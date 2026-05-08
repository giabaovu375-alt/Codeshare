import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, Moon, Sun, Plus, LogOut, User as UserIcon, Shield, Flame, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

export const Header = () => {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="size-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Code2 className="size-5 text-primary-foreground" />
          </div>
          <span className="text-gradient">CodeShare</span>
        </Link>

        <div className="hidden md:block flex-1 max-w-md mx-6">
          <SearchAutocomplete placeholder="Tìm code, tag, ngôn ngữ..." />
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/trending"><Flame className="size-4 mr-1 text-orange-500" />Trending</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/ai"><Sparkles className="size-4 mr-1 text-primary" />AI</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Đổi giao diện">
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Button asChild variant="outline" size="sm" className="h-9 w-9 px-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto sm:px-3">
                  <Link to="/admin" aria-label="Trang quản trị">
                    <Shield className="size-4 sm:mr-1" />
                    <span className="hidden sm:inline">QTV</span>
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="icon" aria-label="Hồ sơ">
                <Link to="/profile"><UserIcon className="size-5" /></Link>
              </Button>
              <Button asChild variant="default" className="bg-gradient-primary hover:opacity-90 shadow-glow">
                <Link to="/new"><Plus className="size-4 mr-1" />Đăng code</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Đăng xuất">
                <LogOut className="size-5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="default" className="bg-gradient-primary hover:opacity-90">
              <Link to="/auth"><UserIcon className="size-4 mr-1" />Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};