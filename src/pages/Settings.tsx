import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Database,
  Cpu,
  Globe,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const TARGET_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
];

function ServiceStatus({ name, status, icon: Icon }: { name: string; status: string; icon: React.ElementType }) {
  const isConnected = status === "connected" || status === "configured";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isConnected ? "bg-success/10" : "bg-destructive/10"}`}>
          <Icon className={`h-4 w-4 ${isConnected ? "text-success" : "text-destructive"}`} />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground capitalize">{status}</p>
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
  const queryClient = useQueryClient();

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const { data: transformStatus } = useQuery({
    queryKey: ["transformStatus"],
    queryFn: api.getTransformStatus,
    refetchInterval: 5000,
  });

  const { data: translateStatus } = useQuery({
    queryKey: ["translateStatus"],
    queryFn: api.getTranslateStatus,
    refetchInterval: 5000,
  });

  const toggleAutoTransformMutation = useMutation({
    mutationFn: api.toggleAutoTransform,
    onSuccess: () => {
      toast.success("Auto-transform setting updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["transformStatus"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleAutoTranslateMutation = useMutation({
    mutationFn: api.toggleAutoTranslate,
    onSuccess: () => {
      toast.success("Auto-translate setting updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["translateStatus"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (settingsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure Hot Stinger platform settings
        </p>
      </div>

      <Tabs defaultValue="automation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-4">
          {/* Transformation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Transformation Settings</CardTitle>
              <CardDescription>
                Configure AI-powered content transformation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-transform new articles</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically transform articles after collection
                  </p>
                </div>
                <Switch
                  checked={settings?.autoTransform?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    toggleAutoTransformMutation.mutate(checked)
                  }
                  disabled={toggleAutoTransformMutation.isPending}
                />
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  When enabled, new articles will be automatically queued for AI transformation using OVHcloud's DeepSeek model.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Translation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>
                Configure automatic translation behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-translate after transform</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically translate articles after transformation
                  </p>
                </div>
                <Switch
                  checked={settings?.autoTranslate?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    toggleAutoTranslateMutation.mutate(checked)
                  }
                  disabled={toggleAutoTranslateMutation.isPending}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Target Languages</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Languages configured for automatic translation
                </p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_LANGUAGES.map((lang) => {
                    const isSelected = settings?.autoTranslate?.targetLanguages?.includes(lang.code);
                    return (
                      <Badge
                        key={lang.code}
                        variant={isSelected ? "default" : "outline"}
                      >
                        {lang.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues" className="space-y-4">
          {/* Transform Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Transform Queue
              </CardTitle>
              <CardDescription>
                AI transformation processing queue status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{transformStatus?.pending || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{transformStatus?.processing || 0}</p>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{transformStatus?.completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={transformStatus?.enabled ? "default" : "secondary"}>
                  {transformStatus?.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Translate Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Translation Queue
              </CardTitle>
              <CardDescription>
                Multi-language translation processing queue status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{translateStatus?.pending || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{translateStatus?.processing || 0}</p>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{translateStatus?.completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={translateStatus?.enabled ? "default" : "secondary"}>
                  {translateStatus?.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          {/* System Health */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Connection status for all services
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
            <CardContent className="grid gap-3">
              <ServiceStatus
                name="PostgreSQL Database"
                status={health?.services?.postgresql || "disconnected"}
                icon={Database}
              />
              <ServiceStatus
                name="Redis Cache"
                status={health?.services?.redis || "disconnected"}
                icon={Zap}
              />
              <ServiceStatus
                name="Firecrawl (Web Scraping)"
                status={health?.services?.firecrawl || "disconnected"}
                icon={Globe}
              />
              <ServiceStatus
                name="OVHcloud AI Endpoints"
                status={health?.services?.ovhAi || "disconnected"}
                icon={Cpu}
              />
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                External service endpoints (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>OVHcloud AI Endpoint</Label>
                <Input
                  value={settings?.ovhAi?.endpoint || ""}
                  readOnly
                  className="bg-muted font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Model: {settings?.ovhAi?.model || "DeepSeek-R1-Distill-Llama-70B"}</p>
              </div>
              <div className="space-y-2">
                <Label>Firecrawl URL</Label>
                <Input
                  value={settings?.firecrawl?.url || ""}
                  readOnly
                  className="bg-muted font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application</span>
                <span className="font-medium">{health?.app || "Hot Stinger"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">{health?.version || "2.0.0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={health?.status === "ok" ? "default" : "destructive"}>
                  {health?.status || "unknown"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
