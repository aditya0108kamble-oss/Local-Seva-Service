import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, HeartHandshake, MapPin, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — LocalSeva" },
      { name: "description", content: "Learn about LocalSeva, our mission, and how we empower local service providers and communities." },
      { property: "og:title", content: "About Us — LocalSeva" },
      { property: "og:description", content: "Connecting Indian households with trusted local skilled workers." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="py-12">
      {/* Hero */}
      <section className="container-page max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
          <HeartHandshake className="h-4 w-4" /> Hyperlocal Community Marketplace
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-primary sm:text-4xl lg:text-5xl">
          Empowering Local Hands, Serving Every Indian Household
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          LocalSeva is built to bridge the gap between skilled local workers and households needing prompt, reliable, and fairly negotiated services.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="container-page max-w-5xl py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card-surface p-6">
            <div className="rounded-xl bg-primary-soft p-3 text-primary inline-flex">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Trust & Transparency</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We verify workers, offer complete transparency on initial pricing, and log negotiation histories to ensure both customers and service providers are protected.
            </p>
          </div>
          <div className="card-surface p-6">
            <div className="rounded-xl bg-teal-soft p-3 text-teal inline-flex">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Worker Empowerment</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Local plumbers, electricians, carpenters, and helpers set their own prices, pick their operating radii, and negotiate terms directly without middlemen eating up their earnings.
            </p>
          </div>
          <div className="card-surface p-6">
            <div className="rounded-xl bg-success-soft p-3 text-success inline-flex">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Hyperlocal Reach</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              By focusing on neighbourhood proximity and realistic availability, we aim to help households find capable assistance within minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Services */}
      <section className="bg-card py-12">
        <div className="container-page max-w-4xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Comprehensive Household Support</h2>
          <p className="mt-2 text-muted-foreground">
            From emergency repairs to daily home maintenance, LocalSeva hosts a broad spectrum of services.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              "Plumbing", "Electrical repairs", "House cleaning", "Painting",
              "Carpentry", "Cooking", "Maid services", "Appliance repair",
              "Gardening", "Moving and shifting", "General maintenance"
            ].map((s) => (
              <span key={s} className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page max-w-3xl py-12 text-center">
        <h2 className="text-2xl font-bold">Ready to experience LocalSeva?</h2>
        <p className="mt-2 text-muted-foreground">Join as a customer to find reliable service providers, or register your skills today.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild variant="teal">
            <Link to="/search">Find Services</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/become-worker">Become a Worker</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
