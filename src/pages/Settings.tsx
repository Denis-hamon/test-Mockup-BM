import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Database,
  Zap,
  Server,
  Activity,
} from "lucide-react";
import api from "@/lib/api";

function ServiceStatus({ name, status, icon: Icon }: { name: string; status: string; icon: React.ElementType }) {
  const isConnected = status === "connected" || status === "ok";

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isConnected ? "bg-success/10" : "bg-destructive/10"}`}>
          <Icon className={`h-5 w-5 ${isConnected ? "text-success" : "text-destructive"}`} />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground capitalize">{status}</p>
        </div>
      </div>
      {isConnected ? (
        <CheckCircle className="h-5 w-5 text-success" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
    </div>
  );
}

export default function Settings() {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
  });

  const { data: overview } = useQuery({
    queryKey: ["reporting-overview"],
    queryFn: api.getReportingOverview,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          System configuration and health monitoring
        </p>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {/* System Health */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Status</CardTitle>
                  <CardDescription>
                    Connection status for all backend services
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHealth()}
                  disabled={healthLoading}
                >
                  {healthLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ServiceStatus
                    name="PostgreSQL Database"
                    status={health?.database?.postgresql || "disconnected"}
                    icon={Database}
                  />
                  <ServiceStatus
                    name="Redis Cache"
                    status={health?.database?.redis || "disconnected"}
                    icon={Zap}
                  />
                  <ServiceStatus
                    name="API Server"
                    status={health?.status || "unknown"}
                    icon={Server}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Current system status summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{health?.status === "ok" ? "Online" : "Offline"}</p>
                  <p className="text-sm text-muted-foreground">API Status</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Database className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{health?.database?.postgresql === "connected" ? "OK" : "Error"}</p>
                  <p className="text-sm text-muted-foreground">Database</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{health?.database?.redis === "connected" ? "OK" : "Error"}</p>
                  <p className="text-sm text-muted-foreground">Cache</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Server className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{health?.version || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Content Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Content Statistics</CardTitle>
              <CardDescription>Overview of collected and processed content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Articles</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{stats?.collected || 0}</p>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{stats?.transformed || 0}</p>
                  <p className="text-sm text-muted-foreground">Transformed</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{((stats?.totalWords || 0) / 1000).toFixed(1)}k</p>
                  <p className="text-sm text-muted-foreground">Total Words</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reporting Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>Projects, providers and success metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{overview?.totalProjects || 0}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{overview?.totalProviders || 0}</p>
                  <p className="text-sm text-muted-foreground">Providers</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{overview?.totalArticles || 0}</p>
                  <p className="text-sm text-muted-foreground">Articles</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{overview?.articlesThisWeek || 0}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{overview?.successRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By Language */}
          {stats?.byLanguage && stats.byLanguage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Articles by Language</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.byLanguage.map((lang) => (
                    <div key={lang.language} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{lang.language.toUpperCase()}</Badge>
                        <span className="font-medium">{lang.count} articles</span>
                      </div>
                      <span className="text-muted-foreground">
                        {((lang.words || 0) / 1000).toFixed(1)}k words
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
              <CardDescription>About this installation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Application</span>
                  <span className="font-medium">Content Pipeline OVHcloud</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">{health?.version || "2.0.0"}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">API Status</span>
                  <Badge variant={health?.status === "ok" ? "default" : "destructive"}>
                    {health?.status || "unknown"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Last Check</span>
                  <span className="font-medium">
                    {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
              <CardDescription>Powered by</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="font-medium">React 19</p>
                  <p className="text-xs text-muted-foreground">Frontend</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="font-medium">Express.js</p>
                  <p className="text-xs text-muted-foreground">API Server</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="font-medium">PostgreSQL</p>
                  <p className="text-xs text-muted-foreground">Database</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="font-medium">Redis</p>
                  <p className="text-xs text-muted-foreground">Cache</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
