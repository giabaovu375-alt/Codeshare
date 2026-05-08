import { Badge } from "@/components/ui/badge";
import { rankOf } from "@/lib/level";
import { cn } from "@/lib/utils";

export const RankBadge = ({ level, className }: { level: number; className?: string }) => {
  const r = rankOf(level);
  return (
    <Badge variant="outline" className={cn("gap-1", r.color, className)}>
      <span>{r.emoji}</span>
      <span>Lv.{level} {r.label}</span>
    </Badge>
  );
};