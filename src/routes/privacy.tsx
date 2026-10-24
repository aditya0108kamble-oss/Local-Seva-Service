import { createFileRoute } from "@tanstack/react-router";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LocalSeva" },
      { name: "description", content: "Privacy Policy and data practices for the LocalSeva hyperlocal marketplace." },
      { property: "og:title", content: "Privacy Policy — LocalSeva" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal-soft p-3 text-teal">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        </div>
      </div>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-teal" /> 1. Overview & Data Collection
          </h2>
          <p>
            LocalSeva values your privacy. We collect minimal personal details required to facilitate bookings between customers and service providers:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Customer data: Name, email address, optional contact telephone number, and general locality for requested jobs.</li>
            <li>Worker data: Name, profile photograph, skills, starting rates, operating radius, and general locality coordinates (where shared).</li>
            <li>Authentication: Secured via Supabase Auth. Plaintext passwords are never accessible or stored by LocalSeva.</li>
          </ul>
        </section>

        <section className="card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Eye className="h-4 w-4 text-teal" /> 2. Location & Geolocation Privacy
          </h2>
          <p>
            LocalSeva uses browser-based geolocation solely with your explicit device permission to sort nearby service providers. 
            Exact coordinates are not publicly broadcasted; only straight-line distance calculations and general localities are visible to users.
          </p>
        </section>

        <section className="card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-teal" /> 3. Data Protection & Security
          </h2>
          <p>
            All application data is protected by PostgreSQL Row Level Security (RLS) policies. Only customers and their assigned workers can access 
            associated booking conversations, negotiation history, and addresses. Private administrative records remain strictly restricted to platform administrators.
          </p>
        </section>
      </div>
    </div>
  );
}
