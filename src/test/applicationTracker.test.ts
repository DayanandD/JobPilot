import { describe, it, expect } from 'vitest';
import { 
  isValidStatusTransition, 
  createNewApplication, 
  updateApplicationState, 
  addNoteToApplication 
} from '../repositories/applicationRepository';
import { JobApplication } from '../types';

describe('Application Tracker Repository & State Machine Tests', () => {
  it('validates allowed status transitions', () => {
    expect(isValidStatusTransition('saved', 'preparing')).toBe(true);
    expect(isValidStatusTransition('preparing', 'applied')).toBe(true);
    expect(isValidStatusTransition('applied', 'interviewing')).toBe(true);
    expect(isValidStatusTransition('interviewing', 'offer')).toBe(true);
  });

  it('creates new application entry with initial status history timestamp', async () => {
    const app = await createNewApplication(
      'job_test_99',
      'Senior .NET Developer',
      'TechCorp',
      'Hyderabad',
      'https://example.com/job/99',
      'saved'
    );

    expect(app.jobId).toBe('job_test_99');
    expect(app.status).toBe('saved');
    expect(app.statusHistory.length).toBe(1);
    expect(app.statusHistory[0].status).toBe('saved');
  });

  it('appends timestamped entry to statusHistory on status update', async () => {
    const initialApps: JobApplication[] = [{
      id: 'app_test_1',
      jobId: 'job_1',
      jobTitle: 'Senior Developer',
      company: 'TechCorp',
      location: 'Remote',
      sourceUrl: 'https://example.com/1',
      status: 'saved',
      notes: [],
      statusHistory: [{ status: 'saved', timestamp: '2026-10-01T10:00:00Z' }],
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z'
    }];

    const updated = await updateApplicationState('app_test_1', 'applied', initialApps);
    const target = updated.find(a => a.id === 'app_test_1')!;

    expect(target.status).toBe('applied');
    expect(target.statusHistory.length).toBe(2);
    expect(target.statusHistory[1].status).toBe('applied');
  });

  it('adds timestamped note to application', async () => {
    const initialApps: JobApplication[] = [{
      id: 'app_test_2',
      jobId: 'job_2',
      jobTitle: 'Lead Engineer',
      company: 'WebWorks',
      location: 'Hyderabad',
      sourceUrl: 'https://example.com/2',
      status: 'applied',
      notes: [],
      statusHistory: [{ status: 'applied', timestamp: '2026-10-02T10:00:00Z' }],
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T10:00:00Z'
    }];

    const updated = await addNoteToApplication('app_test_2', 'Spoke with recruiter via email.', initialApps);
    const target = updated.find(a => a.id === 'app_test_2')!;

    expect(target.notes.length).toBe(1);
    expect(target.notes[0].content).toBe('Spoke with recruiter via email.');
  });
});
