import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { type Article, type ArticlesResponse } from "@/lib/api";

interface ArticleFilters {
  language?: string;
  providerId?: number;
  projectId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export function useArticles(filters: ArticleFilters = {}) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: () => api.getArticles(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => api.getArticle(id),
    enabled: !!id,
  });
}

export function useBatchTransform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleIds: number[]) => api.batchTransform(articleIds),
    onSuccess: (data) => {
      toast.success(data.message || 'Transformation started');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => {
      toast.error(`Transform failed: ${error.message}`);
    },
  });
}

export function useBatchTranslate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleIds, languages }: { articleIds: number[]; languages?: string[] }) =>
      api.batchTranslate(articleIds, languages),
    onSuccess: (data) => {
      toast.success(data.message || 'Translation started');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => {
      toast.error(`Translation failed: ${error.message}`);
    },
  });
}

export function useBatchPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleIds: number[]) => api.batchPublish(articleIds),
    onSuccess: (data) => {
      toast.success(data.message || 'Articles published');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => {
      toast.error(`Publish failed: ${error.message}`);
    },
  });
}

export function useBatchDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleIds: number[]) => api.batchDelete(articleIds),
    onSuccess: (data) => {
      toast.success(data.message || 'Articles deleted');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: number) => api.deleteArticle(articleId),
    onSuccess: () => {
      toast.success('Article deleted');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}
