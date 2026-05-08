import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StarRating } from "./StarRating";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const RatingSection = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [my, setMy] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("ratings").select("stars, user_id").eq("product_id", productId);
    if (data) {
      setCount(data.length);
      setAvg(data.length ? data.reduce((s, r) => s + r.stars, 0) / data.length : 0);
      if (user) setMy(data.find(r => r.user_id === user.id)?.stars ?? 0);
    }
  };
  useEffect(() => { load(); }, [productId, user]);

  const rate = async (stars: number) => {
    if (!user) { toast.error("Đăng nhập để đánh giá"); return; }
    const { error } = await supabase.from("ratings").upsert(
      { product_id: productId, user_id: user.id, stars },
      { onConflict: "product_id,user_id" }
    );
    if (error) toast.error(error.message);
    else { toast.success("Đã đánh giá"); load(); }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avg)} readOnly size={18} />
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({count} đánh giá)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Đánh giá của bạn:</span>
          <StarRating value={my} onChange={rate} size={22} />
        </div>
      </div>
    </Card>
  );
};
