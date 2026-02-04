import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCard, AnimatedCardContent } from "@/components/ui/animated-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedStatusBadge } from "@/components/ui/animated-badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useParams } from "react-router-dom";
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Loader2,
  MoreVertical,
  Eye,
  Archive,
  RotateCcw,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sparkles,
  Languages,
  Wand2,
  Bot,
  Zap,
  Timer,
  Activity,
  ShieldAlert,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import api, { type Job, type JobDiagnosis, type ArchivedJob, type JobLog, type Provider, type PipelineJob, type PipelineDiagnostics } from "@/lib/api";

function JobStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    running: { variant: "default", className: "bg-green-500" },
    paused: { variant: "secondary", className: "bg-yellow-500 text-yellow-900" },
    completed: { variant: "outline", className: "border-green-500 text-green-600" },
    failed: { variant: "destructive", className: "" },
    cancelled: { variant: "secondary", className: "" },
    pending: { variant: "outline", className: "" },
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant} className={config.className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function JobDiagnosisModal({ jobId, isOpen, onClose }: {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: diagnosis, isLoading } = useQuery({
    queryKey: ['job-diagnosis', jobId],
    queryFn: () => api.getJobDiagnosis(jobId),
    enabled: isOpen,
  });

  const { data: logs } = useQuery({
    queryKey: ['job-logs', jobId],
    queryFn: () => api.getJobLogs(jobId),
    enabled: isOpen,
  });

  const queryClient = useQueryClient();

  const restartMutation = useMutation({
    mutationFn: () => api.restartJob(jobId),
    onSuccess: () => {
      toast.success("Job restarted to retry failed URLs");
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Job Diagnosis
          </DialogTitle>
          <DialogDescription>
            Understand why the job didn't reach 100% completion
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : diagnosis ? (
          <div className="flex-1 overflow-auto space-y-4">
            {/* Completion Overview */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Completion Rate</span>
                <span className="text-2xl font-bold">{diagnosis.completionRate}%</span>
              </div>
              <Progress value={diagnosis.completionRate} className="h-3" />
            </div>

            {/* Error Summary */}
            {diagnosis.totalErrors > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Why the job stopped ({diagnosis.totalErrors} errors)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(diagnosis.errorsByType).map(([type, count]) => (
                    <div key={type} className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed URLs */}
            {diagnosis.failedUrls.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Failed URLs ({diagnosis.failedUrls.length})</h4>
                <ScrollArea className="h-40 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {diagnosis.failedUrls.slice(0, 20).map((item, i) => (
                      <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                        <p className="truncate font-mono text-xs">{item.url}</p>
                        <p className="text-destructive text-xs mt-1">{item.error}</p>
                        <p className="text-muted-foreground text-xs">Attempts: {item.attempts}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Recommendations */}
            {diagnosis.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Recommendations</h4>
                <ul className="space-y-2">
                  {diagnosis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent Logs */}
            {logs && logs.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Recent Logs</h4>
                <ScrollArea className="h-32 border rounded-lg">
                  <div className="p-2 space-y-1 font-mono text-xs">
                    {logs.slice(0, 20).map((log, i) => (
                      <div
                        key={i}
                        className={`p-1 rounded ${
                          log.level === 'error' ? 'bg-destructive/10 text-destructive' :
                          log.level === 'warning' ? 'bg-yellow-500/10 text-yellow-600' : ''
                        }`}
                      >
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {' '}{log.message}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No diagnosis data available
          </div>
        )}

        <DialogFooter className="gap-2">
          {diagnosis && diagnosis.failedUrls.length > 0 && (
            <Button
              onClick={() => restartMutation.mutate()}
              disabled={restartMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {restartMutation.isPending ? "Restarting..." : "Retry Failed URLs"}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JobsTable({ jobs, onDiagnose }: {
  jobs: Job[];
  onDiagnose: (jobId: number) => void;
}) {
  const queryClient = useQueryClient();
  const [pendingActions, setPendingActions] = useState<Record<number, string>>({});

  const setJobPending = (jobId: number, action: string) => {
    setPendingActions(prev => ({ ...prev, [jobId]: action }));
  };

  const clearJobPending = (jobId: number) => {
    setPendingActions(prev => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  };

  const pauseMutation = useMutation({
    mutationFn: api.pauseJob,
    onMutate: async (jobId) => {
      setJobPending(jobId, 'pause');
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      // Snapshot previous value
      const previousJobs = queryClient.getQueryData(['jobs']);
      // Optimistically update
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.id === jobId ? { ...j, status: 'paused' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success("Job paused"),
    onError: (error: Error, jobId, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: (_, __, jobId) => {
      clearJobPending(jobId);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: api.resumeJob,
    onMutate: async (jobId) => {
      setJobPending(jobId, 'resume');
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.id === jobId ? { ...j, status: 'running' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success("Job resumed"),
    onError: (error: Error, jobId, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: (_, __, jobId) => {
      clearJobPending(jobId);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: api.cancelJob,
    onMutate: async (jobId) => {
      setJobPending(jobId, 'cancel');
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.id === jobId ? { ...j, status: 'cancelled' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success("Job cancelled"),
    onError: (error: Error, jobId, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: (_, __, jobId) => {
      clearJobPending(jobId);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: api.archiveJob,
    onMutate: async (jobId) => {
      setJobPending(jobId, 'archive');
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      // Remove from active jobs list optimistically
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.filter(j => j.id !== jobId)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success("Job archived"),
    onError: (error: Error, jobId, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: (_, __, jobId) => {
      clearJobPending(jobId);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['archived-jobs'] });
    },
  });

  const restartMutation = useMutation({
    mutationFn: api.restartJob,
    onMutate: async (jobId) => {
      setJobPending(jobId, 'restart');
    },
    onSuccess: () => toast.success("Job restarted"),
    onError: (error: Error) => toast.error(error.message),
    onSettled: (_, __, jobId) => {
      clearJobPending(jobId);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const isJobPending = (jobId: number) => !!pendingActions[jobId];
  const getJobAction = (jobId: number) => pendingActions[jobId];

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left py-3 px-4 font-medium">Provider</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium w-64">Progress</th>
            <th className="text-right py-3 px-4 font-medium">Speed</th>
            <th className="text-right py-3 px-4 font-medium">Started</th>
            <th className="text-right py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id} className="border-t hover:bg-muted/30">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    job.status === 'running' ? 'bg-green-500 animate-pulse' :
                    job.status === 'paused' ? 'bg-yellow-500' :
                    job.status === 'completed' ? 'bg-green-500' :
                    job.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <span className="font-medium">{job.providerName}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="py-3 px-4">
                <div className="space-y-1">
                  <Progress value={job.completionRate} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{job.current}/{job.total}</span>
                    <span>{job.completionRate}%</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1 text-sm">
                  <TrendingUp className="h-3 w-3" />
                  {job.speed}/min
                </div>
              </td>
              <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                {job.startedAt ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true }) : '-'}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {job.status === 'running' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => pauseMutation.mutate(job.id)}
                      disabled={isJobPending(job.id)}
                      title="Pause"
                    >
                      {getJobAction(job.id) === 'pause' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {job.status === 'paused' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resumeMutation.mutate(job.id)}
                      disabled={isJobPending(job.id)}
                      title="Resume"
                    >
                      {getJobAction(job.id) === 'resume' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {/* Quick Cancel button for running/paused jobs */}
                  {(job.status === 'running' || job.status === 'paused') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelMutation.mutate(job.id)}
                      disabled={isJobPending(job.id)}
                      title="Cancel"
                      className="text-destructive hover:text-destructive"
                    >
                      {getJobAction(job.id) === 'cancel' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isJobPending(job.id)}>
                        {isJobPending(job.id) && !['pause', 'resume', 'cancel'].includes(getJobAction(job.id) || '') ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDiagnose(job.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Diagnose
                      </DropdownMenuItem>
                      {job.canRestart && (
                        <DropdownMenuItem
                          onClick={() => restartMutation.mutate(job.id)}
                          disabled={isJobPending(job.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restart (retry failed)
                        </DropdownMenuItem>
                      )}
                      {job.canArchive && (
                        <DropdownMenuItem
                          onClick={() => archiveMutation.mutate(job.id)}
                          disabled={isJobPending(job.id)}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {(job.status === 'running' || job.status === 'paused') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => cancelMutation.mutate(job.id)}
                            disabled={isJobPending(job.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Job
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const durationMs = end - start;

  if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`;
  } else if (durationMs < 3600000) {
    const mins = Math.floor(durationMs / 60000);
    const secs = Math.round((durationMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(durationMs / 3600000);
    const mins = Math.round((durationMs % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  }
}

function ArchivedJobCard({ job }: { job: ArchivedJob }) {
  const duration = job.started_at && job.completed_at
    ? formatDuration(job.started_at, job.completed_at)
    : '-';

  const successRate = job.articles_found > 0
    ? Math.round((job.articles_processed / job.articles_found) * 100)
    : 0;

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            job.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
            job.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
            'bg-muted'
          }`}>
            {job.status === 'completed' ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : job.status === 'failed' ? (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <Archive className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <h4 className="font-medium">{job.provider_name}</h4>
            <p className="text-xs text-muted-foreground">
              {new Date(job.started_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="text-center p-2 bg-muted/50 rounded">
          <p className="text-lg font-semibold">{job.articles_found}</p>
          <p className="text-xs text-muted-foreground">Collected</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded">
          <p className="text-lg font-semibold">{job.articles_processed}</p>
          <p className="text-xs text-muted-foreground">Processed</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded">
          <p className={`text-lg font-semibold ${
            job.completion_rate >= 90 ? 'text-green-600' :
            job.completion_rate >= 50 ? 'text-yellow-600' :
            'text-red-600'
          }`}>{job.completion_rate}%</p>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded">
          <p className="text-lg font-semibold">{duration}</p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <Progress value={job.completion_rate} className="h-2" />
      </div>

      {/* Failure Reason */}
      {job.failure_reason && (
        <div className="p-2 bg-destructive/10 rounded text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{job.failure_reason}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
        <span>Archived {formatDistanceToNow(new Date(job.archived_at), { addSuffix: true })}</span>
        {job.estimated_total > 0 && (
          <span>{job.articles_found} / {job.estimated_total} URLs</span>
        )}
      </div>
    </div>
  );
}

function ArchivedJobsSection() {
  const { data: archivedJobs, isLoading } = useQuery({
    queryKey: ['archived-jobs'],
    queryFn: api.getArchivedJobs,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!archivedJobs || archivedJobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No archived jobs</h3>
        <p className="text-sm text-muted-foreground">
          Completed jobs will appear here when archived
        </p>
      </div>
    );
  }

  // Stats summary
  const totalJobs = archivedJobs.length;
  const successfulJobs = archivedJobs.filter(j => j.status === 'completed').length;
  const totalArticles = archivedJobs.reduce((sum, j) => sum + j.articles_found, 0);
  const avgCompletion = Math.round(
    archivedJobs.reduce((sum, j) => sum + j.completion_rate, 0) / totalJobs
  );

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold">{totalJobs}</p>
          <p className="text-xs text-muted-foreground">Total Jobs</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{successfulJobs}</p>
          <p className="text-xs text-muted-foreground">Successful</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold">{totalArticles.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Articles Collected</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className={`text-2xl font-bold ${
            avgCompletion >= 90 ? 'text-green-600' :
            avgCompletion >= 50 ? 'text-yellow-600' :
            'text-red-600'
          }`}>{avgCompletion}%</p>
          <p className="text-xs text-muted-foreground">Avg. Completion</p>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {archivedJobs.map(job => (
          <ArchivedJobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function PipelineDiagnosticsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ['pipeline-diagnostics'],
    queryFn: api.getPipelineDiagnostics,
    refetchInterval: 3000,
    enabled: isExpanded,
  });

  const pauseMutation = useMutation({
    mutationFn: api.pausePipeline,
    onSuccess: () => {
      toast.success('Pipeline paused');
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resumeMutation = useMutation({
    mutationFn: api.resumePipeline,
    onSuccess: () => {
      toast.success('Pipeline resumed');
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelMutation = useMutation({
    mutationFn: api.cancelPipeline,
    onSuccess: () => {
      toast.success('Pipeline cancelled');
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const retryMutation = useMutation({
    mutationFn: api.retryFailedPipeline,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-diagnostics'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clearMutation = useMutation({
    mutationFn: api.clearPipeline,
    onSuccess: () => {
      toast.success('Pipeline cleared');
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-diagnostics'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const transformPendingMutation = useMutation({
    mutationFn: () => api.transformPending(20),
    onSuccess: (result) => {
      toast.success(`Started transformation of ${result.count} articles`);
      queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-diagnostics'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Query for pending articles count
  const { data: transformProgress } = useQuery({
    queryKey: ['transform-progress'],
    queryFn: api.getTransformProgress,
    refetchInterval: 5000,
    enabled: isExpanded,
  });

  const isPaused = diagnostics?.transform.paused || diagnostics?.translate.paused;
  const isRunning = diagnostics?.transform.status === 'running' || diagnostics?.translate.status === 'running';
  const totalErrors = (diagnostics?.transform.errors || 0) + (diagnostics?.translate.errors || 0);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-purple-500" />
          <div>
            <h3 className="font-medium">Pipeline Controls & Diagnostics</h3>
            <p className="text-xs text-muted-foreground">
              Monitor performance, errors, and control the AI pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {diagnostics?.isRateLimited && (
            <Badge variant="destructive" className="gap-1">
              <ShieldAlert className="h-3 w-3" />
              Rate Limited
            </Badge>
          )}
          {totalErrors > 0 && (
            <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {totalErrors} errors
            </Badge>
          )}
          {diagnostics?.speed ? (
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {diagnostics.speed}/min
            </Badge>
          ) : null}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : diagnostics ? (
            <>
              {/* Control Buttons */}
              <div className="flex flex-wrap gap-2">
                {isRunning && !isPaused && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                  >
                    {pauseMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    Pause Pipeline
                  </Button>
                )}
                {isPaused && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeMutation.mutate()}
                    disabled={resumeMutation.isPending}
                  >
                    {resumeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Resume Pipeline
                  </Button>
                )}
                {isRunning && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Cancel
                  </Button>
                )}
                {diagnostics.failedArticleCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryMutation.mutate()}
                    disabled={retryMutation.isPending}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    {retryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Retry {diagnostics.failedArticleCount} Failed
                  </Button>
                )}
                {!isRunning && (diagnostics.transform.status !== 'idle' || diagnostics.translate.status !== 'idle') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearMutation.mutate()}
                    disabled={clearMutation.isPending}
                  >
                    {clearMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Clear History
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => transformPendingMutation.mutate()}
                  disabled={transformPendingMutation.isPending || (transformProgress?.status === 'running')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {transformPendingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Transform Pending Articles
                </Button>
              </div>

              {/* Transform Progress */}
              {transformProgress && transformProgress.status === 'running' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Transforming Articles
                    </span>
                    <span className="text-sm text-purple-600 dark:text-purple-400">
                      {transformProgress.current} / {transformProgress.total}
                    </span>
                  </div>
                  <Progress
                    value={(transformProgress.current / transformProgress.total) * 100}
                    className="h-2 bg-purple-200 dark:bg-purple-900"
                  />
                  {transformProgress.errors > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      {transformProgress.errors} errors (rate limited - will retry)
                    </p>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Speed</span>
                  </div>
                  <p className="text-xl font-bold">{diagnostics.speed || 0}</p>
                  <p className="text-xs text-muted-foreground">articles/min</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Timer className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">ETA</span>
                  </div>
                  <p className="text-xl font-bold">
                    {diagnostics.etaMinutes ? (
                      diagnostics.etaMinutes < 60
                        ? `${diagnostics.etaMinutes}m`
                        : `${Math.floor(diagnostics.etaMinutes / 60)}h ${diagnostics.etaMinutes % 60}m`
                    ) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Errors</span>
                  </div>
                  <p className={`text-xl font-bold ${totalErrors > 0 ? 'text-red-600' : ''}`}>
                    {totalErrors}
                  </p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Failed</span>
                  </div>
                  <p className={`text-xl font-bold ${diagnostics.failedArticleCount > 0 ? 'text-orange-600' : ''}`}>
                    {diagnostics.failedArticleCount}
                  </p>
                  <p className="text-xs text-muted-foreground">articles</p>
                </div>
              </div>

              {/* Error Breakdown */}
              {Object.keys(diagnostics.errorsByType).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Error Breakdown
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(diagnostics.errorsByType).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={`${
                          type === 'rate_limit' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {type === 'rate_limit' && <ShieldAlert className="h-3 w-3 mr-1" />}
                        {type.replace('_', ' ')}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Rate Limit Warning */}
              {diagnostics.isRateLimited && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-500">Rate Limited</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        The OVH AI API is rate limiting requests. The pipeline will automatically retry with exponential backoff.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Errors */}
              {diagnostics.recentErrors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Errors</h4>
                  <ScrollArea className="h-32 border rounded-lg">
                    <div className="p-2 space-y-1 font-mono text-xs">
                      {diagnostics.recentErrors.map((error, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded ${
                            error.type === 'rate_limit' ? 'bg-yellow-500/10' : 'bg-destructive/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {error.type}
                            </Badge>
                          </div>
                          <p className={error.type === 'rate_limit' ? 'text-yellow-600' : 'text-destructive'}>
                            {error.message}
                          </p>
                          {error.articleId && (
                            <p className="text-muted-foreground">Article #{error.articleId}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Last Error */}
              {diagnostics.transform.lastError && (
                <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                  <p className="text-sm font-medium text-destructive">Last Transform Error</p>
                  <p className="text-xs text-muted-foreground mt-1">{diagnostics.transform.lastError}</p>
                  {diagnostics.transform.lastErrorAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(diagnostics.transform.lastErrorAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">No diagnostic data available</p>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineJobCard({ job }: { job: PipelineJob }) {
  const isScoring = job.phase === 'scoring';
  const isTransforming = job.phase === 'transform';
  const isTranslating = job.phase === 'translate';

  // Calculate progress for each phase
  const scoringProgress = job.totalArticles > 0
    ? Math.round((job.scoredCount || 0) / job.totalArticles * 100)
    : 0;
  const transformProgress = job.totalArticles > 0
    ? Math.round((job.transformedCount / job.totalArticles) * 100)
    : 0;
  const translateProgress = job.totalTranslations > 0
    ? Math.round((job.translatedCount / job.totalTranslations) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${job.status === 'running' ? 'bg-gradient-to-r from-purple-500 via-yellow-500 via-blue-500 to-purple-500 animate-pulse' : job.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${job.status === 'running' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-muted'}`}>
              <Bot className={`h-5 w-5 ${job.status === 'running' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-medium">{job.providerName || `Provider #${job.providerId}`}</h3>
              <p className="text-sm text-muted-foreground">
                {job.totalArticles} article{job.totalArticles !== 1 ? 's' : ''} to process
              </p>
            </div>
          </div>
          <Badge
            variant={job.status === 'running' ? 'default' : job.status === 'completed' ? 'outline' : 'destructive'}
            className={job.status === 'running' ? 'bg-purple-500' : job.status === 'completed' ? 'border-green-500 text-green-600' : ''}
          >
            {job.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>

        {/* Scoring Phase */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${isScoring && job.status === 'running' ? 'text-purple-500' : 'text-muted-foreground'}`} />
              <span className={isScoring && job.status === 'running' ? 'font-medium' : ''}>
                Relevance Scoring
              </span>
              {isScoring && job.status === 'running' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </div>
            <span className="text-muted-foreground">
              {job.scoredCount || 0}/{job.totalArticles}
            </span>
          </div>
          <Progress
            value={scoringProgress}
            className="h-2"
          />
        </div>

        {/* Transform Phase */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wand2 className={`h-4 w-4 ${isTransforming && job.status === 'running' ? 'text-purple-500' : 'text-muted-foreground'}`} />
              <span className={isTransforming && job.status === 'running' ? 'font-medium' : ''}>
                Transformation
              </span>
              {isTransforming && job.status === 'running' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </div>
            <span className="text-muted-foreground">
              {job.transformedCount}/{job.totalArticles}
            </span>
          </div>
          <Progress
            value={transformProgress}
            className="h-2"
          />
        </div>

        {/* Translate Phase */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Languages className={`h-4 w-4 ${!isTransforming && job.status === 'running' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <span className={!isTransforming && job.status === 'running' ? 'font-medium' : ''}>
                Translation (8 languages)
              </span>
              {!isTransforming && job.status === 'running' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </div>
            <span className="text-muted-foreground">
              {job.translatedCount}/{job.totalTranslations}
            </span>
          </div>
          <Progress
            value={translateProgress}
            className="h-2"
          />
        </div>

        {/* Errors */}
        {job.errors > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{job.errors} error{job.errors !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Timing */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Started {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}</span>
          {job.completedAt && (
            <span>Completed {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineJobsSection({ projectId }: { projectId?: number }) {
  const { data: providers = [] } = useQuery({
    queryKey: ['providers', projectId],
    queryFn: () => api.getProviders(projectId),
    enabled: !!projectId,
  });

  // Also fetch all providers if no projectId for name mapping
  const { data: allProviders = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.getProviders(),
    enabled: !projectId,
  });

  const activeProviders = projectId ? providers : allProviders;
  const providerIds = new Set(providers.map(p => p.id));
  const providerNameMap = new Map(activeProviders.map(p => [p.id, p.name]));

  const { data: pipelineJobs, isLoading } = useQuery({
    queryKey: ['pipeline-jobs'],
    queryFn: api.getPipelineJobs,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Enrich with provider names and filter by project if projectId is set
  const enrichedJobs = pipelineJobs?.map(j => ({
    ...j,
    providerName: j.providerName || providerNameMap.get(j.providerId) || `Provider #${j.providerId}`,
  }));

  const jobs = projectId && enrichedJobs
    ? enrichedJobs.filter(j => providerIds.has(j.providerId))
    : enrichedJobs;

  const runningJobs = jobs?.filter(j => j.status === 'running') || [];
  const completedJobs = jobs?.filter(j => j.status === 'completed' || j.status === 'failed') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No AI processing jobs</h3>
        <p className="text-sm text-muted-foreground">
          When articles are collected, they are automatically transformed and translated.
          <br />
          Active processing jobs will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Diagnostics Panel */}
      <PipelineDiagnosticsPanel />

      {/* Running Jobs */}
      {runningJobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            Processing ({runningJobs.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {runningJobs.map(job => (
              <PipelineJobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Recently Completed ({completedJobs.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {completedJobs.slice(0, 4).map(job => (
              <PipelineJobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveMonitor() {
  const { id: projectId } = useParams<{ id: string }>();
  const [diagnosingJobId, setDiagnosingJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const parsedProjectId = projectId ? parseInt(projectId) : undefined;

  // Fetch providers to filter jobs by project
  const { data: providers = [] } = useQuery({
    queryKey: ['providers', parsedProjectId],
    queryFn: () => api.getProviders(parsedProjectId),
  });

  const providerIds = new Set(providers.map(p => p.id));

  const { data: allJobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 1000, // Faster refresh for better reactivity
    staleTime: 500, // Data is considered stale after 500ms
  });

  // Create a map of provider IDs to names
  const providerNameMap = new Map(providers.map(p => [p.id, p.name]));

  // Enrich jobs with provider names and filter by project
  const enrichedJobs = allJobs?.map(j => ({
    ...j,
    providerName: j.providerName || providerNameMap.get(j.providerId) || `Provider #${j.providerId}`,
  }));

  // Filter jobs by project providers
  const jobs = parsedProjectId
    ? enrichedJobs?.filter(j => providerIds.has(j.providerId))
    : enrichedJobs;

  const [isPausingAll, setIsPausingAll] = useState(false);
  const [isCancellingAll, setIsCancellingAll] = useState(false);

  const pauseAllMutation = useMutation({
    mutationFn: async () => {
      setIsPausingAll(true);
      const runningJobs = jobs?.filter(j => j.status === 'running') || [];
      await Promise.all(runningJobs.map(j => api.pauseJob(j.id)));
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.status === 'running' ? { ...j, status: 'paused' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success('All jobs paused'),
    onError: (error: Error, _, context) => {
      toast.error(error.message || 'Failed to pause jobs');
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      setIsPausingAll(false);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const cancelAllMutation = useMutation({
    mutationFn: async () => {
      setIsCancellingAll(true);
      const activeJobs = jobs?.filter(j => ['running', 'paused'].includes(j.status)) || [];
      await Promise.all(activeJobs.map(j => api.cancelJob(j.id)));
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => ['running', 'paused'].includes(j.status) ? { ...j, status: 'cancelled' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success('All jobs cancelled'),
    onError: (error: Error, _, context) => {
      toast.error(error.message || 'Failed to cancel jobs');
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      setIsCancellingAll(false);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const runningJobs = jobs?.filter(j => j.status === 'running') || [];
  const activeJobs = jobs?.filter(j => j.status === 'running' || j.status === 'paused') || [];
  const finishedJobs = jobs?.filter(j => ['completed', 'failed', 'cancelled'].includes(j.status)) || [];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!projectId ? (
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Monitor</h1>
            <p className="text-muted-foreground mt-1">
              {runningJobs.length} active job(s) running
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {runningJobs.length} active job{runningJobs.length !== 1 ? 's' : ''} running
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => pauseAllMutation.mutate()}
            disabled={runningJobs.length === 0 || isPausingAll}
          >
            {isPausingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Pause className="h-4 w-4 mr-2" />
            )}
            {isPausingAll ? 'Pausing...' : 'Pause All'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => cancelAllMutation.mutate()}
            disabled={activeJobs.length === 0 || isCancellingAll}
          >
            {isCancellingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {isCancellingAll ? 'Stopping...' : 'Stop All'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnimatedCard hoverEffect="lift" delay={0}>
          <AnimatedCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <AnimatedNumber value={runningJobs.length} className="text-2xl font-bold" />
              </div>
              <motion.div
                animate={{ rotate: runningJobs.length > 0 ? 360 : 0 }}
                transition={{ duration: 2, repeat: runningJobs.length > 0 ? Infinity : 0, ease: "linear" }}
              >
                <RefreshCw className="h-8 w-8 text-green-500" />
              </motion.div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard hoverEffect="lift" delay={0.1}>
          <AnimatedCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <AnimatedNumber value={jobs?.filter(j => j.status === 'paused').length || 0} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Pause className="h-8 w-8 text-yellow-500" />
              </motion.div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard hoverEffect="lift" delay={0.2}>
          <AnimatedCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <AnimatedNumber value={jobs?.filter(j => j.status === 'completed').length || 0} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </motion.div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard hoverEffect="lift" delay={0.3}>
          <AnimatedCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <AnimatedNumber value={jobs?.filter(j => j.status === 'failed').length || 0} className="text-2xl font-bold" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <AlertCircle className="h-8 w-8 text-red-500" />
              </motion.div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Jobs ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="ai-processing" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Processing
          </TabsTrigger>
          <TabsTrigger value="finished">
            Finished ({finishedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeJobs.length > 0 ? (
            <JobsTable jobs={activeJobs} onDiagnose={setDiagnosingJobId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Jobs</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Start a collection job from the Collection Points page to see real-time progress here.
                </p>
                <Button asChild>
                  <Link to={projectId ? `/projects/${projectId}/collection-points` : "/collection-points"}>Start New Collection</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-processing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Processing Pipeline
              </CardTitle>
              <CardDescription>
                Relevance scoring, transformation and translation of collected articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineJobsSection projectId={parsedProjectId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finished">
          {finishedJobs.length > 0 ? (
            <JobsTable jobs={finishedJobs} onDiagnose={setDiagnosingJobId} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No finished jobs</h3>
                <p className="text-sm text-muted-foreground">
                  Completed, failed, or cancelled jobs will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Jobs</CardTitle>
              <CardDescription>
                Historical record of completed collection jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArchivedJobsSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diagnosis Modal */}
      {diagnosingJobId && (
        <JobDiagnosisModal
          jobId={diagnosingJobId}
          isOpen={true}
          onClose={() => setDiagnosingJobId(null)}
        />
      )}
    </div>
  );
}
