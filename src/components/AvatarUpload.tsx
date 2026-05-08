import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const AvatarUpload = ({
  userId, currentUrl, displayName, onUploaded,
}: {
  userId: string;
  currentUrl?: string | null;
  displayName?: string | null;
  onUploaded: (url: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Ảnh tối đa 2MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Phải là ảnh"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", userId);
    onUploaded(pub.publicUrl);
    toast.success("Đã đổi avatar");
    setUploading(false);
  };

  const initial = (displayName ?? "?").charAt(0).toUpperCase();

  return (
    <div className="relative group">
      <Avatar className="size-20 ring-2 ring-primary/30">
        <AvatarImage src={currentUrl ?? undefined} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">{initial}</AvatarFallback>
      </Avatar>
      <Button size="icon" variant="secondary"
        className="absolute -bottom-1 -right-1 size-7 rounded-full shadow-md"
        onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="Đổi avatar">
        {uploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
      </Button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
};