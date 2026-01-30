// Hot Stinger API Service
const API_BASE = '/api';

// Types
export interface DashboardStats {
  totalArticles: number;
  collected: number;
  transformed: number;
  translated: number;
  published: number;
  avgWordCount: number;
  avgSeoScore: number;
  activeJobs: number;
  languageCounts: Record<string, number>;
  statusCounts: Record<string, number>;
}

export interface Activity {
  id: number;
  type: 'collection' | 'transformation' | 'translation' | 'error' | 'publish' | 'delete';
  message: string;
  timestamp: string;
  articleId?: number;
  articleTitle?: string;
  providerId?: number;
  providerName?: string;
}

export interface Provider {
  id: number;
  name: string;
  slug: string;
  domain: string;
  entryUrl?: string;
  baseUrls: Record<string, string>;
  targetUrl?: string;
  status: 'active' | 'paused' | 'scheduled';
  articlesCollected: number;
  lastRun?: string;
  nextRun?: string;
  successRate: number;
  schedule: string;
  crawlDepth: number;
  urlPatterns?: string[] | string;
  includePatterns: string[];
  excludePatterns: string[] | string;
  contentSelectors?: string;
  autoTransform?: boolean;
  autoTranslate?: boolean;
  isActive: boolean;
  activeJobs: number;
}

export interface Job {
  id: number;
  providerId: number;
  providerName: string;
  providerDomain: string;
  status: 'running' | 'paused' | 'completed' | 'error' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  articlesFound: number;
  articlesProcessed: number;
  estimatedTotal: number;
  articlesPerHour: number;
  errors: Array<{ message: string; url: string; timestamp: string }>;
  recentDiscoveries: Array<{ title: string; url: string; timestamp: string }>;
}

export interface JobsResponse {
  jobs: Job[];
  transformQueue: { enabled: boolean; queueSize: number; isProcessing: boolean };
  translateQueue: { enabled: boolean; queueSize: number; isProcessing: boolean };
}

export interface Article {
  id: number;
  title: string;
  originalTitle: string;
  transformedTitle?: string;
  sourceUrl: string;
  providerName: string;
  providerSlug: string;
  status: 'collected' | 'transformed' | 'translated' | 'published';
  language: string;
  wordCount: number;
  seoScore: number;
  createdAt: string;
  transformedAt?: string;
  publishedAt?: string;
  translationsCount: number;
  parentArticleId?: number;
}

export interface ArticleDetail extends Article {
  providerId: number;
  originalContent?: string;
  transformedContent?: string;
  ovhLinks?: Array<{ keyword: string; url: string }>;
  disclaimer?: string;
  translations: Array<{
    id: number;
    language: string;
    status: string;
    title: string;
    createdAt: string;
  }>;
  hasTranslations: Record<string, boolean>;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  limit: number;
  offset: number;
  counts: Record<string, number>;
  statusCounts: Record<string, number>;
}

export interface Settings {
  autoTransform: { enabled: boolean; queueSize: number; isProcessing: boolean };
  autoTranslate: { enabled: boolean; targetLanguages: string[]; queueSize: number; isProcessing: boolean };
  ovhAi: { model: string; endpoint: string };
  firecrawl: { url: string };
}

export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  enabled: boolean;
}

