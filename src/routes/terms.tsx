import { createFileRoute } from "@tanstack/react-router";
import { Scale, CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — LocalSeva" },
      { name: "description", content: "Terms of service and user agreements for the LocalSeva service marketplace." },
      { property: "og:title", content: "Terms and Conditions — LocalSeva" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary-soft p-3 text-primary">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        </div>
      </div>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal" /> 1. Marketplace Nature
          </h2>
          <p>
            LocalSeva provides a matchmaking platform connecting customers with independent local workers. LocalSeva does not directly employ workers or guarantee specific workmanship outcomes, although our review and complaint resolution mechanisms aim to ensure reliability and safety.
          </p>
        </section>

        <section className="card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Scale className="h-4 w-4 text-teal" /> 2. Transparent Pricing & Negotiations
          </h2>
          <p>
            All price offers, counter-offers, and acceptances made through LocalSeva are binding once mutually accepted for that booking. Neither party may arbitrarily alter the agreed fee after acceptance without entering into an explicit revised agreement recorded in the platform.
          </p>
        </section>

        <section className="card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-destructive" /> 3. Code of Conduct & Account Suspension
          </h2>
          <p>
            Users must maintain respectful communication and adhere to local labor safety guidelines. Abusive reviews, harassment, fraudulent pricing, or non-fulfillment of accepted bookings may result in administrative account suspension and removal from the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
