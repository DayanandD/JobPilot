import { describe, it, expect } from 'vitest';
import { 
  calculateJobMatch, 
  isSkillEquivalent, 
  calculateSeniorityScore 
} from '../domain/matchEngine';
import { CandidateProfile, Job } from '../types';

describe('Deterministic Match Engine Subsystem Tests', () => {
  const sampleProfile: CandidateProfile = {
    id: 'prof_test',
    fullName: 'Alex Mercer',
    email: 'alex@example.com',
    location: 'Hyderabad',
    title: 'Senior Software Engineer',
    summary: 'Fullstack developer with C#, React, PostgreSQL, and AWS expertise.',
    yearsOfExperience: 5,
    skills: [
      { name: 'C#' },
      { name: 'ASP.NET Core' },
      { name: 'React' },
      { name: 'PostgreSQL' },
      { name: 'AWS' }
    ],
    workExperience: [],
    education: [{ id: 'e1', institution: 'University', degree: 'BS', fieldOfStudy: 'CS' }],
    certifications: [],
    projects: [],
    preferences: {
      preferredRoles: ['Senior Software Engineer'],
      preferredLocations: ['Hyderabad'],
      remotePreference: 'all',
      employmentTypes: ['full-time']
    },
    isConfirmed: true
  };

  const sampleJob: Job = {
    id: 'job_match_1',
    provider: 'anna_web_provider',
    providerJobId: '201',
    title: 'Senior Software Engineer',
    company: 'TechCorp Solutions',
    location: 'Hyderabad',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'Requires 5 years experience in C#, React, PostgreSQL, AWS.',
    requirements: ['C#', 'React', 'PostgreSQL', 'AWS'],
    preferredSkills: [],
    salary: 'Not specified',
    sourceUrl: 'https://example.com/job/201',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  it('calculates deterministic 6-vector match score correctly', () => {
    const matchResult = calculateJobMatch(sampleProfile, sampleJob);
    
    expect(matchResult.totalScore).toBe(100);
    expect(matchResult.breakdown.skillsScore).toBe(40);
    expect(matchResult.breakdown.experienceScore).toBe(20);
    expect(matchResult.breakdown.roleScore).toBe(15);
    expect(matchResult.breakdown.locationScore).toBe(10);
    expect(matchResult.breakdown.seniorityScore).toBe(10);
    expect(matchResult.breakdown.educationScore).toBe(5);
    expect(matchResult.matchedSkills.length).toBe(4);
    expect(matchResult.missingSkills.length).toBe(0);
  });

  it('handles equivalent technologies in skill matching', () => {
    expect(isSkillEquivalent('react.js', 'React')).toBe(true);
    expect(isSkillEquivalent('c#', 'ASP.NET Core')).toBe(true);
    expect(isSkillEquivalent('postgres', 'PostgreSQL')).toBe(true);
    expect(isSkillEquivalent('python', 'c#')).toBe(false);
  });

  it('calculates seniority score based on level alignment', () => {
    const matchScore = calculateSeniorityScore('Senior Software Engineer', 'Senior Developer', 10);
    expect(matchScore).toBe(10);

    const diffScore = calculateSeniorityScore('Junior Developer', 'Senior Developer', 10);
    expect(diffScore).toBeLessThan(10);
  });

  it('returns empty 0% score result for unconfirmed or missing profile', () => {
    const emptyResult = calculateJobMatch(null, sampleJob);
    expect(emptyResult.totalScore).toBe(0);
    expect(emptyResult.concerns[0]).toContain('profile incomplete');
  });
});
