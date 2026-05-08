import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Shield, CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck, ShieldAlert, Trash2, Flag } from "lucide-react";
import { CATEGORY_META } from "@/components/ProductCard";

type Status = "pending" | "approved" | "rejected";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const nav = useNavigate();
  const [items, setItems] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");
  const [rejectTarget, setRejectTarget] = useState<Tables<"products"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [view, setView] = useState<"products" | "reports">("products");

  useEffect(() => {
    if (!authLoading && !user) nav("/auth");
    if (!adminLoading && user && !isAdmin) {
      toast.error("Bạn không có quyền truy cập trang admin");
      nav("/");
    }
  }, [user, isAdmin, authLoading, adminLoading, nav]);

  const load = () => {
    setLoading(true);
    supabase.from("products").select("*").order("created_at",{ascending:false}).then(({ data }) => {
      setItems(data ?? []); setLoading(false);
    });
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const loadReports = async () => {
    const { data } = await supabase.from("reports").select("*, products(title)").eq("status", "open").order("created_at", { ascending: false });
    setReports(data ?? []);
  };
  useEffect(() => { if (isAdmin && view === "reports") loadReports(); }, [isAdmin, view]);

  const resolveReport = async (id: string, status: "resolved" | "dismissed") => {
    const { error } = await supabase.from("reports").update({
      status, reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Đã xử lý"); loadReports(); }
  };

  const approve = async (p: Tables<"products">) => {
    const { error } = await supabase.from("products").update({
      status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString(), reject_reason: null,
    }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Đã duyệt"); load(); }
  };

  const doReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) { toast.error("Nhập lý do tối thiểu 5 ký tự"); return; }
    const { error } = await supabase.from("products").update({
      status: "rejected", reject_reason: rejectReason.trim(), reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
    }).eq("id", rejectTarget.id);
    if (error) toast.error(error.message);
    else { toast.success("Đã từ chối"); setRejectTarget(null); setRejectReason(""); load(); }
  };

  const remove = async (p: Tables<"products">) => {
    if (!confirm(`Xoá vĩnh viễn "${p.title}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Đã xoá"); load(); }
  };

  const filtered = items.filter(i => i.status === tab);
  const counts = { pending: items.filter(i=>i.status==="pending").length,
                   approved: items.filter(i=>i.status==="approved").length,
                   rejected: items.filter(i=>i.status==="rejected").length };

  if (adminLoading || !isAdmin) return <div className="min-h-screen bg-background"><Header /><div className="container py-12 text-center text-muted-foreground">Đang kiểm tra quyền...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bảng điều khiển <span className="text-gradient">Admin</span></h1>
            <p className="text-sm text-muted-foreground">Duyệt và quản lý code do user đăng</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={view === "products" ? "default" : "outline"} onClick={() => setView("products")}
            className={view === "products" ? "bg-gradient-primary" : ""}>
            <Shield className="size-4 mr-1" />Sản phẩm
          </Button>
          <Button size="sm" variant={view === "reports" ? "default" : "outline"} onClick={() => setView("reports")}
            className={view === "reports" ? "bg-gradient-primary" : ""}>
            <Flag className="size-4 mr-1" />Báo cáo ({reports.length})
          </Button>
        </div>

        {view === "reports" ? (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">Không có báo cáo nào đang mở.</Card>
            ) : reports.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive">{r.reason}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("vi-VN")}</span>
                    </div>
                    <Link to={`/p/${r.product_id}`} className="font-semibold hover:text-primary">
                      {r.products?.title ?? "[Sản phẩm đã xoá]"}
                    </Link>
                    {r.detail && <p className="text-sm text-muted-foreground mt-1">{r.detail}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "dismissed")}>Bỏ qua</Button>
                    <Button size="sm" className="bg-gradient-primary" onClick={() => resolveReport(r.id, "resolved")}>
                      <CheckCircle2 className="size-4 mr-1" />Đã xử lý
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending"><Clock className="size-4 mr-1" />Chờ duyệt ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved"><CheckCircle2 className="size-4 mr-1" />Đã duyệt ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected"><XCircle className="size-4 mr-1" />Từ chối ({counts.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">Không có sản phẩm nào.</Card>
            ) : (
              <div className="space-y-3">
                {filtered.map(p => {
                  const meta = CATEGORY_META[p.category];
                  const Icon = meta.icon;
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-4 p-4">
                        <div className="sm:w-40 aspect-video bg-muted rounded-lg overflow-hidden shrink-0">
                          {p.demo_image_url ? (
                            <img src={p.demo_image_url} alt={p.title} className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full bg-gradient-hero flex items-center justify-center"><Icon className="size-8 text-primary/40" /></div>}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <Badge className="mb-1"><Icon className="size-3 mr-1" />{meta.label}</Badge>
                              <h3 className="font-semibold">{p.title}</h3>
                              <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("vi-VN")}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {p.link_direct && <a href={p.link_direct} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center"><ExternalLink className="size-3 mr-1" />Trực tiếp</a>}
                            {p.link_bypass1 && <a href={p.link_bypass1} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center"><ShieldCheck className="size-3 mr-1" />Vượt 1</a>}
                            {p.link_bypass2 && <a href={p.link_bypass2} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center"><ShieldAlert className="size-3 mr-1" />Vượt 2</a>}
                          </div>
                          {p.reject_reason && <p className="text-xs text-destructive">Lý do từ chối: {p.reject_reason}</p>}
                          <div className="flex gap-2 pt-2 flex-wrap">
                            <Button asChild variant="outline" size="sm"><Link to={`/p/${p.id}`}>Xem chi tiết</Link></Button>
                            {p.status !== "approved" && (
                              <Button size="sm" className="bg-gradient-primary" onClick={() => approve(p)}>
                                <CheckCircle2 className="size-4 mr-1" />Duyệt
                              </Button>
                            )}
                            {p.status !== "rejected" && (
                              <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => { setRejectTarget(p); setRejectReason(""); }}>
                                <XCircle className="size-4 mr-1" />Từ chối
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                              <Trash2 className="size-4 mr-1" />Xoá
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </main>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối: {rejectTarget?.title}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Lý do từ chối (user sẽ thấy để chỉnh sửa)..."
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} maxLength={500} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Huỷ</Button>
            <Button variant="destructive" onClick={doReject}>Từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;