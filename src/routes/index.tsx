import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarCheck, Handshake, IndianRupee, Lock, MessageSquareWarning, Search, Star, UserPlus, Bell, BriefcaseBusiness, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchForm } from "@/components/search-form";
import { CategoryIcon } from "@/components/category-icon";
import { WorkerCard, WORKER_SELECT, type WorkerListItem } from "@/components/worker-card";
import { categoriesQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_WORKERS } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalSeva — Trusted Local Services, Just Around the Corner" },
      { name: "description", content: "Book plumbers, electricians, cleaners, painters and more in your locality. Compare, negotiate a fair price and book." },
      { property: "og:title", content: "LocalSeva — Find Trusted Local Workers Near You" },
      { property: "og:description", content: "Hyperlocal service marketplace for Indian households." },
    ],
  }),
  component: Index,
});

function Index() {
  const cats = useQuery(categoriesQuery);
  const featured = useQuery({
    queryKey: ["featured-workers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select(WORKER_SELECT)
        .order("is_demo", { ascending: true })
        .order("rating_avg", { ascending: false })
        .limit(6);
      if (error || !data || data.length === 0) {
        return DEMO_WORKERS as unknown as WorkerListItem[];
      }
      // Merge with rich demo data if DB profiles have 0 reviews/ratings
      const merged = (data as unknown as WorkerListItem[]).map((w) => {
        const enriched = DEMO_WORKERS.find((d) => d.id === w.id || d.display_name.startsWith(w.display_name.replace(" (Demo)", "")));
        if (enriched && (w.rating_avg === 0 || w.is_demo)) {
          return {
            ...w,
            display_name: enriched.display_name,
            avatar_url: enriched.avatar_url,
            rating_avg: enriched.rating_avg,
            review_count: enriched.review_count,
            completed_jobs: enriched.completed_jobs,
            verification_status: enriched.verification_status,
            availability_status: enriched.availability_status,
            worker_services: w.worker_services?.length ? w.worker_services : enriched.worker_services,
          };
        }
        return w;
      });
      return merged;
    },
  });

  return (
    <>
      {/* Hero Section with Vibrant Modern Gradient Mesh */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-soft px-3.5 py-1.5 text-xs font-semibold text-accent-foreground backdrop-blur-md shadow-xs animate-bounce-subtle">
              <Sparkles className="h-4 w-4 text-teal animate-spin-slow" />
              <span>India's Trusted Hyperlocal Marketplace</span>
            </div>
            
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] text-foreground sm:text-5xl lg:text-6xl tracking-tight">
              Find Trusted Local Workers <span className="text-gradient-brand">Near You</span>
            </h1>
            
            <p className="mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
              From plumbing and electrical fixes to deep cleaning and carpentry, connect with skilled local professionals at transparent, negotiated prices.
            </p>
            
            <div className="mt-8 rounded-2xl bg-card/90 p-2 shadow-xl ring-1 ring-border backdrop-blur-md transition-all hover:shadow-2xl">
              <SearchForm />
            </div>
            
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <Button asChild variant="outline" className="border-border font-medium hover:bg-secondary">
                <Link to="/become-worker">
                  Join as a Service Provider <ArrowRight className="ml-1.5 h-4 w-4 text-teal" />
                </Link>
              </Button>
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Free to join · Set your own prices
              </span>
            </div>
          </div>

          {/* Hero Visual Card with Floating Animation */}
          <div className="relative animate-float">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-teal/40 to-blue-600/30 blur-2xl opacity-70 animate-glow" />
            <div className="relative rounded-3xl bg-card p-2 shadow-2xl ring-1 ring-border">
              <img
                src={heroImg}
                alt="Local electrician and plumber greeting a customer at her home"
                width={1280}
                height={1024}
                className="aspect-[5/4] w-full rounded-2xl object-cover"
              />
              <div className="card-surface absolute -bottom-5 left-5 flex items-center gap-3.5 border-teal/20 px-5 py-3.5 shadow-xl backdrop-blur-md bg-card/95">
                <div className="rounded-xl bg-gradient-accent p-2.5 text-white shadow-md">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Negotiate fairly</p>
                  <p className="text-xs font-medium text-muted-foreground">Agree on a transparent price before work starts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Service Categories */}
      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Popular Service Categories</h2>
            <p className="mt-1 text-muted-foreground">Pick a service to instantly discover nearby workers.</p>
          </div>
          <Button asChild variant="ghost" className="text-teal font-semibold hover:text-teal/80">
            <Link to="/search">View all services →</Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {cats.isLoading
            ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            : cats.data?.map((c) => (
                <Link
                  key={c.id}
                  to="/search"
                  search={{ category: c.slug }}
                  className="card-surface card-hover group flex flex-col items-start gap-3.5 p-5 border-border bg-card/90 hover:bg-card"
                >
                  <span className="rounded-xl bg-gradient-to-br from-blue-500/10 to-teal-500/20 p-3.5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-teal group-hover:text-white shadow-xs">
                    <CategoryIcon name={c.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="font-semibold text-foreground group-hover:text-teal transition-colors">{c.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Explore workers →</p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* How It Works with Modern Gradient Highlights */}
      <section className="py-20 bg-secondary/40 border-y border-border">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-teal">Simple 3-Step Process</span>
            <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">How LocalSeva Works</h2>
            <p className="mt-3 text-muted-foreground">Connecting you with trusted neighborhood professionals with total transparency.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { num: "01", icon: Search, t: "1. Search for a service", d: "Choose a category and enter your locality to see available workers nearby." },
              { num: "02", icon: Handshake, t: "2. Compare & agree on price", d: "Check reviews, verified badges, and negotiate prices directly in chat." },
              { num: "03", icon: Star, t: "3. Book & leave a review", d: "Track booking status and leave an honest review once the work is done." },
            ].map((s) => (
              <div key={s.t} className="card-surface p-7 relative overflow-hidden bg-card hover:border-teal/40 transition-all">
                <span className="absolute -right-2 -bottom-4 text-7xl font-extrabold text-muted/40 select-none">
                  {s.num}
                </span>
                <div className="h-12 w-12 rounded-2xl bg-teal-soft flex items-center justify-center text-teal">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed relative z-10">{s.d}</p>
              </div>
            ))}
          </div>

          {/* Banner for workers with Deep Navy & Teal gradient */}
          <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-teal-950 p-8 sm:p-10 text-white shadow-xl relative">
            <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-400/30">
                  Earn on your terms
                </span>
                <h3 className="mt-3 text-2xl font-bold sm:text-3xl text-white">Are you a skilled local service provider?</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-3 text-sm text-slate-200">
                  {[
                    { icon: UserPlus, t: "Register & list your skills" },
                    { icon: Bell, t: "Get requests from your locality" },
                    { icon: BriefcaseBusiness, t: "Direct payout with 0% cut" },
                  ].map((s) => (
                    <div key={s.t} className="flex items-center gap-2.5">
                      <div className="rounded-full bg-teal/20 p-1 text-teal-300">
                        <s.icon className="h-4 w-4" />
                      </div>
                      <span>{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button asChild size="lg" className="bg-gradient-accent text-white font-semibold shadow-lg hover:opacity-95 border-0">
                <Link to="/become-worker">Become a Worker</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Workers */}
      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Featured Service Providers</h2>
            <p className="mt-1 text-muted-foreground">Top-rated and verified local specialists ready to assist you.</p>
          </div>
          <Button asChild variant="outline" className="border-border">
            <Link to="/search">See all workers →</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
            : featured.data?.map((w) => <WorkerCard key={w.id} w={w} />)}
        </div>
      </section>

      {/* Trust & Safety Highlights */}
      <section className="container-page pb-20">
        <div className="card-surface p-8 sm:p-10 border-border bg-card">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-foreground">Why India Chooses LocalSeva</h2>
            <p className="mt-1 text-sm text-muted-foreground">Built on safety, transparent pricing, and trusted neighborhood relationships.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: BadgeCheck, t: "Verified Profiles", d: "Worker credentials and IDs undergo verification." },
              { icon: IndianRupee, t: "Upfront Pricing", d: "Clear starting quotes and negotiated transparent rates." },
              { icon: Star, t: "Genuine Reviews", d: "Only completed bookings can submit ratings." },
              { icon: Lock, t: "Secure & Private", d: "Contact numbers shared only upon booking acceptance." },
              { icon: MessageSquareWarning, t: "Prompt Support", d: "Dedicated resolution for disputes and complaints." },
            ].map((s) => (
              <div key={s.t} className="text-center sm:text-left">
                <div className="h-10 w-10 rounded-xl bg-teal-soft flex items-center justify-center text-teal mx-auto sm:mx-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 font-bold text-foreground">{s.t}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
