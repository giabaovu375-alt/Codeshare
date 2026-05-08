import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Trash2, User as UserIcon } from "lucide-react";

type C = { id: string; user_id: string; content: string; created_at: string; profiles?: { display_name: string | null } | null };

export const CommentSection = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [items, setItems] = useState<C[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("comments").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(100);
    if (!data) return;
    const ids = [...new Set(data.map(c => c.user_id))];
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    const map = new Map((profs ?? []).map(p => [p.id, p]));
    setItems(data.map(c => ({ ...c, profiles: map.get(c.user_id) ?? null })));
  };
  useEffect(() => { load(); }, [productId]);

  const post = async () => {
    if (!user) { toast.error("Đăng nhập để bình luận"); return; }
    const t = text.trim();
    if (t.length < 1 || t.length > 1000) { toast.error("Bình luận 1-1000 ký tự"); return; }
    setPosting(true);
    const { error } = await supabase.from("comments").insert({ product_id: productId, user_id: user.id, content: t });
    setPosting(false);
    if (error) toast.error(error.message); else { setText(""); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Xoá bình luận?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg flex items-center gap-2"><MessageCircle className="size-5" />Bình luận ({items.length})</h2>
      {user ? (
        <Card className="p-3 space-y-2">
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Viết bình luận..." rows={3} maxLength={1000} />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{text.length}/1000</span>
            <Button onClick={post} disabled={posting || !text.trim()} size="sm" className="bg-gradient-primary">
              {posting ? "Đang gửi..." : "Gửi"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-3 text-center text-sm text-muted-foreground">Đăng nhập để bình luận</Card>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Chưa có bình luận nào.</p>
      ) : items.map(c => (
        <Card key={c.id} className="p-3">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
              <UserIcon className="size-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-sm">{c.profiles?.display_name ?? "Người dùng"}</span>
                  <span className="text-xs text-muted-foreground ml-2">{new Date(c.created_at).toLocaleString("vi-VN")}</span>
                </div>
                {(user?.id === c.user_id || isAdmin) && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del(c.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-line mt-1">{c.content}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
