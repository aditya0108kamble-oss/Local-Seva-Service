import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, BriefcaseBusiness, CheckCircle2, Clock, Hourglass, ShieldCheck, Star, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingList, BOOKING_SELECT, type BookingRow } from "@/components/booking-list";
import { SearchForm } from "@/components/search-form";
import { WorkerCard, WORKER_SELECT, type WorkerListItem } from "@/components/worker-card";
import { EmptyState, PageTitle, VerifiedBadge } from "@/components/common";
import { useAuth } from "@/lib/auth";
import { dateTime, errMsg } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_CUSTOMER_BOOKINGS, DEMO_WORKERS } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LocalSeva" }, { name: "description", content: "Your LocalSeva bookings and activity." }, { property: "og:title", content: "Dashboard — LocalSeva" }, { property: "og:description", content: "Your LocalSeva dashboard." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { isWorker, isAdmin, ready, profile } = useAuth();
  const [view, setView] = useState<"worker" | "customer" | null>(null);
  if (!ready) return <div className="container-page py-10"><Skeleton className="h-40 rounded-xl" /></div>;
  const v = view ?? (isWorker ? "worker" : "customer");
  return (
    <div className="container-page py-8">
      {profile?.is_suspended && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-danger-soft p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> Your account is suspended. Contact support for help.
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {isWorker && (
          <div className="inline-flex rounded-lg bg-secondary p-1">
            {(["worker", "customer"] as const).map((x) => (
              <button key={x} onClick={() => setView(x)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${v === x ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                {x === "worker" ? "Worker view" : "Customer view"}
              </button>
            ))}
          </div>
        )}
        {isAdmin && (
          <Button asChild variant="outline" size="sm"><Link to="/admin"><ShieldCheck /> Admin dashboard</Link></Button>
        )}
      </div>
      {v === "worker" ? <WorkerDashboard /> : <CustomerDashboard />}
    </div>
  );
}

function useBookings(kind: "customer" | "worker", workerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", kind, user?.id, workerId],
    enabled: kind === "customer" || !!workerId,
    queryFn: async () => {
      let q = supabase.from("bookings").select(BOOKING_SELECT).order("created_at", { ascending: false });
      q = kind === "customer" ? q.eq("customer_id", user!.id) : q.eq("worker_id", workerId!);
      const { data, error } = await q;
      if (data && data.length > 0) {
        return data as unknown as BookingRow[];
      }
      if (kind === "customer") {
        return DEMO_CUSTOMER_BOOKINGS as unknown as BookingRow[];
      }
      if (error) throw error;
      return [];
    },
  });
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: number | string }) {
  return (
    <div className="card-surface p-4">
      <Icon className="h-5 w-5 text-teal" />
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CustomerDashboard() {
  const { profile, user } = useAuth();
  const b = useBookings("customer");
  const favs = useQuery({
    queryKey: ["favs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("favourites").select(`worker_profiles(${WORKER_SELECT})`).eq("customer_id", user!.id);
      const rows = (data ?? []).map((r) => r.worker_profiles as unknown as WorkerListItem).filter(Boolean);
      if (rows.length > 0) return rows;
      return DEMO_WORKERS.slice(0, 2) as unknown as WorkerListItem[];
    },
  });
  const myReviews = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("id, rating, comment, created_at, worker_profiles(display_name)").eq("customer_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });
  const notes = useNotifications(5);
  const rows = b.data ?? [];
  const by = (s: string[]) => rows.filter((r) => s.includes(r.status));
  const upcoming = rows.filter((r) => ["accepted"].includes(r.status) && r.scheduled_at && new Date(r.scheduled_at) > new Date());

  return (
    <>
      <PageTitle title={`Namaste, ${profile?.full_name?.split(" ")[0] || "there"}`} subtitle="Track your bookings and find help nearby." />
      <SearchForm compact />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Hourglass} label="Pending requests" value={by(["pending"]).length} />
        <Stat icon={BriefcaseBusiness} label="Active bookings" value={by(["accepted", "in_progress"]).length} />
        <Stat icon={CheckCircle2} label="Completed" value={by(["completed"]).length} />
        <Stat icon={Clock} label="Upcoming" value={upcoming.length} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {b.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <Tabs defaultValue="active">
              <TabsList className="flex h-auto flex-wrap">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled / Rejected</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4"><BookingList perspective="customer" rows={by(["accepted", "in_progress"])} empty="Accepted and in-progress bookings appear here." /></TabsContent>
              <TabsContent value="upcoming" className="mt-4"><BookingList perspective="customer" rows={upcoming} empty="Scheduled bookings that are confirmed show up here." /></TabsContent>
              <TabsContent value="pending" className="mt-4"><BookingList perspective="customer" rows={by(["pending"])} empty="Requests waiting for a worker's response." /></TabsContent>
              <TabsContent value="completed" className="mt-4"><BookingList perspective="customer" rows={by(["completed"])} empty="Finished jobs will be listed here." /></TabsContent>
              <TabsContent value="cancelled" className="mt-4"><BookingList perspective="customer" rows={by(["cancelled", "rejected"])} empty="No cancelled bookings." /></TabsContent>
            </Tabs>
          )}
        </div>
        <aside className="space-y-6">
          <NotificationsPanel items={notes.data ?? []} />
          <div className="card-surface p-5">
            <h3 className="font-semibold">Recent reviews</h3>
            {myReviews.data?.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {myReviews.data.map((r) => (
                  <li key={r.id}><span className="text-warning">{"★".repeat(r.rating)}</span> for {(r.worker_profiles as { display_name: string } | null)?.display_name}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">You haven't reviewed anyone yet.</p>
            )}
          </div>
        </aside>
      </div>
      <h2 className="mb-4 mt-10 text-xl font-bold">Favourite workers</h2>
      {favs.data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{favs.data.map((w) => <WorkerCard key={w.id} w={w} />)}</div>
      ) : (
        <EmptyState icon={Star} title="No favourites yet" text="Tap the heart on a worker's profile to save them here." action={<Button asChild variant="outline"><Link to="/search">Browse workers</Link></Button>} />
      )}
    </>
  );
}

function useNotifications(limit: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id, limit],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
      return data ?? [];
    },
  });
}

