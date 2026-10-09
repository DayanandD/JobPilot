import { describe, it, expect } from 'vitest';
import { 
  deduplicateJobs, 
  calculateJobFreshness, 
  parseExperienceYears, 
  normalizeStringForKey 
} from '../domain/jobProvider';
import { Job } from '../types';

describe('JobProvider Domain & Deduplication Tests', () => {
  const sampleJob1: Job = {
    id: 'j1',
    provider: 'p1',
    providerJobId: '1001',
    title: 'Senior .NET Developer',
    company: 'TechCorp Solutions',
    location: 'Hyderabad',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'C# developer job',
    requirements: ['C#', 'ASP.NET Core'],
    preferredSkills: ['AWS'],
    salary: '$100k',
    sourceUrl: 'https://jobs.example.com/item/1001?utm=1',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  const sampleJob2: Job = {
    id: 'j2',
    provider: 'p1',
    providerJobId: '1001', // Duplicate Provider ID
    title: 'Senior .NET Developer',
    company: 'TechCorp Solutions',
    location: 'Hyderabad',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'C# developer job duplicate',
    requirements: ['C#'],
    preferredSkills: [],
    sourceUrl: 'https://jobs.example.com/item/1001?utm=2',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  const sampleJob3: Job = {
    id: 'j3',
    provider: 'p2',
    providerJobId: '2002',
    title: 'senior dotnet developer', // Normalized composite duplicate
    company: 'techcorp-solutions',
    location: 'hyderabad',
    remoteType: 'remote',
    employmentType: 'full-time',
    description: 'Another duplicate entry',
    requirements: ['C#'],
    preferredSkills: [],
    sourceUrl: 'https://jobs.example.com/item/2002',
    publishedAt: 'Not specified',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  const sampleJob4: Job = {
    id: 'j4',
    provider: 'p3',
    providerJobId: '3003',
    title: 'Frontend React Engineer',
    company: 'WebWorks Inc',
    location: 'Remote',
    remoteType: 'remote',
    employmentType: 'full-time',
    description: 'React developer job',
    requirements: ['React', 'TypeScript'],
    preferredSkills: [],
    sourceUrl: 'https://webworks.com/careers/react',
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  it('deduplicates jobs by Provider ID, Canonical URL, and Company+Title+Location composite key', () => {
    const rawJobs = [sampleJob1, sampleJob2, sampleJob3, sampleJob4];
    const deduplicated = deduplicateJobs(rawJobs);

    expect(deduplicated.length).toBe(2);
    expect(deduplicated[0].id).toBe('j1');
    expect(deduplicated[1].id).toBe('j4');
  });

  it('normalizes string keys accurately', () => {
    expect(normalizeStringForKey('TechCorp Solutions! Inc.')).toBe('techcorpsolutionsinc');
  });

  it('calculates job freshness accurately', () => {
    const freshInfo = calculateJobFreshness(sampleJob1);
    expect(freshInfo.isFresh).toBe(true);
    expect(freshInfo.publishedDaysAgo).toBe(2);
    expect(freshInfo.verificationStatus).toBe('verified_active');

    const oldInfo = calculateJobFreshness(sampleJob4);
    expect(oldInfo.isFresh).toBe(false);
    expect(oldInfo.publishedDaysAgo).toBe(30);

    const unverifiedInfo = calculateJobFreshness(sampleJob3);
    expect(unverifiedInfo.publishedDaysAgo).toBeNull();
    expect(unverifiedInfo.verificationStatus).toBe('unverified_date');
  });

  it('parses experience years from raw requirement strings', () => {
    expect(parseExperienceYears('Requires 3-5 years of experience')).toBe(3);
    expect(parseExperienceYears('Senior engineer with 5+ yrs exp')).toBe(5);
    expect(parseExperienceYears('Fresh graduate welcome')).toBe(0);
  });
});
