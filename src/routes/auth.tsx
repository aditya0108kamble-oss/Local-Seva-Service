import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["login", "signup"]).optional(),
    type: z.enum(["customer", "worker"]).optional(),
    redirect: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Login or Sign Up — LocalSeva" },
      { name: "description", content: "Sign in or create your LocalSeva customer or worker account." },
      { property: "og:title", content: "Login or Sign Up — LocalSeva" },
      { property: "og:description", content: "Access your LocalSeva account." },
    ],
  }),
  component: AuthPage,
});

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard");

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  account_type: z.enum(["customer", "worker"]),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState(search.mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [login, setLogin] = useState({ email: "", password: "" });
  const [su, setSu] = useState({ full_name: "", email: "", phone: "", password: "", account_type: search.type ?? "customer" });
  const target = safePath(search.redirect);

  useEffect(() => {
    if (user) navigate({ to: target as "/dashboard" });
  }, [user, target, navigate]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: login.email.trim(), password: login.password });
    setBusy(false);
    if (error) toast.error(error.message === "Invalid login credentials" ? "Incorrect email or password" : error.message);
  };

  const doSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(su);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + (su.account_type === "worker" ? "/worker-profile" : "/dashboard"),
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone || null, account_type: parsed.data.account_type },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) setSent(parsed.data.email);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(errMsg(r.error));
  };

  const forgot = async () => {
    if (!z.string().email().safeParse(login.email.trim()).success) return toast.error("Enter your email above first");
    const { error } = await supabase.auth.resetPasswordForEmail(login.email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent. Check your inbox.");
  };

  if (sent)
    return (
      <div className="container-page flex justify-center py-16">
        <div className="card-surface max-w-md p-8 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-teal" />
          <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">We sent a confirmation link to <strong>{sent}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    );

  const fe = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card-surface w-full max-w-md p-6 sm:p-8">
        <h1 className="text-center text-2xl font-bold">Welcome to LocalSeva</h1>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "login")} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={doLogin} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="le">Email</Label>
                <Input id="le" type="email" autoComplete="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lp">Password</Label>
                  <button type="button" onClick={forgot} className="text-xs font-medium text-teal hover:underline">Forgot password?</button>
                </div>
                <Input id="lp" type="password" autoComplete="current-password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Login"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={doSignup} className="mt-4 space-y-4" noValidate>
              <div className="space-y-2">
                <Label>I want to</Label>
                <RadioGroup value={su.account_type} onValueChange={(v) => setSu({ ...su, account_type: v as "customer" })} className="grid grid-cols-2 gap-2">
                  {[
                    { v: "customer", l: "Hire workers" },
                    { v: "worker", l: "Offer my services" },
                  ].map((o) => (
                    <Label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal has-[:checked]:border-teal has-[:checked]:bg-teal-soft">
                      <RadioGroupItem value={o.v} /> {o.l}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sn">Full name</Label>
                <Input id="sn" autoComplete="name" value={su.full_name} onChange={(e) => setSu({ ...su, full_name: e.target.value })} />
                {fe("full_name")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="se">Email</Label>
                <Input id="se" type="email" autoComplete="email" value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} />
                {fe("email")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp">Mobile number {su.account_type === "customer" && <span className="text-muted-foreground">(optional)</span>}</Label>
                <Input id="sp" type="tel" autoComplete="tel" placeholder="98XXXXXXXX" value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} />
                {fe("phone")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spw">Password</Label>
                <Input id="spw" type="password" autoComplete="new-password" value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} />
                {fe("password")}
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={google}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.33 0 8.86-3.74 8.86-9.02 0-.6-.07-1.06-.15-1.13z" /></svg>
          Continue with Google
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Google sign-ups start as customers. You can <Link to="/become-worker" className="text-teal hover:underline">become a worker</Link> anytime.
        </p>
      </div>
    </div>
  );
}
