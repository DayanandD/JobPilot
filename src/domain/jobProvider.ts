import { Job, RemoteType } from '../types';

export interface JobSearchQuery {
  keywords: string;
  location?: string;
  remoteType?: RemoteType;
  experienceYears?: number;
  maxAgeDays?: number; // Filter jobs posted within max N days (default 14 days)
  limit?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  total: number;
  providerId: string;
}

export interface JobProvider {
  id: string;
  name: string;
  searchJobs(query: JobSearchQuery): Promise<JobSearchResult>;
  getJobDetails(jobId: string): Promise<Job | null>;
  healthCheck(): Promise<boolean>;
}

export interface JobFreshnessInfo {
  publishedDaysAgo: number | null;
  isFresh: boolean; // Published within 14 days
  verificationStatus: 'verified_active' | 'recently_discovered' | 'unverified_date';
  displayText: string;
}

/**
 * Normalizes job title and company for deduplication comparison.
 */
export function normalizeStringForKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/\.net/g, 'dotnet')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Deduplicates a list of jobs based on:
 * 1. Provider + providerJobId
 * 2. Canonical sourceUrl
 * 3. Company + title + location composite key
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenComposites = new Set<string>();
  const result: Job[] = [];

  for (const job of jobs) {
    // Check 1: Provider ID
    const providerKey = `${job.provider}_${job.providerJobId}`;
    if (seenIds.has(providerKey)) continue;

    // Check 2: Canonical URL
    const canonicalUrl = job.sourceUrl.split('?')[0].toLowerCase().trim();
    if (canonicalUrl && seenUrls.has(canonicalUrl)) continue;

    // Check 3: Composite Key (Normalized Company + Title + Location)
    const compositeKey = `${normalizeStringForKey(job.company)}_${normalizeStringForKey(job.title)}_${normalizeStringForKey(job.location)}`;
    if (seenComposites.has(compositeKey)) continue;

    // Add unique job
    seenIds.add(providerKey);
    if (canonicalUrl) seenUrls.add(canonicalUrl);
    seenComposites.add(compositeKey);
    result.push(job);
  }

  return result;
}

/**
 * Evaluates job freshness metrics without fabricating missing dates.
 */
export function calculateJobFreshness(job: Job): JobFreshnessInfo {
  if (!job.publishedAt || job.publishedAt === 'Not specified') {
    return {
      publishedDaysAgo: null,
      isFresh: false,
      verificationStatus: 'unverified_date',
      displayText: 'Date not specified'
    };
  }

  const publishedDate = new Date(job.publishedAt);
  if (isNaN(publishedDate.getTime())) {
    return {
      publishedDaysAgo: null,
      isFresh: false,
      verificationStatus: 'unverified_date',
      displayText: 'Date not specified'
    };
  }

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishedDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isFresh = diffDays <= 14;
  let verificationStatus: 'verified_active' | 'recently_discovered' | 'unverified_date' = 'recently_discovered';

  if (diffDays <= 7) {
    verificationStatus = 'verified_active';
  }

  return {
    publishedDaysAgo: diffDays,
    isFresh,
    verificationStatus,
    displayText: diffDays === 0 ? 'Posted today' : `Posted ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  };
}

/**
 * Parses numerical experience years required from raw text string.
 * E.g., "3-5 years" -> 3, "Senior 5+ yrs" -> 5
 */
export function parseExperienceYears(text: string): number {
  const match = text.match(/(\d+)\s*(?:\+|-\s*\d+)?\s*(?:years?|yrs?)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Filters jobs ensuring published age is within maxAgeDays threshold (default 14 days).
 * Unverified or recently discovered jobs within 14 days are retained.
 */
export function filterFreshJobs(jobs: Job[], maxAgeDays: number = 14): Job[] {
  if (!maxAgeDays || maxAgeDays <= 0) return jobs;

  return jobs.filter(job => {
    const freshness = calculateJobFreshness(job);
    if (freshness.publishedDaysAgo === null) return true;
    return freshness.publishedDaysAgo <= maxAgeDays;
  });
}

/**
 * Validates whether a candidate job strictly satisfies user search query filters:
 * - Keyword relevance (technology requirements like .NET, React, Python)
 * - City / Region location constraints
 * - Onsite / Hybrid / Remote employment modes
 */
export function isJobMatchingQuery(job: Job, query: JobSearchQuery): boolean {
  if (!query) return true;

  // 1. Keyword strict matching
  if (query.keywords && query.keywords.trim().length > 0) {
    const rawKw = query.keywords.trim().toLowerCase();
    const textToMatch = `${job.title} ${job.company} ${job.location} ${job.description} ${(job.requirements || []).join(' ')}`.toLowerCase();

    // Check specific tech stack anchor keywords
    if (rawKw.includes('.net') || rawKw.includes('dotnet')) {
      if (!textToMatch.includes('.net') && !textToMatch.includes('dotnet') && !textToMatch.includes('c#')) {
        return false;
      }
    }

    const keywords = rawKw
      .replace(/[^a-z0-9\.\+\#\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !['in', 'for', 'at', 'and', 'or', 'the', 'with', 'job', 'jobs', 'hiring'].includes(w));

    if (keywords.length > 0) {
      const matchCount = keywords.filter(w => textToMatch.includes(w)).length;
      const requiredMatches = Math.min(keywords.length, Math.ceil(keywords.length * 0.5));
      if (matchCount < requiredMatches) {
        return false;
      }
    }
  }

  // 2. Location strict matching
  if (query.location && query.location.trim().length > 0 && query.location.toLowerCase() !== 'all') {
    const queryLocLower = query.location.toLowerCase();
    const jobLocLower = (job.location || '').toLowerCase();

    const locTokens = queryLocLower.split(/[,\s]+/).filter(w => w.length > 2 && !['india', 'usa', 'remote', 'all'].includes(w));

    if (locTokens.length > 0) {
      const matchesLocToken = locTokens.some(tok => jobLocLower.includes(tok));
      const isGlobalRemote = jobLocLower.includes('remote') || job.remoteType === 'remote';

      if (!matchesLocToken) {
        // If user explicitly asked for onsite or hybrid in a specific city, exclude non-local/overseas remote jobs
        if (query.remoteType === 'onsite' || query.remoteType === 'hybrid') {
          return false;
        }
        // Exclude overseas remote jobs when searching for a specific city like "Ahmedabad"
        const overseasRegions = ['canada', 'united states', 'us', 'germany', 'uk', 'poland', 'spain', 'france', 'turkey', 'austria', 'netherlands', 'sweden'];
        if (isGlobalRemote && overseasRegions.some(region => jobLocLower.includes(region))) {
          return false;
        }
      }
    }
  }

  // 3. Remote Type strict matching
  if (query.remoteType && query.remoteType !== 'all') {
    const desiredRemote = query.remoteType.toLowerCase();
    const jobRemote = (job.remoteType || '').toLowerCase();
    const jobLocLower = (job.location || '').toLowerCase();

    if (desiredRemote === 'onsite') {
      if (jobRemote === 'remote' || jobLocLower.startsWith('remote')) {
        return false;
      }
    } else if (desiredRemote === 'remote') {
      if (jobRemote === 'onsite' && !jobLocLower.includes('remote')) {
        return false;
      }
    } else if (desiredRemote === 'hybrid') {
      if (jobRemote === 'remote' && !jobLocLower.includes('hybrid')) {
        return false;
      }
    }
  }

  return true;
}
