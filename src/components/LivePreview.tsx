import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Code as CodeIcon, RefreshCw } from "lucide-react";

interface Props {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
}

export const LivePreview = ({
  initialHtml = "<h1>Hello CodeShare!</h1>\n<p>Sửa code để xem preview ngay.</p>",
  initialCss = "body{font-family:sans-serif;padding:20px;color:#333}h1{color:#6366f1}",
  initialJs = "console.log('Live preview ready');",
}: Props) => {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [key, setKey] = useState(0);

  const srcDoc = useMemo(() => `
<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body>${html}<script>try{${js}}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="color:red">'+e+'</pre>')}</script></body></html>
  `, [html, css, js, key]);

  return (
    <Card className="overflow-hidden">
      <Tabs defaultValue="preview">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="h-6"><Eye className="size-3 mr-1" />Preview</TabsTrigger>
            <TabsTrigger value="html" className="h-6"><CodeIcon className="size-3 mr-1" />HTML</TabsTrigger>
            <TabsTrigger value="css" className="h-6">CSS</TabsTrigger>
            <TabsTrigger value="js" className="h-6">JS</TabsTrigger>
          </TabsList>
          <Button size="sm" variant="ghost" onClick={() => setKey(k => k + 1)}>
            <RefreshCw className="size-3 mr-1" />Chạy lại
          </Button>
        </div>
        <TabsContent value="preview" className="m-0">
          <iframe key={key} srcDoc={srcDoc} title="preview" sandbox="allow-scripts" className="w-full h-[400px] bg-white" />
        </TabsContent>
        <TabsContent value="html" className="m-0">
          <Textarea value={html} onChange={e => setHtml(e.target.value)} rows={16} className="font-mono text-sm rounded-none border-0" />
        </TabsContent>
        <TabsContent value="css" className="m-0">
          <Textarea value={css} onChange={e => setCss(e.target.value)} rows={16} className="font-mono text-sm rounded-none border-0" />
        </TabsContent>
        <TabsContent value="js" className="m-0">
          <Textarea value={js} onChange={e => setJs(e.target.value)} rows={16} className="font-mono text-sm rounded-none border-0" />
        </TabsContent>
      </Tabs>
    </Card>
  );
};