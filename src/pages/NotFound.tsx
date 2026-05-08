import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, Home, Search, Ghost } from "lucide-react";

const NotFound = () => {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="relative inline-block mb-6">
          <Ghost className="size-32 text-primary/40 animate-pulse" />
          <div className="absolute -top-2 -right-2 size-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
            <Code2 className="size-5 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-7xl font-bold text-gradient mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Ơ kìa, lạc trôi rồi! 👻</h2>
        <p className="text-muted-foreground mb-2">Trang <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{loc.pathname}</code> không tồn tại</p>
        <p className="text-sm text-muted-foreground mb-6">Có thể link đã bị xoá, hoặc bro gõ sai chính tả 😅</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button asChild className="bg-gradient-primary shadow-glow"><Link to="/"><Home className="size-4 mr-1" />Về trang chủ</Link></Button>
          <Button asChild variant="outline"><Link to="/"><Search className="size-4 mr-1" />Tìm code khác</Link></Button>
        </div>
      </div>
    </div>
  );
};
export default NotFound;
