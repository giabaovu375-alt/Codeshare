import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const StarRating = ({
  value, onChange, size = 20, readOnly = false,
}: { value: number; onChange?: (v: number) => void; size?: number; readOnly?: boolean }) => (
  <div className="inline-flex items-center gap-0.5">
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" disabled={readOnly}
        onClick={() => onChange?.(n)}
        className={cn("transition-colors", !readOnly && "hover:scale-110", readOnly && "cursor-default")}
        aria-label={`${n} sao`}>
        <Star
          style={{ width: size, height: size }}
          className={cn(n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")}
        />
      </button>
    ))}
  </div>
);
