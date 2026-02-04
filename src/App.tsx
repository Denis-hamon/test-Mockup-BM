import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import AIGuidelines from "./pages/AIGuidelines";
import Documentation from "./pages/Documentation";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
        <AuthProvider>
          <Routes>
            {/* Public Routes (no authentication required) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (authentication required) */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout><Home /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <AppLayout><Projects /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reporting" element={
              <ProtectedRoute>
                <AppLayout><Reporting /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/article/:id" element={
              <ProtectedRoute>
                <AppLayout><ArticleDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/documentation" element={
              <ProtectedRoute>
                <AppLayout><Documentation /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Project-Scoped Routes with ProjectLayout */}
            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><ProjectDetail /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/collection-points" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><CollectionPoints /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/live-monitor" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><LiveMonitor /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/repository" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><ContentRepository /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/article/:articleId" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><ArticleDetail /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/ai-guidelines" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><AIGuidelines /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/settings" element={
              <ProtectedRoute>
                <AppLayout><ProjectPage><ProjectSettings /></ProjectPage></AppLayout>
              </ProtectedRoute>
            } />

            {/* Legacy standalone routes */}
            <Route path="/collection-points" element={
              <ProtectedRoute>
                <AppLayout><CollectionPoints /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/live-monitor" element={
              <ProtectedRoute>
                <AppLayout><LiveMonitor /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/repository" element={
              <ProtectedRoute>
                <AppLayout><ContentRepository /></AppLayout>
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
