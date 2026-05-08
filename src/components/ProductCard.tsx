import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gamepad2, ShoppingCart, BookOpen, Package, ExternalLink, Shield, ShieldAlert, Download, GitCompare, Play, Eye } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { FavoriteButton } from "./FavoriteButton";
import { getCompareIds, toggleCompare } from "@/lib/compare";
import { toast } from "sonner";

const CATEGORY_META = {
  game: { label: "Web Game", icon: Gamepad2 },
  shop: { label: "Web Bán hàng", icon: ShoppingCart },
  comic: { label: "Web Truyện tranh", icon: BookOpen },
  other: { label: "Khác", icon: Package },
} as const;

export const ProductCard = ({ p }: { p: Tables<"products"> }) => {
  const meta = CATEGORY_META[p.category];
  const Icon = meta.icon;
  const tags: string[] = (p as any).tags ?? [];
  const language: string | null = (p as any).language ?? null;
  const hasTryable = !!((p as any).code_html || (p as any).code_css || (p as any).code_js || (p as any).embed_url);
  const viewCount: number = (p as any).view_count ?? 0;
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    const sync = () => setInCompare(getCompareIds().includes(p.id));
    sync();
    window.addEventListener("compare:change", sync);
    return () => window.removeEventListener("compare:change", sync);
  }, [p.id]);

  const onToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const next = toggleCompare(p.id);
    if (next.includes(p.id)) toast.success("Đã thêm vào so sánh");
    else toast("Đã xoá khỏi so sánh");
  };

  return (
    <div className="relative group">
      <Link to={`/p/${p.id}`}>
        <Card className="overflow-hidden border-border hover:border-primary/50 transition-smooth shadow-card hover:shadow-glow animate-fade-in">
          <div className="aspect-video bg-muted relative overflow-hidden">
            {p.demo_image_url ? (
              <img src={p.demo_image_url} alt={p.title} loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
            ) : (
              <div className="w-full h-full bg-gradient-hero flex items-center justify-center">
                <Icon className="size-12 text-primary/40" />
              </div>
            )}
            <Badge className="absolute top-2 left-2 bg-background/90 text-foreground border-border">
              <Icon className="size-3 mr-1" />{meta.label}
            </Badge>
            {hasTryable && (
              <Badge className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground border-0">
                <Play className="size-3 mr-1" />Dùng thử
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-smooth">{p.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            {(language || tags.length > 0) && (
              <div className="flex flex-wrap gap-1 pt-1">
                {language && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{language}</Badge>}
                {tags.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-[10px] py-0 px-1.5">#{t}</Badge>)}
              </div>
            )}
            <div className="flex flex-wrap gap-1 pt-1 items-center">
              {p.link_direct && <Badge variant="outline" className="text-xs"><ExternalLink className="size-3 mr-1" />Trực tiếp</Badge>}
              {p.link_bypass1 && <Badge variant="outline" className="text-xs border-primary/40 text-primary"><Shield className="size-3 mr-1" />Vượt 1</Badge>}
              {p.link_bypass2 && <Badge variant="outline" className="text-xs border-primary/60 text-primary"><ShieldAlert className="size-3 mr-1" />Vượt 2</Badge>}
              <div className="ml-auto flex gap-1 text-xs text-muted-foreground">
                {viewCount > 0 && <span className="flex items-center gap-0.5"><Eye className="size-3" />{viewCount}</span>}
                {(p.download_count ?? 0) > 0 && <span className="flex items-center gap-0.5"><Download className="size-3" />{p.download_count}</span>}
              </div>
            </div>
          </div>
        </Card>
      </Link>
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <FavoriteButton productId={p.id} variant="icon" />
        <Button
          size="icon"
          variant={inCompare ? "default" : "secondary"}
          className={`size-8 ${inCompare ? "bg-primary" : "bg-background/80 backdrop-blur"}`}
          onClick={onToggleCompare}
          aria-label="So sánh"
          title="Thêm vào so sánh"
        >
          <GitCompare className="size-4" />
        </Button>
      </div>
    </div>
  );
};
export { CATEGORY_META };
