import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

export const FollowButton = ({ targetUserId }: { targetUserId: string }) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) return;
    supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle()
      .then(({ data }) => setFollowing(!!data));
  }, [user?.id, targetUserId]);

  if (user?.id === targetUserId) return null;

  const toggle = async () => {
    if (!user) { nav("/auth"); return; }
    setLoading(true);
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setFollowing(false);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      if (error) toast.error(error.message); else setFollowing(true);
    }
    setLoading(false);
  };

  return (
    <Button size="sm" variant={following ? "outline" : "default"}
      className={!following ? "bg-gradient-primary shadow-glow" : ""}
      onClick={toggle} disabled={loading}>
      {following ? <><UserCheck className="size-4 mr-1" />Đang theo dõi</> : <><UserPlus className="size-4 mr-1" />Theo dõi</>}
    </Button>
  );
};