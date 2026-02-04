// Content Pipeline API Service v2
const API_BASE = '/api';

// ==================== TYPES ====================

// AI Guidelines
export interface AIGuidelines {
  // Tone & Voice
  tone?: 'formal' | 'professional' | 'casual' | 'technical' | 'educational';
  targetAudiences?: string[]; // Multi-select audiences
  writingStyle?: 'concise' | 'detailed' | 'conversational';

  // Brand Identity
  brandName?: string;
  brandVoice?: string;
  termsToUse?: string[];
  termsToAvoid?: string[];

  // Content Structure
  includeIntroduction?: boolean;
  includeConclusion?: boolean;
  includeTldr?: boolean;
  includeFaq?: boolean;
  includeCta?: boolean;
  headingStyle?: 'questions' | 'statements' | 'action-oriented';
  maxParagraphLength?: number;
  useBulletPoints?: boolean;

  // SEO Instructions
  primaryKeywords?: string[];
  secondaryKeywords?: string[];
  internalLinks?: string[];
  metaDescriptionStyle?: 'short' | 'descriptive' | 'cta';

  // Content Rules
  mandatoryDisclaimer?: string;
  productsToMention?: string[];
  competitorsPolicy?: 'never-mention' | 'mention-objectively' | 'compare';
  technicalAccuracy?: 'simplified' | 'balanced' | 'highly-technical';

  // Custom Instructions
  customInstructions?: string;
  goodExamples?: string;
  badExamples?: string;

  // Image Generation Settings
  imageGeneration?: {
    enabled?: boolean;
    style?: 'photorealistic' | 'illustration' | 'abstract' | 'minimal' | 'tech';
    promptTemplate?: string;
    negativePrompt?: string;
    autoGenerate?: boolean;
  };
}

// Project
export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string;
  project_intention?: string;
  color: string;
  icon: string;
  is_active: boolean;
  providers_count: number;
  articles_count: number;
  default_language?: string;
  target_languages?: string[];
  auto_transform?: boolean;
  auto_translate?: boolean;
  ai_guidelines?: AIGuidelines;
  created_at: string;
  updated_at: string;
}

// Relevance Score
export interface RelevanceScore {
  articleId: number;
  score: number;
  reason: string;
  keywords_match: string[];
  recommendation: 'keep' | 'review' | 'delete';
}

export interface RelevanceStats {
  total_articles: string;
  scored_articles: string;
  avg_score: number | null;
  highly_relevant: string;
  relevant: string;
  moderate: string;
  low_relevance: string;
  has_intention: boolean;
  intention_preview?: string;
}

// Folder
export interface Folder {
  id: number;
  project_id: number;
  name: string;
  parent_folder_id?: number;
  providers_count: number;
  created_at: string;
}

// Provider
export interface Provider {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  entryUrl?: string;
  base_urls: Record<string, string>;
  targetUrl?: string;
  status: 'active' | 'paused' | 'scheduled';
  articlesCollected?: number;
  articles_count?: number;
  lastRun?: string;
  last_sync_at?: string;
  nextRun?: string;
  successRate?: number;
  schedule?: string;
  crawlDepth?: number;
  urlPatterns?: string[] | string;
  includePatterns?: string[];
  excludePatterns?: string[] | string;
  contentSelectors?: string;
  autoTransform?: boolean;
  autoTranslate?: boolean;
  jsRender?: boolean;
  scrapingMethod?: 'firecrawl' | 'direct' | 'playwright';
  is_active: boolean;
  activeJobs?: number;
  project_id?: number;
  folder_id?: number;
  project_name?: string;
  folder_name?: string;
}

// Job (enhanced)
export interface Job {
  id: number;
  providerId: number;
  providerName: string;
  providerDomain?: string;
  language: string;
  url: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  total: number;
  current: number;
  articlesCollected: number;
  completionRate: number;
  speed: number;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  errorCount: number;
  failedUrls: Array<{ url: string; error: string; attempts: number }>;
  canRestart: boolean;
  canArchive: boolean;
}

export interface JobLog {
  id: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  url?: string;
  timestamp: string;
}

export interface JobDiagnosis {
  jobId: number;
  completionRate: number;
  totalErrors: number;
  errorsByType: Record<string, number>;
  failedUrls: Array<{ url: string; error: string; attempts: number }>;
  recommendations: string[];
}

