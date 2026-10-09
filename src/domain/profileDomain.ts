import { z } from 'zod';
import { CandidateProfile, Skill } from '../types';

// Zod Validation Schemas
export const SkillSchema = z.object({
  name: z.string().min(1, 'Skill name cannot be empty'),
  category: z.string().optional(),
  yearsOfExperience: z.number().nonnegative().optional(),
  level: z.enum(['beginner', 'intermediate', 'expert']).optional()
});

export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Job title is required'),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  description: z.string(),
  skillsUsed: z.array(z.string()),
  achievements: z.array(z.string()).optional()
});

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const UserPreferencesSchema = z.object({
  preferredRoles: z.array(z.string()),
  preferredLocations: z.array(z.string()),
  remotePreference: z.enum(['all', 'remote', 'hybrid', 'onsite']),
  minSalary: z.number().optional(),
  employmentTypes: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship']))
});

export const CandidateProfileSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').or(z.string().length(0)),
  phone: z.string().optional(),
  location: z.string(),
  title: z.string().min(1, 'Target role title is required'),
  summary: z.string(),
  yearsOfExperience: z.number().nonnegative(),
  skills: z.array(SkillSchema),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    issuer: z.string(),
    issueDate: z.string().optional()
  })),
  projects: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    link: z.string().optional()
  })),
  preferences: UserPreferencesSchema,
  resumeFileName: z.string().optional(),
  resumeUpdatedAt: z.string().optional(),
  isConfirmed: z.boolean()
});

/**
 * Normalizes skill string into standard canonical format.
 * E.g., "react.js" -> "React", "asp.net core" -> "ASP.NET Core"
 */
export function normalizeSkillName(rawName: string): string {
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  const ALIAS_MAP: Record<string, string> = {
    'react.js': 'React',
    'reactjs': 'React',
    'react': 'React',
    'vue.js': 'Vue.js',
    'vuejs': 'Vue.js',
    'vue': 'Vue.js',
    'angular.js': 'Angular',
    'angularjs': 'Angular',
    'angular': 'Angular',
    'node.js': 'Node.js',
    'nodejs': 'Node.js',
    'node': 'Node.js',
    'asp.net core': 'ASP.NET Core',
    '.net core': '.NET Core',
    'dotnet': '.NET',
    '.net': '.NET',
    'c#': 'C#',
    'csharp': 'C#',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mongo': 'MongoDB',
    'mongodb': 'MongoDB',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'python3': 'Python',
    'python': 'Python',
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'docker': 'Docker',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes'
  };

  if (ALIAS_MAP[lower]) {
    return ALIAS_MAP[lower];
  }

  // Capitalize words by default
  return trimmed.split(' ').map(word => {
    if (word.length <= 3 && word.toUpperCase() === word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

/**
 * Calculates candidate profile completeness percentage (0 - 100%).
 */
export function calculateProfileCompleteness(profile: CandidateProfile | null): number {
  if (!profile) return 0;

  let points = 0;
  const maxPoints = 100;

  if (profile.fullName && profile.fullName.trim().length > 0) points += 15;
  if (profile.title && profile.title.trim().length > 0) points += 15;
  if (profile.email && profile.email.trim().length > 0) points += 10;
  if (profile.yearsOfExperience >= 0) points += 10;
  if (profile.summary && profile.summary.trim().length > 20) points += 10;
  if (profile.skills && profile.skills.length >= 3) points += 20;
  if (profile.workExperience && profile.workExperience.length > 0) points += 10;
  if (profile.education && profile.education.length > 0) points += 10;

  return Math.min(maxPoints, points);
}

/**
 * Sanitizes location string by stripping leading role title keywords (e.g. "Developer Ahmedabad" -> "Ahmedabad")
 */
export function cleanLocationString(rawLoc: string): string {
  if (!rawLoc) return '';
  let clean = rawLoc.trim();
  clean = clean.replace(/^(Software\s+Engineer|Full-Stack\s+\.NET\s+Developer|Full-Stack\s+Developer|Fullstack\s+Developer|Developer|Engineer|Software|Senior|Lead|Architect)\s*/i, '');
  clean = clean.trim();
  return clean || rawLoc;
}

/**
 * Guardrail Enforcement: Creates a draft candidate profile from raw extraction data,
 * explicitly setting `isConfirmed: false` so that AI extraction does NOT silently overwrite confirmed profile data.
 */
export function createDraftProfileFromExtraction(extractedData: Partial<CandidateProfile>): CandidateProfile {
  const normalizedSkills: Skill[] = (extractedData.skills || []).map(s => ({
    ...s,
    name: normalizeSkillName(s.name)
  }));

  const cleanLoc = cleanLocationString(extractedData.location || '');
  const cleanPrefLocations = (extractedData.preferences?.preferredLocations || [cleanLoc])
    .map(loc => cleanLocationString(loc))
    .filter(Boolean);

  return {
    id: extractedData.id || `prof_${Date.now()}`,
    fullName: extractedData.fullName || '',
    email: extractedData.email || '',
    phone: extractedData.phone || '',
    location: cleanLoc,
    title: extractedData.title || '',
    summary: extractedData.summary || '',
    yearsOfExperience: extractedData.yearsOfExperience || 0,
    skills: normalizedSkills,
    workExperience: extractedData.workExperience || [],
    education: extractedData.education || [],
    certifications: extractedData.certifications || [],
    projects: extractedData.projects || [],
    preferences: {
      preferredRoles: extractedData.preferences?.preferredRoles || (extractedData.title ? [extractedData.title] : []),
      preferredLocations: cleanPrefLocations.length > 0 ? cleanPrefLocations : [cleanLoc],
      remotePreference: extractedData.preferences?.remotePreference || 'all',
      employmentTypes: extractedData.preferences?.employmentTypes || ['full-time']
    },
    resumeFileName: extractedData.resumeFileName,
    resumeUpdatedAt: new Date().toISOString(),
    isConfirmed: false // AI extraction MUST be explicitly reviewed and confirmed by user
  };
}
