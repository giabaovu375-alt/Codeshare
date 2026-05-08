import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { CATEGORY_META } from "@/components/ProductCard";
import { ExternalLink, Shield, ShieldAlert, ArrowLeft, Trash2, Clock, XCircle, CheckCircle2, Download, Play, Eye, Tag, Code as CodeIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RatingSection } from "@/components/RatingSection";
import { CommentSection } from "@/components/CommentSection";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReportDialog } from "@/components/ReportDialog";
import { LikeButtons } from "@/components/LikeButtons";
import { FollowButton } from "@/components/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "@/components/RankBadge";

const ProductDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState<Tables<"products"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<Tables<"profiles"> | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("products").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setP(data); setLoading(false);
      if (data) document.title = `${data.title} - CodeShare`;
      if (data?.user_id) {
        supabase.from("profiles").select("*").eq("id", data.user_id).maybeSingle()
          .then(({ data: prof }) => setAuthor(prof));
      }
    });
  }, [id]);

  const remove = async () => {
    if (!p || !confirm("Xoá sản phẩm này?")) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Đã xoá"); nav("/"); }
  };

  const trackDownload = async (linkType: "direct" | "bypass1" | "bypass2", url: string) => {
    if (user && p) {
      await supabase.from("download_history").insert({ user_id: user.id, product_id: p.id, link_type: linkType });
      await supabase.from("products").update({ download_count: (p.download_count ?? 0) + 1 }).eq("id", p.id);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="container py-12 text-center text-muted-foreground">Đang tải...</div></div>;
  if (!p) return <div className="min-h-screen bg-background"><Header /><div className="container py-12 text-center">Không tìm thấy sản phẩm.</div></div>;

  const meta = CATEGORY_META[p.category];
  const Icon = meta.icon;
  const isOwner = user?.id === p.user_id;
  const hasTryable = !!((p as any).code_html || (p as any).code_css || (p as any).code_js || (p as any).embed_url);
  const tags: string[] = (p as any).tags ?? [];
  const language: string | null = (p as any).language ?? null;
  const framework: string | null = (p as any).framework ?? null;
  const viewCount: number = (p as any).view_count ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-8 animate-fade-in space-y-4">
        <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="size-4 mr-1" />Về danh sách</Link></Button>

        {p.status !== "approved" && isOwner && (
          <Card className={`p-4 border-l-4 ${p.status === "pending" ? "border-l-primary bg-primary/5" : "border-l-destructive bg-destructive/5"}`}>
            <div className="flex items-start gap-3">
              {p.status === "pending" ? <Clock className="size-5 text-primary mt-0.5" /> : <XCircle className="size-5 text-destructive mt-0.5" />}
              <div className="flex-1">
                <p className="font-semibold">{p.status === "pending" ? "Đang chờ duyệt" : "Đã bị từ chối"}</p>
                <p className="text-sm text-muted-foreground">
                  {p.status === "pending" ? "Sản phẩm sẽ hiển thị công khai sau khi admin duyệt." : (p.reject_reason || "Không có lý do")}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden shadow-card">
          {p.demo_image_url ? (
            <img src={p.demo_image_url} alt={p.title} className="w-full aspect-video object-cover" />
          ) : (
            <div className="w-full aspect-video bg-gradient-hero flex items-center justify-center"><Icon className="size-20 text-primary/40" /></div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Badge><Icon className="size-3 mr-1" />{meta.label}</Badge>
                  {p.status === "approved" && <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle2 className="size-3 mr-1" />Đã duyệt</Badge>}
                  <Badge variant="outline"><Download className="size-3 mr-1" />{p.download_count ?? 0} lượt tải</Badge>
                  {viewCount > 0 && <Badge variant="outline"><Eye className="size-3 mr-1" />{viewCount} lượt xem</Badge>}
                  {language && <Badge variant="outline" className="border-primary/40 text-primary"><CodeIcon className="size-3 mr-1" />{language}</Badge>}
                  {framework && framework !== "None" && <Badge variant="outline">{framework}</Badge>}
                </div>
                <h1 className="text-3xl font-bold">{p.title}</h1>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map(t => (
                      <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="text-xs text-primary hover:underline">
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <LikeButtons productId={p.id} />
                <FavoriteButton productId={p.id} variant="full" />
                {isOwner && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="size-4 mr-1" />Xoá</Button>}
              </div>
            </div>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{p.description}</p>

            {hasTryable && (
              <Button asChild size="lg" className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
                <Link to={`/p/${p.id}/try`}><Play className="size-5 mr-2" />Dùng thử web ngay (không cần tải)</Link>
              </Button>
            )}

            {author && (
              <Card className="p-3 flex items-center gap-3 bg-muted/30">
                <Link to={`/u/${author.id}`}>
                  <Avatar className="size-10">
                    <AvatarImage src={author.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                      {(author.display_name ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/u/${author.id}`} className="font-medium hover:text-primary line-clamp-1">
                    {author.display_name ?? "Ẩn danh"}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RankBadge level={author.level ?? 1} className="text-[10px] py-0 px-1.5" />
                  </div>
                </div>
                <FollowButton targetUserId={author.id} />
              </Card>
            )}

            <div className="border-t border-border pt-4 space-y-3">
              <h2 className="font-semibold text-lg">Tải xuống</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {p.link_direct && (
                  <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => trackDownload("direct", p.link_direct!)}>
                    <ExternalLink className="size-5" /><span>Trực tiếp</span><span className="text-xs text-muted-foreground">Không vượt link</span>
                  </Button>
                )}
                {p.link_bypass1 && (
                  <Button className="h-auto py-4 flex-col gap-1 bg-gradient-primary hover:opacity-90" onClick={() => trackDownload("bypass1", p.link_bypass1!)}>
                    <Shield className="size-5" /><span>Vượt 1 lần</span><span className="text-xs opacity-80">Hỗ trợ tác giả</span>
                  </Button>
                )}
                {p.link_bypass2 && (
                  <Button variant="outline" className="h-auto py-4 flex-col gap-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => trackDownload("bypass2", p.link_bypass2!)}>
                    <ShieldAlert className="size-5" /><span>Vượt 2 lần</span><span className="text-xs opacity-80">Tốc hơn nhưng dài hơn</span>
                  </Button>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <ReportDialog productId={p.id} />
              </div>
            </div>
          </div>
        </Card>

        <RatingSection productId={p.id} />
        <CommentSection productId={p.id} />
      </main>
    </div>
  );
};
export default ProductDetail;
