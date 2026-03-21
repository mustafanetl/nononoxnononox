import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TripProvider } from "@/contexts/TripContext";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import MyTrips from "./pages/MyTrips";
import ResetPassword from "./pages/ResetPassword";
import TripDetail from "./pages/TripDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TripProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-trips" element={<MyTrips />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/trip/view" element={<TripDetail />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TripProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
