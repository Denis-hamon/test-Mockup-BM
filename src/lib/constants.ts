// ==================== SHARED CONSTANTS ====================
// Single source of truth for all application constants

// ==================== LANGUAGES ====================

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
] as const;

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code);

export type LanguageCode = typeof LANGUAGE_CODES[number];

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code.toUpperCase();
}

export function getLanguageNativeName(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.nativeName || code.toUpperCase();
}

export function getLanguageFlag(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || '🏳️';
}

// ==================== ARTICLE STATUS ====================

export const ARTICLE_STATUSES = [
  { value: 'collected', label: 'Collected', color: 'bg-muted text-muted-foreground' },
  { value: 'transformed', label: 'Transformed', color: 'bg-warning/10 text-warning' },
  { value: 'translated', label: 'Translated', color: 'bg-primary/10 text-primary' },
  { value: 'published', label: 'Published', color: 'bg-success/10 text-success' },
] as const;

export type ArticleStatus = typeof ARTICLE_STATUSES[number]['value'];

export function getStatusConfig(status: string) {
  return ARTICLE_STATUSES.find(s => s.value === status) || ARTICLE_STATUSES[0];
}

// ==================== TARGET AUDIENCES (OVHcloud) ====================

export const OVHCLOUD_AUDIENCES = [
  { id: 'developers', label: 'Developers', description: 'Software developers, DevOps, SRE' },
  { id: 'sysadmins', label: 'System Administrators', description: 'IT admins, infrastructure managers' },
  { id: 'startups', label: 'Startups & Entrepreneurs', description: 'Tech startups, founders, CTOs' },
  { id: 'smb', label: 'SMB / PME', description: 'Small & medium businesses' },
  { id: 'enterprise', label: 'Enterprise', description: 'Large companies, corporations' },
  { id: 'agencies', label: 'Web Agencies', description: 'Digital agencies, web developers' },
  { id: 'ecommerce', label: 'E-commerce', description: 'Online stores, merchants' },
  { id: 'gamers', label: 'Gamers', description: 'Game servers, gaming communities' },
  { id: 'data-scientists', label: 'Data Scientists', description: 'ML/AI engineers, data analysts' },
  { id: 'students', label: 'Students & Learners', description: 'Tech students, self-learners' },
  { id: 'hobbyists', label: 'Hobbyists', description: 'Personal projects, home labs' },
  { id: 'resellers', label: 'Resellers & Partners', description: 'Hosting resellers, MSPs' },
] as const;

export type AudienceId = typeof OVHCLOUD_AUDIENCES[number]['id'];

// ==================== AI GUIDELINES OPTIONS ====================

export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Professional, corporate tone' },
  { value: 'professional', label: 'Professional', description: 'Business-friendly but approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational style' },
  { value: 'technical', label: 'Technical', description: 'Detailed, precise language' },
  { value: 'educational', label: 'Educational', description: 'Teaching-focused, step-by-step' },
] as const;

export const WRITING_STYLE_OPTIONS = [
  { value: 'concise', label: 'Concise', description: 'Short, to the point' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
  { value: 'conversational', label: 'Conversational', description: 'Natural, dialogue-like' },
] as const;

export const HEADING_STYLE_OPTIONS = [
  { value: 'questions', label: 'Questions', description: 'How to...? What is...?' },
  { value: 'statements', label: 'Statements', description: 'Getting Started, Configuration' },
  { value: 'action-oriented', label: 'Action-oriented', description: 'Deploy, Configure, Monitor' },
] as const;

export const META_DESCRIPTION_OPTIONS = [
  { value: 'short', label: 'Short', description: '< 120 characters, punchy' },
  { value: 'descriptive', label: 'Descriptive', description: '120-160 characters, detailed' },
  { value: 'cta', label: 'Call-to-Action', description: 'Action-focused, compelling' },
] as const;

export const COMPETITORS_POLICY_OPTIONS = [
  { value: 'never-mention', label: 'Never Mention', description: 'Avoid all competitor references' },
  { value: 'mention-objectively', label: 'Mention Objectively', description: 'Neutral comparisons allowed' },
  { value: 'compare', label: 'Compare', description: 'Active comparison encouraged' },
] as const;

export const TECHNICAL_ACCURACY_OPTIONS = [
  { value: 'simplified', label: 'Simplified', description: 'Beginner-friendly explanations' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of simple and technical' },
  { value: 'highly-technical', label: 'Highly Technical', description: 'Expert-level detail' },
] as const;

// ==================== JOB STATUSES ====================

export const JOB_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-muted text-muted-foreground' },
  { value: 'running', label: 'Running', color: 'bg-green-500 text-white' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-500 text-yellow-900' },
  { value: 'completed', label: 'Completed', color: 'border-green-500 text-green-600' },
  { value: 'failed', label: 'Failed', color: 'bg-destructive text-destructive-foreground' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
] as const;

export type JobStatus = typeof JOB_STATUSES[number]['value'];

// ==================== PROJECT COLORS ====================

export const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
] as const;

// ==================== PAGINATION ====================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
