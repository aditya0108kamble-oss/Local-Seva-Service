import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery } from "@/lib/queries";

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { data: cats } = useQuery(categoriesQuery);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [max, setMax] = useState("");

  return (
    <form
      className={`card-surface grid gap-3 p-3 ${compact ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_auto]"}`}
      onSubmit={(e) => {
        e.preventDefault();
        navigate({
          to: "/search",
          search: {
            category: category === "all" ? undefined : category,
            q: q.trim() || undefined,
            max: max ? Number(max) : undefined,
          },
        });
      }}
    >
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-12" aria-label="Service category">
          <SelectValue placeholder="Choose a service" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All services</SelectItem>
          {cats?.map((c) => (
            <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-12 pl-9" placeholder="Locality, e.g. Andheri West" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Locality" maxLength={80} />
      </div>
      {!compact && (
        <Input
          className="h-12"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Max budget ₹ (optional)"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          aria-label="Maximum budget"
        />
      )}
      <Button type="submit" variant="teal" size="lg" className="h-12">
        <Search /> Search
      </Button>
    </form>
  );
}
