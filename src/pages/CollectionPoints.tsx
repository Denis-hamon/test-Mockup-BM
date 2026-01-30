import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import api, { type Provider } from "@/lib/api";
import { ProviderModal, type ProviderFormData } from "@/components/ProviderModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

function StatusBadge({ status }: { status: Provider['status'] }) {
  const config = {
    active: { label: 'Active', className: 'bg-success/10 text-success border-0' },
    paused: { label: 'Paused', className: 'bg-muted text-muted-foreground' },
    scheduled: { label: 'Scheduled', className: 'bg-primary/10 text-primary border-0' },
  };

  const { label, className } = config[status] || config.active;

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}

function CollectionPointRow({ point, onStart, onPause, onEdit, onDelete, isStarting }: {
  point: Provider;
  onStart: (id: number) => void;
  onPause: (id: number) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  isStarting: boolean;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{point.name}</span>
          <span className="text-xs text-muted-foreground">{point.domain}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={point.status} />
      </TableCell>
      <TableCell className="text-right font-medium">
        {point.articlesCollected.toLocaleString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          {point.successRate >= 98 ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : point.successRate >= 95 ? (
            <Clock className="h-4 w-4 text-warning" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span>{point.successRate}%</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {point.lastRun ? formatDistanceToNow(new Date(point.lastRun), { addSuffix: true }) : 'Never'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {point.nextRun ? format(new Date(point.nextRun), 'MMM d, h:mm a') : '—'}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {point.schedule}
        </Badge>
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
              disabled={isStarting || point.activeJobs > 0}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPause(point.id)}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={point.targetUrl || point.entryUrl || Object.values(point.baseUrls)[0]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Source
              </a>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [startingId, setStartingId] = useState<number | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: api.getProviders,
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => api.startProvider(id),
    onMutate: (id) => setStartingId(id),
    onSuccess: () => {
      toast.success('Collection started');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to start: ${error.message}`);
    },
    onSettled: () => setStartingId(null),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: number) => api.pauseProvider(id),
    onSuccess: () => {
      toast.success('Collection paused');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to pause: ${error.message}`);
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: (data: ProviderFormData) => {
      const payload = {
        ...data,
        urlPatterns: data.urlPatterns.split('\n').filter(Boolean),
        excludePatterns: data.excludePatterns.split('\n').filter(Boolean),
      };
      return api.createProvider(payload);
    },
    onSuccess: () => {
      toast.success('Collection point created');
      setProviderModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProviderFormData }) => {
      const payload = {
        ...data,
        urlPatterns: data.urlPatterns.split('\n').filter(Boolean),
        excludePatterns: data.excludePatterns.split('\n').filter(Boolean),
      };
      return api.updateProvider(id, payload);
    },
    onSuccess: () => {
      toast.success('Collection point updated');
      setEditingProvider(null);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
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
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const filteredPoints = providers.filter(point =>
    point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.status === 'active').length,
    totalArticles: providers.reduce((sum, p) => sum + p.articlesCollected, 0),
    avgSuccessRate: providers.length > 0
      ? (providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length).toFixed(1)
      : '0',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collection Points</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content collection sources
          </p>
        </div>
        <Button onClick={() => setProviderModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Collection Point
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sources</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{stats.active}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.active} active sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Articles Collected</p>
              <p className="text-2xl font-bold">{stats.totalArticles.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-2xl font-bold">{stats.avgSuccessRate}%</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Articles</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPoints.map(point => (
                  <CollectionPointRow
                    key={point.id}
                    point={point}
                    onStart={(id) => startMutation.mutate(id)}
                    onPause={(id) => pauseMutation.mutate(id)}
                    onEdit={(provider) => setEditingProvider(provider)}
                    onDelete={(provider) => setDeletingProvider(provider)}
                    isStarting={startingId === point.id}
                  />
                ))}
              </TableBody>
            </Table>
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
