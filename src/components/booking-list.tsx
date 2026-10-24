import { Link } from "@tanstack/react-router";
import { CalendarClock, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, StatusBadge } from "@/components/common";
import { dateTime, inr } from "@/lib/format";

export type BookingRow = {
  id: string;
  booking_code: string;
  status: string;
  booking_type: string;
  scheduled_at: string | null;
  created_at: string;
  agreed_price: number | null;
  customer_budget: number | null;
  locality: string;
  job_description: string;
  worker_profiles: { display_name: string } | null;
  worker_services: { service_categories: { name: string } | null } | null;
};

export const BOOKING_SELECT =
  "id, booking_code, status, booking_type, scheduled_at, created_at, agreed_price, customer_budget, locality, job_description, worker_profiles(display_name), worker_services(service_categories(name))";

export function BookingList({ rows, empty, perspective }: { rows: BookingRow[]; empty: string; perspective: "customer" | "worker" }) {
  if (!rows.length) return <EmptyState icon={Inbox} title="Nothing here yet" text={empty} />;
  return (
    <div className="space-y-3">
      {rows.map((b) => (
        <div key={b.id} className="card-surface flex flex-wrap items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{b.booking_code}</span>
              <StatusBadge status={b.status} />
              {b.booking_type === "immediate" && <span className="text-xs font-medium text-teal">Immediate</span>}
            </div>
            <p className="mt-1 font-semibold">
              {b.worker_services?.service_categories?.name}
              {perspective === "customer" ? ` · ${b.worker_profiles?.display_name ?? ""}` : ` · ${b.locality}`}
            </p>
            <p className="truncate text-sm text-muted-foreground">{b.job_description}</p>
          </div>
          <div className="text-sm">
            <p className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="h-4 w-4" /> {b.scheduled_at ? dateTime(b.scheduled_at) : `Requested ${dateTime(b.created_at)}`}
            </p>
            <p className="font-semibold">{b.agreed_price != null ? `Agreed ${inr(b.agreed_price)}` : b.customer_budget ? `Budget ${inr(b.customer_budget)}` : "Price not agreed"}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/bookings/$id" params={{ id: b.id }}>View Details</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