export interface ArchivedJob {
  id: number;
  original_job_id: number;
  provider_id: number;
  provider_name: string;
  status: string;
  started_at: string;
  completed_at: string;
  articles_found: number;
  articles_processed: number;
  estimated_total: number;
  completion_rate: number;
  failure_reason?: string;
  error_details?: Record<string, unknown>;
  archived_at: string;
}

// Pipeline Job (AI Processing)
export interface PipelineJob {
  id: number;
  type: 'pipeline';
  providerId: number;
  providerName?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  phase: 'scoring' | 'transform' | 'translate';
  totalArticles: number;
  currentArticle: number;
  scoredCount?: number;
  transformedCount: number;
  translatedCount: number;
  totalTranslations: number;
  currentTranslation: number;
  errors: number;
  startedAt: string;
  completedAt?: string;
  logs: Array<{ timestamp: string; message: string; level: string }>;
}

// Pipeline Diagnostics
export interface PipelineDiagnostics {
  transform: {
    status: string;
    phase: string;
    current: number;
    total: number;
    errors: number;
    lastError: string | null;
    lastErrorAt: string | null;
    paused: boolean;
  };
  translate: {
    status: string;
    current: number;
    total: number;
    errors: number;
    lastError: string | null;
    lastErrorAt: string | null;
    paused: boolean;
  };
  errorsByType: Record<string, number>;
  recentErrors: Array<{
    type: string;
    articleId?: number;
    message: string;
    timestamp: string;
  }>;
  failedArticleCount: number;
  speed: number;
  etaMinutes: number | null;
  isRateLimited: boolean;
}

// Article
export interface Article {
  id: number;
  title?: string;
  original_title: string;
  transformed_title?: string;
  source_url: string;
  provider_id: number;
  provider_name?: string;
  provider_slug?: string;
  project_name?: string;
  status: 'collected' | 'transformed' | 'approved' | 'translated' | 'published';
  language: string;
  word_count: number;
  seoScore?: number;
  category?: string;
  created_at: string;
  updated_at?: string;
  transformedAt?: string;
  publishedAt?: string;
  translationsCount?: number;
  parent_article_id?: number;
  thumbnail_url?: string;
  // Relevance scoring
  relevance_score?: number;
  relevance_reason?: string;
  relevance_scored_at?: string;
}

export interface ArticleDetail extends Article {
  original_content?: string;
  transformed_content?: string;
  ovh_links?: Array<{ keyword: string; url: string }>;
  disclaimer?: string;
  seo_breakdown?: {
    keywords: number;
    readability: number;
    structure: number;
    meta: number;
  };
  translations: Array<{
    id: number;
    language: string;
    status: string;
    transformed_title?: string;
  }>;
}

export interface ArticlesResponse {
  articles: Article[];
  counts: Record<string, number>;
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Reporting
export interface ReportingOverview {
  totalProjects: number;
  totalProviders: number;
  totalArticles: number;
  articlesThisWeek: number;
  successRate: number;
  byStatus: Record<string, number>;
}

export interface ProjectStats {
  id: number;
  name: string;
  color: string;
  providers_count: number;
  articles_count: number;
  total_words: number;
}

export interface ProviderStats {
  id: number;
  name: string;
  slug: string;
  project_name?: string;
  articles_count: number;
  total_words: number;
  transformed_count: number;
}

export interface TrendData {
  date: string;
  articles_count: number;
  words_count: number;
}

// Dashboard Stats
export interface DashboardStats {
  total: number;
  collected: number;
  transformed: number;
  totalWords: number;
  byLanguage: Array<{ language: string; count: number; words: number }>;
  byProvider: Array<{ name: string; slug: string; count: number }>;
}

// Scraping Progress (legacy)
export interface ScrapeProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  provider?: number;
  language?: string;
  total: number;
  current: number;
  articles: Array<{ id: number; title: string; url: string; wordCount: number }>;
  logs: Array<{ timestamp: string; message: string; type: string }>;
}

// Transform Progress
export interface TransformProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  current: number;
  total: number;
  errors: number;
  logs: Array<{ timestamp: string; message: string; type: string }>;
}

// Settings
export interface Settings {
  autoTransform: { enabled: boolean; queueSize: number; isProcessing: boolean };
  autoTranslate: { enabled: boolean; targetLanguages: string[]; queueSize: number; isProcessing: boolean };
  ovhAi: { model: string; endpoint: string };
  firecrawl: { url: string };
}

// ==================== API ERROR CLASS ====================

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retry: boolean = status >= 500
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 400;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'You need to be logged in to perform this action.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists or is in conflict.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Server error. Please try again later.',
    502: 'Server temporarily unavailable. Please try again.',
    503: 'Service temporarily unavailable. Please try again.',
  };
  return messages[status] || `An error occurred (HTTP ${status})`;
}

