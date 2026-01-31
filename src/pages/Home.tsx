import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
  Activity,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['reporting-overview'],
    queryFn: api.getReportingOverview,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 5000,
  });

  const activeJobs = jobs?.filter(j => j.status === 'running' || j.status === 'paused') || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Content Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content collection and transformation projects
          </p>
        </div>
        <Link to="/projects">
          <Button>
            <FolderKanban className="h-4 w-4 mr-2" />
            View All Projects
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{overview?.totalProjects || 0}</p>
                )}
              </div>
              <FolderKanban className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Providers</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{overview?.totalProviders || 0}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{overview?.totalArticles || 0}</p>
                )}
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{overview?.successRate || 0}%</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>Quick access to your content projects</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map(project => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.providers_count} providers - {project.articles_count} articles
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
                {projects.length > 5 && (
                  <Link to="/projects" className="block text-center py-2 text-sm text-muted-foreground hover:text-foreground">
                    View all {projects.length} projects
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first project to start collecting content
                </p>
                <Link to="/projects">
                  <Button>Create Project</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Jobs
            </CardTitle>
            <CardDescription>Currently running collection jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {activeJobs.length > 0 ? (
              <div className="space-y-3">
                {activeJobs.map(job => (
                  <div key={job.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{job.providerName}</span>
                      <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${job.completionRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{job.current} / {job.total}</span>
                      <span>{job.completionRate}%</span>
                    </div>
                  </div>
                ))}
                <Link to="/live-monitor" className="block text-center py-2 text-sm text-primary hover:underline">
                  View Live Monitor
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-medium mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  No active jobs running
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/projects">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FolderKanban className="h-6 w-6" />
                <span>New Project</span>
              </Button>
            </Link>
            <Link to="/live-monitor">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Activity className="h-6 w-6" />
                <span>Live Monitor</span>
              </Button>
            </Link>
            <Link to="/repository">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Repository</span>
              </Button>
            </Link>
            <Link to="/reporting">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Reporting</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
