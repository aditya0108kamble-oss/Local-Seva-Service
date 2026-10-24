import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { BadgeCheck, Bell, BriefcaseBusiness, ChevronRight, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/become-worker")({
  head: () => ({
    meta: [
      { title: "Become a Service Provider — LocalSeva" },
      { name: "description", content: "Register as a local service provider on LocalSeva. Set your own prices, serve nearby customers, and grow your income." },
      { property: "og:title", content: "Become a Service Provider — LocalSeva" },
      { property: "og:description", content: "Join LocalSeva as a worker and start earning." },
    ],
  }),
  component: BecomeWorkerPage,
});

const PRICING_UNITS = ["per_hour", "per_visit", "per_job", "per_day"] as const;
const PRICING_LABELS: Record<string, string> = {
  per_hour: "per hour",
  per_visit: "per visit",
  per_job: "per job",
  per_day: "per day",
};

const workerSchema = z.object({
  display_name: z.string().trim().min(2, "Enter your full name").max(100),
  bio: z.string().trim().min(10, "Write at least 10 characters about yourself").max(1000),
  experience_years: z.coerce.number().min(0).max(60, "Enter a valid experience value"),
  locality: z.string().trim().min(2, "Enter your locality").max(100),
  city: z.string().trim().min(2, "Enter your city").max(100),
  service_radius_km: z.coerce.number().min(1, "Minimum 1 km").max(100, "Maximum 100 km"),
  working_hours: z.string().trim().max(200).optional(),
  languages: z.string().trim().max(200).optional(),
});

const serviceSchema = z.object({
  category_id: z.string().uuid("Choose a service category"),
  description: z.string().trim().max(500).optional(),
  base_price: z.coerce.number().min(1, "Enter a price").max(99999),
  pricing_unit: z.enum(PRICING_UNITS),
});

