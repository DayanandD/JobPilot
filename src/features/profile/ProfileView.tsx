import { useState, useEffect } from 'react';
import { 
  User, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import { CandidateProfile, Skill } from '../../types';
import { calculateProfileCompleteness, normalizeSkillName } from '../../domain/profileDomain';
import { parseAndExtractResume } from '../../domain/resumeExtractor';
import { saveProfileToStorage } from '../../repositories/profileRepository';

export function ProfileView() {
  const { candidateProfile, setCandidateProfile } = useAppStore();

  const [fullName, setFullName] = useState(candidateProfile?.fullName || '');
  const [title, setTitle] = useState(candidateProfile?.title || '');
  const [email, setEmail] = useState(candidateProfile?.email || '');
  const [location, setLocation] = useState(candidateProfile?.location || '');
  const [experienceYears, setExperienceYears] = useState(candidateProfile?.yearsOfExperience || 0);
  const [summary, setSummary] = useState(candidateProfile?.summary || '');
  const [skills, setSkills] = useState<Skill[]>(candidateProfile?.skills || []);
  const [preferredRoles, setPreferredRoles] = useState<string[]>(
    candidateProfile?.preferences?.preferredRoles && candidateProfile.preferences.preferredRoles.length > 0
      ? candidateProfile.preferences.preferredRoles
      : [candidateProfile?.title || 'Software Engineer']
  );
  const [newRoleInput, setNewRoleInput] = useState('');

  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    candidateProfile?.preferences?.preferredLocations && candidateProfile.preferences.preferredLocations.length > 0
      ? candidateProfile.preferences.preferredLocations
      : [candidateProfile?.location || 'Hyderabad', 'Remote']
  );
  const [newLocationInput, setNewLocationInput] = useState('');

  const [newSkillName, setNewSkillName] = useState('');
  const [isSavedMessage, setIsSavedMessage] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  useEffect(() => {
    if (candidateProfile) {
      setFullName(candidateProfile.fullName || '');
      setTitle(candidateProfile.title || '');
      setEmail(candidateProfile.email || '');
      setLocation(candidateProfile.location || '');
      setExperienceYears(candidateProfile.yearsOfExperience || 0);
      setSummary(candidateProfile.summary || '');
      setSkills(candidateProfile.skills || []);
      if (candidateProfile.preferences?.preferredRoles) {
        setPreferredRoles(candidateProfile.preferences.preferredRoles);
      }
      if (candidateProfile.preferences?.preferredLocations) {
        setPreferredLocations(candidateProfile.preferences.preferredLocations);
      }
    }
  }, [candidateProfile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const extractedProfile = await parseAndExtractResume(file);
      setCandidateProfile(extractedProfile);
    } catch (err: any) {
      setExtractionError(err?.message || 'Failed to parse resume file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const completeness = calculateProfileCompleteness({
    id: candidateProfile?.id || 'prof_1',
    fullName,
    title,
    email,
    location,
    yearsOfExperience: Number(experienceYears),
    summary,
    skills,
    workExperience: candidateProfile?.workExperience || [],
    education: candidateProfile?.education || [],
    certifications: candidateProfile?.certifications || [],
    projects: candidateProfile?.projects || [],
    preferences: candidateProfile?.preferences || {
      preferredRoles: [title],
      preferredLocations: [location],
      remotePreference: 'all',
      employmentTypes: ['full-time']
    },
    isConfirmed: true
  });

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const normalized = normalizeSkillName(newSkillName);
    if (!skills.some(s => s.name.toLowerCase() === normalized.toLowerCase())) {
      setSkills([...skills, { name: normalized }]);
    }
    setNewSkillName('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    const cleanRole = newRoleInput.trim();
    if (!preferredRoles.some(r => r.toLowerCase() === cleanRole.toLowerCase())) {
      setPreferredRoles([...preferredRoles, cleanRole]);
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (index: number) => {
    setPreferredRoles(preferredRoles.filter((_, i) => i !== index));
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationInput.trim()) return;
    const cleanLoc = newLocationInput.trim();
    if (!preferredLocations.some(l => l.toLowerCase() === cleanLoc.toLowerCase())) {
      setPreferredLocations([...preferredLocations, cleanLoc]);
    }
    setNewLocationInput('');
  };

  const handleRemoveLocation = (index: number) => {
    setPreferredLocations(preferredLocations.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoles = preferredRoles.length > 0 ? preferredRoles : [title || 'Software Engineer'];
    const finalLocations = preferredLocations.length > 0 ? preferredLocations : [location || 'Hyderabad', 'Remote'];

    const updatedProfile: CandidateProfile = {
      id: candidateProfile?.id || 'prof_1',
      fullName,
      title,
      email,
      location,
      yearsOfExperience: Number(experienceYears),
      summary,
      skills,
      workExperience: candidateProfile?.workExperience || [],
      education: candidateProfile?.education || [],
      certifications: candidateProfile?.certifications || [],
      projects: candidateProfile?.projects || [],
      preferences: {
        preferredRoles: finalRoles,
        preferredLocations: finalLocations,
        remotePreference: candidateProfile?.preferences?.remotePreference || 'all',
        employmentTypes: candidateProfile?.preferences?.employmentTypes || ['full-time']
      },
      isConfirmed: true,
      resumeUpdatedAt: new Date().toISOString()
    };

    setCandidateProfile(updatedProfile);
    await saveProfileToStorage(updatedProfile);

    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Candidate Profile & Resume</span>
          </h1>
          <p className="text-sm text-slate-400">
            Upload your resume for AI extraction or edit your confirmed background parameters.
          </p>
        </div>

        {/* Profile Completeness Score Chip */}
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 min-w-[200px] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Completeness</span>
            <span className="text-cyan-400 font-bold">{completeness}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Guardrail Alert if unconfirmed */}
      {candidateProfile && !candidateProfile.isConfirmed && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-amber-200">Unconfirmed Profile Extraction</div>
            <div className="text-amber-300/80">
              The parameters below were extracted from your uploaded resume. Review the information and click "Confirm & Save Profile" to activate deterministic matching.
            </div>
          </div>
        </div>
      )}

      {/* Resume File Upload Zone */}
      <div className="p-6 rounded-2xl bg-slate-800/60 border border-dashed border-slate-700 hover:border-cyan-500/60 transition-colors text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
          {isExtracting ? (
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">
            {isExtracting ? 'Extracting Resume Parameters...' : 'Upload Resume (PDF, DOCX, TXT)'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            AI will extract your skills, years of experience, and role metrics for your review.
          </p>
        </div>

        {extractionError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-medium">
            {extractionError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className={`px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-lg shadow-cyan-600/20 flex items-center gap-2 ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}>
            {isExtracting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isExtracting ? 'Processing File...' : 'Select Resume File'}</span>
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.txt" 
              onChange={handleFileUpload}
              disabled={isExtracting}
              className="hidden" 
            />
          </label>

          <button
            type="button"
            onClick={async () => {
              const demoProfile: CandidateProfile = {
                id: 'prof_demo',
                fullName: 'Alex Mercer',
                title: 'Senior Full Stack Engineer',
                email: 'alex.mercer@example.com',
                location: 'San Francisco, CA',
                yearsOfExperience: 6,
                summary: 'Experienced Full Stack Engineer specializing in React, TypeScript, Python, and cloud infrastructure. Passionate about building high-performance AI applications.',
                skills: [
                  { name: 'React' },
                  { name: 'TypeScript' },
                  { name: 'Python' },
                  { name: 'Node.js' },
                  { name: 'PostgreSQL' },
                  { name: 'AWS' },
                  { name: 'Docker' },
                  { name: 'Tailwind CSS' }
                ],
                workExperience: [
                  {
                    id: 'exp_1',
                    company: 'TechCorp Solutions',
                    title: 'Senior Full Stack Engineer',
                    startDate: '2022-01',
                    endDate: 'Present',
                    isCurrent: true,
                    description: 'Led development of AI-assisted workflow engines serving 500k active users.',
                    skillsUsed: ['React', 'TypeScript', 'Python', 'AWS']
                  }
                ],
                education: [
                  {
                    id: 'edu_1',
                    institution: 'UC Berkeley',
                    degree: 'B.S.',
                    fieldOfStudy: 'Computer Science',
                    startDate: '2015-08',
                    endDate: '2019-05'
                  }
                ],
                certifications: [
                  {
                    id: 'cert_1',
                    name: 'AWS Certified Solutions Architect',
                    issuer: 'Amazon Web Services',
                    issueDate: '2022-06'
                  }
                ],
                projects: [],
                preferences: {
                  preferredRoles: ['Senior Full Stack Engineer'],
                  preferredLocations: ['San Francisco, CA', 'Remote'],
                  remotePreference: 'remote',
                  employmentTypes: ['full-time']
                },
                isConfirmed: true,
                resumeUpdatedAt: new Date().toISOString()
              };
              setCandidateProfile(demoProfile);
              await saveProfileToStorage(demoProfile);
              setIsSavedMessage(true);
              setTimeout(() => setIsSavedMessage(false), 3000);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <span>⚡ Load Demo Profile (1-Click)</span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Confirmed Profile Parameters</span>
          </h2>

          {isSavedMessage && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Profile Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Role Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hyderabad, India"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Years of Professional Experience</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              placeholder="e.g. 5"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              min={0}
              max={50}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Professional Summary</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief summary of your technical experience..."
            className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>

        {/* Skills Section */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verified Skills & Technologies ({skills.length})
          </label>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="Add skill (e.g. react.js, asp.net core)..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Skill
            </button>
          </div>
        </div>

        {/* Preferred Target Roles Section */}
        <div className="space-y-3 pt-4 border-t border-slate-700/60">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preferred Job Roles ({preferredRoles.length})
          </label>

          <div className="flex flex-wrap gap-2">
            {preferredRoles.map((role, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-1.5"
              >
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(index)}
                  className="hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="Add role (e.g. Software Engineer, Full-Stack Developer)..."
              value={newRoleInput}
              onChange={(e) => setNewRoleInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddRole}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Role
            </button>
          </div>
        </div>

        {/* Preferred Target Cities Section */}
        <div className="space-y-3 pt-4 border-t border-slate-700/60">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preferred Cities & Locations ({preferredLocations.length})
          </label>

          <div className="flex flex-wrap gap-2">
            {preferredLocations.map((loc, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(index)}
                  className="hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="Add city (e.g. Ahmedabad, Hyderabad, Bangalore, Remote)..."
              value={newLocationInput}
              onChange={(e) => setNewLocationInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddLocation}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add City
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/60 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Confirm & Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
