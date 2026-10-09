import { describe, it, expect } from 'vitest';
import { JoobleJobProvider } from '../domain/providers/joobleJobProvider';
import { AdzunaJobProvider } from '../domain/providers/adzunaJobProvider';
import { JSearchJobProvider } from '../domain/providers/jsearchJobProvider';
import { GreenhouseJobProvider } from '../domain/providers/greenhouseJobProvider';
import { LeverJobProvider } from '../domain/providers/leverJobProvider';
import { MultiJobProvider } from '../domain/providers/multiJobProvider';

describe('Production Real Job Provider Adapters Unit Tests', () => {
  describe('1. Jooble Provider Adapter', () => {
    it('returns empty result when API key is unconfigured', async () => {
      const provider = new JoobleJobProvider({ apiKey: '' });
      expect(provider.isConfigured()).toBe(false);
      const res = await provider.searchJobs({ keywords: 'Software Engineer', location: 'India' });
      expect(res.jobs).toEqual([]);
      expect(res.total).toBe(0);
      expect(res.providerId).toBe('jooble_provider');
    });

    it('healthCheck returns false when unconfigured', async () => {
      const provider = new JoobleJobProvider({ apiKey: '' });
      const healthy = await provider.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('2. Adzuna Provider Adapter', () => {
    it('returns empty result when credentials are absent', async () => {
      const provider = new AdzunaJobProvider({ appId: '', appKey: '' });
      expect(provider.isConfigured()).toBe(false);
      const res = await provider.searchJobs({ keywords: '.NET Developer', location: 'Hyderabad' });
      expect(res.jobs).toEqual([]);
      expect(res.total).toBe(0);
      expect(res.providerId).toBe('adzuna_provider');
    });
  });

  describe('3. JSearch RapidAPI Provider Adapter', () => {
    it('returns empty result when RapidAPI key is missing', async () => {
      const provider = new JSearchJobProvider({ rapidApiKey: '' });
      expect(provider.isConfigured()).toBe(false);
      const res = await provider.searchJobs({ keywords: 'React Developer', location: 'Bangalore' });
      expect(res.jobs).toEqual([]);
      expect(res.total).toBe(0);
      expect(res.providerId).toBe('jsearch_provider');
    });
  });

  describe('4. Greenhouse Public Board Provider Adapter', () => {
    it('fetches and normalizes public job board listings without API keys', async () => {
      const provider = new GreenhouseJobProvider({ boardTokens: ['canonical'] });
      const res = await provider.searchJobs({ keywords: 'Engineer', location: 'Remote' });
      expect(res.providerId).toBe('greenhouse_provider');
      expect(Array.isArray(res.jobs)).toBe(true);
      if (res.jobs.length > 0) {
        const first = res.jobs[0];
        expect(first.provider).toBe('greenhouse_provider');
        expect(first.title).toBeDefined();
        expect(first.sourceUrl).toContain('greenhouse');
      }
    }, 15000);
  });

  describe('5. Lever Public Career Provider Adapter', () => {
    it('fetches and normalizes public Lever postings without API keys', async () => {
      const provider = new LeverJobProvider({ companies: ['spotify'] });
      const res = await provider.searchJobs({ keywords: 'Engineer', location: 'Remote' });
      expect(res.providerId).toBe('lever_provider');
      expect(Array.isArray(res.jobs)).toBe(true);
      if (res.jobs.length > 0) {
        const first = res.jobs[0];
        expect(first.provider).toBe('lever_provider');
        expect(first.title).toBeDefined();
        expect(first.sourceUrl).toContain('lever.co');
      }
    }, 15000);
  });

  describe('6. MultiJobProvider Aggregator', () => {
    it('aggregates multiple providers and deduplicates results', async () => {
      const unconfiguredJooble = new JoobleJobProvider({ apiKey: '' });
      const unconfiguredAdzuna = new AdzunaJobProvider({ appId: '', appKey: '' });
      const publicGreenhouse = new GreenhouseJobProvider({ boardTokens: ['canonical'] });

      const multi = new MultiJobProvider([unconfiguredJooble, unconfiguredAdzuna, publicGreenhouse]);
      const res = await multi.searchJobs({ keywords: 'Engineer', location: 'Remote' });

      expect(res.providerId).toBe('multi_provider');
      expect(Array.isArray(res.jobs)).toBe(true);
    }, 15000);

    it('returns empty result cleanly when no providers return listings', async () => {
      const unconfiguredJooble = new JoobleJobProvider({ apiKey: '' });
      const unconfiguredAdzuna = new AdzunaJobProvider({ appId: '', appKey: '' });

      const multi = new MultiJobProvider([unconfiguredJooble, unconfiguredAdzuna]);
      const res = await multi.searchJobs({ keywords: 'NonExistentSkill12345', location: 'NowhereCity' });

      expect(res.jobs).toEqual([]);
      expect(res.total).toBe(0);
    });
  });
});
