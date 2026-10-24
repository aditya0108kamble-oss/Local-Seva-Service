import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/site-header";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export function SiteFooter() {
  const link = "text-sm text-slate-300 hover:text-white transition-colors";
  return (
    <footer className="mt-20 border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="inline-block rounded-2xl bg-white px-3.5 py-2 shadow-lg">
            <Logo />
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Trusted Local Services, Just Around the Corner. Connecting Indian households with prompt, verified service specialists.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-medium">
            <ShieldCheck className="h-4 w-4" /> 100% Verified Local Professionals
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-200">LocalSeva</h4>
          <Link to="/about" className={link}>About Us</Link>
          <Link to="/how-it-works" className={link}>How It Works</Link>
          <Link to="/contact" className={link}>Contact Support</Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-200">Support & Trust</h4>
          <Link to="/help" className={link}>Help Center & FAQ</Link>
          <Link to="/privacy" className={link}>Privacy Policy</Link>
          <Link to="/terms" className={link}>Terms and Conditions</Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-200">For Service Providers</h4>
          <Link to="/become-worker" className="text-sm font-semibold text-teal-400 hover:text-teal-300">Become a Worker →</Link>
          <Link to="/auth" search={{ mode: "signup" }} className={link}>Create Worker Account</Link>
          <p className="mt-2 text-xs text-slate-500">
            Set your own prices, pick your schedule, and receive instant bookings in your neighborhood.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="container-page flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LocalSeva. Built for Indian Households & Skilled Workers.</p>
          <p className="flex items-center gap-1">
            College Project Demonstration · Made with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