function BecomeWorkerPage() {
  const { user, isWorker } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container-page max-w-2xl py-16">
        <div className="card-surface p-8 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-teal" />
          <h1 className="mt-4 text-2xl font-bold">Join as a Service Provider</h1>
          <p className="mt-2 text-muted-foreground">Create an account first to register as a worker.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="teal">
              <Link to="/auth" search={{ mode: "signup", type: "worker" }}>Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ mode: "login", redirect: "/become-worker" }}>Log in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isWorker) {
    return (
      <div className="container-page max-w-2xl py-16">
        <div className="card-surface p-8 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-success" />
          <h1 className="mt-4 text-2xl font-bold">You're already a worker!</h1>
          <p className="mt-2 text-muted-foreground">Manage your profile, services, and bookings from your dashboard.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="teal"><Link to="/dashboard">Go to dashboard</Link></Button>
            <Button asChild variant="outline"><Link to="/worker-profile">Edit profile</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return <WorkerRegistrationForm />;
}

function WorkerRegistrationForm() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const cats = useQuery(categoriesQuery);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    experience_years: "",
    locality: "",
    city: "",
    service_radius_km: "10",
    working_hours: "",
    languages: "",
  });
  const [services, setServices] = useState([
    { category_id: "", description: "", base_price: "", pricing_unit: "per_visit" as typeof PRICING_UNITS[number] },
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useMutation({
    mutationFn: async () => {
      // Validate profile
      const pParsed = workerSchema.safeParse(profile);
      if (!pParsed.success) {
        const errs: Record<string, string> = {};
        pParsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
        setErrors(errs);
        throw new Error("Fix profile errors");
      }

      // Validate at least one service
      const validServices = services.filter((s) => s.category_id && Number(s.base_price) > 0);
      if (validServices.length === 0) {
        setErrors({ services: "Add at least one service with a price" });
        throw new Error("Add at least one service");
      }
      const sErrors: Record<string, string> = {};
      validServices.forEach((s, i) => {
        const p = serviceSchema.safeParse(s);
        if (!p.success) p.error.issues.forEach((e) => (sErrors[`service_${i}_${e.path[0]}`] = e.message));
      });
      if (Object.keys(sErrors).length) {
        setErrors(sErrors);
        throw new Error("Fix service errors");
      }
      setErrors({});

      // Create worker profile
      const { data: wp, error: wpErr } = await supabase
        .from("worker_profiles")
        .insert({
          user_id: user!.id,
          display_name: pParsed.data.display_name,
          bio: pParsed.data.bio,
          experience_years: pParsed.data.experience_years,
          locality: pParsed.data.locality,
          city: pParsed.data.city,
          service_radius_km: pParsed.data.service_radius_km,
          working_hours: pParsed.data.working_hours || null,
          languages: pParsed.data.languages ? pParsed.data.languages.split(",").map((l) => l.trim()).filter(Boolean) : [],
          verification_status: "pending",
          availability_status: "available",
        })
        .select("id")
        .single();
      if (wpErr) throw wpErr;

      // Assign worker role
      const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: user!.id, role: "worker" }).select().maybeSingle();
      if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;

      // Create services
      const sInserts = validServices.map((s) => ({
        worker_id: wp.id,
        category_id: s.category_id,
        description: s.description || null,
        base_price: Number(s.base_price),
        pricing_unit: s.pricing_unit,
        is_active: true,
      }));
      const { error: sErr } = await supabase.from("worker_services").insert(sInserts);
      if (sErr) throw sErr;

      return wp.id;
    },
    onSuccess: async (workerId) => {
      toast.success("Profile created! Our team will review your verification request.");
      refresh();
      navigate({ to: "/workers/$id", params: { id: workerId } });
    },
    onError: (e) => {
      if (e.message !== "Fix profile errors" && e.message !== "Add at least one service" && e.message !== "Fix service errors") {
        toast.error(errMsg(e));
      }
    },
  });

  const fe = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  const steps = [
    { n: 1, label: "Your info" },
    { n: 2, label: "Services & prices" },
    { n: 3, label: "Review & submit" },
  ];

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Become a Service Provider</h1>
        <p className="mt-1 text-muted-foreground">Join thousands of workers earning through LocalSeva. It's free to register.</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s.n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {s.n}
            </div>
            <span className={`hidden text-sm sm:block ${step === s.n ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Profile info */}
      {step === 1 && (
        <div className="card-surface space-y-5 p-6">
          <h2 className="text-xl font-bold">Step 1: About you</h2>
          <div className="space-y-2">
            <Label htmlFor="dn">Display name (shown to customers)</Label>
            <Input id="dn" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="e.g. Raju Sharma" maxLength={100} />
            {fe("display_name")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About yourself</Label>
            <Textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Describe your experience, skills, and why customers should choose you..." maxLength={1000} rows={4} />
            {fe("bio")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exp">Years of experience</Label>
              <Input id="exp" type="number" min={0} max={60} value={profile.experience_years} onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })} />
              {fe("experience_years")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Service radius (km)</Label>
              <Input id="radius" type="number" min={1} max={100} value={profile.service_radius_km} onChange={(e) => setProfile({ ...profile, service_radius_km: e.target.value })} />
              {fe("service_radius_km")}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loc">Locality</Label>
              <Input id="loc" value={profile.locality} onChange={(e) => setProfile({ ...profile, locality: e.target.value })} placeholder="e.g. Andheri West" maxLength={100} />
              {fe("locality")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="e.g. Mumbai" maxLength={100} />
              {fe("city")}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh">Working hours <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="wh" value={profile.working_hours} onChange={(e) => setProfile({ ...profile, working_hours: e.target.value })} placeholder="e.g. Mon–Sat, 8 AM – 7 PM" maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lang">Languages spoken <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input id="lang" value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="e.g. Hindi, Marathi, English" maxLength={200} />
          </div>
          <Button className="w-full" variant="teal" onClick={() => {
            const parsed = workerSchema.safeParse(profile);
            if (!parsed.success) {
              const errs: Record<string, string> = {};
              parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
              setErrors(errs);
              return;
            }
            setErrors({});
            setStep(2);
          }}>Next: Add services</Button>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div className="card-surface space-y-5 p-6">
          <h2 className="text-xl font-bold">Step 2: Services &amp; prices</h2>
          <p className="text-sm text-muted-foreground">Add the services you offer and your starting prices. Customers can negotiate with you.</p>
          {errors.services && <p className="text-sm text-destructive">{errors.services}</p>}
          {services.map((svc, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Service {i + 1}</p>
                {services.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setServices(services.filter((_, j) => j !== i))}>Remove</Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Service category</Label>
                <Select value={svc.category_id} onValueChange={(v) => setServices(services.map((s, j) => j === i ? { ...s, category_id: v } : s))}>
                  <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>
                    {cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors[`service_${i}_category_id`] && <p className="text-xs text-destructive">{errors[`service_${i}_category_id`]}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Starting price (₹)</Label>
                  <Input type="number" min={1} value={svc.base_price} onChange={(e) => setServices(services.map((s, j) => j === i ? { ...s, base_price: e.target.value } : s))} placeholder="e.g. 500" />
                  {errors[`service_${i}_base_price`] && <p className="text-xs text-destructive">{errors[`service_${i}_base_price`]}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Pricing unit</Label>
                  <Select value={svc.pricing_unit} onValueChange={(v) => setServices(services.map((s, j) => j === i ? { ...s, pricing_unit: v as typeof PRICING_UNITS[number] } : s))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRICING_UNITS.map((u) => <SelectItem key={u} value={u}>{PRICING_LABELS[u]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Service description <span className="text-muted-foreground">(optional)</span></Label>
                <Input value={svc.description} onChange={(e) => setServices(services.map((s, j) => j === i ? { ...s, description: e.target.value } : s))} placeholder="e.g. Full bathroom plumbing repair and installation" maxLength={500} />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => setServices([...services, { category_id: "", description: "", base_price: "", pricing_unit: "per_visit" }])}>
            + Add another service
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" variant="teal" onClick={() => {
              const valid = services.filter((s) => s.category_id && Number(s.base_price) > 0);
              if (valid.length === 0) { setErrors({ services: "Add at least one service with a price" }); return; }
              setErrors({});
              setStep(3);
            }}>Review &amp; submit</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold">Step 3: Review &amp; submit</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="font-medium">Name</dt><dd className="text-muted-foreground">{profile.display_name}</dd></div>
              <div><dt className="font-medium">Location</dt><dd className="text-muted-foreground">{profile.locality}, {profile.city} · {profile.service_radius_km} km radius</dd></div>
              <div><dt className="font-medium">Experience</dt><dd className="text-muted-foreground">{profile.experience_years} years</dd></div>
              {profile.working_hours && <div><dt className="font-medium">Hours</dt><dd className="text-muted-foreground">{profile.working_hours}</dd></div>}
              {profile.languages && <div><dt className="font-medium">Languages</dt><dd className="text-muted-foreground">{profile.languages}</dd></div>}
            </dl>
            <div className="mt-4">
              <p className="font-medium text-sm">Services:</p>
              <ul className="mt-2 space-y-1">
                {services.filter((s) => s.category_id && Number(s.base_price) > 0).map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {cats.data?.find((c) => c.id === s.category_id)?.name} — ₹{s.base_price} {PRICING_LABELS[s.pricing_unit]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card-surface p-5 text-sm">
            <p className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              After submitting, your profile will be reviewed by our team. You'll appear as <strong>Pending verification</strong> until approved. You can still receive bookings in the meantime.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" variant="teal" onClick={() => register.mutate()} disabled={register.isPending}>
              {register.isPending ? "Creating profile…" : "Submit profile"}
            </Button>
          </div>
        </div>
      )}

      {/* Benefits */}
      {step === 1 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: UserPlus, t: "Free to join", d: "No registration fees. Create your profile in minutes." },
            { icon: BriefcaseBusiness, t: "Set your own prices", d: "You control what you charge. Negotiate directly with customers." },
            { icon: Bell, t: "Get nearby requests", d: "Receive booking requests from customers in your service area." },
          ].map((b) => (
            <div key={b.t} className="card-surface p-4 text-sm">
              <b.icon className="h-5 w-5 text-teal" />
              <p className="mt-2 font-semibold">{b.t}</p>
              <p className="mt-1 text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
