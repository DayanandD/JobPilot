import { JobProvider, JobSearchQuery, JobSearchResult, deduplicateJobs } from '../jobProvider';
import { AnnaWebJobProvider } from '../annaWebJobProvider';
import { JoobleJobProvider } from './joobleJobProvider';
import { AdzunaJobProvider } from './adzunaJobProvider';
import { JSearchJobProvider } from './jsearchJobProvider';
import { GreenhouseJobProvider } from './greenhouseJobProvider';
import { LeverJobProvider } from './leverJobProvider';
import { Job } from '../../types';

export class MultiJobProvider implements JobProvider {
  public id = 'multi_provider';
  public name = 'JobPilot Production Multi-Provider Aggregator';
  private providers: JobProvider[];

  constructor(customProviders?: JobProvider[]) {
    if (customProviders && customProviders.length > 0) {
      this.providers = customProviders;
    } else {
      this.providers = [
        new JoobleJobProvider(),
        new AdzunaJobProvider(),
        new JSearchJobProvider(),
        new GreenhouseJobProvider(),
        new LeverJobProvider(),
        new AnnaWebJobProvider()
      ];
    }
  }

  public async searchJobs(query: JobSearchQuery): Promise<JobSearchResult> {
    const results = await Promise.allSettled(
      this.providers.map(p => p.searchJobs(query))
    );

    const allJobs: Job[] = [];
    for (const res of results) {
      if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.jobs)) {
        allJobs.push(...res.value.jobs);
      }
    }

    const deduplicated = deduplicateJobs(allJobs);

    return {
      jobs: deduplicated,
      total: deduplicated.length,
      providerId: this.id
    };
  }

  public async getJobDetails(jobId: string): Promise<Job | null> {
    for (const provider of this.providers) {
      try {
        const details = await provider.getJobDetails(jobId);
        if (details) return details;
      } catch (err) {
        // Continue to next provider
      }
    }
    return null;
  }

  public async healthCheck(): Promise<boolean> {
    const healthResults = await Promise.allSettled(
      this.providers.map(p => p.healthCheck())
    );
    return healthResults.some(r => r.status === 'fulfilled' && r.value === true);
  }
}
