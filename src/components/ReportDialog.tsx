import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const REASONS = [
  { v: "dead_link", label: "Link die / không tải được" },
  { v: "broken_code", label: "Code bị lỗi / không chạy" },
  { v: "inappropriate", label: "Nội dung không phù hợp" },
  { v: "spam", label: "Spam / quảng cáo" },
  { v: "other", label: "Lý do khác" },
] as const;

export const ReportDialog = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("dead_link");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Đăng nhập để báo cáo"); return; }
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      product_id: productId, user_id: user.id, reason: reason as any, detail: detail.trim() || null,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Đã gửi báo cáo. Cảm ơn bạn!"); setOpen(false); setDetail(""); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground"><Flag className="size-4 mr-1" />Báo cáo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Báo cáo sản phẩm</DialogTitle></DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
          {REASONS.map(r => (
            <div key={r.v} className="flex items-center space-x-2">
              <RadioGroupItem value={r.v} id={r.v} />
              <Label htmlFor={r.v} className="cursor-pointer">{r.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="Chi tiết thêm (tuỳ chọn)..." maxLength={500} rows={3} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={loading} variant="destructive">{loading ? "Đang gửi..." : "Gửi báo cáo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
