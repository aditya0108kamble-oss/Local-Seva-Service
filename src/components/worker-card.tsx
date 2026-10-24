import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, MapPin, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvailabilityDot, DemoBadge, Rating, VerifiedBadge } from "@/components/common";
import { inr, pricingUnitLabel } from "@/lib/format";

export type WorkerListItem = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  locality: string;
  city: string;
  rating_avg: number;
  review_count: number;
  completed_jobs: number;
  verification_status: string;
  availability_status: string;
  is_demo: boolean;
  latitude: number | null;
  longitude: number | null;
  worker_services: { id: string; base_price: number; pricing_unit: string; is_active: boolean; service_categories: { name: string } | null }[];
};

export function cheapestService(w: WorkerListItem) {
  const active = w.worker_services.filter((s) => s.is_active);
  return active.sort((a, b) => Number(a.base_price) - Number(b.base_price))[0];
}

export function WorkerCard({ w, distanceKm }: { w: WorkerListItem; distanceKm?: number | null }) {
  const s = cheapestService(w);
  return (
    <article className="card-surface card-hover flex flex-col p-5 border-slate-200/90 bg-white/90 rounded-2xl relative overflow-hidden group">
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-teal to-emerald-500 opacity-80" />

      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar src={w.avatar_url} name={w.display_name} size={60} />
          {w.verification_status === "verified" && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-white">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
              {w.display_name}
            </h3>
            {w.is_demo && <DemoBadge />}
          </div>
          <p className="text-sm font-semibold text-teal mt-0.5">{s?.service_categories?.name ?? "Services"}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" /> {w.locality}, {w.city}
            {distanceKm != null && <span className="ml-1 font-semibold text-slate-700">· ~{distanceKm.toFixed(1)} km</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm bg-slate-50/80 rounded-xl p-2.5">
        <Rating value={w.rating_avg} count={w.review_count} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
          <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" /> {w.completed_jobs} jobs
        </span>
        <AvailabilityDot status={w.availability_status} />
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Starting from</p>
          <p className="font-display text-lg font-bold text-slate-900">
            {s ? inr(s.base_price) : "—"}{" "}
            <span className="text-xs font-normal text-slate-500">{s ? pricingUnitLabel[s.pricing_unit] : ""}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 hover:bg-slate-50">
            <Link to="/workers/$id" params={{ id: w.id }}>Profile</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl bg-gradient-accent text-white font-semibold shadow-xs hover:opacity-95 border-0">
            <Link to="/workers/$id" params={{ id: w.id }} search={{ book: true }}>Book Now</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export const WORKER_SELECT =
  "id, display_name, avatar_url, locality, city, rating_avg, review_count, completed_jobs, verification_status, availability_status, is_demo, latitude, longitude, worker_services(id, base_price, pricing_unit, is_active, category_id, service_categories(name, slug))";
