import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { BriefcaseBusiness, Clock, Heart, Languages, MapPin, Radar, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvailabilityDot, DemoBadge, EmptyState, Rating } from "@/components/common";
import { dateOnly, errMsg, inr, pricingUnitLabel } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_WORKERS } from "@/lib/demo-data";

export const Route = createFileRoute("/workers/$id")({
  validateSearch: z.object({ book: z.coerce.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Worker Profile — LocalSeva" },
      { name: "description", content: "View services, prices, availability and reviews for this LocalSeva worker." },
      { property: "og:title", content: "Worker Profile — LocalSeva" },
      { property: "og:description", content: "Compare and book trusted local workers." },
    ],
  }),
  component: WorkerPage,
});

function WorkerPage() {
  const { id } = Route.useParams();
  const { book } = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const w = useQuery({
    queryKey: ["worker", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*, worker_services(*, service_categories(name, icon))")
        .eq("id", id)
        .maybeSingle();
      
      const demoMatch = DEMO_WORKERS.find((d) => d.id === id);
      if (!data && demoMatch) {
        return demoMatch as any;
      }
      if (data && demoMatch) {
        return {
          ...data,
          display_name: demoMatch.display_name,
          avatar_url: demoMatch.avatar_url,
          rating_avg: demoMatch.rating_avg,
          review_count: demoMatch.review_count,
          completed_jobs: demoMatch.completed_jobs,
          verification_status: demoMatch.verification_status,
          availability_status: demoMatch.availability_status,
          bio: data.bio || demoMatch.bio,
          working_hours: data.working_hours || demoMatch.working_hours,
          languages: data.languages?.length ? data.languages : demoMatch.languages,
          worker_services: data.worker_services?.length ? data.worker_services : demoMatch.worker_services,
        };
      }
      if (error) throw error;
      return data;
    },
  });
  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").eq("worker_id", id).eq("is_hidden", false).order("created_at", { ascending: false });
      if (data && data.length > 0) return data;
      const demoMatch = DEMO_WORKERS.find((d) => d.id === id);
      if (demoMatch?.demo_reviews) return demoMatch.demo_reviews as any;
      if (error) throw error;
      return [];
    },
  });
  const fav = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favourites").select("worker_id").eq("worker_id", id).maybeSingle();
      return !!data;
    },
  });
  const toggleFav = useMutation({
    mutationFn: async () => {
      if (fav.data) {
        const { error } = await supabase.from("favourites").delete().eq("worker_id", id).eq("customer_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favourites").insert({ worker_id: id, customer_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fav"] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  useEffect(() => {
    if (book && w.data) setOpen(true);
  }, [book, w.data]);

  if (w.isLoading)
    return (
      <div className="container-page py-10">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  if (!w.data)
    return (
      <div className="container-page py-10">
        <EmptyState icon={UserX} title="Worker not found" action={<Button asChild><Link to="/search">Back to search</Link></Button>} />
      </div>
    );

  const p = w.data;
  const services = p.worker_services.filter((s) => s.is_active);
  const isOwn = user?.id === p.user_id;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card-surface p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar src={p.avatar_url} name={p.display_name} size={96} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{p.display_name}</h1>
                  {p.verification_status === "verified" ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Not yet verified</Badge>
                  )}
                  {p.is_demo && <DemoBadge />}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.locality}, {p.city}</span>
                  <span className="inline-flex items-center gap-1"><Radar className="h-4 w-4" /> Serves within {p.service_radius_km} km</span>
                  <span className="inline-flex items-center gap-1"><BriefcaseBusiness className="h-4 w-4" /> {p.experience_years} yrs experience</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <Rating value={p.rating_avg} count={p.review_count} />
                  <span className="text-sm text-muted-foreground">{p.completed_jobs} completed jobs</span>
                  <AvailabilityDot status={p.availability_status} />
                </div>
              </div>
              {user && !isOwn && (
                <Button variant="outline" size="icon" aria-label={fav.data ? "Remove from favourites" : "Add to favourites"} onClick={() => toggleFav.mutate()}>
                  <Heart className={fav.data ? "fill-destructive text-destructive" : ""} />
                </Button>
              )}
            </div>
            {p.bio && <p className="mt-5 leading-relaxed">{p.bio}</p>}
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {p.working_hours && <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-teal" /> {p.working_hours}</p>}
              {p.languages.length > 0 && <p className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-teal" /> {p.languages.join(", ")}</p>}
            </div>
          </section>

          <section className="card-surface p-6">
            <h2 className="text-lg font-bold">Services & prices</h2>
            <div className="mt-4 divide-y">
              {services.length === 0 && <p className="text-sm text-muted-foreground">No services listed yet.</p>}
              {services.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{s.service_categories?.name}</p>
                    {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                  </div>
                  <p className="font-display font-bold">
                    {inr(s.base_price)} <span className="text-xs font-normal text-muted-foreground">{pricingUnitLabel[s.pricing_unit]}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface p-6">
            <h2 className="text-lg font-bold">Customer reviews</h2>
            <div className="mt-4 space-y-4">
              {reviews.data?.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
              {reviews.data?.map((r) => (
                <div key={r.id} className="rounded-lg bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.reviewer_name}</p>
                    <span className="text-xs text-muted-foreground">{dateOnly(r.created_at)}</span>
                  </div>
                  <p className="text-warning">{"★".repeat(r.rating)}<span className="text-border">{"★".repeat(5 - r.rating)}</span></p>
                  {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                  {r.worker_response && <p className="mt-2 border-l-2 border-teal pl-3 text-sm text-muted-foreground">Worker reply: {r.worker_response}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="card-surface h-fit p-6 lg:sticky lg:top-24">
          <p className="text-sm text-muted-foreground">Starting from</p>
          <p className="font-display text-3xl font-bold">
            {services[0] ? inr(Math.min(...services.map((s) => Number(s.base_price)))) : "—"}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Final price is agreed with the worker before the job. You can make an offer after requesting.</p>
          {isOwn ? (
            <Button asChild className="mt-5 w-full"><Link to="/worker-profile">Edit my profile</Link></Button>
          ) : user ? (
            <Button className="mt-5 w-full" variant="teal" size="lg" onClick={() => setOpen(true)} disabled={services.length === 0}>
              Request booking
            </Button>
          ) : (
            <Button asChild className="mt-5 w-full" variant="teal" size="lg">
              <Link to="/auth" search={{ redirect: `/workers/${id}?book=true` }}>Sign in to book</Link>
            </Button>
          )}
        </aside>
      </div>
      {user && !isOwn && (
        <BookingDialog open={open} onOpenChange={setOpen} workerId={p.id} services={services.map((s) => ({ id: s.id, name: s.service_categories?.name ?? "", price: Number(s.base_price), unit: s.pricing_unit }))} />
      )}
    </div>
  );
}

const bookingSchema = z.object({
  service_id: z.string().uuid({ message: "Choose a service" }),
  job_description: z.string().trim().min(5, "Describe the job in at least 5 characters").max(2000),
  service_address: z.string().trim().min(3, "Enter the service address").max(500),
  locality: z.string().trim().min(2, "Enter your locality").max(100),
  booking_type: z.enum(["immediate", "scheduled"]),
  scheduled_at: z.string().optional(),
  customer_budget: z.string().optional(),
});

function BookingDialog({ open, onOpenChange, workerId, services }: { open: boolean; onOpenChange: (o: boolean) => void; workerId: string; services: { id: string; name: string; price: number; unit: string }[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ service_id: services[0]?.id ?? "", job_description: "", service_address: "", locality: "", booking_type: "immediate" as "immediate" | "scheduled", scheduled_at: "", customer_budget: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = bookingSchema.safeParse(f);
      const errs: Record<string, string> = {};
      if (!parsed.success) parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      if (f.booking_type === "scheduled") {
        if (!f.scheduled_at) errs.scheduled_at = "Pick a date and time";
        else if (new Date(f.scheduled_at) < new Date()) errs.scheduled_at = "Time must be in the future";
      }
      if (f.customer_budget && !(Number(f.customer_budget) > 0)) errs.customer_budget = "Enter a valid amount";
      setErrors(errs);
      if (Object.keys(errs).length) throw new Error("Please fix the highlighted fields");

      // Handle demo worker simulation
      const isDemoWorker = DEMO_WORKERS.some((d) => d.id === workerId);
      if (isDemoWorker) {
        // Return a mock booking ID for demo evaluation
        return "demo-bk-1";
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: user!.id,
          worker_id: workerId,
          service_id: f.service_id,
          job_description: f.job_description.trim(),
          service_address: f.service_address.trim(),
          locality: f.locality.trim(),
          booking_type: f.booking_type,
          scheduled_at: f.booking_type === "scheduled" ? new Date(f.scheduled_at).toISOString() : null,
          customer_budget: f.customer_budget ? Number(f.customer_budget) : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (bid) => {
      toast.success("Request sent! The worker must accept before your booking is confirmed.");
      onOpenChange(false);
      navigate({ to: "/bookings/$id", params: { id: bid } });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a booking</DialogTitle>
          <DialogDescription>The worker will review your request. It's confirmed only after they accept.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={f.service_id} onValueChange={(v) => setF({ ...f, service_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a service" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — from {inr(s.price)} {pricingUnitLabel[s.unit]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("service_id")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="jd">Describe the job</Label>
            <Textarea id="jd" placeholder="e.g. Kitchen tap is leaking and needs replacement" value={f.job_description} onChange={(e) => setF({ ...f, job_description: e.target.value })} maxLength={2000} />
            {err("job_description")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addr">Service address</Label>
              <Input id="addr" placeholder="Flat, building, street" value={f.service_address} onChange={(e) => setF({ ...f, service_address: e.target.value })} maxLength={500} />
              {err("service_address")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="locl">Locality</Label>
              <Input id="locl" placeholder="e.g. Andheri West" value={f.locality} onChange={(e) => setF({ ...f, locality: e.target.value })} maxLength={100} />
              {err("locality")}
            </div>
          </div>
          <div className="space-y-2">
            <Label>When?</Label>
            <RadioGroup value={f.booking_type} onValueChange={(v) => setF({ ...f, booking_type: v as "immediate" })} className="grid grid-cols-2 gap-2">
              {[
                { v: "immediate", l: "As soon as possible" },
                { v: "scheduled", l: "Schedule a time" },
              ].map((o) => (
                <Label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal has-[:checked]:border-teal has-[:checked]:bg-teal-soft">
                  <RadioGroupItem value={o.v} /> {o.l}
                </Label>
              ))}
            </RadioGroup>
          </div>
          {f.booking_type === "scheduled" && (
            <div className="space-y-2">
              <Label htmlFor="when">Preferred date & time</Label>
              <Input id="when" type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} />
              {err("scheduled_at")}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="bud">Your budget ₹ (optional)</Label>
            <Input id="bud" type="number" min={1} value={f.customer_budget} onChange={(e) => setF({ ...f, customer_budget: e.target.value })} />
            {err("customer_budget")}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="teal" onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
