import { JobProvider, JobSearchQuery, JobSearchResult, isJobMatchingQuery } from '../jobProvider';
import { Job } from '../../types';

export interface GreenhouseConfig {
  boardTokens?: string[];
}

/**
 * Greenhouse Public Career Board Provider Adapter
 * Official Greenhouse Public API: https://boards-api.greenhouse.io/v1/boards/{board}/jobs
 */
export class GreenhouseJobProvider implements JobProvider {
  public id = 'greenhouse_provider';
  public name = 'Greenhouse Public Career API';
  private boardTokens: string[];

  constructor(config: GreenhouseConfig = {}) {
    this.boardTokens = config.boardTokens || ['gitlab', 'cloudflare', 'docker', 'canonical'];
  }

  public async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    const nowIso = new Date().toISOString();
    const allJobs: Job[] = [];

    for (const boardToken of this.boardTokens) {
      try {
        const endpoint = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
        const response = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!data || !Array.isArray(data.jobs)) continue;

        const companyName = boardToken.charAt(0).toUpperCase() + boardToken.slice(1);

        for (const raw of data.jobs) {
          const rawTitle = (raw.title || '').trim();
          const locationName = (raw.location?.name || 'Remote').trim();
          const content = (raw.content || '').replace(/<[^>]*>/g, '').trim();

          const tempJob: Job = {
            id: `job_gh_${boardToken}_${raw.id}`,
            provider: this.id,
            providerJobId: String(raw.id),
            title: rawTitle,
            company: companyName,
            location: locationName,
            remoteType: locationName.toLowerCase().includes('remote') ? 'remote' : 'onsite',
            employmentType: 'full-time',
            description: content || `Job posting for ${rawTitle} at ${companyName}.`,
            requirements: [],
            preferredSkills: [],
            salary: 'Not specified',
            sourceUrl: raw.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${raw.id}`,
            publishedAt: raw.updated_at || nowIso,
            discoveredAt: nowIso,
            lastVerifiedAt: nowIso
          };

          if (!isJobMatchingQuery(tempJob, query)) continue;

          const extractedSkills: string[] = [];
          const techDict = ['C#', 'ASP.NET Core', '.NET', 'React', 'TypeScript', 'JavaScript', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'Node.js', 'Java', 'Spring Boot', 'SQL'];
          for (const tech of techDict) {
            const regex = new RegExp('\\b' + tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
            if (regex.test(content || rawTitle) && !extractedSkills.includes(tech)) {
              extractedSkills.push(tech);
            }
          }
          if (extractedSkills.length === 0) {
            extractedSkills.push('Software Engineering');
          }

          allJobs.push({
            id: `job_greenhouse_${boardToken}_${raw.id}_${Date.now()}`,
            provider: this.id,
            providerJobId: `${boardToken}_${raw.id}`,
            title: rawTitle,
            company: companyName,
            location: locationName,
            remoteType: locationName.toLowerCase().includes('remote') ? 'remote' : (query.remoteType || 'all'),
            employmentType: 'full-time',
            description: content ? content.slice(0, 1000) : `Engineering role for ${rawTitle} at ${companyName}.`,
            requirements: extractedSkills,
            preferredSkills: extractedSkills.slice(0, 3),
            salary: 'Not specified',
            sourceUrl: raw.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${raw.id}`,
            publishedAt: raw.updated_at || nowIso,
            discoveredAt: nowIso,
            lastVerifiedAt: nowIso
          });
        }
      } catch (err: any) {
        console.warn(`[GreenhouseJobProvider] Failed to fetch board ${boardToken}:`, err?.message || err);
      }
    }

    return {
      jobs: allJobs,
      total: allJobs.length,
      providerId: this.id
    };
  }

  public async getJobDetails(_jobId: string): Promise<Job | null> {
    return null;
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }
}
