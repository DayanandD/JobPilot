import { JobProvider, JobSearchQuery, JobSearchResult } from '../jobProvider';
import { Job } from '../../types';

export interface JoobleConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Jooble REST API Provider Adapter
 * Official Jooble API documentation: https://jooble.org/api/about
 */
export class JoobleJobProvider implements JobProvider {
  public id = 'jooble_provider';
  public name = 'Jooble Jobs REST API';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: JoobleConfig = {}) {
    const procEnv = (globalThis as any).process?.env || {};
    const metaEnv = (import.meta as any).env || {};
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (procEnv.JOOBLE_API_KEY || metaEnv.VITE_JOOBLE_API_KEY || '');
    this.baseUrl = config.baseUrl || 'https://jooble.org/api';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    if (!this.isConfigured()) {
      return { jobs: [], total: 0, providerId: this.id };
    }

    const endpoint = `${this.baseUrl}/${this.apiKey.trim()}`;
    const nowIso = new Date().toISOString();

    const requestBody = {
      keywords: query.keywords,
      location: query.location || 'India',
      page: 1,
      resultonpage: query.limit || 20
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.warn(`[JoobleJobProvider] API returned HTTP status ${response.status}`);
        return { jobs: [], total: 0, providerId: this.id };
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.jobs)) {
        return { jobs: [], total: 0, providerId: this.id };
      }

      const jobs: Job[] = data.jobs.map((raw: any, index: number) => {
        const rawTitle = (raw.title || '').replace(/<[^>]*>/g, '').trim();
        const snippet = (raw.snippet || '').replace(/<[^>]*>/g, '').trim();
        const rawLocation = (raw.location || query.location || 'India').trim();
        const companyName = (raw.company || raw.source || 'Enterprise Employer').trim();
        const salaryText = raw.salary && raw.salary.trim() ? raw.salary.trim() : 'Not specified';
        const sourceUrl = raw.link || `https://jooble.org/desc/${raw.id || index}`;

        // Extract skills from snippet
        const extractedSkills: string[] = [];
        const techDict = ['C#', 'ASP.NET Core', '.NET', 'React', 'TypeScript', 'JavaScript', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'Node.js', 'Java', 'Spring Boot', 'SQL'];
        for (const tech of techDict) {
          const regex = new RegExp('\\b' + tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
          if (regex.test(snippet) && !extractedSkills.includes(tech)) {
            extractedSkills.push(tech);
          }
        }
        if (extractedSkills.length === 0) {
          extractedSkills.push('Software Engineering');
        }

        return {
          id: `job_jooble_${raw.id || index}_${Date.now()}`,
          provider: this.id,
          providerJobId: String(raw.id || index),
          title: rawTitle || query.keywords,
          company: companyName,
          location: rawLocation,
          remoteType: raw.type && raw.type.toLowerCase().includes('remote') ? 'remote' : (query.remoteType || 'all'),
          employmentType: 'full-time',
          description: snippet || `Job vacancy for ${rawTitle} at ${companyName}.`,
          requirements: extractedSkills,
          preferredSkills: extractedSkills.slice(0, 3),
          salary: salaryText,
          sourceUrl,
          publishedAt: raw.updated || nowIso,
          discoveredAt: nowIso,
          lastVerifiedAt: nowIso
        };
      });

      return {
        jobs,
        total: data.totalCount || jobs.length,
        providerId: this.id
      };
    } catch (err: any) {
      console.error('[JoobleJobProvider] Search request failed:', err?.message || err);
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
