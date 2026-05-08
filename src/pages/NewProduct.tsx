import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Upload, Link2, Shield, ShieldAlert, ExternalLink, Code as CodeIcon, Eye, X, Tag } from "lucide-react";
import { LANGUAGES, FRAMEWORKS } from "@/lib/languages";
import { LivePreview } from "@/components/LivePreview";

const schema = z.object({
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự").max(120),
  description: z.string().trim().min(10, "Mô tả tối thiểu 10 ký tự").max(2000),
  category: z.enum(["game", "shop", "comic", "other"]),
  link_direct: z.string().trim().url("Link không hợp lệ").max(500).optional().or(z.literal("")),
  link_bypass1: z.string().trim().url("Link không hợp lệ").max(500).optional().or(z.literal("")),
  link_bypass2: z.string().trim().url("Link không hợp lệ").max(500).optional().or(z.literal("")),
  embed_url: z.string().trim().url("Link nhúng không hợp lệ").max(500).optional().or(z.literal("")),
});

const NewProduct = () => {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const isEdit = !!id;
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", category: "other" as const,
    link_direct: "", link_bypass1: "", link_bypass2: "",
    language: "" as string, framework: "" as string,
    code_html: "", code_css: "", code_js: "",
    embed_url: "",
    tags: [] as string[],
  });

  useEffect(() => { if (!authLoading && !user) nav("/auth"); }, [user, authLoading, nav]);

  useEffect(() => {
    if (!isEdit || !user) return;
    supabase.from("products").select("*").eq("id", id!).maybeSingle().then(({ data }) => {
      if (!data) { toast.error("Không tìm thấy"); nav("/"); return; }
      if (data.user_id !== user.id) { toast.error("Bạn không có quyền sửa"); nav("/"); return; }
      setForm({
        title: data.title, description: data.description, category: data.category as any,
        link_direct: data.link_direct ?? "", link_bypass1: data.link_bypass1 ?? "", link_bypass2: data.link_bypass2 ?? "",
        language: (data as any).language ?? "", framework: (data as any).framework ?? "",
        code_html: (data as any).code_html ?? "", code_css: (data as any).code_css ?? "", code_js: (data as any).code_js ?? "",
        embed_url: (data as any).embed_url ?? "",
        tags: (data as any).tags ?? [],
      });
      setExistingImage(data.demo_image_url);
      setPreview(data.demo_image_url ?? "");
    });
  }, [isEdit, id, user, nav]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || form.tags.includes(t) || form.tags.length >= 8) { setTagInput(""); return; }
    setForm({ ...form, tags: [...form.tags, t] });
    setTagInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!parsed.data.link_direct && !parsed.data.link_bypass1 && !parsed.data.link_bypass2) {
      toast.error("Cần ít nhất 1 link tải"); return;
    }
    setLoading(true);

    let demo_image_url: string | null = existingImage;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("demo-images").upload(path, imageFile);
      if (upErr) { toast.error("Upload ảnh thất bại: " + upErr.message); setLoading(false); return; }
      demo_image_url = supabase.storage.from("demo-images").getPublicUrl(path).data.publicUrl;
    }

    const payload: any = {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      link_direct: parsed.data.link_direct || null,
      link_bypass1: parsed.data.link_bypass1 || null,
      link_bypass2: parsed.data.link_bypass2 || null,
      embed_url: parsed.data.embed_url || null,
      language: form.language || null,
      framework: form.framework || null,
      code_html: form.code_html || null,
      code_css: form.code_css || null,
      code_js: form.code_js || null,
      tags: form.tags,
      demo_image_url,
    };

    if (isEdit) {
      const { error } = await supabase.from("products")
        .update({ ...payload, status: "pending", reject_reason: null }).eq("id", id!);
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Đã gửi lại! Chờ admin duyệt.");
      nav(`/p/${id}`);
    } else {
      const { data, error } = await supabase.from("products")
        .insert({ ...payload, user_id: user.id }).select().single();
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Đã gửi! Sản phẩm sẽ hiển thị công khai sau khi admin duyệt.");
      nav(`/p/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">{isEdit ? "Chỉnh sửa" : "Đăng"} <span className="text-gradient">{isEdit ? "code" : "code mới"}</span></h1>
        <p className="text-muted-foreground mb-6">{isEdit ? "Sau khi sửa, code sẽ được gửi lại để duyệt" : "Chia sẻ source code của bạn với cộng đồng"}</p>

        <form onSubmit={submit}>
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid grid-cols-3 max-w-md">
              <TabsTrigger value="info"><Link2 className="size-4 mr-1" />Thông tin</TabsTrigger>
              <TabsTrigger value="code"><CodeIcon className="size-4 mr-1" />Code Preview</TabsTrigger>
              <TabsTrigger value="meta"><Tag className="size-4 mr-1" />Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="grid md:grid-cols-2 gap-6 mt-0">
              <Card className="p-6 space-y-4 shadow-card">
                <div><Label>Tiêu đề *</Label>
                  <Input maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Source code web bán hàng XYZ" /></div>

                <div><Label>Mô tả *</Label>
                  <Textarea rows={5} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tính năng, công nghệ, hướng dẫn..." /></div>

                <div><Label>Danh mục *</Label>
                  <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="game">Web Game</SelectItem>
                      <SelectItem value="shop">Web Bán hàng</SelectItem>
                      <SelectItem value="comic">Web Truyện tranh</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Cần ít nhất 1 trong 3 link bên dưới</p>
                  <div><Label className="flex items-center gap-1"><ExternalLink className="size-3" />Link trực tiếp (không vượt)</Label>
                    <Input type="url" value={form.link_direct} onChange={(e) => setForm({ ...form, link_direct: e.target.value })} placeholder="https://..." /></div>
                  <div><Label className="flex items-center gap-1 text-primary"><Shield className="size-3" />Link vượt 1 lần</Label>
                    <Input type="url" value={form.link_bypass1} onChange={(e) => setForm({ ...form, link_bypass1: e.target.value })} placeholder="https://link1s..." /></div>
                  <div><Label className="flex items-center gap-1 text-primary"><ShieldAlert className="size-3" />Link vượt 2 lần</Label>
                    <Input type="url" value={form.link_bypass2} onChange={(e) => setForm({ ...form, link_bypass2: e.target.value })} placeholder="https://link2s..." /></div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 shadow-card h-fit">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Upload className="size-4" />Ảnh demo</div>
                <label className="block aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/60 transition-smooth cursor-pointer overflow-hidden bg-muted/30">
                  {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Upload className="size-10" /><span className="text-sm">Bấm để chọn ảnh (≤5MB)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>
                {preview && <Button type="button" variant="ghost" size="sm" onClick={() => { setImageFile(null); setPreview(""); }}>Xoá ảnh</Button>}
              </Card>
            </TabsContent>

            <TabsContent value="code" className="space-y-4 mt-0">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  💡 Dán code HTML/CSS/JS để người xem có thể <b>"Dùng thử web"</b> ngay không cần tải. Hoặc dán link nhúng từ CodePen/JSFiddle.
                </p>

                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-2">
                    <Label>HTML</Label>
                    <Textarea rows={8} value={form.code_html} onChange={(e) => setForm({ ...form, code_html: e.target.value })}
                      placeholder="<div>...</div>" className="font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label>CSS</Label>
                    <Textarea rows={8} value={form.code_css} onChange={(e) => setForm({ ...form, code_css: e.target.value })}
                      placeholder="body{...}" className="font-mono text-xs" />
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <Label>JavaScript</Label>
                  <Textarea rows={6} value={form.code_js} onChange={(e) => setForm({ ...form, code_js: e.target.value })}
                    placeholder="console.log('hi')" className="font-mono text-xs" />
                </div>

                <div className="space-y-2">
                  <Label>Hoặc link nhúng (CodePen / JSFiddle / CodeSandbox)</Label>
                  <Input type="url" value={form.embed_url} onChange={(e) => setForm({ ...form, embed_url: e.target.value })}
                    placeholder="https://codepen.io/..." />
                </div>
              </Card>

              {(form.code_html || form.code_css || form.code_js) && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><Eye className="size-4" />Xem trước</div>
                  <LivePreview initialHtml={form.code_html} initialCss={form.code_css} initialJs={form.code_js} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="meta" className="space-y-4 mt-0">
              <Card className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ngôn ngữ chính</Label>
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn ngôn ngữ" /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Framework / Thư viện</Label>
                    <Select value={form.framework} onValueChange={(v) => setForm({ ...form, framework: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn framework" /></SelectTrigger>
                      <SelectContent>{FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tags ({form.tags.length}/8)</Label>
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="VD: ecommerce, fullstack, ai..." />
                    <Button type="button" variant="outline" onClick={addTag}>Thêm</Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.tags.map(t => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        #{t}
                        <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter(x => x !== t) })}>
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">Giới hạn: tối đa 5 sản phẩm / giờ.</p>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90 shadow-glow">
              {loading ? "Đang gửi..." : (isEdit ? "Lưu & gửi lại" : "Đăng sản phẩm")}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewProduct;
