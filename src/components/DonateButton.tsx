import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Heart } from "lucide-react";

export const DonateButton = ({ variant = "ghost" }: { variant?: "ghost" | "outline" | "default" }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm"><Coffee className="size-4 mr-1" />Ủng hộ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Heart className="size-5 text-red-500 fill-red-500" />Cảm ơn bro đã ủng hộ!</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">Mỗi ly cà phê giúp web duy trì và có thêm code mới mỗi ngày 💪</p>
          <div className="bg-gradient-hero p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold">☕ Mua mình ly cà phê</p>
            <p className="text-xs text-muted-foreground">Cập nhật QR Momo / STK ngân hàng tại đây</p>
            <code className="block bg-background/50 p-2 rounded text-xs">Momo: 0123456789</code>
            <code className="block bg-background/50 p-2 rounded text-xs">BIDV: 1234567890</code>
          </div>
          <p className="text-xs text-muted-foreground">Hoặc share web cho bạn bè cũng giúp ích lắm rồi! ❤️</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
