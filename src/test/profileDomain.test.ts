import { describe, it, expect } from 'vitest';
import { 
  normalizeSkillName, 
  calculateProfileCompleteness, 
  createDraftProfileFromExtraction,
  CandidateProfileSchema 
} from '../domain/profileDomain';
import { CandidateProfile } from '../types';

describe('profileDomain Logic Tests', () => {
  it('normalizes tech skills correctly', () => {
    expect(normalizeSkillName('react.js')).toBe('React');
    expect(normalizeSkillName('asp.net core')).toBe('ASP.NET Core');
    expect(normalizeSkillName('c#')).toBe('C#');
    expect(normalizeSkillName('ts')).toBe('TypeScript');
    expect(normalizeSkillName('postgres')).toBe('PostgreSQL');
  });

  it('calculates profile completeness percentage accurately', () => {
    expect(calculateProfileCompleteness(null)).toBe(0);

    const partialProfile: Partial<CandidateProfile> = {
      fullName: 'Alex Mercer',
      title: 'Senior Software Engineer',
      yearsOfExperience: 5
    };
    expect(calculateProfileCompleteness(partialProfile as CandidateProfile)).toBe(40);

    const fullProfile: CandidateProfile = {
      id: 'prof_1',
      fullName: 'Alex Mercer',
      email: 'alex@example.com',
      location: 'Hyderabad',
      title: 'Senior Software Engineer',
      summary: 'Experienced developer with extensive skills in fullstack cloud systems.',
      yearsOfExperience: 6,
      skills: [{ name: 'C#' }, { name: 'React' }, { name: 'PostgreSQL' }],
      workExperience: [{
        id: 'w1',
        company: 'TechCorp',
        title: 'Developer',
        startDate: '2020-01-01',
        isCurrent: true,
        description: 'Building microservices',
        skillsUsed: ['C#']
      }],
      education: [{
        id: 'e1',
        institution: 'Tech University',
        degree: 'BS Computer Science',
        fieldOfStudy: 'Computer Science'
      }],
      certifications: [],
      projects: [],
      preferences: {
        preferredRoles: ['Software Engineer'],
        preferredLocations: ['Hyderabad'],
        remotePreference: 'all',
        employmentTypes: ['full-time']
      },
      isConfirmed: true
    };

    expect(calculateProfileCompleteness(fullProfile)).toBe(100);
  });

  it('enforces confirmation guardrails on AI extractions', () => {
    const draft = createDraftProfileFromExtraction({
      fullName: 'John Doe',
      title: 'Backend Engineer',
      skills: [{ name: 'react.js' }]
    });

    expect(draft.isConfirmed).toBe(false);
    expect(draft.skills[0].name).toBe('React');
  });

  it('validates CandidateProfile schema with Zod', () => {
    const invalidProfile = {
      fullName: '',
      email: 'invalid-email-format'
    };

    const parseResult = CandidateProfileSchema.safeParse(invalidProfile);
    expect(parseResult.success).toBe(false);
  });
});
