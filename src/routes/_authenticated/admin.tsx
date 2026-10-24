import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Flag,
  Hourglass,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, StatusBadge } from "@/components/common";
import { dateTime, errMsg, inr } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin Dashboard — LocalSeva" },
      { name: "description", content: "LocalSeva administrator control panel." },
      { property: "og:title", content: "Admin Dashboard — LocalSeva" },
      { property: "og:description", content: "Manage the LocalSeva platform." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="container-page py-16 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have permission to view this page.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary p-2 text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, verification, bookings, and complaints.</p>
        </div>
      </div>

      <StatsSection />

      <Tabs defaultValue="verification" className="mt-8">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="verification">Worker Verification</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>
        <TabsContent value="verification" className="mt-6"><VerificationPanel /></TabsContent>
        <TabsContent value="users" className="mt-6"><UserManagementPanel /></TabsContent>
        <TabsContent value="bookings" className="mt-6"><BookingsPanel /></TabsContent>
        <TabsContent value="complaints" className="mt-6"><ComplaintsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── STATS ──────────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, color = "text-teal" }: { icon: typeof CheckCircle2; label: string; value: number | string; color?: string }) {
  return (
    <div className="card-surface p-4">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatsSection() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as {
        total_customers: number;
        total_workers: number;
        pending_verifications: number;
        total_bookings: number;
        completed_bookings: number;
        cancelled_bookings: number;
        open_complaints: number;
      };
    },
  });

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }
  if (!stats.data) return null;

  const s = stats.data;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      <Stat icon={Users} label="Customers" value={s.total_customers} />
      <Stat icon={BriefcaseBusiness} label="Workers" value={s.total_workers} />
      <Stat icon={Hourglass} label="Pending verification" value={s.pending_verifications} color="text-warning" />
      <Stat icon={BookOpen} label="Total bookings" value={s.total_bookings} />
      <Stat icon={CheckCircle2} label="Completed" value={s.completed_bookings} color="text-success" />
      <Stat icon={XCircle} label="Cancelled" value={s.cancelled_bookings} color="text-muted-foreground" />
      <Stat icon={Flag} label="Open complaints" value={s.open_complaints} color="text-destructive" />
    </div>
  );
}

// ─── WORKER VERIFICATION ────────────────────────────────────────────────────

function VerificationPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");

  const workers = useQuery({
    queryKey: ["admin-workers", filter],
    queryFn: async () => {
      let q = supabase
        .from("worker_profiles")
        .select("id, display_name, avatar_url, locality, city, verification_status, verification_note, created_at, experience_years")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("verification_status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const setVerification = useMutation({
    mutationFn: async ({ workerId, status, note }: { workerId: string; status: "verified" | "rejected"; note?: string }) => {
      const { error } = await supabase.rpc("admin_set_verification", { _worker: workerId, _status: status, _note: note ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification status updated and worker notified.");
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All workers</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{workers.data?.length ?? 0} workers</p>
      </div>

      {workers.isLoading ? <Skeleton className="h-40 rounded-xl" /> : workers.data?.length === 0 ? (
        <div className="card-surface py-12 text-center text-sm text-muted-foreground">No workers in this category.</div>
      ) : (
        <div className="space-y-3">
          {workers.data?.map((w) => (
            <VerificationCard
              key={w.id}
              worker={w}
              onVerify={(status, note) => setVerification.mutate({ workerId: w.id, status, note })}
              busy={setVerification.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationCard({
  worker,
  onVerify,
  busy,
}: {
  worker: { id: string; display_name: string; avatar_url: string | null; locality: string; city: string; verification_status: string; verification_note: string | null; created_at: string; experience_years: number };
  onVerify: (status: "verified" | "rejected", note?: string) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="card-surface flex flex-wrap items-center gap-4 p-4">
      <Avatar src={worker.avatar_url} name={worker.display_name} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/workers/$id" params={{ id: worker.id }} className="font-semibold hover:text-teal hover:underline">
            {worker.display_name}
          </Link>
          <StatusBadge status={worker.verification_status} />
        </div>
        <p className="text-sm text-muted-foreground">{worker.locality}, {worker.city} · {worker.experience_years} yrs exp</p>
        <p className="text-xs text-muted-foreground">Registered: {dateTime(worker.created_at)}</p>
        {worker.verification_note && (
          <p className="mt-1 text-xs italic text-muted-foreground">Note: {worker.verification_note}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {worker.verification_status !== "verified" && (
          <Button variant="teal" size="sm" onClick={() => onVerify("verified")} disabled={busy}>
            <BadgeCheck className="mr-1 h-4 w-4" /> Verify
          </Button>
        )}
        {worker.verification_status !== "rejected" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <XCircle className="mr-1 h-4 w-4" /> Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject {worker.display_name}?</AlertDialogTitle>
                <AlertDialogDescription>The worker will be notified. Add a reason (optional).</AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea placeholder="Reason for rejection (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onVerify("rejected", note.trim() || undefined)}
                >
                  Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {worker.verification_status === "verified" && (
          <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
      </div>
    </div>
  );
}

// ─── USER MANAGEMENT ────────────────────────────────────────────────────────

function UserManagementPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const users = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", { _search: q || null });
      if (error) throw error;
      return data as unknown as { id: string; full_name: string; email: string; phone: string | null; is_suspended: boolean; roles: string[]; created_at: string }[];
    },
  });

  const setSuspension = useMutation({
    mutationFn: async ({ userId, suspended, reason }: { userId: string; suspended: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("admin_set_suspension", {
        _user: userId,
        _suspended: suspended,
        _reason: reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account status updated.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search.trim());
        }}
      >
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
        />
        <Button type="submit">
          <Search className="mr-1 h-4 w-4" /> Search
        </Button>
      </form>

      {users.isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : users.data?.length === 0 ? (
        <div className="card-surface py-12 text-center text-sm text-muted-foreground">No users found.</div>
      ) : (
        <div className="space-y-3">
          {users.data?.map((u) => (
            <div key={u.id} className="card-surface flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{u.full_name}</p>
                  {u.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                  {u.roles.map((r) => (
                    <Badge key={r} variant="secondary">{r}</Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                <p className="text-xs text-muted-foreground">Joined: {dateTime(u.created_at)}</p>
              </div>
              <div className="flex gap-2">
                {u.is_suspended ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuspension.mutate({ userId: u.id, suspended: false })}
                    disabled={setSuspension.isPending}
                  >
                    Reactivate
                  </Button>
                ) : (
                  <SuspendDialog
                    name={u.full_name}
                    onConfirm={(reason) => setSuspension.mutate({ userId: u.id, suspended: true, reason })}
                    busy={setSuspension.isPending}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuspendDialog({ name, onConfirm, busy }: { name: string; onConfirm: (reason: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive" disabled={busy}>
          <ShieldOff className="mr-1 h-4 w-4" /> Suspend
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The user won't be able to use the platform. Add a reason for your records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Reason for suspension"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onConfirm(reason.trim())}
          >
            Suspend account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── BOOKINGS ───────────────────────────────────────────────────────────────

function BookingsPanel() {
  const [status, setStatus] = useState("all");

  const bookings = useQuery({
    queryKey: ["admin-bookings", status],
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select("id, booking_code, status, booking_type, created_at, agreed_price, customer_budget, locality, job_description, worker_profiles(display_name), worker_services(service_categories(name))")
        .order("created_at", { ascending: false })
        .limit(100);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["all", "pending", "accepted", "in_progress", "completed", "cancelled", "rejected"].map((s) => (
            <SelectItem key={s} value={s}>
              {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {bookings.isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : bookings.data?.length === 0 ? (
        <div className="card-surface py-12 text-center text-sm text-muted-foreground">No bookings found.</div>
      ) : (
        <div className="space-y-3">
          {bookings.data?.map((b) => (
            <div key={b.id} className="card-surface flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{b.booking_code}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 font-semibold">
                  {(b.worker_services as { service_categories: { name: string } | null } | null)?.service_categories?.name}
                  {" · "}
                  {(b.worker_profiles as { display_name: string } | null)?.display_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {b.locality} · {dateTime(b.created_at)}
                </p>
                {b.agreed_price != null && (
                  <p className="text-sm font-medium text-success">Agreed: {inr(b.agreed_price)}</p>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/bookings/$id" params={{ id: b.id }}>View</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMPLAINTS ─────────────────────────────────────────────────────────────

function ComplaintsPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("open");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const complaints = useQuery({
    queryKey: ["admin-complaints", filter],
    queryFn: async () => {
      let q = supabase
        .from("complaints")
        .select("id, subject, description, status, resolution_notes, created_at, updated_at, booking_id, reporter_id, reported_user_id")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateComplaint = useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: string; resolution_notes?: string }) => {
      const { error } = await supabase
        .from("complaints")
        .update({ status, resolution_notes: resolution_notes || null, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Complaint updated.");
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setResolveId(null);
      setNotes("");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-4">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All complaints</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_review">In review</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      {complaints.isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : complaints.data?.length === 0 ? (
        <div className="card-surface py-12 text-center text-sm text-muted-foreground">No complaints found.</div>
      ) : (
        <div className="space-y-3">
          {complaints.data?.map((c) => (
            <div key={c.id} className="card-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.subject}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Filed: {dateTime(c.created_at)}</span>
                    {c.booking_id && (
                      <Link to="/bookings/$id" params={{ id: c.booking_id }} className="text-teal hover:underline">
                        Related booking →
                      </Link>
                    )}
                  </div>
                  {c.resolution_notes && (
                    <p className="mt-2 text-sm italic text-muted-foreground">Resolution: {c.resolution_notes}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status === "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateComplaint.mutate({ id: c.id, status: "in_review" })}
                      disabled={updateComplaint.isPending}
                    >
                      Mark in review
                    </Button>
                  )}
                  {["open", "in_review"].includes(c.status) && (
                    <>
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() => { setResolveId(c.id); setNotes(""); }}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => updateComplaint.mutate({ id: c.id, status: "dismissed" })}
                        disabled={updateComplaint.isPending}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!resolveId} onOpenChange={(o) => !o && setResolveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve complaint</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="rn">Resolution notes</Label>
            <Textarea
              id="rn"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the action taken…"
              maxLength={1000}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveId(null)}>Cancel</Button>
            <Button
              variant="teal"
              onClick={() => resolveId && updateComplaint.mutate({ id: resolveId, status: "resolved", resolution_notes: notes.trim() })}
              disabled={updateComplaint.isPending}
            >
              Mark resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
