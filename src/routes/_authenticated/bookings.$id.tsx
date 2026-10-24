import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flag, Handshake, Info, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common";
import { useAuth } from "@/lib/auth";
import { dateTime, errMsg, inr, pricingUnitLabel } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_CUSTOMER_BOOKINGS } from "@/lib/demo-data";

type BStatus = Database["public"]["Enums"]["booking_status"];

export const Route = createFileRoute("/_authenticated/bookings/$id")({
  head: () => ({ meta: [{ title: "Booking Details — LocalSeva" }, { name: "description", content: "Booking status, price negotiation and review." }, { property: "og:title", content: "Booking Details — LocalSeva" }, { property: "og:description", content: "Your LocalSeva booking." }] }),
  component: BookingPage,
});

function BookingPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["offers", id] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  const b = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const demoMatch = DEMO_CUSTOMER_BOOKINGS.find((d) => d.id === id);
      if (demoMatch) {
        return {
          id: demoMatch.id,
          booking_code: demoMatch.booking_code,
          status: demoMatch.status,
          booking_type: demoMatch.booking_type,
          scheduled_at: demoMatch.scheduled_at,
          created_at: demoMatch.created_at,
          agreed_price: demoMatch.agreed_price,
          customer_budget: demoMatch.customer_budget,
          locality: demoMatch.locality,
          service_address: "Flat 402, Shanti Vihar, " + demoMatch.locality,
          job_description: demoMatch.job_description,
          customer_id: user?.id,
          worker_id: "146ae007-475d-4118-aa12-0a844cb98242",
          cancel_reason: null,
          worker_profiles: {
            id: "146ae007-475d-4118-aa12-0a844cb98242",
            display_name: demoMatch.worker_profiles.display_name,
            user_id: "worker-demo-id",
          },
          worker_services: {
            base_price: demoMatch.agreed_price || 400,
            pricing_unit: "per_visit",
            service_categories: demoMatch.worker_services.service_categories,
          },
        } as any;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*, worker_profiles(id, display_name, user_id), worker_services(base_price, pricing_unit, service_categories(name))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const parties = useQuery({
    queryKey: ["booking-parties", id, b.data?.status],
    enabled: !!b.data,
    queryFn: async () => {
      const { data } = await supabase.rpc("booking_parties", { _booking: id });
      return data?.[0];
    },
  });
  const offers = useQuery({
    queryKey: ["offers", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("price_offers").select("*").eq("booking_id", id).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const review = useQuery({
    queryKey: ["booking-review", id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").eq("booking_id", id).maybeSingle();
      return data;
    },
  });

  const status = useMutation({
    mutationFn: async ({ s, reason }: { s: BStatus; reason?: string }) => {
      const { error } = await supabase.rpc("update_booking_status", { _booking: id, _status: s, _reason: reason });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking updated");
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (b.isLoading) return <div className="container-page py-10"><Skeleton className="h-64 rounded-xl" /></div>;
  if (!b.data)
    return (
      <div className="container-page py-10 text-center">
        <p>Booking not found or you don't have access.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    );

  const bk = b.data;
  const isCustomer = bk.customer_id === user?.id;
  const isWorker = bk.worker_profiles?.user_id === user?.id;
  const negotiable = ["pending", "accepted"].includes(bk.status) && (isCustomer || isWorker);
  const otherUserId = isCustomer ? bk.worker_profiles?.user_id : bk.customer_id;

  return (
    <div className="container-page max-w-4xl py-8">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
      <div className="card-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-muted-foreground">{bk.booking_code}</p>
            <h1 className="text-2xl font-bold">{bk.worker_services?.service_categories?.name}</h1>
          </div>
          <StatusBadge status={bk.status} />
        </div>
        {bk.status === "pending" && bk.booking_type === "immediate" && isCustomer && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> This immediate request isn't confirmed yet. The worker must accept it first.
          </p>
        )}
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Info2 k="Worker" v={<Link className="text-teal hover:underline" to="/workers/$id" params={{ id: bk.worker_id }}>{bk.worker_profiles?.display_name}</Link>} />
          <Info2 k="Customer" v={parties.data?.customer_name || "—"} />
          {parties.data?.customer_phone && (isWorker || isCustomer) && <Info2 k="Customer phone" v={parties.data.customer_phone} />}
          <Info2 k="When" v={bk.booking_type === "immediate" ? "As soon as possible" : dateTime(bk.scheduled_at)} />
          <Info2 k="Address" v={`${bk.service_address}, ${bk.locality}`} />
          <Info2 k="Listed price" v={`${inr(bk.worker_services?.base_price)} ${pricingUnitLabel[bk.worker_services?.pricing_unit ?? ""] ?? ""}`} />
          <Info2 k="Customer budget" v={inr(bk.customer_budget)} />
          <Info2 k="Agreed price" v={<span className="font-display text-lg font-bold text-success">{bk.agreed_price != null ? inr(bk.agreed_price) : "Not agreed yet"}</span>} />
          <Info2 k="Requested on" v={dateTime(bk.created_at)} />
        </dl>
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Job description</p>
          <p className="mt-1 whitespace-pre-wrap">{bk.job_description}</p>
        </div>
        {bk.cancel_reason && <p className="mt-3 text-sm text-muted-foreground">Reason: {bk.cancel_reason}</p>}

        <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
          {isWorker && bk.status === "pending" && (
            <>
              <Button variant="teal" onClick={() => status.mutate({ s: "accepted" })} disabled={status.isPending}>Accept request</Button>
              <ReasonAction label="Reject" title="Reject this request?" onConfirm={(r) => status.mutate({ s: "rejected", reason: r })} />
            </>
          )}
          {isWorker && bk.status === "accepted" && <Button onClick={() => status.mutate({ s: "in_progress" })}>Start job</Button>}
          {isWorker && bk.status === "in_progress" && <Button variant="teal" onClick={() => status.mutate({ s: "completed" })}>Mark completed</Button>}
          {(isCustomer || isWorker) && ["pending", "accepted"].includes(bk.status) && (
            <ReasonAction label="Cancel booking" title="Cancel this booking?" onConfirm={(r) => status.mutate({ s: "cancelled", reason: r })} />
          )}
          {(isCustomer || isWorker) && <ReportDialog bookingId={id} reportedUserId={otherUserId ?? null} />}
        </div>
      </div>

      <Negotiation bookingId={id} offers={offers.data ?? []} me={user!.id} negotiable={negotiable} onChange={refresh} customerId={bk.customer_id} />

      {bk.status === "completed" && (
        <ReviewSection bookingId={id} workerId={bk.worker_id} review={review.data ?? null} isCustomer={isCustomer} isWorker={isWorker} onChange={() => qc.invalidateQueries({ queryKey: ["booking-review", id] })} />
      )}
    </div>
  );
}

function Info2({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="mt-0.5">{v}</dd>
    </div>
  );
}

function ReasonAction({ label, title, onConfirm }: { label: string; title: string; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>This can't be undone. The other party will be notified.</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        <AlertDialogFooter>
          <AlertDialogCancel>Go back</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(reason.trim())}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type Offer = { id: string; offered_by: string; amount: number; message: string | null; status: string; created_at: string };

function Negotiation({ bookingId, offers, me, negotiable, onChange, customerId }: { bookingId: string; offers: Offer[]; me: string; negotiable: boolean; onChange: () => void; customerId: string }) {
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const pending = offers.find((o) => o.status === "pending");
  const make = useMutation({
    mutationFn: async () => {
      const a = Number(amount);
      if (!(a > 0)) throw new Error("Enter a valid amount");
      const { error } = await supabase.rpc("make_offer", { _booking: bookingId, _amount: a, _message: msg || undefined });
      if (error) throw error;
    },
    onSuccess: () => {
      setAmount("");
      setMsg("");
      toast.success("Offer sent");
      onChange();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_offer", { _offer: id, _accept: accept });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.accept ? "Price agreed!" : "Offer declined");
      onChange();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <section className="card-surface mt-6 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Handshake className="h-5 w-5 text-teal" /> Price negotiation</h2>
      {offers.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No offers yet. Either side can propose a price.</p>}
      <ol className="mt-4 space-y-3">
        {offers.map((o) => {
          const mine = o.offered_by === me;
          return (
            <li key={o.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm rounded-xl p-3 ${mine ? "bg-primary-soft" : "bg-secondary"}`}>
                <p className="text-xs text-muted-foreground">{o.offered_by === customerId ? "Customer" : "Worker"} · {dateTime(o.created_at)}</p>
                <p className="font-display text-xl font-bold">{inr(o.amount)}</p>
                {o.message && <p className="text-sm">{o.message}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  {!mine && o.status === "pending" && negotiable && (
                    <>
                      <Button size="sm" variant="teal" onClick={() => respond.mutate({ id: o.id, accept: true })} disabled={respond.isPending}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: o.id, accept: false })} disabled={respond.isPending}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {negotiable && (
        <form className="mt-5 grid gap-2 border-t pt-5 sm:grid-cols-[140px_1fr_auto]" onSubmit={(e) => { e.preventDefault(); make.mutate(); }}>
          <Input type="number" min={1} placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Offer amount" />
          <Input placeholder="Message (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} aria-label="Offer message" />
          <Button type="submit" disabled={make.isPending}>{pending && pending.offered_by !== me ? "Counter offer" : "Send offer"}</Button>
        </form>
      )}
      {negotiable && <p className="mt-2 text-xs text-muted-foreground">Sending a new offer replaces any open offer. Once an offer is accepted it becomes the agreed price; changing it later needs a new accepted offer.</p>}
    </section>
  );
}

function ReviewSection({ bookingId, workerId, review, isCustomer, isWorker, onChange }: { bookingId: string; workerId: string; review: Database["public"]["Tables"]["reviews"]["Row"] | null; isCustomer: boolean; isWorker: boolean; onChange: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reply, setReply] = useState("");
  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").insert({ booking_id: bookingId, worker_id: workerId, customer_id: user!.id, rating, comment: comment.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Thanks for your review!"); onChange(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const respond = useMutation({
    mutationFn: async () => {
      if (!reply.trim()) throw new Error("Write a reply first");
      const { error } = await supabase.from("reviews").update({ worker_response: reply.trim() }).eq("id", review!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reply posted"); onChange(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <section className="card-surface mt-6 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Star className="h-5 w-5 text-warning" /> Review</h2>
      {review ? (
        <div className="mt-3">
          <p className="text-warning">{"★".repeat(review.rating)}<span className="text-border">{"★".repeat(5 - review.rating)}</span></p>
          {review.comment && <p className="mt-1">{review.comment}</p>}
          {review.worker_response && <p className="mt-2 border-l-2 border-teal pl-3 text-sm text-muted-foreground">Worker reply: {review.worker_response}</p>}
          {isWorker && !review.worker_response && (
            <div className="mt-3 flex gap-2">
              <Input placeholder="Reply to this review" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} />
              <Button onClick={() => respond.mutate()} disabled={respond.isPending}>Reply</Button>
            </div>
          )}
          {isWorker && <ReportDialog reviewId={review.id} reportedUserId={review.customer_id} label="Report review" />}
        </div>
      ) : isCustomer ? (
        <div className="mt-3 space-y-3">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
                <Star className={`h-7 w-7 ${n <= rating ? "fill-warning text-warning" : "text-border"}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="How was the service?" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Submit review</Button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">The customer hasn't reviewed this job yet.</p>
      )}
    </section>
  );
}

function ReportDialog({ bookingId, reviewId, reportedUserId, label = "Report a problem" }: { bookingId?: string; reviewId?: string; reportedUserId: string | null; label?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      if (desc.trim().length < 10) throw new Error("Please describe the problem (at least 10 characters)");
      const { error } = await supabase.from("complaints").insert({
        booking_id: bookingId ?? null,
        review_id: reviewId ?? null,
        reporter_id: user!.id,
        reported_user_id: reportedUserId,
        subject: subject.trim() || (reviewId ? "Reported review" : "Booking problem"),
        description: desc.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Report submitted. Our team will review it."); setOpen(false); setDesc(""); setSubject(""); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={reviewId ? "sm" : "default"} className="text-destructive"><Flag /> {label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label htmlFor="sub">Subject</Label><Input id="sub" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} /></div>
          <div className="space-y-2"><Label htmlFor="desc">What happened?</Label><Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={2000} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => send.mutate()} disabled={send.isPending}>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
