import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { User as UserIcon, Download, Package, Clock, CheckCircle2, XCircle, Shield, Heart, Github, Globe, Twitter, Sparkles } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { RankBadge } from "@/components/RankBadge";
import { DailyCheckin } from "@/components/DailyCheckin";
import { xpProgress } from "@/lib/level";

type Dl = Tables<"download_history"> & { products: Tables<"products"> | null };
type Fav = Tables<"favorites"> & { products: Tables<"products"> | null };

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [downloads, setDownloads] = useState<Dl[]>([]);
  const [favs, setFavs] = useState<Fav[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !user) nav("/auth"); }, [user, authLoading, nav]);

  const reload = () => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      setDisplayName(data?.display_name ?? "");
      setBio(data?.bio ?? "");
      setGithub(data?.github_url ?? "");
      setWebsite(data?.website_url ?? "");
      setTwitter(data?.twitter_url ?? "");
    });
  };

  useEffect(() => {
    if (!user) return;
    reload();
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).then(({ data }) => setProducts(data ?? []));
    supabase.from("download_history").select("*, products(*)").eq("user_id", user.id).order("created_at",{ascending:false}).limit(50).then(({ data }) => setDownloads((data as any) ?? []));
    supabase.from("favorites").select("*, products(*)").eq("user_id", user.id).order("created_at",{ascending:false}).then(({ data }) => setFavs((data as any) ?? []));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const clean = (s: string) => s.trim() || null;
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(),
      bio: clean(bio),
      github_url: clean(github),
      website_url: clean(website),
      twitter_url: clean(twitter),
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Đã lưu hồ sơ"); reload(); }
  };

  const removeFav = async (productId: string) => {
    if (!user) return;
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
    setFavs(favs.filter(f => f.product_id !== productId));
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle2 className="size-3 mr-1" />Đã duyệt</Badge>;
    if (s === "pending") return <Badge variant="outline" className="border-primary text-primary"><Clock className="size-3 mr-1" />Chờ duyệt</Badge>;
    return <Badge variant="outline" className="border-destructive text-destructive"><XCircle className="size-3 mr-1" />Từ chối</Badge>;
  };

  if (!user) return null;

  const prog = profile ? xpProgress(profile.xp ?? 0, profile.level ?? 1) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-8 animate-fade-in space-y-6">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {profile && (
              <AvatarUpload userId={user.id} currentUrl={profile.avatar_url} displayName={profile.display_name}
                onUploaded={(url) => setProfile({ ...profile, avatar_url: url })} />
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile?.display_name || "Hồ sơ"}</h1>
                {profile && <RankBadge level={profile.level ?? 1} />}
                {isAdmin && <Badge className="bg-gradient-primary text-primary-foreground"><Shield className="size-3 mr-1" />QTV</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {profile?.bio && <p className="text-sm">{profile.bio}</p>}
              {prog && (
                <div className="space-y-1 max-w-sm">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Sparkles className="size-3" />{profile?.xp ?? 0} XP</span>
                    <span>{prog.current}/{prog.needed}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary transition-all" style={{ width: `${prog.pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <DailyCheckin />

        <Tabs defaultValue="info">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="info"><UserIcon className="size-4 mr-1" />Thông tin</TabsTrigger>
            <TabsTrigger value="my"><Package className="size-4 mr-1" />Code ({products.length})</TabsTrigger>
            <TabsTrigger value="fav"><Heart className="size-4 mr-1" />Yêu thích ({favs.length})</TabsTrigger>
            <TabsTrigger value="dl"><Download className="size-4 mr-1" />Lịch sử ({downloads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <Card className="p-6 max-w-xl space-y-4">
              <div><Label>Tên hiển thị</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} /></div>
              <div><Label>Bio</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={3} placeholder="Vài dòng về bạn..." />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/300</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label className="flex items-center gap-1"><Github className="size-3" />GitHub URL</Label>
                  <Input value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." maxLength={200} /></div>
                <div><Label className="flex items-center gap-1"><Globe className="size-3" />Website</Label>
                  <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." maxLength={200} /></div>
                <div className="sm:col-span-2"><Label className="flex items-center gap-1"><Twitter className="size-3" />Twitter / X</Label>
                  <Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/..." maxLength={200} /></div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="bg-gradient-primary shadow-glow">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <p className="text-xs text-muted-foreground">
                💡 Trang public của bạn: <Link to={`/u/${user.id}`} className="text-primary underline">/u/{user.id.slice(0,8)}...</Link>
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="my" className="mt-4">
            {products.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Bạn chưa đăng code nào. <Link to="/new" className="text-primary underline">Đăng ngay</Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map(p => (
                  <Card key={p.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link to={`/p/${p.id}`} className="font-semibold hover:text-primary">{p.title}</Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                      {p.status === "rejected" && p.reject_reason && (
                        <p className="text-xs text-destructive mt-1">Lý do: {p.reject_reason}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge(p.status)}
                      {p.status === "rejected" && (
                        <Button asChild size="sm" variant="outline"><Link to={`/edit/${p.id}`}>Sửa & gửi lại</Link></Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fav" className="mt-4">
            {favs.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">Chưa có sản phẩm yêu thích.</Card>
            ) : (
              <div className="space-y-2">
                {favs.map(f => (
                  <Card key={f.id} className="p-3 flex items-center gap-3">
                    <Heart className="size-4 text-red-500 fill-red-500" />
                    <div className="flex-1 min-w-0">
                      {f.products ? (
                        <Link to={`/p/${f.product_id}`} className="font-medium hover:text-primary line-clamp-1">{f.products.title}</Link>
                      ) : <span className="text-muted-foreground italic">[Đã xoá]</span>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeFav(f.product_id)}>Bỏ thích</Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dl" className="mt-4">
            {downloads.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">Chưa có lịch sử tải.</Card>
            ) : (
              <div className="space-y-2">
                {downloads.map(d => (
                  <Card key={d.id} className="p-3 flex items-center gap-3">
                    <Download className="size-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      {d.products ? (
                        <Link to={`/p/${d.product_id}`} className="font-medium hover:text-primary line-clamp-1">{d.products.title}</Link>
                      ) : <span className="text-muted-foreground italic">[Đã xoá]</span>}
                      <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("vi-VN")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {d.link_type === "direct" ? "Trực tiếp" : d.link_type === "bypass1" ? "Vượt 1" : "Vượt 2"}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
export default Profile;
