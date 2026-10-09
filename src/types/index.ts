export type TabType = 
  | 'dashboard'
  | 'jobs'
  | 'saved'
  | 'applications'
  | 'interview'
  | 'profile'
  | 'settings';

export type RemoteType = 'all' | 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export interface Skill {
  name: string;
  category?: string;
  yearsOfExperience?: number;
  level?: 'beginner' | 'intermediate' | 'expert';
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
  achievements?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string;
  endDate?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
}

export interface UserPreferences {
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: RemoteType;
  minSalary?: number;
  employmentTypes: EmploymentType[];
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location: string;
  title: string;
  summary: string;
  yearsOfExperience: number;
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  preferences: UserPreferences;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  isConfirmed: boolean;
}

export interface Job {
  id: string;
  provider: string;
  providerJobId: string;
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  employmentType: EmploymentType;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  salary?: string;
  sourceUrl: string;
  publishedAt: string;
  discoveredAt: string;
  lastVerifiedAt: string;
}

export interface MatchBreakdown {
  skillsScore: number;       // Weight 40%
  experienceScore: number;   // Weight 20%
  roleScore: number;         // Weight 15%
  locationScore: number;     // Weight 10%
  seniorityScore: number;    // Weight 10%
  educationScore: number;    // Weight 5%
}

export interface JobMatchResult {
  jobId: string;
  totalScore: number; // 0-100%
  breakdown: MatchBreakdown;
  matchedSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  experienceComparison: {
    required: number;
    candidate: number;
    meetsRequirement: boolean;
  };
  strengths: string[];
  concerns: string[];
}

export type ApplicationStatus = 
  | 'saved'
  | 'preparing'
  | 'applied'
  | 'recruiter_contacted'
  | 'interview_scheduled'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationNote {
  id: string;
  createdAt: string;
  content: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  sourceUrl: string;
  status: ApplicationStatus;
  appliedDate?: string;
  followUpDate?: string;
  interviewDate?: string;
  coverLetter?: string;
  recruiterMessage?: string;
  notes: ApplicationNote[];
  statusHistory: {
    status: ApplicationStatus;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'technical' | 'behavioral' | 'project' | 'role' | 'skill_gap';
  question: string;
  whyAsked: string;
  suggestedStructure: string;
  candidateAnswerHint?: string;
}

export interface MockAnswerEvaluation {
  score: number; // 0-100
  relevance: string;
  technicalCorrectness: string;
  clarityAndStructure: string;
  improvementTips: string[];
}

export interface MockInterviewTurn {
  id: string;
  question: InterviewQuestion;
  candidateAnswer?: string;
  evaluation?: MockAnswerEvaluation;
  timestamp: string;
}

export interface MockInterviewSession {
  id: string;
  jobId?: string;
  roleTitle: string;
  turns: MockInterviewTurn[];
  isCompleted: boolean;
  createdAt: string;
}
