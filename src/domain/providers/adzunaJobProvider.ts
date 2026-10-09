import { JobProvider, JobSearchQuery, JobSearchResult } from '../jobProvider';
import { Job } from '../../types';

export interface AdzunaConfig {
  appId?: string;
  appKey?: string;
  country?: string;
}

/**
 * Adzuna Jobs REST API Provider Adapter
 * Official Adzuna Developer API: https://developer.adzuna.com
 */
export class AdzunaJobProvider implements JobProvider {
  public id = 'adzuna_provider';
  public name = 'Adzuna Jobs API';
  private appId: string;
  private appKey: string;
  private country: string;

  constructor(config: AdzunaConfig = {}) {
    const procEnv = (globalThis as any).process?.env || {};
    const metaEnv = (import.meta as any).env || {};
    this.appId = config.appId !== undefined ? config.appId : (procEnv.ADZUNA_APP_ID || metaEnv.VITE_ADZUNA_APP_ID || '');
    this.appKey = config.appKey !== undefined ? config.appKey : (procEnv.ADZUNA_APP_KEY || metaEnv.VITE_ADZUNA_APP_KEY || '');
    this.country = config.country || 'in'; // Default 'in' for India coverage
  }

  public isConfigured(): boolean {
    return Boolean(this.appId && this.appKey && this.appId.trim().length > 0 && this.appKey.trim().length > 0);
  }

  public async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    if (!this.isConfigured()) {
      return { jobs: [], total: 0, providerId: this.id };
    }

    const page = 1;
    const resultsPerPage = query.limit || 20;
    const what = encodeURIComponent(query.keywords);
    const where = encodeURIComponent(query.location || 'India');
    const endpoint = `https://api.adzuna.com/v1/api/jobs/${this.country}/search/${page}?app_id=${this.appId.trim()}&app_key=${this.appKey.trim()}&results_per_page=${resultsPerPage}&what=${what}&where=${where}`;
    const nowIso = new Date().toISOString();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        console.warn(`[AdzunaJobProvider] API returned HTTP status ${response.status}`);
        return { jobs: [], total: 0, providerId: this.id };
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.results)) {
        return { jobs: [], total: 0, providerId: this.id };
      }

      const jobs: Job[] = data.results.map((raw: any, index: number) => {
        const rawTitle = (raw.title || '').replace(/<[^>]*>/g, '').trim();
        const description = (raw.description || '').replace(/<[^>]*>/g, '').trim();
        const companyName = (raw.company?.display_name || 'Enterprise Employer').trim();
        const locationName = (raw.location?.display_name || query.location || 'India').trim();
        const sourceUrl = raw.redirect_url || 'https://www.adzuna.co.in';

        let salaryText = 'Not specified';
        if (raw.salary_min || raw.salary_max) {
          const min = raw.salary_min ? Math.round(raw.salary_min) : null;
          const max = raw.salary_max ? Math.round(raw.salary_max) : null;
          if (min && max) salaryText = `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
          else if (min) salaryText = `From ₹${min.toLocaleString()}`;
          else if (max) salaryText = `Up to ₹${max.toLocaleString()}`;
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
          id: `job_adzuna_${raw.id || index}_${Date.now()}`,
          provider: this.id,
          providerJobId: String(raw.id || index),
          title: rawTitle || query.keywords,
          company: companyName,
          location: locationName,
          remoteType: description.toLowerCase().includes('remote') ? 'remote' : (query.remoteType || 'all'),
          employmentType: 'full-time',
          description: description || `Job vacancy for ${rawTitle} at ${companyName}.`,
          requirements: extractedSkills,
          preferredSkills: extractedSkills.slice(0, 3),
          salary: salaryText,
          sourceUrl,
          publishedAt: raw.created || nowIso,
          discoveredAt: nowIso,
          lastVerifiedAt: nowIso
        };
      });

      return {
        jobs,
        total: data.count || jobs.length,
        providerId: this.id
      };
    } catch (err: any) {
      console.error('[AdzunaJobProvider] Search request failed:', err?.message || err);
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
