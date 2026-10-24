export const inr = (n: number | string | null | undefined) =>
  n == null || n === ""
    ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

export const dateTime = (s: string | null | undefined) =>
  s
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(s))
    : "—";

export const dateOnly = (s: string | null | undefined) =>
  s ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(s)) : "—";

export const pricingUnitLabel: Record<string, string> = {
  per_hour: "per hour",
  per_visit: "per visit",
  per_job: "per job",
  per_day: "per day",
};

export const statusLabel: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  countered: "Countered",
  withdrawn: "Withdrawn",
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
  verified: "Verified",
};

export type BadgeTone = "warning" | "success" | "destructive" | "info" | "teal" | "secondary";
export const statusTone: Record<string, BadgeTone> = {
  pending: "warning",
  accepted: "info",
  rejected: "destructive",
  in_progress: "teal",
  completed: "success",
  cancelled: "secondary",
  countered: "secondary",
  withdrawn: "secondary",
  open: "warning",
  in_review: "info",
  resolved: "success",
  dismissed: "secondary",
  verified: "success",
};

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const errMsg = (e: unknown) =>
  e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Something went wrong";
