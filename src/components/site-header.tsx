import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LayoutDashboard, LogOut, Menu, ShieldCheck, User as UserIcon, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/common";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-extrabold text-slate-900 group">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 via-indigo-900 to-teal-800 text-white shadow-md group-hover:scale-105 transition-transform">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-7 9 7" />
          <path d="M6 10v9h12v-9" />
          <circle cx="12" cy="14.5" r="2.2" className="text-teal-400" stroke="currentColor" />
        </svg>
      </span>
      <span>
        Local<span className="text-teal font-extrabold">Seva</span>
      </span>
    </Link>
  );
}

const nav = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Find Services" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/become-worker", label: "Become a Worker" },
] as const;

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unread = useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
      return count ?? 0;
    },
  });

  const name = profile?.full_name || user?.email || "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        
        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-teal-soft text-teal font-semibold" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Dark / Light Mode Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </Button>

          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-xl hover:bg-secondary">
                <Link to="/notifications">
                  <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  {!!unread.data && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                      {unread.data > 9 ? "9+" : unread.data}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full ring-2 ring-border hover:ring-teal transition-all focus-visible:outline-hidden" aria-label="Account menu">
                  <Avatar src={profile?.avatar_url} name={name} size={36} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl border-border bg-card">
                  <DropdownMenuLabel className="truncate font-semibold px-2 py-1.5">{name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })} className="rounded-xl cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-teal" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })} className="rounded-xl cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4 text-teal" /> My profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })} className="rounded-xl cursor-pointer text-primary font-semibold">
                      <ShieldCheck className="mr-2 h-4 w-4 text-primary" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-danger-soft"
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" className="font-semibold text-muted-foreground hover:text-foreground">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild className="bg-gradient-accent text-white font-semibold shadow-md hover:opacity-95 rounded-xl border-0">
                <Link to="/auth" search={{ mode: "signup" }}>Sign Up</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container-page flex flex-col py-4 gap-1" aria-label="Mobile">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-3.5 py-2.5 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                {n.label}
              </Link>
            ))}
            {user ? (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-xl px-3.5 py-2.5 font-semibold text-teal hover:bg-teal-soft">
                Dashboard
              </Link>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/auth" onClick={() => setOpen(false)}>Login</Link>
                </Button>
                <Button asChild className="bg-gradient-accent text-white font-semibold rounded-xl border-0">
                  <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
