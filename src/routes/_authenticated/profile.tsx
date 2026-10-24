import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — LocalSeva" },
      { name: "description", content: "Manage your LocalSeva account information." },
      { property: "og:title", content: "My Profile — LocalSeva" },
      { property: "og:description", content: "Update your LocalSeva profile." },
    ],
  }),
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").or(z.literal("")),
});

function ProfilePage() {
  const { user, profile, refresh } = useAuth();
  const qc = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.safeParse(f);
      if (!parsed.success) {
        const errs: Record<string, string> = {};
        parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
        setErrors(errs);
        throw new Error("Validation failed");
      }
      setErrors({});

      let avatar_url = profile?.avatar_url;
      if (avatarFile) {
        setUploading(true);
        const ext = avatarFile.name.split(".").pop();
        const path = `profiles/${user!.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("worker-avatars").upload(path, avatarFile, { upsert: true });
        setUploading(false);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("worker-avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("profiles").update({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
        avatar_url,
        updated_at: new Date().toISOString(),
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      refresh();
      setAvatarFile(null);
    },
    onError: (e) => {
      if (e.message !== "Validation failed") toast.error(errMsg(e));
    },
  });

  const changePassword = useMutation({
    mutationFn: async ({ current, next }: { current: string; next: string }) => {
      // Re-auth not directly supported; use updateUser (works if session is valid)
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Password updated successfully!"),
    onError: (e) => toast.error(errMsg(e)),
  });

  const [pwF, setPwF] = useState({ current: "", next: "", confirm: "" });

  const fe = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <div className="container-page max-w-xl py-8">
      <h1 className="mb-6 text-2xl font-bold">My Profile</h1>

      {/* Profile info */}
      <div className="card-surface space-y-5 p-6">
        <h2 className="text-lg font-bold">Account information</h2>

        {/* Avatar */}
        <div className="space-y-2">
          <Label>Profile photo</Label>
          <div className="flex items-center gap-4">
            <Avatar src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url} name={profile?.full_name ?? "?"} size={64} />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-teal hover:text-teal">
              <Upload className="h-4 w-4" />
              {avatarFile ? avatarFile.name : "Upload photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fn">Full name</Label>
          <Input id="fn" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} autoComplete="name" maxLength={100} />
          {fe("full_name")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="em">Email address</Label>
          <Input id="em" value={user?.email ?? ""} disabled className="bg-secondary" />
          <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ph">Mobile number</Label>
          <Input id="ph" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98XXXXXXXX" autoComplete="tel" maxLength={13} />
          {fe("phone")}
        </div>

        <Button variant="teal" className="w-full" onClick={() => save.mutate()} disabled={save.isPending || uploading}>
          {save.isPending || uploading ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {/* Change password */}
      <div className="card-surface mt-6 space-y-4 p-6">
        <h2 className="text-lg font-bold">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="pnew">New password</Label>
          <Input id="pnew" type="password" value={pwF.next} onChange={(e) => setPwF({ ...pwF, next: e.target.value })} autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pconf">Confirm new password</Label>
          <Input id="pconf" type="password" value={pwF.confirm} onChange={(e) => setPwF({ ...pwF, confirm: e.target.value })} autoComplete="new-password" />
        </div>
        <Button variant="outline" className="w-full" onClick={() => {
          if (pwF.next.length < 8) return toast.error("Password must be at least 8 characters");
          if (pwF.next !== pwF.confirm) return toast.error("Passwords don't match");
          changePassword.mutate({ current: pwF.current, next: pwF.next });
        }} disabled={changePassword.isPending}>
          {changePassword.isPending ? "Updating…" : "Update password"}
        </Button>
      </div>

      {/* Account info */}
      <div className="card-surface mt-6 p-6">
        <h2 className="mb-3 text-lg font-bold">Account details</h2>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account ID</dt><dd className="mt-0.5 font-mono text-xs">{user?.id}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email verified</dt><dd className="mt-0.5">{user?.email_confirmed_at ? "Yes" : "Pending"}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account created</dt><dd className="mt-0.5">{user?.created_at ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(user.created_at)) : "—"}</dd></div>
        </dl>
      </div>
    </div>
  );
}
