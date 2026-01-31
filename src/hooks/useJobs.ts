import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { type Job, type PipelineJob } from "@/lib/api";

export function useJobs(refetchInterval = 5000) {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval,
    staleTime: 1000, // Very short stale time for active monitoring
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
    refetchInterval: 2000, // Frequent updates for active jobs
  });
}

export function useJobLogs(id: number, enabled = true) {
  return useQuery({
    queryKey: ['job-logs', id],
    queryFn: () => api.getJobLogs(id),
    enabled: enabled && !!id,
    refetchInterval: 5000,
  });
}

export function useJobDiagnosis(id: number, enabled = true) {
  return useQuery({
    queryKey: ['job-diagnosis', id],
    queryFn: () => api.getJobDiagnosis(id),
    enabled: enabled && !!id,
  });
}

export function useArchivedJobs() {
  return useQuery({
    queryKey: ['archived-jobs'],
    queryFn: api.getArchivedJobs,
    staleTime: 60000, // 1 minute
  });
}

export function usePipelineJobs(refetchInterval = 2000) {
  return useQuery({
    queryKey: ['pipeline-jobs'],
    queryFn: api.getPipelineJobs,
    refetchInterval,
    staleTime: 1000,
  });
}

export function usePauseJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => api.pauseJob(jobId),
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.id === jobId ? { ...j, status: 'paused' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success('Job paused'),
    onError: (error: Error, _, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useResumeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => api.resumeJob(jobId),
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.id === jobId ? { ...j, status: 'running' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success('Job resumed'),
    onError: (error: Error, _, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => api.cancelJob(jobId),
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.map(j => j.id === jobId ? { ...j, status: 'cancelled' as const } : j)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success('Job cancelled'),
    onError: (error: Error, _, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRestartJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => api.restartJob(jobId),
    onSuccess: () => {
      toast.success('Job restarted');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useArchiveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => api.archiveJob(jobId),
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old: Job[] | undefined) =>
        old?.filter(j => j.id !== jobId)
      );
      return { previousJobs };
    },
    onSuccess: () => toast.success('Job archived'),
    onError: (error: Error, _, context) => {
      toast.error(error.message);
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['archived-jobs'] });
    },
  });
}

export function useStartScrape() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { providerId: number; language: string; url: string }) =>
      api.startScrape(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Scraping started');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to start scrape: ${error.message}`);
    },
  });
}