// ==================== API FUNCTIONS ====================

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token');

  // Build headers with auth token if available
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('auth_token');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expirée, veuillez vous reconnecter', false);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      data.code || 'UNKNOWN_ERROR',
      data.error || getDefaultErrorMessage(response.status),
      response.status >= 500
    );
  }

  return response.json();
}

export const api = {
  // ==================== PROJECTS ====================
  getProjects: () => fetchApi<Project[]>('/projects'),

  getProject: (id: number) => fetchApi<Project>(`/projects/${id}`),

  createProject: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    fetchApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (id: number, data: Partial<Project>) =>
    fetchApi<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: number, force: boolean = false) =>
    fetchApi<{ success: boolean }>(`/projects/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' }),

  getProjectStats: (id: number) =>
    fetchApi<{ providers_count: number; articles_count: number; total_words: number; collected: number; transformed: number }>(`/projects/${id}/stats`),

  updateProjectIntention: (id: number, intention: string) =>
    fetchApi<{ success: boolean }>(`/projects/${id}/intention`, {
      method: 'PATCH',
      body: JSON.stringify({ intention }),
    }),

  getRelevanceStats: (projectId: number) =>
    fetchApi<RelevanceStats>(`/projects/${projectId}/relevance-stats`),

  // ==================== FOLDERS ====================
  getFolders: (projectId: number) => fetchApi<Folder[]>(`/projects/${projectId}/folders`),

  createFolder: (projectId: number, data: { name: string; parent_folder_id?: number }) =>
    fetchApi<Folder>(`/projects/${projectId}/folders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFolder: (id: number, data: { name?: string; parent_folder_id?: number }) =>
    fetchApi<Folder>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFolder: (id: number) =>
    fetchApi<{ success: boolean }>(`/folders/${id}`, { method: 'DELETE' }),

  // ==================== PROVIDERS ====================
  getProviders: (projectId?: number) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return fetchApi<Provider[]>(`/providers${params}`);
  },

  getProvider: (id: number) => fetchApi<Provider>(`/providers/${id}`),

  createProvider: (data: {
    name: string;
    slug: string;
    base_urls: Record<string, string>;
    project_id?: number;
    folder_id?: number;
  }) =>
    fetchApi<Provider>('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProvider: (id: number, data: Partial<Provider>) =>
    fetchApi<Provider>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleProvider: (id: number) =>
    fetchApi<Provider>(`/providers/${id}/toggle`, { method: 'PATCH' }),

  deleteProvider: (id: number) =>
    fetchApi<{ success: boolean }>(`/providers/${id}`, { method: 'DELETE' }),

  // ==================== JOBS ====================
  getJobs: () => fetchApi<Job[]>('/jobs'),

  getJob: (id: number) => fetchApi<Job>(`/jobs/${id}`),

  getJobLogs: (id: number) => fetchApi<JobLog[]>(`/jobs/${id}/logs`),

  getJobDiagnosis: (id: number) => fetchApi<JobDiagnosis>(`/jobs/${id}/diagnosis`),

  pauseJob: (id: number) => fetchApi<Job>(`/jobs/${id}/pause`, { method: 'POST' }),

  resumeJob: (id: number) => fetchApi<Job>(`/jobs/${id}/resume`, { method: 'POST' }),

  cancelJob: (id: number) => fetchApi<Job>(`/jobs/${id}/stop`, { method: 'POST' }),

  restartJob: (id: number) => fetchApi<Job>(`/jobs/${id}/restart`, { method: 'POST' }),

  archiveJob: (id: number) => fetchApi<{ success: boolean; message: string }>(`/jobs/${id}/archive`, { method: 'POST' }),

  getArchivedJobs: () => fetchApi<ArchivedJob[]>('/jobs/archived'),

  // Pipeline Jobs (AI Processing)
  getPipelineJobs: () => fetchApi<PipelineJob[]>('/pipeline-jobs'),

  getPipelineDiagnostics: () => fetchApi<PipelineDiagnostics>('/pipeline-jobs/diagnostics'),

  retryFailedPipeline: () => fetchApi<{ message: string; retried: number }>('/pipeline-jobs/retry-failed', {
    method: 'POST',
  }),

  pausePipeline: () => fetchApi<{ success: boolean; message: string }>('/pipeline-jobs/pause', {
    method: 'POST',
  }),

  resumePipeline: () => fetchApi<{ success: boolean; message: string }>('/pipeline-jobs/resume', {
    method: 'POST',
  }),

  cancelPipeline: () => fetchApi<{ success: boolean; message: string }>('/pipeline-jobs/cancel', {
    method: 'POST',
  }),

  clearPipeline: () => fetchApi<{ success: boolean; message: string }>('/pipeline-jobs/clear', {
    method: 'POST',
  }),

  // ==================== SCRAPING ====================
  getScrapeProgress: () => fetchApi<ScrapeProgress>('/scrape/progress'),

  startScrape: (data: { providerId: number; language: string; url: string }) =>
    fetchApi<{ message: string; jobId?: number }>('/scrape', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  configureFirecrawl: (apiKey: string) =>
    fetchApi<{ message: string }>('/firecrawl/config', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),

  // ==================== ARTICLES ====================
  getArticles: (params: {
    language?: string;
    providerId?: number;
    projectId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.language) searchParams.set('language', params.language);
    if (params.providerId) searchParams.set('providerId', String(params.providerId));
    if (params.projectId) searchParams.set('projectId', String(params.projectId));
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    return fetchApi<ArticlesResponse>(`/articles?${searchParams.toString()}`);
  },

  getArticle: (id: number) => fetchApi<ArticleDetail>(`/articles/${id}`),

  updateArticle: (id: number, data: { title?: string; content?: string }) =>
    fetchApi<ArticleDetail>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Edit article with learning capture
  editArticle: (id: number, data: { title?: string; content?: string }) =>
    fetchApi<{ message: string; editId: number | null; editType: string; wordCountDelta: number }>(`/articles/${id}/edit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get edit history for an article
  getArticleEdits: (id: number) =>
    fetchApi<{ edits: Array<{
      id: number;
      edit_type: string;
      word_count_before: number;
      word_count_after: number;
      char_diff: number;
      ai_analysis: unknown;
      analysis_status: string;
      created_at: string;
    }> }>(`/articles/${id}/edits`),

  // Get project learnings
  getProjectLearnings: (projectId: number) =>
    fetchApi<{
      learnings: Array<{
        id: number;
        rule_type: string;
        rule_description: string;
        confidence_score: number;
        occurrence_count: number;
        status: string;
        created_at: string;
      }>;
      stats: { suggested: string; applied: string };
      totalEdits: number;
    }>(`/projects/${projectId}/learnings`),

  // Apply or reject a learning
  learningAction: (projectId: number, learningId: number, action: 'apply' | 'reject') =>
    fetchApi<{ message: string; learningId: number; newStatus: string }>(`/projects/${projectId}/learnings/${learningId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  // Get edit stats for a project
  getEditStats: (projectId: number) =>
    fetchApi<{
      total_edits: string;
      analyzed: string;
      edits_this_week: string;
    }>(`/projects/${projectId}/edit-stats`),

  deleteArticle: (id: number) =>
    fetchApi<{ success: boolean }>(`/articles/${id}`, { method: 'DELETE' }),

  // AI Transform
  transformText: (params: {
    text: string;
    action?: string;
    customPrompt?: string;
    context?: string;
  }) =>
    fetchApi<{ success: boolean; result: string; action: string }>('/ai/transform', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Batch transform pending articles
  transformPending: (limit: number = 20) =>
    fetchApi<{ message: string; count: number; articleIds: number[] }>('/articles/transform-pending', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    }),

  // Approve article for translation
  approveArticle: (id: number) =>
    fetchApi<{ success: boolean; message: string; targetLanguages: string[] }>(`/articles/${id}/approve`, {
      method: 'POST',
    }),

  // Bulk approve articles
  bulkApproveArticles: (articleIds: number[]) =>
    fetchApi<{ success: boolean; message: string }>('/articles/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),

  // Article Diagnostics
  diagnoseArticles: (params: { providerId?: number; status?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.providerId) searchParams.set('providerId', String(params.providerId));
    if (params.status) searchParams.set('status', params.status);
    return fetchApi<{
      summary: {
        total: number;
        valid: number;
        invalid: number;
        botProtectionBlocked: number;
        transformable: number;
      };
      articles: Array<{
        id: number;
        title: string;
        url: string;
        status: string;
        providerId: number;
        validation: {
          isValid: boolean;
          issues: Array<{ type: string; message: string; severity: string }>;
          wordCount: number;
          contentLength: number;
          canTransform: boolean;
        };
      }>;
    }>(`/articles/diagnose?${searchParams.toString()}`);
  },

  validateArticles: (providerId: number, markInvalid: boolean = false) =>
    fetchApi<{
      success: boolean;
      total: number;
      valid: number;
      invalid: number;
      markedInvalid: number;
      invalidArticles: Array<{
        id: number;
        title: string;
        issues: Array<{ type: string; message: string; severity: string }>;
      }>;
    }>('/articles/validate-batch', {
      method: 'POST',
      body: JSON.stringify({ providerId, markInvalid }),
    }),

  batchTransform: (articleIds: number[]) =>
    fetchApi<{ message: string; queued: number }>('/articles/batch/transform', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),

  // Single article transform with DeepSeek (for re-transform from article detail)
  transformSingleWithDeepSeek: (articleId: number) =>
    fetchApi<{
      success: boolean;
      message: string;
      taskId: string;
    }>(`/articles/${articleId}/transform-deepseek`, {
      method: 'POST',
    }),

  // Get transform task status
  getTransformTaskStatus: (taskId: string) =>
    fetchApi<{
      taskId: string;
      status: 'pending' | 'thinking' | 'generating' | 'completed' | 'failed';
      phase: string;
      progress: number;
      thinkingContent?: string;
      generatedContent?: string;
      error?: string;
      startedAt: string;
      completedAt?: string;
    }>(`/transform-tasks/${taskId}`),

  batchTranslate: (articleIds: number[], languages?: string[]) =>
    fetchApi<{ message: string; queued: number }>('/articles/batch/translate', {
      method: 'POST',
      body: JSON.stringify({ articleIds, languages }),
    }),

  batchPublish: (articleIds: number[]) =>
    fetchApi<{ message: string; published: number }>('/articles/batch/publish', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),

  batchDelete: (articleIds: number[]) =>
    fetchApi<{ message: string; deleted: number }>('/articles/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),

  exportArticles: (params: { status?: string; language?: string; format?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.language) searchParams.set('language', params.language);
    if (params.format) searchParams.set('format', params.format);
    return fetch(`${API_BASE}/articles/export?${searchParams.toString()}`)
      .then(res => res.text());
  },

  // ==================== IMAGE GENERATION ====================
  generateThumbnail: (articleId: number) =>
    fetchApi<{ message: string; thumbnail_url: string }>(`/articles/${articleId}/generate-thumbnail`, {
      method: 'POST',
    }),

  batchGenerateThumbnails: (articleIds: number[]) =>
    fetchApi<{ message: string; queued: number }>('/articles/batch/generate-thumbnails', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),

  // ==================== RELEVANCE SCORING ====================
  scoreArticleRelevance: (articleId: number) =>
    fetchApi<RelevanceScore & { success: boolean }>(`/articles/${articleId}/relevance-score`, {
      method: 'POST',
    }),

  batchScoreRelevance: (articleIds: number[], projectId?: number) =>
    fetchApi<{
      success: boolean;
      scored: number;
      errors: number;
      results: RelevanceScore[];
      errorDetails: Array<{ articleId: number; error: string }>;
    }>('/articles/batch-relevance-score', {
      method: 'POST',
      body: JSON.stringify({ articleIds, projectId }),
    }),

  // ==================== TRANSFORMATION ====================
  getTransformProgress: () => fetchApi<TransformProgress>('/transform/progress'),

  startTransform: (articleIds: number[]) =>
    fetchApi<{ message: string }>('/transform', {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    }),

  // ==================== TRANSLATION ====================
  startTranslation: (articleId: number, targetLanguage: string) =>
    fetchApi<{ message: string }>('/translate', {
      method: 'POST',
      body: JSON.stringify({ articleId, targetLanguage }),
    }),

  // ==================== REPORTING ====================
  getReportingOverview: () => fetchApi<ReportingOverview>('/reporting/overview'),

  getReportingByProject: () => fetchApi<ProjectStats[]>('/reporting/by-project'),

  getReportingByProvider: () => fetchApi<ProviderStats[]>('/reporting/by-provider'),

  getReportingTrends: (days = 30) => fetchApi<TrendData[]>(`/reporting/trends?days=${days}`),

  // ==================== STATS ====================
  getStats: () => fetchApi<DashboardStats>('/stats'),

  // ==================== HEALTH ====================
  getHealth: () => fetchApi<{
    status: string;
    timestamp: string;
    database: { postgresql: string; redis: string };
    version: string;
  }>('/health'),

  // ==================== AUTH ====================
  resendVerificationEmail: (email: string) =>
    fetchApi<{ message: string; emailSent: boolean }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export default api;
