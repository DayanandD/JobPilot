import { describe, it, expect } from 'vitest';
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../domain/interviewCopilot';
import { Job, InterviewQuestion } from '../types';

describe('Interview Copilot Subsystem Tests', () => {
  const sampleJob: Job = {
    id: 'job_prep_1',
    provider: 'anna_web_provider',
    providerJobId: '401',
    title: 'Senior Fullstack Engineer',
    company: 'InnovateTech Solutions',
    location: 'Hyderabad',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    description: 'Looking for a Senior Fullstack Engineer with C#, React, and Cloud experience.',
    requirements: ['C#', 'React', 'AWS'],
    preferredSkills: ['PostgreSQL', 'Docker'],
    salary: 'Not specified',
    sourceUrl: 'https://example.com/job/401',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  it('generates structured interview prep questions for target job', async () => {
    const questions = await generateInterviewQuestions(sampleJob);

    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions[0]).toHaveProperty('id');
    expect(questions[0]).toHaveProperty('question');
    expect(questions[0]).toHaveProperty('category');
    expect(questions[0]).toHaveProperty('suggestedStructure');
  });

  it('evaluates brief candidate answer with low score and improvement tips', async () => {
    const question: InterviewQuestion = {
      id: 'q_test_1',
      category: 'technical',
      question: 'How do you handle state management in React?',
      whyAsked: 'Test React knowledge',
      suggestedStructure: 'STAR'
    };

    const evalResult = await evaluateInterviewAnswer(question, 'I use redux.');

    expect(evalResult.score).toBeLessThan(50);
    expect(evalResult.improvementTips.length).toBeGreaterThan(0);
  });

  it('evaluates comprehensive candidate answer with high score and positive structure feedback', async () => {
    const question: InterviewQuestion = {
      id: 'q_test_2',
      category: 'behavioral',
      question: 'Describe a situation where you resolved a production performance bottleneck.',
      whyAsked: 'Test troubleshooting skills under pressure',
      suggestedStructure: 'STAR'
    };

    const answer = `In my previous role at TechCorp, we noticed slow API response times reaching 2 seconds during peak hours (Situation). My task was to diagnose and reduce latency to under 300ms (Task). I analyzed PostgreSQL query plans, added missing indexes, and implemented Redis caching for key GET endpoints (Action). As a result, average latency dropped by 80% to 180ms and throughput doubled (Result).`;

    const evalResult = await evaluateInterviewAnswer(question, answer);

    expect(evalResult.score).toBeGreaterThanOrEqual(70);
    expect(evalResult.clarityAndStructure).toBeDefined();
  });
});
