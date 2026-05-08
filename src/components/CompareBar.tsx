import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GitCompare, X } from "lucide-react";
import { getCompareIds, setCompareIds } from "@/lib/compare";

export const CompareBar = () => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(getCompareIds());
    sync();
    window.addEventListener("compare:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("compare:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <Card className="px-4 py-3 shadow-glow flex items-center gap-3 border-primary/40 bg-background/95 backdrop-blur">
        <GitCompare className="size-5 text-primary" />
        <span className="text-sm font-medium">{ids.length} sản phẩm để so sánh</span>
        <Button asChild size="sm" className="bg-gradient-primary" disabled={ids.length < 2}>
          <Link to={`/compare?ids=${ids.join(",")}`}>So sánh</Link>
        </Button>
        <Button size="icon" variant="ghost" className="size-7" onClick={() => setCompareIds([])} aria-label="Xoá">
          <X className="size-4" />
        </Button>
      </Card>
    </div>
  );
};