// API Functions
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Stats & Dashboard
export const api = {
  // Stats
  getStats: () => fetchApi<DashboardStats>('/stats'),

  // Activity
  getActivity: (limit = 20) => fetchApi<{ activities: Activity[]; total: number }>(`/activity?limit=${limit}`),

  // Providers
  getProviders: () => fetchApi<Provider[]>('/providers'),
  getProvider: (id: number) => fetchApi<Provider>(`/providers/${id}`),
  createProvider: (data: Partial<Provider>) => fetchApi<Provider>('/providers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProvider: (id: number, data: Partial<Provider>) => fetchApi<Provider>(`/providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProvider: (id: number) => fetchApi<{ success: boolean }>(`/providers/${id}`, { method: 'DELETE' }),
  startProvider: (id: number, language = 'fr') => fetchApi<{ success: boolean; jobId: number }>(`/providers/${id}/start`, {
    method: 'POST',
    body: JSON.stringify({ language }),
  }),
  pauseProvider: (id: number) => fetchApi<{ success: boolean }>(`/providers/${id}/pause`, { method: 'POST' }),
  scheduleProvider: (id: number, schedule: string, nextRun: string) => fetchApi<{ success: boolean }>(`/providers/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ schedule, nextRun }),
  }),

  // Jobs
  getJobs: (active = false) => fetchApi<JobsResponse>(`/jobs${active ? '?active=true' : ''}`),
  getJob: (id: number) => fetchApi<Job>(`/jobs/${id}`),
  getJobLogs: (id: number) => fetchApi<{ logs: Array<{ timestamp: string; message: string; type: string }> }>(`/jobs/${id}/logs`),
  pauseJob: (id: number) => fetchApi<{ success: boolean }>(`/jobs/${id}/pause`, { method: 'POST' }),
  resumeJob: (id: number) => fetchApi<{ success: boolean }>(`/jobs/${id}/resume`, { method: 'POST' }),
  cancelJob: (id: number) => fetchApi<{ success: boolean }>(`/jobs/${id}/cancel`, { method: 'POST' }),

  // Articles
  getArticles: (params: {
    search?: string;
    status?: string;
    language?: string;
    providerId?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
    parentOnly?: boolean;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.language) searchParams.set('language', params.language);
    if (params.providerId) searchParams.set('providerId', String(params.providerId));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.parentOnly) searchParams.set('parentOnly', 'true');
    return fetchApi<ArticlesResponse>(`/articles?${searchParams.toString()}`);
  },
  getArticle: (id: number) => fetchApi<ArticleDetail>(`/articles/${id}`),

  // Batch Operations
  batchTransform: (articleIds: number[]) => fetchApi<{ success: boolean; message: string }>('/articles/batch/transform', {
    method: 'POST',
    body: JSON.stringify({ articleIds }),
  }),
  batchTranslate: (articleIds: number[], targetLanguages?: string[]) => fetchApi<{ success: boolean; message: string }>('/articles/batch/translate', {
    method: 'POST',
    body: JSON.stringify({ articleIds, targetLanguages }),
  }),
  batchDelete: (articleIds: number[]) => fetchApi<{ success: boolean; deleted: number }>('/articles/batch/delete', {
    method: 'POST',
    body: JSON.stringify({ articleIds }),
  }),
  batchPublish: (articleIds: number[]) => fetchApi<{ success: boolean; published: number }>('/articles/batch/publish', {
    method: 'POST',
    body: JSON.stringify({ articleIds }),
  }),

  // Settings
  getSettings: () => fetchApi<Settings>('/settings'),
  updateSettings: (settings: Partial<Settings>) => fetchApi<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Transform/Translate Queue Controls
  getTransformStatus: () => fetchApi<QueueStatus>('/transform/status'),
  toggleAutoTransform: (enabled: boolean) => fetchApi<{ enabled: boolean }>('/transform/auto', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  }),
  getTranslateStatus: () => fetchApi<QueueStatus>('/translate/status'),
  toggleAutoTranslate: (enabled: boolean) => fetchApi<{ enabled: boolean }>('/translate/auto', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  }),

  // Export
  exportArticles: async (params: { status?: string; language?: string; format?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.language) searchParams.set('language', params.language);
    searchParams.set('format', params.format || 'csv');
    const response = await fetch(`${API_BASE}/articles/export?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Export failed');
    return response.text();
  },

  // Job retry
  retryFailedUrl: (jobId: number, url: string) => fetchApi<{ success: boolean }>(`/jobs/${jobId}/retry-url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  }),

  // Health
  getHealth: () => fetchApi<{ app: string; version: string; status: string; services: Record<string, string> }>('/health'),
};

export default api;
