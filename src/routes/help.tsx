import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, Search, LifeBuoy, FileText, Handshake, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — LocalSeva" },
      { name: "description", content: "Frequently asked questions and guides for customers and workers on LocalSeva." },
      { property: "og:title", content: "Help Center — LocalSeva" },
      { property: "og:description", content: "Find help and support on LocalSeva." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const faqs = [
    {
      q: "How does the price negotiation system work?",
      a: "Workers post base starting prices for their services. When you request a booking, you or the worker can make an initial price offer or counter-offer. Each offer is logged chronologically. Once an offer is accepted by both sides, it becomes the locked agreed price for that job."
    },
    {
      q: "Does LocalSeva guarantee arrival within 30 minutes?",
      a: "No. LocalSeva aims for prompt 30-minute matching when distance and availability permit, but travel times, traffic, and schedules vary. We display realistic availability statuses (Available, Busy, Offline) and straight-line distance estimates without fabricating exact arrival times."
    },
    {
      q: "How do I become a verified worker?",
      a: "After creating your worker profile and listing your services, submit your profile for verification. An administrator reviews your qualifications and experience. Once approved, a green Verified badge appears on your profile and search cards."
    },
    {
      q: "What if I need to cancel my booking?",
      a: "You can cancel a booking that is currently in 'Pending' or 'Accepted' status through the booking details page. You will be prompted to provide an optional cancellation reason. Bookings in 'In Progress' or 'Completed' status cannot be cancelled."
    },
    {
      q: "How can I report inappropriate behavior or bad service?",
      a: "On every booking details page, there is a 'Report a problem' flag button. You can file a complaint with details and an optional subject. Administrators review all complaints and take corrective actions, including suspending offending accounts."
    },
    {
      q: "Who can leave reviews?",
      a: "To ensure trust and prevent fake reviews, only customers who have completed a booking with a worker can write a review and assign a 1-5 star rating. Workers can reply to reviews on their bookings."
    }
  ];

  return (
    <div className="container-page max-w-4xl py-12">
      <div className="text-center">
        <div className="inline-flex rounded-full bg-teal-soft p-3 text-teal">
          <LifeBuoy className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Help Center</h1>
        <p className="mt-2 text-muted-foreground">Find answers to common questions about using LocalSeva.</p>
      </div>

      {/* Categories of Help */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5 text-center">
          <Handshake className="mx-auto h-6 w-6 text-teal" />
          <h3 className="mt-2 font-bold">Bookings & Offers</h3>
          <p className="mt-1 text-xs text-muted-foreground">Learn about requesting appointments and negotiating quotes.</p>
        </div>
        <div className="card-surface p-5 text-center">
          <HelpCircle className="mx-auto h-6 w-6 text-primary" />
          <h3 className="mt-2 font-bold">Worker Verification</h3>
          <p className="mt-1 text-xs text-muted-foreground">Guidelines on how verification badges are assigned and vetted.</p>
        </div>
        <div className="card-surface p-5 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-warning" />
          <h3 className="mt-2 font-bold">Safety & Disputes</h3>
          <p className="mt-1 text-xs text-muted-foreground">Resolving complaints, account suspension, and platform terms.</p>
        </div>
      </div>

      {/* FAQ list */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="card-surface p-5">
              <h3 className="text-base font-semibold text-primary">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Still need help */}
      <div className="mt-12 card-surface p-6 text-center">
        <h3 className="text-lg font-bold">Didn't find what you were looking for?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Our support representatives are ready to assist you.</p>
        <div className="mt-4">
          <Button asChild variant="teal">
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
