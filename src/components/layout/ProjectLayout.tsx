import { useParams, useLocation, Link, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  LayoutDashboard,
  Radio,
  Activity,
  FileText,
  Settings,
  Play,
  Loader2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", path: "", icon: LayoutDashboard },
  { label: "Collection Points", path: "/collection-points", icon: Radio },
  { label: "Live Monitor", path: "/live-monitor", icon: Activity },
  { label: "Repository", path: "/repository", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function ProjectLayout({ children }: ProjectLayoutProps) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const projectId = parseInt(id || "0");

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 5000,
  });

  const { data: providers } = useQuery({
    queryKey: ['providers', projectId],
    queryFn: () => api.getProviders(projectId),
    enabled: !!projectId,
  });

  // Count active jobs for this project
  const providerIds = new Set(providers?.map(p => p.id) || []);
  const activeJobs = jobs?.filter(j =>
    providerIds.has(j.providerId) &&
    (j.status === 'running' || j.status === 'paused')
  ) || [];

  // Quick start mutation for running all providers
  const startAllMutation = useMutation({
    mutationFn: async () => {
      if (!providers?.length) throw new Error('No providers configured');
      const firstProvider = providers[0];
      const url = Object.values(firstProvider.base_urls || {})[0];
      if (!url) throw new Error('No base URL configured');

      return api.startScrape({
        providerId: firstProvider.id,
        language: 'fr',
        url: url
      });
    },
    onSuccess: () => {
      toast.success('Collection started');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('already running')) {
        toast.info('A collection is already running');
      } else {
        toast.error(error.message);
      }
    },
  });

  const basePath = `/projects/${id}`;

  const isActive = (path: string) => {
    const fullPath = basePath + path;
    if (path === "") {
      return location.pathname === basePath || location.pathname === basePath + "/";
    }
    return location.pathname.startsWith(fullPath);
  };

  if (!projectId) {
    return <div className="p-6">Invalid project ID</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Project Header Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="px-6 py-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/projects" className="hover:text-foreground transition-colors">
              Projects
            </Link>
            <ChevronRight className="h-4 w-4" />
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="text-foreground font-medium">{project?.name}</span>
            )}
          </div>

          {/* Project Info & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Skeleton className="h-10 w-10 rounded-lg" />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: project?.color || '#3B82F6' }}
                >
                  {project?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </>
                ) : (
                  <>
                    <h1 className="text-lg font-semibold">{project?.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {project?.description || 'No description'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeJobs.length > 0 && (
                <Badge variant="default" className="bg-green-500 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  {activeJobs.length} job{activeJobs.length > 1 ? 's' : ''} running
                </Badge>
              )}
              <Button
                size="sm"
                onClick={() => startAllMutation.mutate()}
                disabled={startAllMutation.isPending || !providers?.length}
              >
                {startAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Collection
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <nav className="flex gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={basePath + item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg
                    transition-colors border-b-2 -mb-[1px]
                    ${active
                      ? 'text-primary border-primary bg-primary/5'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.path === "/live-monitor" && activeJobs.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {activeJobs.length}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
