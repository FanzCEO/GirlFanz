import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EnhancedHeader } from "@/components/layout/EnhancedHeader";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreatorProfile from "@/pages/CreatorProfile";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Moderation from "@/pages/Moderation";
import SystemHealth from "@/pages/SystemHealth";
import { Verification } from "@/pages/Verification";
import { CreatorDashboard } from "@/pages/CreatorDashboard";
import HelpCenter from "@/pages/HelpCenter";
import SupportTickets from "@/pages/SupportTickets";
import WikiPage from "@/pages/WikiPage";
import TutorialsPage from "@/pages/TutorialsPage";
import TutorialDetailPage from "@/pages/TutorialDetailPage";
import FanzMoneyCenter from "@/pages/FanzMoneyCenter";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <EnhancedHeader />
      <Switch>
        {/* Public help pages - accessible to everyone */}
        <Route path="/help" component={HelpCenter} />
        <Route path="/help/tickets" component={SupportTickets} />
        <Route path="/help/contact" component={SupportTickets} />
        <Route path="/wiki/article/:slug" component={WikiPage} />
        <Route path="/wiki" component={WikiPage} />
        <Route path="/tutorials/:id" component={TutorialDetailPage} />
        <Route path="/tutorials" component={TutorialsPage} />
        
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/discover" component={Landing} />
            <Route path="/following" component={Landing} />
            <Route path="/messages" component={Landing} />
            <Route path="/live" component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/discover" component={Dashboard} />
            <Route path="/following" component={Dashboard} />
            <Route path="/live" component={Dashboard} />
            <Route path="/profile" component={CreatorProfile} />
            <Route path="/content" component={Dashboard} />
            <Route path="/messages" component={Messages} />
            <Route path="/analytics" component={CreatorDashboard} />
            <Route path="/earnings" component={CreatorDashboard} />
            <Route path="/settings" component={Settings} />
            <Route path="/verification" component={Verification} />
            <Route path="/moderation" component={Moderation} />
            <Route path="/health" component={SystemHealth} />
            <Route path="/money" component={FanzMoneyCenter} />
            <Route path="/wallet" component={FanzMoneyCenter} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gf-ink ghost-background">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