function NotificationsPanel({ items }: { items: { id: string; title: string; message: string; is_read: boolean; created_at: string }[] }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Notifications</h3>
        <Link to="/notifications" className="text-xs font-medium text-teal hover:underline">See all</Link>
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-3">
          {items.map((n) => (
            <li key={n.id} className="text-sm">
              <p className={n.is_read ? "" : "font-semibold"}>{n.title}</p>
              <p className="text-xs text-muted-foreground">{dateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Bell className="h-4 w-4" /> You're all caught up.</p>
      )}
    </div>
  );
}

function WorkerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const wp = useQuery({
    queryKey: ["my-worker", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("worker_profiles").select("*, worker_services(id)").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const b = useBookings("worker", wp.data?.id);
  const notes = useNotifications(5);
  const setAvail = useMutation({
    mutationFn: async (v: "available" | "busy" | "offline") => {
      const { error } = await supabase.from("worker_profiles").update({ availability_status: v }).eq("id", wp.data!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability updated. Accepted bookings are not affected.");
      qc.invalidateQueries({ queryKey: ["my-worker"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (wp.isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!wp.data)
    return (
      <EmptyState
        icon={UserCog}
        title="Set up your worker profile"
        text="Add your skills, prices and service area so customers can find you."
        action={<Button asChild variant="teal"><Link to="/worker-profile">Create worker profile</Link></Button>}
      />
    );

  const rows = b.data ?? [];
  const by = (s: string[]) => rows.filter((r) => s.includes(r.status));
  const p = wp.data;

  return (
    <>
      <PageTitle
        title="Worker dashboard"
        subtitle={`${p.display_name} · ${p.locality}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedBadge status={p.verification_status} />
            {p.verification_status !== "verified" && <span className="text-xs text-muted-foreground">Verification: {p.verification_status}</span>}
            <Select value={p.availability_status} onValueChange={(v) => setAvail.mutate(v as "available")}>
              <SelectTrigger className="w-40" aria-label="Availability"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline"><Link to="/worker-profile">Profile, services & prices</Link></Button>
          </div>
        }
      />
      {p.worker_services.length === 0 && (
        <div className="mb-6 rounded-lg bg-warning-soft p-4 text-sm text-warning">Add at least one service with a price so customers can book you.</div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={BriefcaseBusiness} label="Total requests" value={rows.length} />
        <Stat icon={Hourglass} label="Pending" value={by(["pending"]).length} />
        <Stat icon={CheckCircle2} label="Accepted" value={by(["accepted"]).length} />
        <Stat icon={Clock} label="In progress" value={by(["in_progress"]).length} />
        <Stat icon={CheckCircle2} label="Completed jobs" value={p.completed_jobs} />
        <Stat icon={Star} label={`Rating (${p.review_count})`} value={p.review_count ? Number(p.rating_avg).toFixed(1) : "—"} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="incoming">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="incoming">Incoming requests</TabsTrigger>
            <TabsTrigger value="active">My bookings</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          <TabsContent value="incoming" className="mt-4"><BookingList perspective="worker" rows={by(["pending"])} empty="New booking requests will appear here." /></TabsContent>
          <TabsContent value="active" className="mt-4"><BookingList perspective="worker" rows={by(["accepted", "in_progress"])} empty="Accepted jobs show up here." /></TabsContent>
          <TabsContent value="completed" className="mt-4"><BookingList perspective="worker" rows={by(["completed"])} empty="Completed jobs will be listed here." /></TabsContent>
          <TabsContent value="closed" className="mt-4"><BookingList perspective="worker" rows={by(["rejected", "cancelled"])} empty="No closed requests." /></TabsContent>
        </Tabs>
        <aside className="space-y-6">
          <NotificationsPanel items={notes.data ?? []} />
          <Button asChild variant="outline" className="w-full"><Link to="/workers/$id" params={{ id: p.id }}>View my public profile & reviews</Link></Button>
        </aside>
      </div>
    </>
  );
}
