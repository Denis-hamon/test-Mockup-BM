// Centralized mock data for the SEO Content Absorption Platform

export type CollectionStatus = 'active' | 'paused' | 'scheduled' | 'completed' | 'error';
export type ArticleStatus = 'collected' | 'transformed' | 'translated' | 'published';
export type Language = 'EN' | 'FR' | 'DE' | 'ES' | 'IT' | 'PL' | 'PT';

export interface CollectionPoint {
  id: string;
  name: string;
  domain: string;
  targetUrl: string;
  status: CollectionStatus;
  articlesCollected: number;
  lastRun: Date | null;
  nextRun: Date | null;
  successRate: number;
  crawlDepth: number;
  includePatterns: string[];
  excludePatterns: string[];
  schedule: 'one-time' | 'daily' | 'weekly' | 'monthly';
}

export interface Article {
  id: string;
  title: string;
  originalUrl: string;
  source: string;
  status: ArticleStatus;
  collectedAt: Date;
  transformedAt: Date | null;
  publishedAt: Date | null;
  seoScore: number;
  wordCount: number;
  imageCount: number;
  language: Language;
  translations: Partial<Record<Language, { status: 'pending' | 'completed'; translatedAt?: Date }>>;
  seoBreakdown: {
    keywords: number;
    readability: number;
    structure: number;
    meta: number;
  };
  originalContent: string;
  transformedContent: string | null;
}

export interface CollectionJob {
  id: string;
  collectionPointId: string;
  collectionPointName: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  startedAt: Date;
  articlesFound: number;
  articlesProcessed: number;
  estimatedTotal: number;
  articlesPerHour: number;
  errors: { message: string; url: string; timestamp: Date }[];
  recentDiscoveries: { title: string; url: string; timestamp: Date }[];
}

export interface ActivityItem {
  id: string;
  type: 'collection' | 'transformation' | 'translation' | 'error' | 'publish';
  message: string;
  timestamp: Date;
  articleId?: string;
  collectionPointId?: string;
}

// Mock Collection Points
export const mockCollectionPoints: CollectionPoint[] = [
  {
    id: 'cp-1',
    name: 'Hostinger Tutorials',
    domain: 'hostinger.com',
    targetUrl: 'https://www.hostinger.com/tutorials',
    status: 'active',
    articlesCollected: 342,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
    successRate: 98.5,
    crawlDepth: 3,
    includePatterns: ['/tutorials/*', '/blog/*'],
    excludePatterns: ['/author/*', '/tag/*'],
    schedule: 'daily',
  },
  {
    id: 'cp-2',
    name: 'DigitalOcean Community',
    domain: 'digitalocean.com',
    targetUrl: 'https://www.digitalocean.com/community/tutorials',
    status: 'active',
    articlesCollected: 567,
    lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 20 * 60 * 60 * 1000),
    successRate: 99.2,
    crawlDepth: 2,
    includePatterns: ['/community/tutorials/*'],
    excludePatterns: ['/community/questions/*'],
    schedule: 'daily',
  },
  {
    id: 'cp-3',
    name: 'Linode Docs',
    domain: 'linode.com',
    targetUrl: 'https://www.linode.com/docs',
    status: 'paused',
    articlesCollected: 289,
    lastRun: new Date(Date.now() - 48 * 60 * 60 * 1000),
    nextRun: null,
    successRate: 97.8,
    crawlDepth: 4,
    includePatterns: ['/docs/guides/*'],
    excludePatterns: ['/docs/api/*'],
    schedule: 'weekly',
  },
  {
    id: 'cp-4',
    name: 'Vultr Docs',
    domain: 'vultr.com',
    targetUrl: 'https://www.vultr.com/docs',
    status: 'scheduled',
    articlesCollected: 156,
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    successRate: 96.4,
    crawlDepth: 2,
    includePatterns: ['/docs/*'],
    excludePatterns: [],
    schedule: 'weekly',
  },
  {
    id: 'cp-5',
    name: 'Hetzner Community',
    domain: 'community.hetzner.com',
    targetUrl: 'https://community.hetzner.com/tutorials',
    status: 'active',
    articlesCollected: 98,
    lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 23 * 60 * 60 * 1000),
    successRate: 99.0,
    crawlDepth: 2,
    includePatterns: ['/tutorials/*'],
    excludePatterns: [],
    schedule: 'daily',
  },
];

