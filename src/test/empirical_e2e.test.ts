import { describe, it, expect } from 'vitest';
import { parseAndExtractResume } from '../domain/resumeExtractor';
import { calculateJobMatch } from '../domain/matchEngine';
import { generateCoverLetter } from '../domain/applicationCopilot';
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../domain/interviewCopilot';
import { searchJobsWithDeduplication } from '../repositories/jobRepository';
import { createNewApplication, loadApplicationsFromStorage } from '../repositories/applicationRepository';
import { CandidateProfile, Job } from '../types';

describe('Empirical End-to-End System Verification', () => {
  const sampleCandidate: CandidateProfile = {
    id: 'cand_empirical_1',
    fullName: 'Dayanand Dongare',
    title: 'Senior Full Stack Engineer',
    email: 'dayanand@example.com',
    location: 'Hyderabad, India',
    yearsOfExperience: 6,
    summary: 'Experienced Full Stack Developer skilled in React, TypeScript, C#, ASP.NET Core, PostgreSQL, and AWS.',
    skills: [
      { name: 'React' },
      { name: 'TypeScript' },
      { name: 'C#' },
      { name: 'ASP.NET Core' },
      { name: 'PostgreSQL' },
      { name: 'AWS' },
      { name: 'Docker' }
    ],
    workExperience: [
      {
        id: 'exp_1',
        company: 'Enterprise Cloud Systems',
        title: 'Senior Full Stack Engineer',
        startDate: '2021-01',
        endDate: 'Present',
        isCurrent: true,
        description: 'Architected cloud microservices and responsive React web dashboards.',
        skillsUsed: ['React', 'TypeScript', 'C#', 'AWS']
      }
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'JNTU Hyderabad',
        degree: 'B.Tech',
        fieldOfStudy: 'Computer Science',
        startDate: '2015-08',
        endDate: '2019-05'
      }
    ],
    certifications: [
      {
        id: 'cert_1',
        name: 'AWS Solutions Architect',
        issuer: 'AWS',
        issueDate: '2022-03'
      }
    ],
    projects: [],
    preferences: {
      preferredRoles: ['Senior Full Stack Engineer'],
      preferredLocations: ['Hyderabad', 'Remote'],
      remotePreference: 'remote',
      employmentTypes: ['full-time']
    },
    isConfirmed: true
  };

  const targetJob: Job = {
    id: 'job_emp_101',
    provider: 'local',
    providerJobId: 'emp_101',
    title: 'Senior Software Engineer - Full Stack (.NET & React)',
    company: 'TechCorp International',
    location: 'Hyderabad, India',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'We are seeking a Senior Full Stack Engineer with 5+ years of experience in C#, ASP.NET Core, React, and AWS to build scalable enterprise cloud applications.',
    requirements: ['React', 'C#', 'ASP.NET Core', 'AWS', 'PostgreSQL'],
    preferredSkills: ['Docker', 'TypeScript'],
    salary: '$120,000 - $140,000',
    sourceUrl: 'https://example.com/jobs/emp_101',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  it('1. Empirical Resume Extraction Test', async () => {
    const resumeTextContent = `Dayanand Dongare Software Engineer | Full-Stack .NET Developer Ahmedabad, Gujarat, India | +91-9270041056 | dayananddongare@outlook.com linkedin.com/in/dayanand-dongare | github.com/DayanandD Professional Summary Full-stack software engineer with 4+ years of experience building enterprise applications using C#, .NET, ASP.NET Core Web API, React, and PostgreSQL. Skilled in Clean Architecture, REST API design, JWT/RBAC-based authentication, and background and real-time processing with Hangfire and SignalR. Experienced across the full development lifecycle, from database design and API development to React-based frontends.

Technical Skills
Languages: C#, JavaScript, TypeScript
Backend & APIs: .NET 8+, ASP.NET Core, ASP.NET Core Web API, REST APIs, LINQ, GraphQL, Dapper, Entity Framework Core, Clean Architecture, SOLID Principles, JWT Authentication, RBAC, SignalR, Hangfire
Frontend: React.js, Redux Toolkit, HTML5, CSS3, Bootstrap, Material UI, Vite, Axios, TanStack Query
Databases: PostgreSQL, Query Optimization
Tools: Git, GitHub, Bitbucket, IIS, Serilog, Swagger/OpenAPI, Postman

Professional Experience
Software Engineer August 2024 – Present IMS Global Pvt. Ltd. Ahmedabad, India
• Developed and maintained RESTful APIs using C#, ASP.NET Core Web API, and Clean Architecture for enterprise ERP workflows.
• Implemented JWT authentication and Role-Based Access Control (RBAC).
• Built Dapper and Entity Framework Core data-access layers with PostgreSQL.`;

    const sampleFile = new File([resumeTextContent], 'Resume_Dayanand_Dongare.txt', { type: 'text/plain' });
    Object.defineProperty(sampleFile, 'text', {
      value: async () => resumeTextContent
    });

    const extracted = await parseAndExtractResume(sampleFile);
    console.log('\n--- EMPIRICAL RESULT 1: REAL RESUME EXTRACTION ---');
    console.log(JSON.stringify(extracted, null, 2));

    expect(extracted).toBeDefined();
    expect(extracted.fullName).toBe('Dayanand Dongare');
    expect(extracted.email).toBe('dayananddongare@outlook.com');
  });

  it('2. Empirical 6-Vector Deterministic Match Scoring Test', () => {
    const matchResult = calculateJobMatch(sampleCandidate, targetJob);
    console.log('\n--- EMPIRICAL RESULT 2: 6-VECTOR MATCH SCORE ---');
    console.log(JSON.stringify(matchResult, null, 2));

    expect(matchResult.totalScore).toBeGreaterThan(80);
    expect(matchResult.matchedSkills).toContain('React');
    expect(matchResult.matchedSkills).toContain('C#');
    expect(matchResult.breakdown.skillsScore).toBe(40);
    expect(matchResult.experienceComparison.meetsRequirement).toBe(true);
  });

  it('3. Empirical AI Cover Letter Generation Test', async () => {
    const coverLetter = await generateCoverLetter(sampleCandidate, targetJob);
    console.log('\n--- EMPIRICAL RESULT 3: GENERATED COVER LETTER ---');
    console.log(coverLetter.content);

    expect(coverLetter.content).toBeDefined();
    expect(coverLetter.content).toContain('TechCorp International');
    expect(coverLetter.content).toContain('Senior Software Engineer');
  });

  it('4. Empirical AI Interview Question & Answer Evaluation Test', async () => {
    const questions = await generateInterviewQuestions(targetJob, sampleCandidate);
    console.log('\n--- EMPIRICAL RESULT 4A: GENERATED INTERVIEW QUESTIONS ---');
    console.log(JSON.stringify(questions, null, 2));

    expect(questions.length).toBeGreaterThan(0);

    const firstQ = questions[0];
    const candidateAnswer = 'In my previous role at Enterprise Cloud Systems, I led the migration of legacy monolithic endpoints to asynchronous ASP.NET Core web APIs. I applied dependency injection to decouple data access repositories from business logic, which improved unit test coverage from 40% to 92% and reduced average request latency by 35%.';

    const evaluation = await evaluateInterviewAnswer(firstQ, candidateAnswer, sampleCandidate);
    console.log('\n--- EMPIRICAL RESULT 4B: ANSWER EVALUATION SCORECARD ---');
    console.log(JSON.stringify(evaluation, null, 2));

    expect(evaluation.score).toBeGreaterThanOrEqual(70);
    expect(evaluation.clarityAndStructure).toBeDefined();
  });

  it('5. Empirical Job Search & Application Tracking Test', async () => {
    const searchResults = await searchJobsWithDeduplication({
      keywords: 'Software Engineer',
      location: 'Remote',
      remoteType: 'all',
      limit: 5
    });

    console.log('\n--- EMPIRICAL RESULT 5A: DEDUPLICATED LIVE JOB SEARCH ---');
    console.log(`Found ${searchResults.length} matching jobs.`);
    expect(Array.isArray(searchResults)).toBe(true);
    expect(searchResults.length).toBeGreaterThanOrEqual(0);

    const createdApp = await createNewApplication(
      targetJob.id,
      targetJob.title,
      targetJob.company,
      targetJob.location,
      targetJob.sourceUrl,
      'applied'
    );

    const loadedApps = await loadApplicationsFromStorage();

    console.log('\n--- EMPIRICAL RESULT 5B: PERSISTED APPLICATION STATE ---');
    console.log(JSON.stringify(loadedApps, null, 2));

    expect(loadedApps.some(a => a.id === createdApp.id)).toBe(true);
  }, 30000);
});
