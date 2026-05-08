import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductSkeleton";
import { DonateButton } from "@/components/DonateButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Gamepad2, ShoppingCart, BookOpen, Package, Layers, ExternalLink, Shield, ShieldAlert, ArrowUpDown, Flame, Crown, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "@/components/RankBadge";
import { CompareBar } from "@/components/CompareBar";
import { LANGUAGES, FRAMEWORKS } from "@/lib/languages";

type Cat = "all" | "game" | "shop" | "comic" | "other";
type LinkFilter = "all" | "direct" | "bypass1" | "bypass2";
type SortBy = "newest" | "oldest" | "downloads" | "views" | "title";

const CATS: { value: Cat; label: string; icon: any }[] = [
  { value: "all", label: "Tất cả", icon: Layers },
  { value: "game", label: "Web Game", icon: Gamepad2 },
  { value: "shop", label: "Web Bán hàng", icon: ShoppingCart },
  { value: "comic", label: "Web Truyện tranh", icon: BookOpen },
  { value: "other", label: "Khác", icon: Package },
];

const PAGE_SIZE = 12;

const Index = () => {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialTag = params.get("tag") ?? "";

  const [items, setItems] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [cat, setCat] = useState<Cat>("all");
  const [linkF, setLinkF] = useState<LinkFilter>("all");
  const [sort, setSort] = useState<SortBy>("newest");
  const [language, setLanguage] = useState<string>("");
  const [framework, setFramework] = useState<string>("");
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [topCreators, setTopCreators] = useState<Tables<"profiles">[]>([]);

  // Debounce search
  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q), 300); return () => clearTimeout(t); }, [q]);

  // Sync URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (activeTag) next.set("tag", activeTag);
    setParams(next, { replace: true });
  }, [q, activeTag, setParams]);

  useEffect(() => {
    document.title = "CodeShare - Chia sẻ source code free";
    supabase.from("profiles").select("*").order("xp", { ascending: false }).limit(5)
      .then(({ data }) => setTopCreators(data ?? []));
  }, []);

  const buildQuery = useCallback((from: number, to: number) => {
    let qb = supabase.from("products").select("*").eq("status", "approved");
    if (cat !== "all") qb = qb.eq("category", cat);
    if (language) qb = qb.eq("language", language);
    if (framework) qb = qb.eq("framework", framework);
    if (activeTag) qb = qb.contains("tags", [activeTag]);
    if (linkF === "direct") qb = qb.not("link_direct", "is", null);
    if (linkF === "bypass1") qb = qb.not("link_bypass1", "is", null);
    if (linkF === "bypass2") qb = qb.not("link_bypass2", "is", null);

    if (sort === "newest") qb = qb.order("created_at", { ascending: false });
    else if (sort === "oldest") qb = qb.order("created_at", { ascending: true });
    else if (sort === "downloads") qb = qb.order("download_count", { ascending: false });
    else if (sort === "views") qb = qb.order("view_count" as any, { ascending: false });
    else qb = qb.order("title", { ascending: true });

    return qb.range(from, to);
  }, [cat, language, framework, activeTag, linkF, sort]);

  // Reset & load on filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setPage(0); setHasMore(true);

    (async () => {
      let data: Tables<"products">[] = [];
      if (debouncedQ.trim()) {
        // Use full-text search via RPC for first page (then fallback to ilike)
        const { data: ftData } = await supabase
          .from("products")
          .select("*")
          .eq("status", "approved")
          .textSearch("search_tsv", debouncedQ.trim(), { type: "websearch", config: "simple" })
          .limit(200);
        let filtered = ftData ?? [];
        // Apply remaining filters client-side (small result set)
        if (cat !== "all") filtered = filtered.filter(p => p.category === cat);
        if (language) filtered = filtered.filter(p => (p as any).language === language);
        if (framework) filtered = filtered.filter(p => (p as any).framework === framework);
        if (activeTag) filtered = filtered.filter(p => ((p as any).tags ?? []).includes(activeTag));
        if (linkF === "direct") filtered = filtered.filter(p => !!p.link_direct);
        if (linkF === "bypass1") filtered = filtered.filter(p => !!p.link_bypass1);
        if (linkF === "bypass2") filtered = filtered.filter(p => !!p.link_bypass2);
        // Sort
        filtered.sort((a, b) => {
          if (sort === "newest") return +new Date(b.created_at) - +new Date(a.created_at);
          if (sort === "oldest") return +new Date(a.created_at) - +new Date(b.created_at);
          if (sort === "downloads") return (b.download_count ?? 0) - (a.download_count ?? 0);
          if (sort === "views") return ((b as any).view_count ?? 0) - ((a as any).view_count ?? 0);
          return a.title.localeCompare(b.title, "vi");
        });
        data = filtered;
        setHasMore(false); // search returns all matches, no need to paginate
      } else {
        const { data: pageData } = await buildQuery(0, PAGE_SIZE - 1);
        data = pageData ?? [];
        setHasMore((pageData ?? []).length === PAGE_SIZE);
      }
      if (!cancelled) { setItems(data); setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [debouncedQ, cat, language, framework, activeTag, linkF, sort, buildQuery]);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (debouncedQ.trim()) return; // search mode loads everything at once
    if (!sentinelRef.current || !hasMore || loading) return;
    const obs = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loadingMore) return;
      setLoadingMore(true);
      const next = page + 1;
      const { data } = await buildQuery(next * PAGE_SIZE, next * PAGE_SIZE + PAGE_SIZE - 1);
      const arr = data ?? [];
      setItems(prev => [...prev, ...arr]);
      setPage(next);
      setHasMore(arr.length === PAGE_SIZE);
      setLoadingMore(false);
    }, { rootMargin: "300px" });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [page, hasMore, loading, loadingMore, buildQuery, debouncedQ]);

  const activeFilterCount = (language ? 1 : 0) + (framework ? 1 : 0) + (activeTag ? 1 : 0) + (linkF !== "all" ? 1 : 0);

  const clearFilters = () => { setLanguage(""); setFramework(""); setActiveTag(""); setLinkF("all"); };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-hero border-b border-border">
        <div className="container py-12 md:py-20 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Sparkles className="size-4" /> Cộng đồng share code Việt Nam
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Chia sẻ <span className="text-gradient">source code</span><br />miễn phí, dễ dàng
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Web game, web bán hàng, truyện tranh và hơn thế. Tải nhanh với hệ thống link đa dạng.
          </p>

          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm code... (gõ có dấu hoặc không dấu)"
              className="h-14 pl-12 pr-4 text-base rounded-xl shadow-card" />
          </div>
        </div>
      </section>

      <section className="border-b border-border sticky top-16 bg-background/95 backdrop-blur z-40">
        <div className="container py-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATS.map((c) => {
              const Icon = c.icon;
              const active = cat === c.value;
              return (
                <Button key={c.value} size="sm" variant={active ? "default" : "outline"}
                  className={active ? "bg-gradient-primary shadow-glow shrink-0" : "shrink-0"}
                  onClick={() => setCat(c.value)}>
                  <Icon className="size-4 mr-1" />{c.label}
                </Button>
              );
            })}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Tabs value={linkF} onValueChange={(v) => setLinkF(v as LinkFilter)} className="flex-1 min-w-[280px]">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="all">Tất cả link</TabsTrigger>
                <TabsTrigger value="direct"><ExternalLink className="size-3 mr-1" />Không vượt</TabsTrigger>
                <TabsTrigger value="bypass1"><Shield className="size-3 mr-1" />Vượt 1</TabsTrigger>
                <TabsTrigger value="bypass2"><ShieldAlert className="size-3 mr-1" />Vượt 2</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={sort} onValueChange={v => setSort(v as SortBy)}>
              <SelectTrigger className="w-[170px]"><ArrowUpDown className="size-4 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="downloads">Tải nhiều nhất</SelectItem>
                <SelectItem value="views">Xem nhiều nhất</SelectItem>
                <SelectItem value="title">Theo tên (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <SlidersHorizontal className="size-4 mr-1" />Bộ lọc
                  {activeFilterCount > 0 && <Badge className="ml-1 h-5 px-1.5">{activeFilterCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Bộ lọc nâng cao</SheetTitle></SheetHeader>
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Ngôn ngữ</label>
                    <Select value={language || "all"} onValueChange={(v) => setLanguage(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Framework</label>
                    <Select value={framework || "all"} onValueChange={(v) => setFramework(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tag</label>
                    <Input value={activeTag} onChange={(e) => setActiveTag(e.target.value.trim().toLowerCase())} placeholder="VD: ecommerce" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={clearFilters}>Xoá tất cả filter</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {(activeTag || language || framework) && (
            <div className="flex gap-1 flex-wrap">
              {language && <Badge variant="secondary" className="gap-1">{language}<button onClick={() => setLanguage("")}><X className="size-3" /></button></Badge>}
              {framework && <Badge variant="secondary" className="gap-1">{framework}<button onClick={() => setFramework("")}><X className="size-3" /></button></Badge>}
              {activeTag && <Badge variant="secondary" className="gap-1">#{activeTag}<button onClick={() => setActiveTag("")}><X className="size-3" /></button></Badge>}
            </div>
          )}
        </div>
      </section>

      <main className="container py-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button asChild variant="outline" className="border-orange-500/40 text-orange-600 hover:bg-orange-500 hover:text-white">
            <Link to="/trending"><Flame className="size-4 mr-1" />Xem Trending</Link>
          </Button>
          <Button asChild variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/ai"><Sparkles className="size-4 mr-1" />AI Code Tools</Link>
          </Button>
        </div>

        {topCreators.length > 0 && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="size-5 text-yellow-500" />
              <h2 className="font-semibold">Top Creators</h2>
              <Link to="/trending" className="text-xs text-primary hover:underline ml-auto">Xem tất cả →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {topCreators.map((u, i) => (
                <Link key={u.id} to={`/u/${u.id}`} className="flex flex-col items-center gap-1 shrink-0 w-20 group">
                  <div className="relative">
                    <Avatar className="size-14 ring-2 ring-yellow-500/30 group-hover:ring-yellow-500 transition">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {(u.display_name ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {i < 3 && (
                      <span className="absolute -top-1 -right-1 size-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                        style={{ background: i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : "#ea580c" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate w-full text-center">{u.display_name ?? "?"}</p>
                  <RankBadge level={u.level ?? 1} className="text-[9px] py-0 px-1" />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Package className="size-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold">Không có sản phẩm phù hợp</h3>
            <p className="text-muted-foreground mb-4">Thử bỏ bớt filter hoặc đổi từ khoá.</p>
            <Button asChild className="bg-gradient-primary shadow-glow"><Link to="/new">Đăng code ngay</Link></Button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
            {!debouncedQ.trim() && hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore ? <Loader2 className="size-6 animate-spin text-primary" /> : <span className="text-xs text-muted-foreground">Cuộn xuống để tải thêm</span>}
              </div>
            )}
            {!hasMore && items.length > PAGE_SIZE && (
              <p className="text-center text-xs text-muted-foreground py-6">— Đã hết —</p>
            )}
          </>
        )}
      </main>

      <CompareBar />

      <footer className="border-t border-border mt-12">
        <div className="container py-6 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-muted-foreground">
          <p>© 2026 CodeShare — Chia sẻ code, lan toả tri thức.</p>
          <DonateButton variant="outline" />
        </div>
      </footer>
    </div>
  );
};
export default Index;
