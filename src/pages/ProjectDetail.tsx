import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Provider } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radio,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Play,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  Loader2,
  RefreshCw,
  Languages,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const projectId = parseInt(id || "0");

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => api.getProjectStats(projectId),
    enabled: !!projectId,
  });

  const { data: providers } = useQuery({
    queryKey: ['providers', projectId],
    queryFn: () => api.getProviders(projectId),
    enabled: !!projectId,
  });

  const { data: articles } = useQuery({
    queryKey: ['articles', { projectId, limit: 10 }],
    queryFn: () => api.getArticles({ projectId, limit: 10 }),
    enabled: !!projectId,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 3000,
  });

  // Get active jobs for this project
  const providerIds = new Set(providers?.map(p => p.id) || []);
  const projectJobs = jobs?.filter(j => providerIds.has(j.providerId)) || [];
  const activeJobs = projectJobs.filter(j => j.status === 'running' || j.status === 'paused');

  // Start collection mutation
  const startMutation = useMutation({
    mutationFn: async (provider: Provider) => {
      const url = Object.values(provider.base_urls || {})[0];
      if (!url) throw new Error('No base URL configured');
      return api.startScrape({
        providerId: provider.id,
        language: 'fr',
        url: url
      });
    },
    onSuccess: () => {
      toast.success('Collection started');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Calculate completion rate
  const collectedCount = stats?.collected || 0;
  const transformedCount = stats?.transformed || 0;
  const transformRate = collectedCount > 0 ? Math.round((transformedCount / collectedCount) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collection Points</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.providers_count || 0}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Radio className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{(stats?.articles_count || 0).toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transformed</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{transformedCount}</p>
                    <p className="text-xs text-muted-foreground">{transformRate}% of collected</p>
                  </>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {((stats?.total_words || 0) / 1000).toFixed(1)}k
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Jobs
                </CardTitle>
                <CardDescription>Currently running collection jobs</CardDescription>
              </div>
              <Link to={`/projects/${projectId}/live-monitor`}>
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.slice(0, 3).map(job => (
                  <div key={job.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          job.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                        }`} />
                        <span className="font-medium">{job.providerName}</span>
                      </div>
                      <Badge variant={job.status === 'running' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress value={job.completionRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{job.current}/{job.total} articles</span>
                        <span>{job.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No active jobs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start a collection to see progress here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collection Points */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Collection Points
                </CardTitle>
                <CardDescription>Your content sources</CardDescription>
              </div>
              <Link to={`/projects/${projectId}/collection-points`}>
                <Button variant="outline" size="sm">
                  Manage
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {providers && providers.length > 0 ? (
              <div className="space-y-3">
                {providers.slice(0, 4).map(provider => {
                  const hasActiveJob = activeJobs.some(j => j.providerId === provider.id);
                  return (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                          <Radio className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{provider.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {provider.articles_count || 0} articles
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasActiveJob ? (
                          <Badge variant="default" className="bg-green-500">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Running
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startMutation.mutate(provider)}
                            disabled={startMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {providers.length > 4 && (
                  <Link
                    to={`/projects/${projectId}/collection-points`}
                    className="block text-center py-2 text-sm text-primary hover:underline"
                  >
                    View all {providers.length} providers
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No providers yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add collection points to start gathering content
                </p>
                <Link to={`/projects/${projectId}/collection-points`}>
                  <Button>Add Provider</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Articles
              </CardTitle>
              <CardDescription>Latest collected content</CardDescription>
            </div>
            <Link to={`/projects/${projectId}/repository`}>
              <Button variant="outline" size="sm">
                View Repository
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {articles?.articles && articles.articles.length > 0 ? (
            <div className="space-y-2">
              {articles.articles.slice(0, 8).map(article => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="font-medium text-sm truncate">
                      {article.transformed_title || article.original_title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{article.provider_name}</span>
                      <span>-</span>
                      <span>{article.word_count?.toLocaleString()} words</span>
                      <span>-</span>
                      <span>{formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {article.language.toUpperCase()}
                    </Badge>
                    <Badge
                      variant={
                        article.status === 'published' ? 'default' :
                        article.status === 'transformed' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {article.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No articles yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a collection to gather articles
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
