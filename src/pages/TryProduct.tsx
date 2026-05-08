import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { ArrowLeft, RefreshCw, Maximize2, Smartphone, Monitor, Tablet, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Device = "desktop" | "tablet" | "mobile";
const SIZES: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-[768px] max-w-full",
  mobile: "w-[375px] max-w-full",
};

const TryProduct = () => {
  const { id } = useParams();
  const [p, setP] = useState<Tables<"products"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<Device>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("products").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setP(data);
      setLoading(false);
      if (data) {
        document.title = `Dùng thử: ${data.title} - CodeShare`;
        supabase.rpc("increment_view", { _product: data.id }).then(() => {});
      }
    });
  }, [id]);

  const srcDoc = useMemo(() => {
    if (!p) return "";
    const html = (p as any).code_html ?? "";
    const css = (p as any).code_css ?? "";
    const js = (p as any).code_js ?? "";
    if (!html && !css && !js) return "";
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}<script>try{${js}}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="color:red;background:#fee;padding:8px">'+e+'</pre>')}</script></body></html>`;
  }, [p, refreshKey]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Đang tải...</div>;
  if (!p) return <div className="min-h-screen grid place-items-center">Không tìm thấy sản phẩm</div>;

  const embedUrl = (p as any).embed_url as string | null;
  const hasContent = !!(srcDoc || embedUrl);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-14 gap-3 flex-wrap">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/p/${p.id}`}><ArrowLeft className="size-4 mr-1" />Quay lại</Link>
          </Button>
          <h1 className="font-semibold truncate flex-1 min-w-0">{p.title}</h1>
          <div className="flex items-center gap-1">
            <Button variant={device === "desktop" ? "default" : "ghost"} size="icon" className="size-8" onClick={() => setDevice("desktop")} aria-label="Desktop">
              <Monitor className="size-4" />
            </Button>
            <Button variant={device === "tablet" ? "default" : "ghost"} size="icon" className="size-8" onClick={() => setDevice("tablet")} aria-label="Tablet">
              <Tablet className="size-4" />
            </Button>
            <Button variant={device === "mobile" ? "default" : "ghost"} size="icon" className="size-8" onClick={() => setDevice("mobile")} aria-label="Mobile">
              <Smartphone className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setRefreshKey(k => k + 1)} aria-label="Reload">
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => {
              const w = window.open("", "_blank");
              if (w && srcDoc) { w.document.write(srcDoc); w.document.close(); }
              else if (embedUrl) window.open(embedUrl, "_blank");
              else toast.error("Không có nội dung");
            }} aria-label="Mở tab mới">
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-stretch justify-center p-4">
        {!hasContent ? (
          <div className="max-w-md text-center self-center bg-background rounded-xl p-8 shadow-card">
            <p className="text-lg font-semibold mb-2">Sản phẩm này chưa có bản dùng thử</p>
            <p className="text-sm text-muted-foreground mb-4">Tác giả chưa cung cấp code preview hoặc link nhúng. Bạn có thể tải về để chạy thử.</p>
            <Button asChild><Link to={`/p/${p.id}`}><ExternalLink className="size-4 mr-1" />Quay về xem link tải</Link></Button>
          </div>
        ) : (
          <div className={`${SIZES[device]} bg-white rounded-xl overflow-hidden shadow-glow transition-all`}>
            {srcDoc ? (
              <iframe
                key={refreshKey}
                srcDoc={srcDoc}
                title={p.title}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                className="w-full h-[calc(100vh-8rem)] border-0"
              />
            ) : (
              <iframe
                key={refreshKey}
                src={embedUrl!}
                title={p.title}
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                className="w-full h-[calc(100vh-8rem)] border-0"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TryProduct;
