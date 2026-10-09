import { JobProvider, JobSearchQuery, JobSearchResult } from '../jobProvider';
import { Job } from '../../types';

export interface JSearchConfig {
  rapidApiKey?: string;
  baseUrl?: string;
}

/**
 * JSearch RapidAPI Provider Adapter
 * Official JSearch documentation: https://rapidapi.com/letscrape-6bb85285-b8f6-407d-b530-3692d9580f5b/api/jsearch
 */
export class JSearchJobProvider implements JobProvider {
  public id = 'jsearch_provider';
  public name = 'JSearch RapidAPI Provider';
  private rapidApiKey: string;
  private baseUrl: string;

  constructor(config: JSearchConfig = {}) {
    const procEnv = (globalThis as any).process?.env || {};
    const metaEnv = (import.meta as any).env || {};
    this.rapidApiKey = config.rapidApiKey !== undefined ? config.rapidApiKey : (procEnv.RAPIDAPI_KEY || metaEnv.VITE_RAPIDAPI_KEY || '');
    this.baseUrl = config.baseUrl || 'https://jsearch.p.rapidapi.com';
  }

  public isConfigured(): boolean {
    return Boolean(this.rapidApiKey && this.rapidApiKey.trim().length > 0);
  }

  public async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    if (!this.isConfigured()) {
      return { jobs: [], total: 0, providerId: this.id };
    }

    const searchQueryStr = `${query.keywords} in ${query.location || 'India'}`;
    const endpoint = `${this.baseUrl}/search?query=${encodeURIComponent(searchQueryStr)}&page=1&num_pages=1`;
    const nowIso = new Date().toISOString();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.rapidApiKey.trim(),
          'x-rapidapi-host': 'jsearch.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        console.warn(`[JSearchJobProvider] API returned HTTP status ${response.status}`);
        return { jobs: [], total: 0, providerId: this.id };
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.data)) {
        return { jobs: [], total: 0, providerId: this.id };
      }

      const jobs: Job[] = data.data.map((raw: any, index: number) => {
        const rawTitle = (raw.job_title || '').trim();
        const description = (raw.job_description || '').trim();
        const companyName = (raw.employer_name || 'Enterprise Employer').trim();
        const locationName = [raw.job_city, raw.job_state, raw.job_country].filter(Boolean).join(', ') || query.location || 'India';
        const sourceUrl = raw.job_apply_link || raw.job_google_link || 'https://example.com';

        let salaryText = 'Not specified';
        if (raw.job_min_salary || raw.job_max_salary) {
          const min = raw.job_min_salary;
          const max = raw.job_max_salary;
          const curr = raw.job_salary_currency || '$';
          if (min && max) salaryText = `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()}`;
          else if (min) salaryText = `${curr}${min.toLocaleString()}`;
          else if (max) salaryText = `${curr}${max.toLocaleString()}`;
        }

        const extractedSkills: string[] = [];
        const techDict = ['C#', 'ASP.NET Core', '.NET', 'React', 'TypeScript', 'JavaScript', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'Node.js', 'Java', 'Spring Boot', 'SQL'];
        for (const tech of techDict) {
          const regex = new RegExp('\\b' + tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
          if (regex.test(description) && !extractedSkills.includes(tech)) {
            extractedSkills.push(tech);
          }
        }
        if (extractedSkills.length === 0) {
          extractedSkills.push('Software Engineering');
        }

        return {
          id: `job_jsearch_${raw.job_id || index}_${Date.now()}`,
          provider: this.id,
          providerJobId: String(raw.job_id || index),
          title: rawTitle || query.keywords,
          company: companyName,
          location: locationName,
          remoteType: raw.job_is_remote ? 'remote' : (query.remoteType || 'all'),
          employmentType: 'full-time',
          description: description || `Job vacancy for ${rawTitle} at ${companyName}.`,
          requirements: extractedSkills,
          preferredSkills: extractedSkills.slice(0, 3),
          salary: salaryText,
          sourceUrl,
          publishedAt: raw.job_posted_at_timestamp ? new Date(raw.job_posted_at_timestamp * 1000).toISOString() : nowIso,
          discoveredAt: nowIso,
          lastVerifiedAt: nowIso
        };
      });

      return {
        jobs,
        total: jobs.length,
        providerId: this.id
      };
    } catch (err: any) {
      console.error('[JSearchJobProvider] Search request failed:', err?.message || err);
      return { jobs: [], total: 0, providerId: this.id };
    }
  }

  public async getJobDetails(_jobId: string): Promise<Job | null> {
    return null;
  }

  public async healthCheck(): Promise<boolean> {
    return this.isConfigured();
  }
}
