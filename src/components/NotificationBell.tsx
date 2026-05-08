import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CheckCheck, Heart, ThumbsUp, MessageSquare, UserPlus, Sparkles, X, BellRing } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { toast } from "sonner";

const ICONS: Record<string, any> = {
  like: ThumbsUp, comment: MessageSquare, follow: UserPlus,
  approve: Sparkles, reject: X, reply: MessageSquare,
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Tables<"notifications">[]>([]);
  const [open, setOpen] = useState(false);
  const { supported, permission, request, notify } = useBrowserNotifications();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Tables<"notifications">;
          const link = n.product_id ? `/p/${n.product_id}` : (n.actor_id ? `/u/${n.actor_id}` : "/");
          if (document.visibilityState === "visible") {
            toast(n.message, { action: { label: "Xem", onClick: () => { window.location.href = link; } } });
          } else {
            notify("CodeShare", n.message, link);
          }
          load();
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = items.filter(i => !i.read).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-semibold">Thông báo</span>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll} className="h-7 text-xs">
              <CheckCheck className="size-3 mr-1" />Đánh dấu đã đọc
            </Button>
          )}
        </div>
        {supported && permission === "default" && (
          <button onClick={request} className="w-full flex items-center gap-2 p-2 text-xs text-primary hover:bg-primary/5 border-b border-border">
            <BellRing className="size-3" />Bật thông báo trên trình duyệt
          </button>
        )}
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có thông báo</div>
          ) : items.map(n => {
            const Icon = ICONS[n.type] ?? Heart;
            const link = n.product_id ? `/p/${n.product_id}` : `/u/${n.actor_id}`;
            return (
              <Link key={n.id} to={link} onClick={() => { markOne(n.id); setOpen(false); }}
                className={`flex gap-3 p-3 hover:bg-muted border-b border-border/50 ${!n.read ? "bg-primary/5" : ""}`}>
                <Icon className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("vi-VN")}</p>
                </div>
                {!n.read && <span className="size-2 rounded-full bg-primary shrink-0 mt-2" />}
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};