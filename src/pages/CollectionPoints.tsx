import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Pencil,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  Stethoscope,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import api, { type Provider, type Job } from "@/lib/api";
import { ProviderModal, type ProviderFormData } from "@/components/ProviderModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ArticleDiagnosticPanel, DiagnosticBadge } from "@/components/ArticleDiagnosticPanel";
import { Link, useParams } from "react-router-dom";

function JobStatusBadge({ job }: { job?: Job }) {
  if (!job) return null;

  switch (job.status) {
    case 'running':
      return (
        <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20 px-2">
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Running
        </Badge>
      );
    case 'paused':
      return (
        <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 px-2">
          <Pause className="h-3 w-3 mr-1" />
          Paused
        </Badge>
      );
    case 'completed':
      if (job.completionRate < 100) {
        return (
          <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 border-orange-500/30 px-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial ({job.completionRate}%)
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="bg-success/10 text-success border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Done
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="px-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground px-2">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground px-2">
          Pending
        </Badge>
      );
  }
}

function StatusBadge({ isActive, hasArticles }: { isActive: boolean; hasArticles: boolean }) {
  if (!isActive) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Disabled
      </Badge>
    );
  }

  if (hasArticles) {
    return (
      <Badge variant="secondary" className="bg-success/10 text-success border-0">
        Ready
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
      New
    </Badge>
  );
}

