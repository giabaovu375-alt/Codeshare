import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Gift } from "lucide-react";
import { toast } from "sonner";

export const DailyCheckin = () => {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    if (!user) return;
    const { data: c } = await supabase.from("daily_checkin").select("date").eq("user_id", user.id).eq("date", today).maybeSingle();
    setDone(!!c);
    const { data: p } = await supabase.from("profiles").select("streak").eq("id", user.id).maybeSingle();
    setStreak(p?.streak ?? 0);
  };

  useEffect(() => { load(); }, [user?.id]);

  const checkin = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("daily_checkin").insert({ user_id: user.id, date: today, xp_earned: 5 });
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Tính streak: nếu hôm qua có check-in → +1, không thì reset về 1
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { data: y } = await supabase.from("daily_checkin").select("date").eq("user_id", user.id).eq("date", yesterday).maybeSingle();
    const newStreak = y ? streak + 1 : 1;
    const { data: prof } = await supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle();
    const newXp = (prof?.xp ?? 0) + 5;
    const newLevel = Math.max(1, 1 + Math.floor(Math.sqrt(newXp / 50)));
    await supabase.from("profiles").update({ streak: newStreak, last_checkin_at: today, xp: newXp, level: newLevel }).eq("id", user.id);

    setDone(true);
    setStreak(newStreak);
    toast.success(`Check-in thành công! +5 XP — Streak ${newStreak} ngày 🔥`);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
      <div className="flex items-center gap-3">
        <Flame className={`size-8 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">Streak: {streak} ngày 🔥</p>
          <p className="text-xs text-muted-foreground">{done ? "Đã check-in hôm nay" : "Check-in để nhận +5 XP"}</p>
        </div>
        <Button size="sm" onClick={checkin} disabled={done || loading}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90">
          <Gift className="size-4 mr-1" />{done ? "Đã nhận" : "+5 XP"}
        </Button>
      </div>
    </Card>
  );
};