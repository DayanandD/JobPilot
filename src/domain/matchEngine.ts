import { CandidateProfile, Job, JobMatchResult, MatchBreakdown } from '../types';
import { normalizeSkillName } from './profileDomain';
import { parseExperienceYears, JobSearchQuery, calculateJobFreshness, filterFreshJobs, isJobMatchingQuery } from './jobProvider';
import { invokeExecutaTool } from '../anna/annaTools';

export interface MatchWeights {
  skills: number;       // Default 40%
  experience: number;   // Default 20%
  role: number;         // Default 15%
  location: number;     // Default 10%
  seniority: number;    // Default 10%
  education: number;    // Default 5%
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  skills: 40,
  experience: 20,
  role: 15,
  location: 10,
  seniority: 10,
  education: 5
};

/**
 * Calculates a pure deterministic 6-vector match score between candidate profile and job posting.
 */
export function calculateJobMatch(
  profile: CandidateProfile | null, 
  job: Job,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): JobMatchResult {
  if (!profile) {
    return createEmptyMatchResult(job);
  }

  // 1. Skills Matching Vector (40%)
  const candidateSkillNames = (profile.skills || []).map(s => normalizeSkillName(s.name).toLowerCase());
  const jobRequirements = (job.requirements || []).map(r => normalizeSkillName(r).toLowerCase());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  jobRequirements.forEach(req => {
    if (candidateSkillNames.some(cs => isSkillEquivalent(cs, req))) {
      matchedSkills.push(normalizeSkillName(req));
    } else {
      missingSkills.push(normalizeSkillName(req));
    }
  });

  const skillsMatchRatio = jobRequirements.length > 0 ? (matchedSkills.length / jobRequirements.length) : 1;
  const skillsScore = Math.round(skillsMatchRatio * weights.skills);

  // 2. Experience Matching Vector (20%)
  const requiredYears = parseExperienceYears(job.description) || 3;
  const candidateYears = profile.yearsOfExperience || 0;
  const meetsExperience = candidateYears >= requiredYears;

  let experienceScore = 0;
  if (meetsExperience) {
    experienceScore = weights.experience;
  } else if (requiredYears > 0) {
    experienceScore = Math.round((candidateYears / requiredYears) * weights.experience);
  }

  // 3. Role Title Matching Vector (15%)
  const candidateTitleLower = (profile.title || '').toLowerCase();
  const jobTitleLower = (job.title || '').toLowerCase();
  
  let roleScore = 0;
  if (candidateTitleLower && jobTitleLower) {
    if (candidateTitleLower === jobTitleLower) {
      roleScore = weights.role;
    } else if (candidateTitleLower.includes(jobTitleLower) || jobTitleLower.includes(candidateTitleLower)) {
      roleScore = Math.round(weights.role * 0.85);
    } else {
      const commonWords = candidateTitleLower.split(' ').filter(w => w.length > 2 && jobTitleLower.includes(w));
      roleScore = commonWords.length > 0 ? Math.round(weights.role * 0.6) : Math.round(weights.role * 0.3);
    }
  }

  // 4. Location & Remote Matching Vector (10%)
  let locationScore = 0;
  const candidateLocLower = (profile.location || '').toLowerCase();
  const jobLocLower = (job.location || '').toLowerCase();

  if (job.remoteType === 'remote' || (profile.preferences && profile.preferences.remotePreference === 'remote')) {
    locationScore = weights.location;
  } else if (candidateLocLower && jobLocLower && (candidateLocLower.includes(jobLocLower) || jobLocLower.includes(candidateLocLower))) {
    locationScore = weights.location;
  } else {
    locationScore = Math.round(weights.location * 0.5);
  }

  // 5. Seniority Matching Vector (10%)
  const seniorityScore = calculateSeniorityScore(profile.title, job.title, weights.seniority);

  // 6. Education Vector (5%)
  const hasEducation = (profile.education && profile.education.length > 0);
  const educationScore = hasEducation ? weights.education : Math.round(weights.education * 0.5);

  // Total Final Score calculation (Sum of vectors)
  const totalScore = Math.min(100, skillsScore + experienceScore + roleScore + locationScore + seniorityScore + educationScore);

  const breakdown: MatchBreakdown = {
    skillsScore,
    experienceScore,
    roleScore,
    locationScore,
    seniorityScore,
    educationScore
  };

  const strengths: string[] = [];
  if (matchedSkills.length > 0) {
    strengths.push(`Matches ${matchedSkills.length} required skill${matchedSkills.length === 1 ? '' : 's'}: ${matchedSkills.slice(0, 3).join(', ')}`);
  }
  if (meetsExperience) {
    strengths.push(`Meets experience requirement (${candidateYears} yrs candidate vs ${requiredYears} yrs required)`);
  }
  if (locationScore >= weights.location) {
    strengths.push(`Compatible location and remote work policy`);
  }

  const concerns: string[] = [];
  if (missingSkills.length > 0) {
    concerns.push(`Missing key skill${missingSkills.length === 1 ? '' : 's'}: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (!meetsExperience) {
    concerns.push(`Years of experience (${candidateYears} yrs) below target (${requiredYears} yrs)`);
  }

  return {
    jobId: job.id,
    totalScore,
    breakdown,
    matchedSkills,
    partialSkills: [],
    missingSkills,
    experienceComparison: {
      required: requiredYears,
      candidate: candidateYears,
      meetsRequirement: meetsExperience
    },
    strengths,
    concerns
  };
}

/**
 * Checks whether candidate skill and required skill are equivalent technologies.
 */
export function isSkillEquivalent(candidateSkill: string, requiredSkill: string): boolean {
  const c = candidateSkill.toLowerCase().trim();
  const r = requiredSkill.toLowerCase().trim();

  if (c === r) return true;
  if (c.includes(r) || r.includes(c)) return true;

  const EQUIVALENCES: Record<string, string[]> = {
    'c#': ['.net', 'asp.net', 'asp.net core', '.net core'],
    'asp.net core': ['c#', '.net', '.net core'],
    '.net core': ['c#', 'asp.net core', '.net'],
    'react': ['react.js', 'javascript', 'typescript'],
    'typescript': ['javascript', 'ts'],
    'postgresql': ['postgres', 'sql'],
    'aws': ['cloud', 'amazon web services']
  };

  if (EQUIVALENCES[c] && EQUIVALENCES[c].includes(r)) return true;
  if (EQUIVALENCES[r] && EQUIVALENCES[r].includes(c)) return true;

  return false;
}

export function calculateSeniorityScore(candidateTitle: string, jobTitle: string, maxWeight: number): number {
  const cTitle = (candidateTitle || '').toLowerCase();
  const jTitle = (jobTitle || '').toLowerCase();

  const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal', 'staff'];

  let candidateLevel = 1;
  let jobLevel = 1;

  SENIORITY_LEVELS.forEach((level, index) => {
    if (cTitle.includes(level)) candidateLevel = index;
    if (jTitle.includes(level)) jobLevel = index;
  });

  const diff = Math.abs(candidateLevel - jobLevel);
  if (diff === 0) return maxWeight;
  if (diff === 1) return Math.round(maxWeight * 0.8);
  return Math.round(maxWeight * 0.5);
}

export function createEmptyMatchResult(job: Job): JobMatchResult {
  return {
    jobId: job.id,
    totalScore: 0,
    breakdown: {
      skillsScore: 0,
      experienceScore: 0,
      roleScore: 0,
      locationScore: 0,
      seniorityScore: 0,
      educationScore: 0
    },
    matchedSkills: [],
    partialSkills: [],
    missingSkills: job.requirements || [],
    experienceComparison: {
      required: 3,
      candidate: 0,
      meetsRequirement: false
    },
    strengths: [],
    concerns: ['Candidate profile incomplete. Set up profile to calculate match score.']
  };
}

export async function matchCandidateWithExecuta(profile: CandidateProfile, job: Job): Promise<JobMatchResult> {
  try {
    const res = await invokeExecutaTool<JobMatchResult>('match_candidate', { profile, job });
    if (res.success && res.data && typeof res.data.totalScore === 'number') {
      return res.data;
    }
  } catch (e) {
    console.warn('Executa match_candidate call failed, using deterministic match engine:', e);
  }
  return calculateJobMatch(profile, job);
}

/**
 * 3-Tier Job Prioritization & Recommendation Engine:
 * Tier 1: User-Selected Search Filters (Keywords, Location, Remote Type, Freshness Age Cutoff)
 * Tier 2: Candidate Profile 6-Vector Match Score (Skills, Experience, Role, Location, Seniority, Education)
 * Tier 3: AI Recommendation Ranking (Composite Score & Freshness Priority Sorting)
 */
export function rankAndRecommendJobs(
  jobs: Job[],
  profile: CandidateProfile | null,
  query?: JobSearchQuery
): Job[] {
  const maxAge = query?.maxAgeDays !== undefined ? query.maxAgeDays : 14;

  // Step 1: Filter out jobs older than maxAgeDays cutoff (Tier 1 cutoff: default 14 days)
  let matchingJobs = maxAge > 0 ? filterFreshJobs(jobs, maxAge) : jobs;

  // Step 1b: Strictly enforce search query parameters (Keywords, Location, Remote Type)
  if (query) {
    matchingJobs = matchingJobs.filter(job => isJobMatchingQuery(job, query));
  }

  // Step 2 & 3: Score and rank candidate jobs
  const scored = matchingJobs.map(job => {
    const match = calculateJobMatch(profile, job);
    const freshness = calculateJobFreshness(job);

    // Tier 1: User Filter Compliance Score
    let userFilterScore = 100;
    if (query?.keywords && query.keywords.trim().length > 0) {
      const kw = query.keywords.toLowerCase();
      const text = `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase();
      if (!text.includes(kw)) {
        userFilterScore -= 30;
      }
    }
    if (query?.location && query.location.trim().length > 0 && query.location.toLowerCase() !== 'all') {
      const loc = query.location.toLowerCase();
      const jobLoc = job.location.toLowerCase();
      if (!jobLoc.includes(loc) && !jobLoc.includes('remote')) {
        userFilterScore -= 20;
      }
    }
    userFilterScore = Math.max(0, userFilterScore);

    // Freshness Score (100 for today/1d, 85 for 2-3d, 75 for 4-7d, 50 for 8-14d)
    let freshnessScore = 70;
    if (freshness.publishedDaysAgo !== null) {
      if (freshness.publishedDaysAgo <= 1) freshnessScore = 100;
      else if (freshness.publishedDaysAgo <= 3) freshnessScore = 85;
      else if (freshness.publishedDaysAgo <= 7) freshnessScore = 75;
      else if (freshness.publishedDaysAgo <= 14) freshnessScore = 50;
      else freshnessScore = 20;
    }

    // Tier 3 Composite Recommendation Score: 50% Candidate Profile Match + 30% User Filter Adherence + 20% Job Freshness
    const recommendationScore = Math.round(
      (match.totalScore * 0.50) +
      (userFilterScore * 0.30) +
      (freshnessScore * 0.20)
    );

    return {
      job,
      matchScore: match.totalScore,
      recommendationScore,
      publishedDaysAgo: freshness.publishedDaysAgo
    };
  });

  // Sort descending by Recommendation Score
  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scored.map(s => s.job);
}
