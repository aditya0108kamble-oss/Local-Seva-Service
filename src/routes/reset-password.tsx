import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — LocalSeva" },
      { name: "description", content: "Set a new password for your LocalSeva account." },
      { property: "og:title", content: "Reset Password — LocalSeva" },
      { property: "og:description", content: "Set a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="container-page flex justify-center py-16">
      <form
        className="card-surface w-full max-w-md space-y-4 p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return toast.error("Password must be at least 8 characters");
          if (pw !== pw2) return toast.error("Passwords don't match");
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return toast.error(error.message);
          toast.success("Password updated");
          navigate({ to: "/dashboard" });
        }}
      >
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <div className="space-y-2">
          <Label htmlFor="p1">New password</Label>
          <Input id="p1" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p2">Confirm password</Label>
          <Input id="p2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </div>
  );
}
