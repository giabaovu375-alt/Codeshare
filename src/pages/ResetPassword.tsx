import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

const ResetPassword = () => {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles recovery hash → session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    if (pwd !== pwd2) { toast.error("Mật khẩu nhập lại không khớp"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Đổi mật khẩu thành công"); nav("/"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md py-12 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex size-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-glow mb-4">
            <KeyRound className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
        </div>
        <Card className="p-6 shadow-card">
          {!ready ? (
            <p className="text-center text-muted-foreground text-sm">Đang xác minh link... Nếu link hết hạn, hãy yêu cầu link mới.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Mật khẩu mới</Label><Input type="password" required value={pwd} onChange={e => setPwd(e.target.value)} /></div>
              <div><Label>Nhập lại mật khẩu</Label><Input type="password" required value={pwd2} onChange={e => setPwd2(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">
                {loading ? "Đang đổi..." : "Đổi mật khẩu"}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
};
export default ResetPassword;
