import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSettings from "./pages/ProjectSettings";
import Reporting from "./pages/Reporting";
import CollectionPoints from "./pages/CollectionPoints";
import LiveMonitor from "./pages/LiveMonitor";
import ContentRepository from "./pages/ContentRepository";
import ArticleDetail from "./pages/ArticleDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Wrapper component for project-scoped pages
function ProjectPage({ children }: { children: React.ReactNode }) {
  return <ProjectLayout>{children}</ProjectLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Global Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/settings" element={<Settings />} />

            {/* Project-Scoped Routes with ProjectLayout */}
            <Route path="/projects/:id" element={<ProjectPage><ProjectDetail /></ProjectPage>} />
            <Route path="/projects/:id/collection-points" element={<ProjectPage><CollectionPoints /></ProjectPage>} />
            <Route path="/projects/:id/live-monitor" element={<ProjectPage><LiveMonitor /></ProjectPage>} />
            <Route path="/projects/:id/repository" element={<ProjectPage><ContentRepository /></ProjectPage>} />
            <Route path="/projects/:id/settings" element={<ProjectPage><ProjectSettings /></ProjectPage>} />

            {/* Legacy standalone routes (redirect to default project or show global view) */}
            <Route path="/collection-points" element={<CollectionPoints />} />
            <Route path="/live-monitor" element={<LiveMonitor />} />
            <Route path="/repository" element={<ContentRepository />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