// Generate sample articles
const sources = ['Hostinger', 'DigitalOcean', 'Linode', 'Vultr', 'Hetzner'];
const articleTitles = [
  'How to Install Docker on Ubuntu 22.04',
  'Complete Guide to Nginx Configuration',
  'Setting Up a LAMP Stack on Debian',
  'Kubernetes Cluster Setup Tutorial',
  'PostgreSQL Performance Optimization',
  'Redis Caching Best Practices',
  'SSL Certificate Installation Guide',
  'WordPress Optimization Tips',
  'MongoDB Replica Set Configuration',
  'Git Version Control Fundamentals',
  'Apache Virtual Hosts Setup',
  'MySQL Database Backup Strategies',
  'Node.js Application Deployment',
  'Python Django Hosting Guide',
  'PHP 8 New Features Overview',
  'Linux Server Security Hardening',
  'Cloud Storage Integration Tutorial',
  'Email Server Configuration Guide',
  'Load Balancer Setup with HAProxy',
  'Container Orchestration Basics',
];

export const mockArticles: Article[] = Array.from({ length: 52 }, (_, i) => {
  const status: ArticleStatus = 
    i < 10 ? 'collected' : 
    i < 25 ? 'transformed' : 
    i < 40 ? 'translated' : 'published';
  
  const source = sources[i % sources.length];
  const title = articleTitles[i % articleTitles.length];
  const seoScore = Math.floor(45 + Math.random() * 50);
  
  return {
    id: `art-${i + 1}`,
    title: `${title} - ${source} Edition`,
    originalUrl: `https://www.${source.toLowerCase()}.com/tutorials/${title.toLowerCase().replace(/\s+/g, '-')}`,
    source,
    status,
    collectedAt: new Date(Date.now() - (i + 1) * 2 * 60 * 60 * 1000),
    transformedAt: status !== 'collected' ? new Date(Date.now() - i * 60 * 60 * 1000) : null,
    publishedAt: status === 'published' ? new Date(Date.now() - (i - 20) * 30 * 60 * 1000) : null,
    seoScore,
    wordCount: 800 + Math.floor(Math.random() * 2000),
    imageCount: Math.floor(Math.random() * 8) + 1,
    language: 'EN',
    translations: {
      EN: { status: 'completed', translatedAt: new Date() },
      FR: status === 'translated' || status === 'published' ? { status: 'completed', translatedAt: new Date() } : { status: 'pending' },
      DE: status === 'published' ? { status: 'completed', translatedAt: new Date() } : { status: 'pending' },
      ES: { status: 'pending' },
      IT: { status: 'pending' },
      PL: { status: 'pending' },
      PT: { status: 'pending' },
    },
    seoBreakdown: {
      keywords: Math.floor(50 + Math.random() * 50),
      readability: Math.floor(50 + Math.random() * 50),
      structure: Math.floor(50 + Math.random() * 50),
      meta: Math.floor(50 + Math.random() * 50),
    },
    originalContent: `# ${title}\n\nThis is the original content from ${source}. It contains detailed instructions and examples for implementing ${title.toLowerCase()}.\n\n## Prerequisites\n\n- A server running Ubuntu 22.04\n- Root access or sudo privileges\n- Basic command line knowledge\n\n## Step 1: Update Your System\n\nBefore installing any packages, update your system:\n\n\`\`\`bash\nsudo apt update && sudo apt upgrade -y\n\`\`\`\n\n## Step 2: Installation\n\nFollow these steps to complete the installation...`,
    transformedContent: status !== 'collected' ? `# ${title} - OVHcloud Guide\n\nWelcome to the OVHcloud guide for ${title.toLowerCase()}. This comprehensive tutorial will walk you through the complete process using OVHcloud infrastructure.\n\n## What You'll Learn\n\n- Complete setup and configuration\n- Best practices for OVHcloud environments\n- Optimization techniques\n\n## Prerequisites\n\n- An OVHcloud account\n- A Public Cloud instance running Ubuntu 22.04\n- Access to your OVHcloud Control Panel\n\n## Step 1: Prepare Your OVHcloud Instance\n\nLog into your OVHcloud Control Panel and ensure your instance is ready...` : null,
  };
});

