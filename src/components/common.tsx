import type { ReactNode } from "react";
import { BadgeCheck, Star, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusLabel, statusTone } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusTone[status] ?? "secondary"}>{statusLabel[status] ?? status}</Badge>;
}

export function VerifiedBadge({ status }: { status: string }) {
  if (status === "verified")
    return (
      <Badge variant="success">
        <BadgeCheck className="h-3.5 w-3.5" /> Verified
      </Badge>
    );
  return null;
}

export function DemoBadge() {
  return <Badge variant="warning">Demo data</Badge>;
}

export function AvailabilityDot({ status }: { status: string }) {
  const map: Record<string, { c: string; l: string }> = {
    available: { c: "bg-success", l: "Available" },
    busy: { c: "bg-warning", l: "Busy" },
    offline: { c: "bg-muted-foreground", l: "Offline" },
  };
  const s = map[status] ?? map.offline;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${s.c}`} /> {s.l}
    </span>
  );
}

export function Rating({ value, count }: { value: number; count: number }) {
  if (!count) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold">
      <Star className="h-4 w-4 fill-warning text-warning" /> {Number(value).toFixed(1)}
      <span className="font-normal text-muted-foreground">({count})</span>
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 rounded-full bg-teal-soft p-3 text-teal">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ src, name, size = 56 }: { src?: string | null; name: string; size?: number }) {
  const initials = name
    .replace(/\(.*\)/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return src ? (
    <img src={src} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-display font-bold text-primary"
      style={{ width: size, height: size, fontSize: size / 2.8 }}
      aria-label={name}
    >
      {initials || "?"}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
