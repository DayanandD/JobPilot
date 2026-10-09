import { describe, it, expect } from 'vitest';
import { analyzeJobDescription, JobAnalysisResultSchema } from '../domain/jobAnalyzer';
import { Job } from '../types';

describe('JobAnalyzer Subsystem Tests', () => {
  const sampleJob: Job = {
    id: 'job_test_1',
    provider: 'anna_web_provider',
    providerJobId: '101',
    title: 'Senior .NET Developer',
    company: 'TechCorp Solutions',
    location: 'Hyderabad',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'Looking for a Senior .NET Developer with 5+ years experience in C#, ASP.NET Core, React, PostgreSQL, AWS, and Docker.',
    requirements: ['C#', 'ASP.NET Core', 'React', 'PostgreSQL'],
    preferredSkills: ['AWS', 'Docker'],
    salary: 'Not specified',
    sourceUrl: 'https://example.com/job/101',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  it('validates JobAnalysisResult schema with Zod', () => {
    const validData = {
      title: 'Senior .NET Developer',
      company: 'TechCorp Solutions',
      location: 'Hyderabad',
      experienceRequired: 5,
      requiredSkills: ['C#', 'ASP.NET Core'],
      preferredSkills: ['AWS'],
      responsibilities: ['Build APIs'],
      education: 'Not specified',
      salary: 'Not specified',
      employmentType: 'full-time',
      remoteType: 'hybrid',
      importantKeywords: ['C#'],
      potentialConcerns: []
    };

    const parseResult = JobAnalysisResultSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('analyzes job description and returns normalized structured result', async () => {
    const result = await analyzeJobDescription(sampleJob);
    expect(result.title).toBe('Senior .NET Developer');
    expect(result.experienceRequired).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.requiredSkills)).toBe(true);
    expect(result.education).toBeDefined();
  });

  it('enforces grounding rule for missing parameters without fabricating facts', async () => {
    const sparseJob: Job = {
      ...sampleJob,
      id: 'job_sparse_2',
      salary: undefined as any,
      description: 'Generic developer position.'
    };

    const result = await analyzeJobDescription(sparseJob);
    expect(result.salary).toBe('Not specified');
    expect(result.potentialConcerns).toEqual([]);
  });
});
