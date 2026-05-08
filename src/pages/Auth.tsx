import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { toast } from "sonner";
import { Code2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ").max(255),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(72),
  display_name: z.string().trim().min(2, "Tên tối thiểu 2 ký tự").max(50).optional(),
});

const Auth = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.pick({ email: true, password: true }).safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email!, password: parsed.data.password! });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Đăng nhập thành công"); nav("/"); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email, password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: parsed.data.display_name } },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Đăng ký thành công, kiểm tra email để xác thực"); }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { toast.error("Nhập email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Đã gửi email reset. Kiểm tra hộp thư!"); setForgotOpen(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex size-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow mb-4">
            <Code2 className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Chào mừng tới <span className="text-gradient">CodeShare</span></h1>
          <p className="text-muted-foreground mt-2">Đăng nhập để chia sẻ code của bạn</p>
        </div>

        <Card className="p-6 shadow-card">
          <GoogleLoginButton />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">Hoặc</span></div>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Mật khẩu</Label>
                    <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-xs text-primary hover:underline">Quên mật khẩu?</button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Quên mật khẩu</DialogTitle></DialogHeader>
                        <p className="text-sm text-muted-foreground">Nhập email, tụi tui sẽ gửi link reset cho bro.</p>
                        <Input type="email" placeholder="email@domain.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setForgotOpen(false)}>Huỷ</Button>
                          <Button onClick={handleForgot} disabled={forgotLoading} className="bg-gradient-primary">
                            {forgotLoading ? "Đang gửi..." : "Gửi link reset"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div><Label>Tên hiển thị</Label><Input required value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Mật khẩu</Label><Input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
                  {loading ? "Đang xử lý..." : "Tạo tài khoản"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary">← Về trang chủ</Link>
        </p>
      </main>
    </div>
  );
};
export default Auth;
