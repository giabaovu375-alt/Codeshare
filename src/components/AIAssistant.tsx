import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Bug, Wand2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Mode = "explain" | "fix" | "optimize";

const MODES: { value: Mode; label: string; icon: any; placeholder: string }[] = [
  { value: "explain", label: "Giải thích", icon: BookOpen, placeholder: "Paste code cần giải thích..." },
  { value: "fix", label: "Sửa bug", icon: Bug, placeholder: "Paste code lỗi + log lỗi (nếu có)..." },
  { value: "optimize", label: "Tối ưu", icon: Wand2, placeholder: "Paste code cần tối ưu..." },
];

export const AIAssistant = () => {
  const [mode, setMode] = useState<Mode>("explain");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!input.trim()) { toast.error("Nhập code đi đã"); return; }
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-code-assistant", {
        body: { mode, code: input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.result ?? "Không có kết quả");
    } catch (e: any) {
      toast.error(e.message ?? "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const cur = MODES.find(m => m.value === mode)!;
  const Icon = cur.icon;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="font-semibold">AI Code Assistant</h3>
      </div>

      <Tabs value={mode} onValueChange={v => { setMode(v as Mode); setOutput(""); }}>
        <TabsList className="w-full">
          {MODES.map(m => {
            const I = m.icon;
            return <TabsTrigger key={m.value} value={m.value} className="flex-1"><I className="size-4 mr-1" />{m.label}</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      <Textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={cur.placeholder} rows={8} className="font-mono text-sm" maxLength={5000} />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{input.length}/5000</span>
        <Button onClick={run} disabled={loading} className="bg-gradient-primary shadow-glow">
          {loading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Icon className="size-4 mr-1" />}
          {loading ? "AI đang suy nghĩ..." : `${cur.label} ngay`}
        </Button>
      </div>

      {output && (
        <Card className="p-4 bg-muted/30 prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_code]:text-xs">
          <ReactMarkdown>{output}</ReactMarkdown>
        </Card>
      )}
    </Card>
  );
};