import { ChefHat, Hammer, House, PaintRoller, Refrigerator, Sparkles, Sprout, Truck, Wrench, Zap, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { ChefHat, Hammer, House, PaintRoller, Refrigerator, Sparkles, Sprout, Truck, Wrench, Zap };

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && icons[name]) || Wrench;
  return <Icon className={className} aria-hidden />;
}
