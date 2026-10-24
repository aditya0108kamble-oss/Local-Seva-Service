import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, VerifiedBadge } from "@/components/common";
import { categoriesQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { inr, pricingUnitLabel, errMsg } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/worker-profile")({
  head: () => ({
    meta: [
      { title: "My Worker Profile — LocalSeva" },
      { name: "description", content: "Manage your worker profile, services, prices and availability on LocalSeva." },
      { property: "og:title", content: "My Worker Profile — LocalSeva" },
      { property: "og:description", content: "Edit your LocalSeva worker profile." },
    ],
  }),
  component: WorkerProfilePage,
});

const PRICING_UNITS = ["per_hour", "per_visit", "per_job", "per_day"] as const;

function WorkerProfilePage() {
  const { user, isWorker } = useAuth();
  const qc = useQueryClient();

  const wp = useQuery({
    queryKey: ["my-worker-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*, worker_services(*, service_categories(name))")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const cats = useQuery(categoriesQuery);

  if (wp.isLoading) return <div className="container-page py-10"><Skeleton className="h-64 rounded-xl" /></div>;

  if (!wp.data) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={BadgeCheck}
          title="No worker profile yet"
          text="You haven't set up a worker profile. Register as a service provider to get started."
          action={<Button asChild variant="teal"><Link to="/become-worker">Create worker profile</Link></Button>}
        />
      </div>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["my-worker-full"] });

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My Worker Profile</h1>
          <div className="mt-1 flex items-center gap-2">
            <VerifiedBadge status={wp.data.verification_status} />
            <span className="text-sm text-muted-foreground">
              Verification: <strong>{wp.data.verification_status}</strong>
              {wp.data.verification_status === "pending" && " · Our team will review your profile soon."}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/workers/$id" params={{ id: wp.data.id }}>View public profile</Link>
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="profile">Profile info</TabsTrigger>
          <TabsTrigger value="services">Services &amp; prices</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileForm data={wp.data} onSave={refresh} />
        </TabsContent>
        <TabsContent value="services" className="mt-6">
          <ServicesPanel workerId={wp.data.id} services={wp.data.worker_services} cats={cats.data ?? []} onSave={refresh} />
        </TabsContent>
        <TabsContent value="availability" className="mt-6">
          <AvailabilityPanel data={wp.data} onSave={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type WP = NonNullable<Awaited<ReturnType<typeof fetchWP>>>;
async function fetchWP(userId: string) {
  const { data } = await supabase.from("worker_profiles").select("*, worker_services(*, service_categories(name))").eq("user_id", userId).maybeSingle();
  return data;
}

function ProfileForm({ data, onSave }: { data: NonNullable<Awaited<ReturnType<typeof fetchWP>>>; onSave: () => void }) {
  const [f, setF] = useState({
    display_name: data.display_name ?? "",
    bio: data.bio ?? "",
    experience_years: String(data.experience_years ?? 0),
    locality: data.locality ?? "",
    city: data.city ?? "",
    service_radius_km: String(data.service_radius_km ?? 10),
    working_hours: data.working_hours ?? "",
    languages: (data.languages ?? []).join(", "),
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      let avatar_url = data.avatar_url;
      if (avatarFile) {
        setUploading(true);
        const ext = avatarFile.name.split(".").pop();
        const path = `avatars/${data.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("worker-avatars").upload(path, avatarFile, { upsert: true });
        setUploading(false);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("worker-avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("worker_profiles").update({
        display_name: f.display_name.trim(),
        bio: f.bio.trim(),
        experience_years: Number(f.experience_years),
        locality: f.locality.trim(),
        city: f.city.trim(),
        service_radius_km: Number(f.service_radius_km),
        working_hours: f.working_hours.trim() || null,
        languages: f.languages ? f.languages.split(",").map((l) => l.trim()).filter(Boolean) : [],
        avatar_url,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated!"); onSave(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="card-surface space-y-5 p-6">
      <h2 className="text-lg font-bold">Profile information</h2>

      {/* Avatar upload */}
      <div className="space-y-2">
        <Label>Profile photo</Label>
        <div className="flex items-center gap-4">
          {data.avatar_url && <img src={data.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-teal hover:text-teal">
            <Upload className="h-4 w-4" />
            {avatarFile ? avatarFile.name : "Upload photo"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dn">Display name</Label>
        <Input id="dn" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">About yourself</Label>
        <Textarea id="bio" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={4} maxLength={1000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exp">Years of experience</Label>
          <Input id="exp" type="number" min={0} max={60} value={f.experience_years} onChange={(e) => setF({ ...f, experience_years: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="radius">Service radius (km)</Label>
          <Input id="radius" type="number" min={1} max={100} value={f.service_radius_km} onChange={(e) => setF({ ...f, service_radius_km: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="loc">Locality</Label>
          <Input id="loc" value={f.locality} onChange={(e) => setF({ ...f, locality: e.target.value })} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={100} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wh">Working hours</Label>
        <Input id="wh" value={f.working_hours} onChange={(e) => setF({ ...f, working_hours: e.target.value })} placeholder="e.g. Mon–Sat, 8 AM – 7 PM" maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lang">Languages (comma-separated)</Label>
        <Input id="lang" value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} placeholder="Hindi, Marathi, English" maxLength={200} />
      </div>
      <Button variant="teal" className="w-full" onClick={() => save.mutate()} disabled={save.isPending || uploading}>
        {save.isPending || uploading ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function ServicesPanel({ workerId, services, cats, onSave }: { workerId: string; services: { id: string; category_id: string | null; description: string | null; base_price: number; pricing_unit: string; is_active: boolean; service_categories: { name: string } | null }[]; cats: { id: string; name: string }[]; onSave: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newSvc, setNewSvc] = useState({ category_id: "", description: "", base_price: "", pricing_unit: "per_visit" as typeof PRICING_UNITS[number] });

  const addService = useMutation({
    mutationFn: async () => {
      if (!newSvc.category_id || !(Number(newSvc.base_price) > 0)) throw new Error("Choose a category and enter a valid price");
      const { error } = await supabase.from("worker_services").insert({
        worker_id: workerId,
        category_id: newSvc.category_id,
        description: newSvc.description.trim() || null,
        base_price: Number(newSvc.base_price),
        pricing_unit: newSvc.pricing_unit,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Service added!"); setAdding(false); setNewSvc({ category_id: "", description: "", base_price: "", pricing_unit: "per_visit" }); onSave(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const toggleService = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("worker_services").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Service updated"); onSave(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worker_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Service removed"); onSave(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="card-surface space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Services &amp; prices</h2>
        <Button variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> Add service
        </Button>
      </div>

      {adding && (
        <div className="space-y-3 rounded-xl border border-dashed p-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={newSvc.category_id} onValueChange={(v) => setNewSvc({ ...newSvc, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input type="number" min={1} value={newSvc.base_price} onChange={(e) => setNewSvc({ ...newSvc, base_price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={newSvc.pricing_unit} onValueChange={(v) => setNewSvc({ ...newSvc, pricing_unit: v as typeof PRICING_UNITS[number] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRICING_UNITS.map((u) => <SelectItem key={u} value={u}>{pricingUnitLabel[u]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input value={newSvc.description} onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })} maxLength={500} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="teal" onClick={() => addService.mutate()} disabled={addService.isPending}>Add service</Button>
          </div>
        </div>
      )}

      {services.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No services added yet. Add your first service above.</p>
      )}

      <div className="divide-y">
        {services.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="flex-1">
              <p className="font-semibold">{s.service_categories?.name}</p>
              {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
              <p className="mt-1 text-sm">{inr(s.base_price)} <span className="text-muted-foreground">{pricingUnitLabel[s.pricing_unit]}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={s.is_active} onCheckedChange={(v) => toggleService.mutate({ id: s.id, is_active: v })} aria-label="Active" />
              <span className="text-xs text-muted-foreground">{s.is_active ? "Active" : "Hidden"}</span>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Remove this service?")) deleteService.mutate(s.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvailabilityPanel({ data, onSave }: { data: { id: string; availability_status: string; working_hours: string | null }; onSave: () => void }) {
  const setAvail = useMutation({
    mutationFn: async (v: "available" | "busy" | "offline") => {
      const { error } = await supabase.from("worker_profiles").update({ availability_status: v }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Availability updated. Accepted bookings are not affected."); onSave(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const statuses: { value: "available" | "busy" | "offline"; label: string; desc: string; color: string }[] = [
    { value: "available", label: "Available", desc: "You're ready to take new bookings.", color: "bg-success" },
    { value: "busy", label: "Busy", desc: "You're occupied but your profile stays visible.", color: "bg-warning" },
    { value: "offline", label: "Offline", desc: "You won't appear in search results.", color: "bg-muted-foreground" },
  ];

  return (
    <div className="card-surface space-y-5 p-6">
      <h2 className="text-lg font-bold">Availability</h2>
      <p className="text-sm text-muted-foreground">Changing your availability won't cancel any already accepted bookings.</p>
      <div className="space-y-3">
        {statuses.map((s) => (
          <label key={s.value} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${data.availability_status === s.value ? "border-teal bg-teal-soft" : ""}`}>
            <input type="radio" name="avail" value={s.value} checked={data.availability_status === s.value} onChange={() => setAvail.mutate(s.value)} className="sr-only" />
            <span className={`h-3 w-3 rounded-full ${s.color}`} />
            <div>
              <p className="font-semibold">{s.label}</p>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
