import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductSkeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tables } from "@/integrations/supabase/types";
import { Flame, TrendingUp, Calendar, Crown } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";

const Trending = () => {
  const [today, setToday] = useState<Tables<"products">[]>([]);
  const [week, setWeek] = useState<Tables<"products">[]>([]);
  const [topUsers, setTopUsers] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Trending - CodeShare";
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    Promise.all([
      supabase.from("download_history").select("product_id").gte("created_at", dayAgo),
      supabase.from("download_history").select("product_id").gte("created_at", weekAgo),
      supabase.from("products").select("*").eq("status", "approved"),
      supabase.from("profiles").select("*").order("xp", { ascending: false }).limit(10),
    ]).then(([d1, d7, prods, users]) => {
      const count = (rows: any[]) => {
        const m: Record<string, number> = {};
        (rows ?? []).forEach(r => { m[r.product_id] = (m[r.product_id] ?? 0) + 1; });
        return m;
      };
      const c1 = count(d1.data ?? []);
      const c7 = count(d7.data ?? []);
      const all = prods.data ?? [];
      const sortBy = (m: Record<string, number>) => [...all]
        .filter(p => m[p.id])
        .sort((a, b) => (m[b.id] ?? 0) - (m[a.id] ?? 0))
        .slice(0, 12);
      setToday(sortBy(c1));
      setWeek(sortBy(c7));
      setTopUsers(users.data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl py-8 animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-glow">
            <Flame className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Trending</h1>
            <p className="text-sm text-muted-foreground">Code hot nhất + Top creators</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <Tabs defaultValue="today">
            <TabsList>
              <TabsTrigger value="today"><Flame className="size-4 mr-1" />Hôm nay</TabsTrigger>
              <TabsTrigger value="week"><Calendar className="size-4 mr-1" />Tuần này</TabsTrigger>
              <TabsTrigger value="all"><TrendingUp className="size-4 mr-1" />All time</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="mt-4">
              {loading ? <ProductGridSkeleton count={6} /> : <List items={today} empty="Chưa có code hot hôm nay" />}
            </TabsContent>
            <TabsContent value="week" className="mt-4">
              {loading ? <ProductGridSkeleton count={6} /> : <List items={week} empty="Chưa có code hot tuần này" />}
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <AllTime />
            </TabsContent>
          </Tabs>

          <Card className="p-4 h-fit lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="size-5 text-yellow-500" />
              <h2 className="font-semibold">Top Creators</h2>
            </div>
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <Link key={u.id} to={`/u/${u.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <span className={`text-sm font-bold w-5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-600" : "text-muted-foreground"}`}>
                    #{i + 1}
                  </span>
                  <Avatar className="size-8">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                      {(u.display_name ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.display_name ?? "Ẩn danh"}</p>
                    <p className="text-xs text-muted-foreground">{u.xp} XP</p>
                  </div>
                  <RankBadge level={u.level ?? 1} className="text-[10px] py-0 px-1.5" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

const List = ({ items, empty }: { items: Tables<"products">[]; empty: string }) =>
  items.length === 0 ? (
    <Card className="p-8 text-center text-muted-foreground">{empty}</Card>
  ) : (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(p => <ProductCard key={p.id} p={p} />)}
    </div>
  );

const AllTime = () => {
  const [data, setData] = useState<Tables<"products">[]>([]);
  useEffect(() => {
    supabase.from("products").select("*").eq("status", "approved")
      .order("download_count", { ascending: false }).limit(12)
      .then(({ data }) => setData(data ?? []));
  }, []);
  return <List items={data} empty="Chưa có dữ liệu" />;
};

export default Trending;