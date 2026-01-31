import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { type Provider } from "@/lib/api";

export function useProviders(projectId?: number) {
  return useQuery({
    queryKey: ['providers', projectId],
    queryFn: () => api.getProviders(projectId),
    staleTime: 60000, // 1 minute
  });
}

export function useProvider(id: number) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => api.getProvider(id),
    enabled: !!id,
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      base_urls: Record<string, string>;
      project_id?: number;
      folder_id?: number;
    }) => api.createProvider(data),
    onSuccess: () => {
      toast.success('Provider created successfully');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create provider: ${error.message}`);
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Provider> }) =>
      api.updateProvider(id, data),
    onSuccess: () => {
      toast.success('Provider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update provider: ${error.message}`);
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteProvider(id),
    onSuccess: () => {
      toast.success('Provider deleted');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete provider: ${error.message}`);
    },
  });
}

export function useToggleProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.toggleProvider(id),
    onSuccess: (provider) => {
      toast.success(`Provider ${provider.is_active ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle provider: ${error.message}`);
    },
  });
}
