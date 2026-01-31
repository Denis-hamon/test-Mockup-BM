import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reporting() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['reporting-overview'],
    queryFn: api.getReportingOverview,
  });

  const { data: byProject, isLoading: loadingByProject } = useQuery({
    queryKey: ['reporting-by-project'],
    queryFn: api.getReportingByProject,
  });

  const { data: byProvider, isLoading: loadingByProvider } = useQuery({
    queryKey: ['reporting-by-provider'],
    queryFn: api.getReportingByProvider,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['reporting-trends', timeRange],
    queryFn: () => api.getReportingTrends(parseInt(timeRange)),
  });

  const statusData = overview?.byStatus
    ? Object.entries(overview.byStatus).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporting</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for your content pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <BarChart3 className="h-8 w-8 text-blue-500" />
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
                <p className="text-sm text-muted-foreground">This Week</p>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{overview?.articlesThisWeek || 0}</p>
                )}
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
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
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Trends</CardTitle>
            <CardDescription>Articles collected over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <Skeleton className="h-64 w-full" />
            ) : trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(val) => new Date(val).toLocaleDateString('fr-FR')}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="articles_count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    name="Articles"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Articles by processing status</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <Skeleton className="h-64 w-full" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">By Project</TabsTrigger>
          <TabsTrigger value="providers">By Provider</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Statistics</CardTitle>
              <CardDescription>Performance breakdown by project</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingByProject ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : byProject && byProject.length > 0 ? (
                <div className="space-y-4">
                  {byProject.map((project, index) => (
                    <div key={project.id} className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: project.color || COLORS[index % COLORS.length] }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {project.articles_count} articles
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (project.articles_count / (byProject[0]?.articles_count || 1)) * 100)}%`,
                              backgroundColor: project.color || COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{project.providers_count} providers</p>
                        <p className="text-xs text-muted-foreground">
                          {((project.total_words || 0) / 1000).toFixed(1)}k words
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Provider Statistics</CardTitle>
              <CardDescription>Performance breakdown by provider</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingByProvider ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : byProvider && byProvider.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Provider</th>
                        <th className="text-left py-3 px-4 font-medium">Project</th>
                        <th className="text-right py-3 px-4 font-medium">Articles</th>
                        <th className="text-right py-3 px-4 font-medium">Transformed</th>
                        <th className="text-right py-3 px-4 font-medium">Words</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byProvider.map(provider => (
                        <tr key={provider.id} className="border-b hover:bg-accent/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
                                <Users className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{provider.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {provider.project_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {provider.articles_count}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={provider.transformed_count > 0 ? "default" : "secondary"}>
                              {provider.transformed_count}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {((provider.total_words || 0) / 1000).toFixed(1)}k
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No provider data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
