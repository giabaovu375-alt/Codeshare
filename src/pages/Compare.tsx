import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { ArrowLeft, Check, Minus, Download, Eye } from "lucide-react";
import { CATEGORY_META } from "@/components/ProductCard";

const Compare = () => {
  const [params] = useSearchParams();
  const idsParam = params.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 3);
  const [items, setItems] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "So sánh sản phẩm - CodeShare";
    if (ids.length === 0) { setLoading(false); return; }
    supabase.from("products").select("*").in("id", ids).eq("status", "approved").then(({ data }) => {
      // preserve order from URL
      const map = new Map((data ?? []).map(d => [d.id, d]));
      setItems(ids.map(id => map.get(id)).filter(Boolean) as Tables<"products">[]);
      setLoading(false);
    });
  }, [idsParam]);

  const Row = ({ label, render }: { label: string; render: (p: any) => React.ReactNode }) => (
    <div className="grid border-b border-border" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
      <div className="p-3 text-sm font-medium text-muted-foreground bg-muted/30">{label}</div>
      {items.map(p => <div key={p.id} className="p-3 text-sm">{render(p)}</div>)}
    </div>
  );

  const Yes = <Check className="size-4 text-green-500" />;
  const No = <Minus className="size-4 text-muted-foreground" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 animate-fade-in">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/"><ArrowLeft className="size-4 mr-1" />Về danh sách</Link>
        </Button>
        <h1 className="text-2xl font-bold mb-4">So sánh <span className="text-gradient">{items.length} sản phẩm</span></h1>

        {loading ? <p className="text-muted-foreground">Đang tải...</p>
          : items.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Chưa chọn sản phẩm để so sánh.</p>
              <Button asChild><Link to="/">Quay về danh sách</Link></Button>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid border-b border-border bg-muted/20" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
                  <div className="p-3" />
                  {items.map(p => {
                    const Icon = CATEGORY_META[p.category].icon;
                    return (
                      <div key={p.id} className="p-3 space-y-2">
                        <div className="aspect-video rounded-md bg-muted overflow-hidden">
                          {p.demo_image_url ? <img src={p.demo_image_url} alt={p.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full grid place-items-center"><Icon className="size-10 text-primary/40" /></div>}
                        </div>
                        <Link to={`/p/${p.id}`} className="font-semibold hover:text-primary line-clamp-2 block text-sm">{p.title}</Link>
                      </div>
                    );
                  })}
                </div>

                <Row label="Danh mục" render={p => CATEGORY_META[p.category].label} />
                <Row label="Ngôn ngữ" render={p => p.language || <span className="text-muted-foreground">—</span>} />
                <Row label="Framework" render={p => (p.framework && p.framework !== "None") ? p.framework : <span className="text-muted-foreground">—</span>} />
                <Row label="Tags" render={p => (p.tags?.length ?? 0) > 0
                  ? <div className="flex flex-wrap gap-1">{p.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">#{t}</Badge>)}</div>
                  : <span className="text-muted-foreground">—</span>} />
                <Row label="Mô tả" render={p => <p className="line-clamp-4 text-xs">{p.description}</p>} />
                <Row label={<span className="flex items-center gap-1"><Download className="size-3 inline" />Lượt tải</span> as any} render={p => p.download_count ?? 0} />
                <Row label={<span className="flex items-center gap-1"><Eye className="size-3 inline" />Lượt xem</span> as any} render={p => p.view_count ?? 0} />
                <Row label="Dùng thử web" render={p => (p.code_html || p.code_css || p.code_js || p.embed_url) ? Yes : No} />
                <Row label="Link trực tiếp" render={p => p.link_direct ? Yes : No} />
                <Row label="Vượt 1 lần" render={p => p.link_bypass1 ? Yes : No} />
                <Row label="Vượt 2 lần" render={p => p.link_bypass2 ? Yes : No} />
                <Row label="Ngày đăng" render={p => new Date(p.created_at).toLocaleDateString("vi-VN")} />

                <div className="grid p-3 gap-2" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
                  <div />
                  {items.map(p => (
                    <Button key={p.id} asChild size="sm" className="bg-gradient-primary"><Link to={`/p/${p.id}`}>Xem chi tiết</Link></Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
      </main>
    </div>
  );
};

export default Compare;
