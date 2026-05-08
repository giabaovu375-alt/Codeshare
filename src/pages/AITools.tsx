import { Header } from "@/components/Header";
import { AIAssistant } from "@/components/AIAssistant";
import { LivePreview } from "@/components/LivePreview";
import { useEffect } from "react";
import { Sparkles, Eye } from "lucide-react";

const AITools = () => {
  useEffect(() => { document.title = "AI Tools & Live Preview - CodeShare"; }, []);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-5xl py-8 animate-fade-in space-y-8">
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="size-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Code Assistant</h1>
              <p className="text-sm text-muted-foreground">Giải thích, sửa bug, tối ưu code bằng AI miễn phí 🚀</p>
            </div>
          </div>
          <AIAssistant />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-glow">
              <Eye className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Live Preview HTML/CSS/JS</h1>
              <p className="text-sm text-muted-foreground">Code → xem kết quả ngay tại đây</p>
            </div>
          </div>
          <LivePreview />
        </section>
      </main>
    </div>
  );
};
export default AITools;