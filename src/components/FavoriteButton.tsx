import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const FavoriteButton = ({ productId, variant = "icon" }: { productId: string; variant?: "icon" | "full" }) => {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setFav(false); return; }
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", productId).maybeSingle()
      .then(({ data }) => setFav(!!data));
  }, [user, productId]);

  const toggle = async (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!user) { toast.error("Đăng nhập để yêu thích"); return; }
    setLoading(true);
    if (fav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
      setFav(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
      if (!error) setFav(true);
    }
    setLoading(false);
  };

  if (variant === "icon") {
    return (
      <Button size="icon" variant="ghost" onClick={toggle} disabled={loading} aria-label="Yêu thích"
        className="h-8 w-8 backdrop-blur bg-background/70 hover:bg-background">
        <Heart className={cn("size-4", fav && "fill-red-500 text-red-500")} />
      </Button>
    );
  }
  return (
    <Button onClick={toggle} disabled={loading} variant={fav ? "default" : "outline"}
      className={cn(fav && "bg-red-500 hover:bg-red-600 text-white border-red-500")}>
      <Heart className={cn("size-4 mr-1", fav && "fill-white")} />{fav ? "Đã thích" : "Yêu thích"}
    </Button>
  );
};
