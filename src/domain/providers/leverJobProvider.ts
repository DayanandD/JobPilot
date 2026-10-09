import { JobProvider, JobSearchQuery, JobSearchResult, isJobMatchingQuery } from '../jobProvider';
import { Job } from '../../types';

export interface LeverConfig {
  companies?: string[];
}

/**
 * Lever Public Career Board Provider Adapter
 * Official Lever Public Postings API: https://api.lever.co/v0/postings/{company}
 */
export class LeverJobProvider implements JobProvider {
  public id = 'lever_provider';
  public name = 'Lever Public Career API';
  private companies: string[];

  constructor(config: LeverConfig = {}) {
    this.companies = config.companies || ['netflix', 'spotify', 'twitch'];
  }

  public async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    const nowIso = new Date().toISOString();
    const allJobs: Job[] = [];

    for (const company of this.companies) {
      try {
        const endpoint = `https://api.lever.co/v0/postings/${company}?mode=json`;
        const response = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!Array.isArray(data)) continue;

        const companyName = company.charAt(0).toUpperCase() + company.slice(1);

        for (const raw of data) {
          const rawTitle = (raw.text || '').trim();
          const locationName = (raw.categories?.location || 'Remote').trim();
          const description = (raw.descriptionPlain || '').trim();

          const tempJob: Job = {
            id: `job_lever_${company}_${raw.id}`,
            provider: this.id,
            providerJobId: String(raw.id),
            title: rawTitle,
            company: companyName,
            location: locationName,
            remoteType: locationName.toLowerCase().includes('remote') ? 'remote' : 'onsite',
            employmentType: 'full-time',
            description: description || `Job posting for ${rawTitle} at ${companyName}.`,
            requirements: [],
            preferredSkills: [],
            salary: 'Not specified',
            sourceUrl: raw.hostedUrl || `https://jobs.lever.co/${company}/${raw.id}`,
            publishedAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : nowIso,
            discoveredAt: nowIso,
            lastVerifiedAt: nowIso
          };

          if (!isJobMatchingQuery(tempJob, query)) continue;

          const extractedSkills: string[] = [];
          const techDict = ['C#', 'ASP.NET Core', '.NET', 'React', 'TypeScript', 'JavaScript', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'Node.js', 'Java', 'Spring Boot', 'SQL'];
          for (const tech of techDict) {
            const regex = new RegExp('\\b' + tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
            if (regex.test(description || rawTitle) && !extractedSkills.includes(tech)) {
              extractedSkills.push(tech);
            }
          }
          if (extractedSkills.length === 0) {
            extractedSkills.push('Software Engineering');
          }

          allJobs.push({
            id: `job_lever_${company}_${raw.id}_${Date.now()}`,
            provider: this.id,
            providerJobId: `${company}_${raw.id}`,
            title: rawTitle,
            company: companyName,
            location: locationName,
            remoteType: locationName.toLowerCase().includes('remote') ? 'remote' : (query.remoteType || 'all'),
            employmentType: 'full-time',
            description: description ? description.slice(0, 1000) : `Engineering position for ${rawTitle} at ${companyName}.`,
            requirements: extractedSkills,
            preferredSkills: extractedSkills.slice(0, 3),
            salary: 'Not specified',
            sourceUrl: raw.hostedUrl || `https://jobs.lever.co/${company}/${raw.id}`,
            publishedAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : nowIso,
            discoveredAt: nowIso,
            lastVerifiedAt: nowIso
          });
        }
      } catch (err: any) {
        console.warn(`[LeverJobProvider] Failed to fetch company ${company}:`, err?.message || err);
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
