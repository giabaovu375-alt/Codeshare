import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Gamepad2, ShoppingCart, BookOpen, Package, Download } from "lucide-react";

const ICONS: Record<string, any> = { game: Gamepad2, shop: ShoppingCart, comic: BookOpen, other: Package };

interface Suggestion { id: string; title: string; category: string; download_count: number }

interface Props { className?: string; placeholder?: string; autoFocus?: boolean; onSelect?: () => void }

export const SearchAutocomplete = ({ className, placeholder = "Tìm code...", autoFocus, onSelect }: Props) => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const nav = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setItems([]); return; }
      setLoading(true);
      const { data } = await supabase.rpc("suggest_products", { _q: q.trim(), _limit: 8 });
      setItems((data ?? []) as Suggestion[]);
      setActive(0);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (s: Suggestion) => {
    setOpen(false); setQ(""); onSelect?.();
    nav(`/p/${s.id}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) go(items[active]);
      else if (q.trim()) { nav(`/?q=${encodeURIComponent(q.trim())}`); setOpen(false); onSelect?.(); }
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}

      {open && q.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {items.length === 0 && !loading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Không tìm thấy. Nhấn Enter để xem kết quả mở rộng.
            </div>
          ) : (
            items.map((s, i) => {
              const Icon = ICONS[s.category] ?? Package;
              return (
                <button
                  key={s.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(s)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm border-b border-border/50 last:border-0 ${i === active ? "bg-accent" : "hover:bg-accent/50"}`}
                >
                  <Icon className="size-4 text-primary shrink-0" />
                  <span className="flex-1 truncate">{s.title}</span>
                  {s.download_count > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Download className="size-3" />{s.download_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
