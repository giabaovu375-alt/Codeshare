import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { FollowButton } from "@/components/FollowButton";
import { RankBadge } from "@/components/RankBadge";
import { xpProgress } from "@/lib/level";
import { Github, Globe, Twitter, Users, Package, Sparkles } from "lucide-react";

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("profiles").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data) document.title = `${data.display_name ?? "User"} - CodeShare`;
    });
    supabase.from("products").select("*").eq("user_id", id).eq("status", "approved").order("created_at", { ascending: false })
      .then(({ data }) => setProducts(data ?? []));
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", id)
      .then(({ count }) => setFollowers(count ?? 0));
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", id)
      .then(({ count }) => setFollowing(count ?? 0));
  }, [id]);

  if (!id) return null;
  if (!profile) return <div className="min-h-screen bg-background"><Header /><div className="container py-12 text-center text-muted-foreground">Đang tải...</div></div>;

  const prog = xpProgress(profile.xp ?? 0, profile.level ?? 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-8 animate-fade-in space-y-6">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="size-24 ring-2 ring-primary/30">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl">
                {(profile.display_name ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">{profile.display_name ?? "Ẩn danh"}</h1>
                  <div className="flex gap-2 items-center mt-1 flex-wrap">
                    <RankBadge level={profile.level ?? 1} />
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Sparkles className="size-3" />{profile.xp ?? 0} XP
                    </span>
                  </div>
                </div>
                <FollowButton targetUserId={profile.id} />
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

              <div className="flex gap-4 text-sm">
                <span><strong>{products.length}</strong> <span className="text-muted-foreground">code</span></span>
                <span><strong>{followers}</strong> <span className="text-muted-foreground">followers</span></span>
                <span><strong>{following}</strong> <span className="text-muted-foreground">following</span></span>
              </div>

              {/* XP progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lv.{profile.level} → Lv.{(profile.level ?? 1) + 1}</span>
                  <span>{prog.current}/{prog.needed} XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary transition-all" style={{ width: `${prog.pct}%` }} />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Github className="size-4 mr-1" />GitHub</Button></a>}
                {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Globe className="size-4 mr-1" />Website</Button></a>}
                {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Twitter className="size-4 mr-1" />Twitter</Button></a>}
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><Package className="size-5" />Code đã đăng</h2>
          {products.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Chưa có code công khai</Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default UserProfile;