import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  RefreshCw,
  Languages,
  Globe,
  TrendingUp,
  Play,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Loader2,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import api, { type Job } from "@/lib/api";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  loading
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? 'text-success' : 'text-destructive'}`}>
                <TrendingUp className="h-3 w-3" />
                <span>{trend.positive ? '+' : ''}{trend.value}% from last week</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveJobCard({ job }: { job: Job }) {
  const progress = job.completionRate || 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{job.providerName}</p>
              <p className="text-xs text-muted-foreground">
                {job.startedAt ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true }) : 'Starting...'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success border-0">
            {job.status === 'running' ? 'Running' : job.status}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{job.current} / {job.total}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            <span>{job.speed} articles/min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 5000,
  });

  const { data: overview } = useQuery({
    queryKey: ['reporting-overview'],
    queryFn: api.getReportingOverview,
  });

  const activeJobs = jobs.filter(j => j.status === 'running');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your content pipeline
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/live-monitor">
              <Clock className="h-4 w-4 mr-2" />
              View Monitor
            </Link>
          </Button>
          <Button asChild>
            <Link to="/collection-points">
              <Play className="h-4 w-4 mr-2" />
              Start Collection
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Articles"
          value={stats?.total || 0}
          subtitle="Across all sources"
          icon={FileText}
          loading={statsLoading}
        />
        <StatCard
          title="Transformed"
          value={stats?.transformed || 0}
          subtitle={`${stats?.collected || 0} pending transformation`}
          icon={RefreshCw}
          loading={statsLoading}
        />
        <StatCard
          title="Total Words"
          value={((stats?.totalWords || 0) / 1000).toFixed(1) + 'k'}
          subtitle="Content volume"
          icon={Languages}
          loading={statsLoading}
        />
        <StatCard
          title="Providers"
          value={overview?.totalProviders || 0}
          subtitle="Collection sources"
          icon={Users}
          loading={statsLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Jobs</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/live-monitor">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          {jobsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : activeJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeJobs.slice(0, 4).map(job => (
                <ActiveJobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No active jobs</p>
                <Button className="mt-4" size="sm" asChild>
                  <Link to="/collection-points">Start New Collection</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.collected || 0}</p>
                    <p className="text-xs text-muted-foreground">Awaiting Transform</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                    <Languages className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.transformed || 0}</p>
                    <p className="text-xs text-muted-foreground">Transformed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                    <Globe className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{overview?.successRate || 0}%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Languages & Providers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">By Language</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              {stats?.byLanguage && stats.byLanguage.length > 0 ? (
                <div className="space-y-4">
                  {stats.byLanguage.slice(0, 5).map((lang) => (
                    <div key={lang.language} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lang.language.toUpperCase()}</Badge>
                        <span className="text-sm">{lang.count} articles</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {((lang.words || 0) / 1000).toFixed(1)}k words
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No language data
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">By Provider</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              {stats?.byProvider && stats.byProvider.length > 0 ? (
                <div className="space-y-4">
                  {stats.byProvider.slice(0, 5).map((provider) => (
                    <div key={provider.slug} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{provider.name}</span>
                      <Badge variant="secondary">{provider.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No provider data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
