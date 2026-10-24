import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { dateTime, errMsg } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — LocalSeva" },
      { name: "description", content: "Your LocalSeva notifications." },
      { property: "og:title", content: "Notifications — LocalSeva" },
      { property: "og:description", content: "View all notifications." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const notes = useQuery({
    queryKey: ["all-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-notifications"] });
      qc.invalidateQueries({ queryKey: ["unread"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const markAllRead = () => {
    const unread = notes.data?.filter((n) => !n.is_read).map((n) => n.id) ?? [];
    if (unread.length) markRead.mutate(unread);
  };

  const unreadCount = notes.data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={markRead.isPending}>
            <Check className="mr-1 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {notes.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : notes.data?.length === 0 ? (
        <div className="card-surface flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-full bg-teal-soft p-3 text-teal">
            <BellOff className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">All caught up</h3>
          <p className="mt-1 text-sm text-muted-foreground">You have no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.data?.map((n) => (
            <div
              key={n.id}
              className={`card-surface flex gap-4 p-4 transition-colors ${!n.is_read ? "border-teal/50 bg-teal-soft/30" : ""}`}
            >
              <div className="mt-1 rounded-full bg-teal-soft p-2 text-teal shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                  {!n.is_read && <Badge variant="teal" className="text-[10px] px-1.5 py-0">New</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-muted-foreground">{dateTime(n.created_at)}</span>
                  {n.related_booking_id && (
                    <Link to="/bookings/$id" params={{ id: n.related_booking_id }} className="text-xs font-medium text-teal hover:underline">
                      View booking →
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => markRead.mutate([n.id])}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
