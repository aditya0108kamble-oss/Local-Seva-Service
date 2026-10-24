import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Bell, BriefcaseBusiness, CalendarCheck, CheckCircle2, Handshake, IndianRupee, Lock, MessageSquareWarning, Search, Shield, Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — LocalSeva" },
      { name: "description", content: "Learn how LocalSeva connects customers with trusted local service providers in your area." },
      { property: "og:title", content: "How It Works — LocalSeva" },
      { property: "og:description", content: "Step-by-step guide to using LocalSeva for customers and workers." },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container-page text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">How LocalSeva Works</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Connecting customers with trusted local workers — simply, transparently, and at fair prices.
          </p>
        </div>
      </section>

      {/* For Customers */}
      <section className="container-page py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-xl bg-primary-soft p-3 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">For Customers</h2>
            <p className="text-muted-foreground">Find and book a local service provider in minutes.</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Search,
              title: "Search for a service",
              desc: "Choose a service category (plumbing, electrical, cleaning, etc.) and enter your locality. Use our smart filters to narrow results by budget, rating, and availability.",
            },
            {
              step: "02",
              icon: Handshake,
              title: "Compare & negotiate a fair price",
              desc: "View worker profiles with transparent starting prices, ratings, and customer reviews. Send a booking request and negotiate the final price directly with the worker before the job begins.",
            },
            {
              step: "03",
              icon: Star,
              title: "Book & leave a review",
              desc: "Track your booking status in real time. After the job is completed, leave an honest review to help other customers — and reward workers who do great work.",
            },
          ].map((s) => (
            <div key={s.step} className="card-surface relative overflow-hidden p-6">
              <span className="absolute right-4 top-4 font-display text-6xl font-extrabold text-primary/10">{s.step}</span>
              <div className="mb-4 rounded-xl bg-teal-soft p-3 text-teal inline-flex">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="teal" size="lg">
            <Link to="/search">Find workers now</Link>
          </Button>
        </div>
      </section>

      {/* For Workers */}
      <section className="bg-card py-16">
        <div className="container-page">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-xl bg-teal-soft p-3 text-teal">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">For Service Providers</h2>
              <p className="text-muted-foreground">Register, list your skills, and grow your income.</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: UserPlus,
                title: "Register and create your profile",
                desc: "Sign up for free and complete your worker profile. List your skills, set your service area, add your starting prices, and upload a profile photo.",
              },
              {
                step: "02",
                icon: Bell,
                title: "Receive booking requests",
                desc: "Customers in your area will find your profile and send booking requests. You decide whether to accept or decline each request. Negotiate the price directly.",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Complete jobs and earn",
                desc: "Accept jobs that suit you, complete the work, and build your reputation through positive customer reviews. Your rating improves your visibility.",
              },
            ].map((s) => (
              <div key={s.step} className="card-surface relative overflow-hidden p-6">
                <span className="absolute right-4 top-4 font-display text-6xl font-extrabold text-teal/10">{s.step}</span>
                <div className="mb-4 rounded-xl bg-primary-soft p-3 text-primary inline-flex">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="teal" size="lg">
              <Link to="/become-worker">Become a worker</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Price Negotiation Explainer */}
      <section className="container-page py-16">
        <div className="card-surface grid gap-8 p-8 lg:grid-cols-2">
          <div>
            <div className="inline-flex rounded-xl bg-teal-soft p-3 text-teal">
              <Handshake className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Transparent Price Negotiation</h2>
            <p className="mt-3 text-muted-foreground">
              LocalSeva is designed around fair, transparent pricing. Workers list their starting price, and customers can negotiate directly.
              Every offer and counter-offer is recorded — so both parties always know where they stand.
            </p>
            <p className="mt-3 text-muted-foreground">
              Once both parties agree on a price, it's locked in as the agreed amount for the booking. No surprises.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { who: "Worker", amount: "₹600", note: "Initial quote", color: "bg-secondary" },
              { who: "Customer", amount: "₹450", note: "Counter offer", color: "bg-primary-soft" },
              { who: "Worker", amount: "₹500", note: "Counter offer", color: "bg-secondary" },
              { who: "Customer", amount: "✓ Accepted ₹500", note: "Price agreed", color: "bg-success-soft" },
            ].map((e, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${e.color}`}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {e.who[0]}
                </div>
                <div>
                  <p className="font-semibold">{e.amount}</p>
                  <p className="text-xs text-muted-foreground">{e.who} · {e.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-card py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold sm:text-3xl">Trust &amp; Safety</h2>
          <p className="mt-1 text-muted-foreground">We're committed to making LocalSeva safe for everyone.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BadgeCheck, title: "Worker verification", desc: "Our team reviews worker applications before awarding a Verified badge. Unverified workers are still available but clearly marked." },
              { icon: IndianRupee, title: "Transparent pricing", desc: "Workers list their starting prices publicly. The negotiation history is recorded and visible to both parties." },
              { icon: Star, title: "Honest reviews", desc: "Only customers who have completed a booking with a worker can leave a review. We prevent fake reviews." },
              { icon: Lock, title: "Secure accounts", desc: "Passwords are never stored in plain text. We use industry-standard authentication with Supabase." },
              { icon: MessageSquareWarning, title: "Complaint reporting", desc: "Both customers and workers can report problems. Our admin team reviews all complaints and takes action." },
              { icon: Shield, title: "Role-based access", desc: "Customers, workers, and administrators each have separate, enforced permissions. Users cannot escalate their own privileges." },
            ].map((t) => (
              <div key={t.title} className="card-surface p-5">
                <t.icon className="h-5 w-5 text-teal" />
                <h3 className="mt-3 font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            {
              q: "Is LocalSeva free to use?",
              a: "Yes. Signing up as a customer or worker is completely free. Workers can list their services and receive bookings at no charge.",
            },
            {
              q: "How long does it take to find a worker?",
              a: "It depends on availability in your area. For immediate requests, workers typically respond within an hour. Scheduling in advance gives more flexibility.",
            },
            {
              q: "Can I cancel a booking?",
              a: "Yes. Customers and workers can cancel pending or accepted bookings. Completed bookings cannot be cancelled. Please cancel early if your plans change.",
            },
            {
              q: "What if I'm unhappy with the service?",
              a: "Leave an honest review and file a complaint through the booking page. Our team will review it and follow up.",
            },
            {
              q: "How does worker verification work?",
              a: "Workers submit their profile for verification. Our admin team reviews the information and approves or rejects it. Verified workers display a badge on their profile.",
            },
            {
              q: "Can a worker refuse a booking request?",
              a: "Yes. Workers are always free to decline a booking request. The booking is only confirmed after the worker accepts it.",
            },
          ].map((faq) => (
            <div key={faq.q} className="card-surface p-5">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-16">
        <div className="card-surface grid gap-6 p-8 text-center md:grid-cols-2 md:text-left">
          <div>
            <h2 className="text-2xl font-bold">Need a service today?</h2>
            <p className="mt-2 text-muted-foreground">Find a trusted local worker in your area right now.</p>
            <Button asChild variant="teal" size="lg" className="mt-5">
              <Link to="/search">Search workers</Link>
            </Button>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Offer your skills?</h2>
            <p className="mt-2 text-muted-foreground">Join LocalSeva as a service provider and start earning.</p>
            <Button asChild variant="outline" size="lg" className="mt-5">
              <Link to="/become-worker">Become a worker</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
