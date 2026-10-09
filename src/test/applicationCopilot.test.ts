import { describe, it, expect } from 'vitest';
import { 
  generateCoverLetter, 
  generateRecruiterMessage, 
  generateApplicationAnswer 
} from '../domain/applicationCopilot';
import { CandidateProfile, Job } from '../types';

describe('Application Copilot Subsystem Tests', () => {
  const sampleProfile: CandidateProfile = {
    id: 'prof_copilot_1',
    fullName: 'Alex Mercer',
    email: 'alex@example.com',
    location: 'Hyderabad',
    title: 'Senior Software Engineer',
    summary: 'Fullstack developer specializing in C# and React.',
    yearsOfExperience: 5,
    skills: [{ name: 'C#' }, { name: 'React' }, { name: 'PostgreSQL' }],
    workExperience: [],
    education: [],
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
    id: 'job_copilot_1',
    provider: 'anna_web_provider',
    providerJobId: '301',
    title: 'Senior .NET Developer',
    company: 'TechCorp Solutions',
    location: 'Hyderabad',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'Looking for a Senior .NET Developer with experience in C# and React.',
    requirements: ['C#', 'React'],
    preferredSkills: [],
    salary: 'Not specified',
    sourceUrl: 'https://example.com/job/301',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  it('generates cover letter grounded in candidate profile', async () => {
    const res = await generateCoverLetter(sampleProfile, sampleJob);
    
    expect(res.isGrounded).toBe(true);
    expect(res.content).toContain('Alex Mercer');
    expect(res.content).toContain('TechCorp');
  });

  it('generates recruiter message using Hiring Team when name is unprovided', async () => {
    const res = await generateRecruiterMessage(sampleProfile, sampleJob);
    
    expect(res.recipientName).toBe('Hiring Team');
    expect(res.content).toContain('Hi Hiring Team');
    expect(res.content).toContain('TechCorp');
  });

  it('generates recruiter message with specific recruiter name when provided', async () => {
    const res = await generateRecruiterMessage(sampleProfile, sampleJob, 'Sarah Jenkins');
    
    expect(res.recipientName).toBe('Sarah Jenkins');
    expect(res.content).toContain('Hi Sarah Jenkins');
  });

  it('generates grounded application question answer', async () => {
    const res = await generateApplicationAnswer(
      sampleProfile, 
      sampleJob, 
      'Why are you a good fit for this role?'
    );

    expect(res.question).toBe('Why are you a good fit for this role?');
    expect(res.shortAnswer).toContain('Senior Software Engineer');
    expect(res.shortAnswer).toContain('5 years');
  });
});
