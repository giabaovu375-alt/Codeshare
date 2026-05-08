import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

interface Props {
  code: string;
  language?: string;
  showCopy?: boolean;
  maxHeight?: number;
}

export const CodeBlock = ({ code, language = "javascript", showCopy = true, maxHeight = 400 }: Props) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Đã copy!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Không copy được");
    }
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border">
      {showCopy && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 z-10 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copy}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          <span className="ml-1 text-xs">{copied ? "Đã copy" : "Copy"}</span>
        </Button>
      )}
      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? vscDarkPlus : oneLight}
        customStyle={{ margin: 0, maxHeight, fontSize: "0.85rem" }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};