// Mock Active Jobs
export const mockActiveJobs: CollectionJob[] = [
  {
    id: 'job-1',
    collectionPointId: 'cp-1',
    collectionPointName: 'Hostinger Tutorials',
    status: 'running',
    startedAt: new Date(Date.now() - 45 * 60 * 1000),
    articlesFound: 127,
    articlesProcessed: 89,
    estimatedTotal: 150,
    articlesPerHour: 118,
    errors: [],
    recentDiscoveries: [
      { title: 'Docker Compose Best Practices', url: 'https://hostinger.com/tutorials/docker-compose', timestamp: new Date(Date.now() - 2000) },
      { title: 'Nginx Reverse Proxy Setup', url: 'https://hostinger.com/tutorials/nginx-proxy', timestamp: new Date(Date.now() - 5000) },
      { title: 'MySQL Replication Guide', url: 'https://hostinger.com/tutorials/mysql-replication', timestamp: new Date(Date.now() - 8000) },
    ],
  },
  {
    id: 'job-2',
    collectionPointId: 'cp-5',
    collectionPointName: 'Hetzner Community',
    status: 'running',
    startedAt: new Date(Date.now() - 15 * 60 * 1000),
    articlesFound: 34,
    articlesProcessed: 28,
    estimatedTotal: 45,
    articlesPerHour: 112,
    errors: [
      { message: 'Timeout fetching resource', url: 'https://community.hetzner.com/tutorials/old-article', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    ],
    recentDiscoveries: [
      { title: 'Hetzner Cloud CLI Tutorial', url: 'https://community.hetzner.com/tutorials/cli', timestamp: new Date(Date.now() - 1000) },
    ],
  },
];

// Mock Activity Feed
export const mockActivityFeed: ActivityItem[] = [
  { id: 'act-1', type: 'collection', message: 'Discovered 5 new articles from Hostinger Tutorials', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: 'act-2', type: 'transformation', message: 'Completed transformation of "Docker Installation Guide"', timestamp: new Date(Date.now() - 12 * 60 * 1000), articleId: 'art-5' },
  { id: 'act-3', type: 'translation', message: 'French translation completed for "Kubernetes Setup"', timestamp: new Date(Date.now() - 25 * 60 * 1000), articleId: 'art-12' },
  { id: 'act-4', type: 'publish', message: 'Published "PostgreSQL Optimization" to production', timestamp: new Date(Date.now() - 45 * 60 * 1000), articleId: 'art-22' },
  { id: 'act-5', type: 'error', message: 'Failed to transform article due to parsing error', timestamp: new Date(Date.now() - 60 * 60 * 1000), articleId: 'art-8' },
  { id: 'act-6', type: 'collection', message: 'Started collection job for DigitalOcean Community', timestamp: new Date(Date.now() - 90 * 60 * 1000), collectionPointId: 'cp-2' },
  { id: 'act-7', type: 'transformation', message: 'Batch transformation completed: 15 articles processed', timestamp: new Date(Date.now() - 120 * 60 * 1000) },
  { id: 'act-8', type: 'translation', message: 'German translations queued for 8 articles', timestamp: new Date(Date.now() - 180 * 60 * 1000) },
];

// Dashboard Stats
export interface DashboardStats {
  totalArticles: number;
  collected: number;
  transformed: number;
  translated: number;
  published: number;
  avgSeoScore: number;
  seoImprovement: number;
  activeJobs: number;
}

export const mockDashboardStats: DashboardStats = {
  totalArticles: mockArticles.length,
  collected: mockArticles.filter(a => a.status === 'collected').length,
  transformed: mockArticles.filter(a => a.status === 'transformed').length,
  translated: mockArticles.filter(a => a.status === 'translated').length,
  published: mockArticles.filter(a => a.status === 'published').length,
  avgSeoScore: Math.round(mockArticles.reduce((sum, a) => sum + a.seoScore, 0) / mockArticles.length),
  seoImprovement: 12.5,
  activeJobs: mockActiveJobs.filter(j => j.status === 'running').length,
};

// SEO Trends Data
export const mockSeoTrends = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  avgScore: 65 + Math.floor(Math.random() * 20) + (i * 0.3),
  articlesOptimized: Math.floor(5 + Math.random() * 15),
}));
