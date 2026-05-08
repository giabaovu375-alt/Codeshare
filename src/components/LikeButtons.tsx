import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const LikeButtons = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [my, setMy] = useState<number>(0);
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("likes").select("value, user_id").eq("product_id", productId);
    let u = 0, d = 0, m = 0;
    (data ?? []).forEach((r: any) => {
      if (r.value === 1) u++; else d++;
      if (user && r.user_id === user.id) m = r.value;
    });
    setUp(u); setDown(d); setMy(m);
  };
  useEffect(() => { load(); }, [productId, user?.id]);

  const toggle = async (val: 1 | -1) => {
    if (!user) { nav("/auth"); return; }
    if (my === val) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("product_id", productId);
    } else {
      const { error } = await supabase.from("likes").upsert(
        { user_id: user.id, product_id: productId, value: val },
        { onConflict: "user_id,product_id" }
      );
      if (error) { toast.error(error.message); return; }
    }
    load();
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant={my === 1 ? "default" : "outline"}
        className={cn(my === 1 && "bg-green-600 hover:bg-green-700")}
        onClick={() => toggle(1)}>
        <ThumbsUp className="size-4 mr-1" />{up}
      </Button>
      <Button size="sm" variant={my === -1 ? "default" : "outline"}
        className={cn(my === -1 && "bg-red-600 hover:bg-red-700")}
        onClick={() => toggle(-1)}>
        <ThumbsDown className="size-4 mr-1" />{down}
      </Button>
    </div>
  );
};