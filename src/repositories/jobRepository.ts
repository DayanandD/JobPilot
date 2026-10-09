import { JobProvider, JobSearchQuery, deduplicateJobs } from '../domain/jobProvider';
import { MultiJobProvider } from '../domain/providers/multiJobProvider';
import { rankAndRecommendJobs } from '../domain/matchEngine';
import { CandidateProfile, Job } from '../types';

let primaryJobProvider: JobProvider = new MultiJobProvider();

export function setJobProvider(provider: JobProvider) {
  primaryJobProvider = provider;
}

export function getJobProvider(): JobProvider {
  return primaryJobProvider;
}

export async function searchJobsWithDeduplication(
  query: JobSearchQuery,
  profile?: CandidateProfile | null
): Promise<Job[]> {
  try {
    const result = await primaryJobProvider.searchJobs(query);
    const deduplicated = deduplicateJobs(result.jobs);
    return rankAndRecommendJobs(deduplicated, profile || null, query);
  } catch (err) {
    console.error('Job search failed in jobRepository:', err);
    return [];
  }
}

export async function fetchJobDetails(jobId: string): Promise<Job | null> {
  try {
    return await primaryJobProvider.getJobDetails(jobId);
  } catch (err) {
    console.error(`Failed to fetch job details for ID ${jobId}:`, err);
    return null;
  }
}
