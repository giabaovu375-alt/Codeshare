import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import NewProduct from "./pages/NewProduct.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import TryProduct from "./pages/TryProduct.tsx";
import Compare from "./pages/Compare.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Trending from "./pages/Trending.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import AITools from "./pages/AITools.tsx";
import { ThemeProvider } from "./hooks/useTheme.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/new" element={<NewProduct />} />
              <Route path="/edit/:id" element={<NewProduct />} />
              <Route path="/p/:id" element={<ProductDetail />} />
              <Route path="/p/:id/try" element={<TryProduct />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/u/:id" element={<UserProfile />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/ai" element={<AITools />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
