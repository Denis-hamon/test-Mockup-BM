import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import api, { type Job } from "@/lib/api";

function JobMonitorCard({ job, isSelected, onSelect }: {
  job: Job;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const progress = job.estimatedTotal > 0
    ? Math.round((job.articlesProcessed / job.estimatedTotal) * 100)
    : 0;
  const remainingArticles = job.estimatedTotal - job.articlesProcessed;
  const estimatedMinutes = job.articlesPerHour > 0
    ? Math.round((remainingArticles / job.articlesPerHour) * 60)
    : 0;

  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
      onClick={onSelect}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              job.status === 'running' ? 'bg-success/10' :
              job.status === 'paused' ? 'bg-warning/10' :
              job.status === 'error' ? 'bg-destructive/10' : 'bg-muted'
            }`}>
              {job.status === 'running' ? (
                <RefreshCw className="h-4 w-4 text-success animate-spin" />
              ) : job.status === 'paused' ? (
                <Pause className="h-4 w-4 text-warning" />
              ) : job.status === 'error' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
            </div>
            <div>
              <p className="font-medium">{job.providerName}</p>
              <p className="text-xs text-muted-foreground">
                Started {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={
              job.status === 'running' ? 'bg-success/10 text-success border-0' :
              job.status === 'paused' ? 'bg-warning/10 text-warning border-0' :
              job.status === 'error' ? 'bg-destructive/10 text-destructive border-0' :
              'bg-muted'
            }
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-3">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {job.articlesProcessed} / {job.estimatedTotal} articles
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {job.articlesPerHour}/hour
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{estimatedMinutes} min remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DiscoveryFeed({ discoveries }: { discoveries: Job['recentDiscoveries'] }) {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {discoveries.length > 0 ? discoveries.map((discovery, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{discovery.title}</p>
              <p className="text-xs text-muted-foreground truncate">{discovery.url}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(discovery.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No recent discoveries
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function ErrorLog({ errors }: { errors: Job['errors'] }) {
  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-success/10 p-3 mb-3">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <p className="text-sm text-muted-foreground">No errors encountered</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {errors.map((error, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm">{error.message}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">{error.url}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Retry
                </Button>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function LiveMonitor() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.getJobs(),
    refetchInterval: 3000,
  });

  const pauseAllMutation = useMutation({
    mutationFn: async () => {
      const runningJobs = jobsData?.jobs.filter(j => j.status === 'running') || [];
      await Promise.all(runningJobs.map(j => api.pauseJob(j.id)));
    },
    onSuccess: () => {
      toast.success('All jobs paused');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const cancelAllMutation = useMutation({
    mutationFn: async () => {
      const activeJobs = jobsData?.jobs.filter(j => ['running', 'paused'].includes(j.status)) || [];
      await Promise.all(activeJobs.map(j => api.cancelJob(j.id)));
    },
    onSuccess: () => {
      toast.success('All jobs cancelled');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const jobs = jobsData?.jobs || [];
  const runningJobs = jobs.filter(j => j.status === 'running');
  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : jobs[0];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Real-time collection job monitoring
            </p>
          </div>
        </div>
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
              <Link to="/collection-points">Start New Collection</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Monitor</h1>
          <p className="text-muted-foreground mt-1">
            {runningJobs.length} active job(s) running
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => pauseAllMutation.mutate()}
            disabled={runningJobs.length === 0}
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause All
          </Button>
          <Button
            variant="destructive"
            onClick={() => cancelAllMutation.mutate()}
            disabled={jobs.length === 0}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop All
          </Button>
        </div>
      </div>

      {/* Queue Status */}
      {jobsData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Transform Queue</p>
                  <p className="text-sm text-muted-foreground">
                    {jobsData.transformQueue.queueSize} articles pending
                  </p>
                </div>
                <Badge variant={jobsData.transformQueue.isProcessing ? 'default' : 'secondary'}>
                  {jobsData.transformQueue.isProcessing ? 'Processing' : 'Idle'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Translation Queue</p>
                  <p className="text-sm text-muted-foreground">
                    {jobsData.translateQueue.queueSize} jobs pending
                  </p>
                </div>
                <Badge variant={jobsData.translateQueue.isProcessing ? 'default' : 'secondary'}>
                  {jobsData.translateQueue.isProcessing ? 'Processing' : 'Idle'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map(job => (
          <JobMonitorCard
            key={job.id}
            job={job}
            isSelected={job.id === (selectedJob?.id || 0)}
            onSelect={() => setSelectedJobId(job.id)}
          />
        ))}
      </div>

      {/* Selected Job Details */}
      {selectedJob && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Discovery Feed */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Article Discovery Feed</CardTitle>
                  <CardDescription>Real-time articles being discovered</CardDescription>
                </div>
                {selectedJob.status === 'running' && (
                  <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DiscoveryFeed discoveries={selectedJob.recentDiscoveries} />
            </CardContent>
          </Card>

          {/* Error Log */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Error Log</CardTitle>
                  <CardDescription>
                    {selectedJob.errors.length} error(s) encountered
                  </CardDescription>
                </div>
                {selectedJob.errors.length > 0 && (
                  <Badge variant="destructive">{selectedJob.errors.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ErrorLog errors={selectedJob.errors} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