function CollectionPointRow({ point, activeJob, lastCompletedJob, onStart, onPause, onEdit, onDelete, onDiagnose, isStarting, isDiagnosing }: {
  point: Provider;
  activeJob?: Job;
  lastCompletedJob?: Job;
  onStart: (id: number) => void;
  onPause: (id: number) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onDiagnose: (provider: Provider) => void;
  isStarting: boolean;
  isDiagnosing: boolean;
}) {
  const hasActiveJob = !!activeJob && (activeJob.status === 'running' || activeJob.status === 'paused');
  const articleCount = parseInt(String(point.articles_count || '0'), 10);

  // Calculate success rate from last completed job
  const successRate = lastCompletedJob?.completionRate;

  // Determine which job to show status for
  const displayJob = activeJob || lastCompletedJob;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{point.name}</span>
          <span className="text-xs text-muted-foreground">
            {point.project_name || 'Default Project'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {displayJob ? (
          <JobStatusBadge job={displayJob} />
        ) : (
          <StatusBadge isActive={point.is_active} hasArticles={articleCount > 0} />
        )}
      </TableCell>
      <TableCell>
        {hasActiveJob && activeJob ? (
          <div className="w-40 space-y-1">
            <Progress value={activeJob.completionRate || 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {activeJob.current || 0} collected
              </span>
              {activeJob.total > 0 ? (
                <span>/ {activeJob.total} found</span>
              ) : (
                <span className="text-green-600">scanning...</span>
              )}
            </div>
          </div>
        ) : (
          <span className="font-medium">
            {articleCount.toLocaleString()} articles
          </span>
        )}
      </TableCell>
      <TableCell>
        {successRate !== undefined ? (
          <div className="flex items-center gap-1 text-sm">
            {successRate >= 90 ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : successRate >= 70 ? (
              <Clock className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span>{successRate}%</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {point.last_sync_at ? formatDistanceToNow(new Date(point.last_sync_at), { addSuffix: true }) : 'Never'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onStart(point.id)}
              disabled={isStarting || hasActiveJob}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Now
            </DropdownMenuItem>
            {hasActiveJob && (
              <DropdownMenuItem asChild>
                <Link to="/live-monitor">
                  <Activity className="h-4 w-4 mr-2" />
                  View in Monitor
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a
                href={Object.values(point.base_urls || {})[0] || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Source
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDiagnose(point)}>
              <Stethoscope className="h-4 w-4 mr-2" />
              Diagnose
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(point)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(point)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function CollectionPoints() {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [startingId, setStartingId] = useState<number | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [diagnosingProvider, setDiagnosingProvider] = useState<Provider | null>(null);
  const queryClient = useQueryClient();

  const parsedProjectId = projectId ? parseInt(projectId) : undefined;

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers', parsedProjectId],
    queryFn: () => api.getProviders(parsedProjectId),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 1000, // Faster refresh for better reactivity
  });

  // Map jobs to providers
  const getActiveJobForProvider = (providerId: number): Job | undefined => {
    return jobs.find(j =>
      j.providerId === providerId &&
      (j.status === 'running' || j.status === 'paused')
    );
  };

  // Get last completed job for provider (for success rate)
  const getLastCompletedJobForProvider = (providerId: number): Job | undefined => {
    return jobs.find(j =>
      j.providerId === providerId &&
      (j.status === 'completed' || j.status === 'failed')
    );
  };

  const startMutation = useMutation({
    mutationFn: async (id: number) => {
      const provider = providers.find(p => p.id === id);
      if (!provider) throw new Error('Provider not found');

      const url = Object.values(provider.base_urls || {})[0];
      if (!url) throw new Error('No base URL configured');

      return api.startScrape({
        providerId: id,
        language: 'fr',
        url: url
      });
    },
    onMutate: (id) => setStartingId(id),
    onSuccess: () => {
      toast.success('Collection started');
      queryClient.invalidateQueries({ queryKey: ['providers', parsedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('already running')) {
        toast.info('A collection is already running for this source');
      } else {
        toast.error(`Failed to start: ${error.message}`);
      }
    },
    onSettled: () => setStartingId(null),
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: number): Promise<{ success: boolean }> => {
      const job = getActiveJobForProvider(id);
      if (job) {
        await api.pauseJob(job.id);
        return { success: true };
      }
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Collection paused');
      queryClient.invalidateQueries({ queryKey: ['providers', parsedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to pause: ${error.message}`);
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: (data: ProviderFormData) => {
      return api.createProvider({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        base_urls: { fr: data.entryUrl || '' },
        project_id: parsedProjectId || 1,
      });
    },
    onSuccess: () => {
      toast.success('Collection point created');
      setProviderModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['providers', parsedProjectId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProviderFormData }) => {
      return api.updateProvider(id, {
        name: data.name,
        slug: data.slug,
        base_urls: { fr: data.entryUrl || '' },
      });
    },
    onSuccess: () => {
      toast.success('Collection point updated');
      setEditingProvider(null);
      queryClient.invalidateQueries({ queryKey: ['providers', parsedProjectId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (id: number) => api.deleteProvider(id),
    onSuccess: () => {
      toast.success('Collection point deleted');
      setDeletingProvider(null);
      queryClient.invalidateQueries({ queryKey: ['providers', parsedProjectId] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Cannot delete provider with articles')) {
        toast.error('Cannot delete: This source has articles. Delete them first from the Repository.');
      } else {
        toast.error(`Failed to delete: ${error.message}`);
      }
    },
  });

  const filteredPoints = providers.filter(point =>
    point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (point.project_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeJobsCount = jobs.filter(j => j.status === 'running').length;

  // Calculate stats from real job data
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'failed');
  const avgCompletionRate = completedJobs.length > 0
    ? (completedJobs.reduce((sum, j) => sum + j.completionRate, 0) / completedJobs.length).toFixed(0)
    : null;

  const stats = {
    total: providers.length,
    active: activeJobsCount,
    totalArticles: providers.reduce((sum, p) => sum + parseInt(String(p.articles_count || '0'), 10), 0),
    avgSuccessRate: avgCompletionRate,
  };

  const handleSubmitProvider = (data: ProviderFormData) => {
    if (editingProvider) {
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    } else {
      createProviderMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header - Only show full header if not in project context */}
      {!projectId && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Collection Points</h1>
            <p className="text-muted-foreground mt-1">
              Manage your content collection sources
            </p>
          </div>
          <div className="flex gap-2">
            {activeJobsCount > 0 && (
              <Link to="/live-monitor">
                <Button variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  {activeJobsCount} Running
                </Button>
              </Link>
            )}
            <Button onClick={() => setProviderModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Collection Point
            </Button>
          </div>
        </div>
      )}

      {/* Simplified header for project context */}
      {projectId && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {providers.length} collection point{providers.length !== 1 ? 's' : ''} configured
          </p>
          <Button onClick={() => setProviderModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Collection Point
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sources</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Activity className={`h-8 w-8 text-green-500 ${stats.active > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Articles</p>
              <p className="text-2xl font-bold">{stats.totalArticles.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-2xl font-bold">
                {stats.avgSuccessRate ? `${stats.avgSuccessRate}%` : '—'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.avgSuccessRate ? 'Based on recent jobs' : 'No completed jobs yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Collection Points</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPoints.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress / Articles</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPoints.map(point => (
                  <CollectionPointRow
                    key={point.id}
                    point={point}
                    activeJob={getActiveJobForProvider(point.id)}
                    lastCompletedJob={getLastCompletedJobForProvider(point.id)}
                    onStart={(id) => startMutation.mutate(id)}
                    onPause={(id) => pauseMutation.mutate(id)}
                    onEdit={(provider) => setEditingProvider(provider)}
                    onDelete={(provider) => setDeletingProvider(provider)}
                    onDiagnose={(provider) => setDiagnosingProvider(provider)}
                    isStarting={startingId === point.id}
                    isDiagnosing={diagnosingProvider?.id === point.id}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No collection points found</p>
              <Button className="mt-4" onClick={() => setProviderModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Collection Point
              </Button>
            </div>
          )}

          {/* Diagnostic Panel */}
          {diagnosingProvider && (
            <ArticleDiagnosticPanel
              providerId={diagnosingProvider.id}
              providerName={diagnosingProvider.name}
            />
          )}
        </CardContent>
      </Card>

      {/* Provider Modal (Add/Edit) */}
      <ProviderModal
        open={providerModalOpen || !!editingProvider}
        onOpenChange={(open) => {
          if (!open) {
            setProviderModalOpen(false);
            setEditingProvider(null);
          }
        }}
        provider={editingProvider}
        onSubmit={handleSubmitProvider}
        isLoading={createProviderMutation.isPending || updateProviderMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingProvider}
        onOpenChange={(open) => !open && setDeletingProvider(null)}
        title="Delete Collection Point"
        description={`Are you sure you want to delete "${deletingProvider?.name}"? This will not delete the articles already collected from this source.`}
        onConfirm={() => deletingProvider && deleteProviderMutation.mutate(deletingProvider.id)}
        isLoading={deleteProviderMutation.isPending}
      />
    </div>
  );
}
