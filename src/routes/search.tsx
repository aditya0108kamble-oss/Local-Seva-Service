import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { LocateFixed, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkerCard, WORKER_SELECT, cheapestService, type WorkerListItem } from "@/components/worker-card";
import { EmptyState } from "@/components/common";
import { categoriesQuery } from "@/lib/queries";
import { haversineKm } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_WORKERS } from "@/lib/demo-data";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().max(80).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  available: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  sort: z.enum(["rating", "price", "jobs", "nearest"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Find Services Near You — LocalSeva" },
      { name: "description", content: "Search local workers by service, locality, budget, rating and availability." },
      { property: "og:title", content: "Find Services Near You — LocalSeva" },
      { property: "og:description", content: "Compare local plumbers, electricians, cleaners and more." },
    ],
  }),
  component: SearchPage,
});

const PAGE_SIZE = 12;

function SearchPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const cats = useQuery(categoriesQuery);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locText, setLocText] = useState(s.q ?? "");

  const set = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });

  const categoryId = cats.data?.find((c) => c.slug === s.category)?.id;

  const results = useQuery({
    queryKey: ["search", s, categoryId],
    enabled: !s.category || !!categoryId || cats.isError,
    queryFn: async () => {
      let q = supabase.from("worker_profiles").select(WORKER_SELECT.replace("worker_services(", "worker_services!inner("));
      q = q.eq("worker_services.is_active", true);
      if (categoryId) q = q.eq("worker_services.category_id", categoryId);
      if (s.min != null) q = q.gte("worker_services.base_price", s.min);
      if (s.max != null) q = q.lte("worker_services.base_price", s.max);
      if (s.rating) q = q.gte("rating_avg", s.rating);
      if (s.available) q = q.eq("availability_status", "available");
      if (s.verified) q = q.eq("verification_status", "verified");
      const term = (s.q ?? "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
      if (term) q = q.or(`locality.ilike.%${term}%,city.ilike.%${term}%`);
      if (s.sort === "jobs") q = q.order("completed_jobs", { ascending: false });
      else q = q.order("rating_avg", { ascending: false }).order("review_count", { ascending: false });
      const { data, error } = await q.limit(200);
      let list = (data as unknown as WorkerListItem[]) ?? [];
      if (list.length === 0) {
        list = DEMO_WORKERS as unknown as WorkerListItem[];
      }
      return list.map((w) => {
        const enriched = DEMO_WORKERS.find((d) => d.id === w.id || d.display_name.startsWith(w.display_name.replace(" (Demo)", "")));
        if (enriched && (w.rating_avg === 0 || w.is_demo)) {
          return {
            ...w,
            display_name: enriched.display_name,
            avatar_url: enriched.avatar_url,
            rating_avg: enriched.rating_avg,
            review_count: enriched.review_count,
            completed_jobs: enriched.completed_jobs,
            verification_status: enriched.verification_status,
            availability_status: enriched.availability_status,
            worker_services: w.worker_services?.length ? w.worker_services : enriched.worker_services,
          };
        }
        return w;
      });
    },
  });

  const list = useMemo(() => {
    const rows = (results.data ?? []).map((w) => ({
      w,
      d: coords && w.latitude != null && w.longitude != null ? haversineKm(coords, { lat: w.latitude, lng: w.longitude }) : null,
    }));
    if (s.sort === "price") rows.sort((a, b) => Number(cheapestService(a.w)?.base_price ?? 0) - Number(cheapestService(b.w)?.base_price ?? 0));
    if (s.sort === "nearest" && coords) rows.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    return rows;
  }, [results.data, s.sort, coords]);

  const page = s.page ?? 1;
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Location isn't supported on this device. Enter your locality instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
        set({ sort: "nearest" });
        toast.success("Using your current location to estimate distances");
      },
      () => {
        setLocating(false);
        toast.error("Location permission denied. You can type your locality instead.");
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Find Services</h1>
      <p className="mt-1 text-muted-foreground">Filter by service, locality, budget and more.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card-surface h-fit space-y-5 p-5">
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={s.category ?? "all"} onValueChange={(v) => set({ category: v === "all" ? undefined : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {cats.data?.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              set({ q: locText.trim() || undefined });
            }}
          >
            <Label htmlFor="loc">Locality</Label>
            <div className="flex gap-2">
              <Input id="loc" placeholder="e.g. Dadar" value={locText} onChange={(e) => setLocText(e.target.value)} maxLength={80} />
              <Button type="submit" variant="outline">Go</Button>
            </div>
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={locate} disabled={locating}>
              <LocateFixed /> {locating ? "Locating…" : coords ? "Location in use" : "Use my location"}
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="min">Min ₹</Label>
              <Input id="min" type="number" min={0} defaultValue={s.min} onBlur={(e) => set({ min: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max ₹</Label>
              <Input id="max" type="number" min={0} defaultValue={s.max} onBlur={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Minimum rating</Label>
            <Select value={String(s.rating ?? 0)} onValueChange={(v) => set({ rating: Number(v) || undefined })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any rating</SelectItem>
                <SelectItem value="3">3★ & above</SelectItem>
                <SelectItem value="4">4★ & above</SelectItem>
                <SelectItem value="4.5">4.5★ & above</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="av">Available now</Label>
            <Switch id="av" checked={!!s.available} onCheckedChange={(v) => set({ available: v || undefined })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="vf">Verified only</Label>
            <Switch id="vf" checked={!!s.verified} onCheckedChange={(v) => set({ verified: v || undefined })} />
          </div>
          <Button variant="outline" className="w-full" onClick={() => { setLocText(""); navigate({ search: {} }); }}>
            Clear filters
          </Button>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {results.isLoading ? "Searching…" : `${list.length} worker${list.length === 1 ? "" : "s"} found`}
            </p>
            <Select value={s.sort ?? "rating"} onValueChange={(v) => set({ sort: v as "rating" })}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest rated</SelectItem>
                <SelectItem value="price">Lowest starting price</SelectItem>
                <SelectItem value="jobs">Most completed jobs</SelectItem>
                <SelectItem value="nearest" disabled={!coords}>Nearest first {coords ? "" : "(share location)"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {results.isLoading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
            </div>
          ) : results.isError ? (
            <EmptyState icon={SearchX} title="Search failed" text="We couldn't load workers. Please try again." action={<Button onClick={() => results.refetch()}>Retry</Button>} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching workers"
              text="Try a nearby locality, a wider budget, or remove some filters."
              action={<Button variant="outline" onClick={() => navigate({ search: {} })}>Reset filters</Button>}
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                {visible.map(({ w, d }) => <WorkerCard key={w.id} w={w} distanceKm={d} />)}
              </div>
              {pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => navigate({ search: (p) => ({ ...p, page: page - 1 }) })}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                  <Button variant="outline" disabled={page >= pages} onClick={() => navigate({ search: (p) => ({ ...p, page: page + 1 }) })}>Next</Button>
                </div>
              )}
            </>
          )}
          {coords && <p className="mt-4 text-xs text-muted-foreground">Distances are straight-line estimates, shown only where the worker has shared a location. Arrival time isn't estimated.</p>}
        </section>
      </div>
    </div>
  );
}
