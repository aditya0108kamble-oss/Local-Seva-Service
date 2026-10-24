import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "customer" | "worker";
type Profile = { id: string; full_name: string; phone: string | null; avatar_url: string | null; is_suspended: boolean };

type AuthCtx = {
  user: User | null;
  ready: boolean;
  roles: Role[];
  profile: Profile | null;
  isAdmin: boolean;
  isWorker: boolean;
  refresh: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") qc.clear();
      if (event === "SIGNED_IN" || event === "USER_UPDATED") qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const me = useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase.from("profiles").select("id, full_name, phone, avatar_url, is_suspended").eq("id", user!.id).maybeSingle(),
      ]);
      return { roles: (roles ?? []).map((r) => r.role as Role), profile: (profile as Profile) ?? null };
    },
  });

  const roles = me.data?.roles ?? [];
  const value: AuthCtx = {
    user,
    ready: ready && (!user || !me.isLoading),
    roles,
    profile: me.data?.profile ?? null,
    isAdmin: roles.includes("admin"),
    isWorker: roles.includes("worker"),
    refresh: () => qc.invalidateQueries({ queryKey: ["me"] }),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
