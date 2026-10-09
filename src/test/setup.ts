import '@testing-library/jest-dom';
import { setAnnaRuntimeForTesting, AnnaRuntime } from '../anna/annaClient';

function createTestMockRuntime(): AnnaRuntime {
  const localStorageState: Record<string, any> = {};

  return {
    windowUuid: 'test_win_123',
    appId: 'jobpilot',
    versionId: '1.0.0',
    runtimeState: localStorageState,
    tools: {
      async invoke({ tool_id, method, args }) {
        if (method === 'parse_resume') {
          const resumeText = args.resumeText || args.resume_text || '';
          if (resumeText) {
            const lines = resumeText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
            let firstLine = lines[0] || 'Candidate Name';
            for (const sep of ['|', '•', ' - ', '  ']) {
              if (firstLine.includes(sep)) {
                firstLine = firstLine.split(sep)[0].trim();
              }
            }
            firstLine = firstLine.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/, '');
            firstLine = firstLine.replace(/https?:\/\/\S+|www\.\S+|linkedin\.com\S+|github\.com\S+/, '');
            firstLine = firstLine.replace(/\+?\d[\d\s-]{7,}\d/, '');
            firstLine = firstLine.trim();

            const nameWords = firstLine.split(/\s+/);
            const cleanNameWords = [];
            for (const word of nameWords) {
              if (['software', 'engineer', 'developer', 'full-stack', '.net', 'senior', 'lead', 'architect', 'ui', 'frontend', 'backend'].includes(word.toLowerCase())) {
                break;
              }
              cleanNameWords.push(word);
            }
            let fullName = cleanNameWords.length > 0 ? cleanNameWords.join(' ') : (lines[0] ? lines[0].split(/\s+/)[0] : 'Candidate Name');
            if (fullName.length > 35) {
              fullName = fullName.split(/\s+/).slice(0, 2).join(' ');
            }

            const emailMatch = resumeText.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
            const email = emailMatch ? emailMatch[0] : '';

            const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,5}[-.\s]?\d{4}/);
            const phone = phoneMatch ? phoneMatch[0] : '';

            const locMatch = resumeText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*India|\s*USA|\s*UK)?)/);
            const location = locMatch ? locMatch[0] : 'Ahmedabad, India';

            let title = '';
            for (const line of lines.slice(0, 8)) {
              if (['engineer', 'developer', 'manager', 'architect', 'lead', 'analyst', 'specialist', 'consultant'].some(k => line.toLowerCase().includes(k))) {
                let cleanT = line.replace(fullName, '').trim();
                for (const sep of ['|', '•', ' - ']) {
                  if (cleanT.includes(sep)) {
                    const parts = cleanT.split(sep).map((p: string) => p.trim());
                    for (const p of parts) {
                      if (['engineer', 'developer', 'manager', 'architect', 'lead'].some(k => p.toLowerCase().includes(k))) {
                        title = p;
                        break;
                      }
                    }
                  }
                }
                if (!title) title = cleanT;
                break;
              }
            }
            if (!title || title.length > 50) title = 'Full-Stack .NET Developer';

            const knownTechs = [
              "C#", "ASP.NET Core", ".NET 8+", ".NET Core", ".NET", "React", "React.js", "TypeScript", "JavaScript", 
              "PostgreSQL", "Dapper", "Entity Framework Core", "EF Core", "Clean Architecture", "REST API", "SignalR", 
              "Hangfire", "AWS", "Docker", "Kubernetes", "Python", "Node.js", "GraphQL", "LINQ", "JWT", "RBAC", 
              "Redux Toolkit", "Bootstrap", "Material UI", "Vite", "Git", "Swagger", "Postman", "Serilog", "IIS"
            ];
            const skills: { name: string }[] = [];
            for (const tech of knownTechs) {
              const regex = new RegExp('\\b' + tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
              if (regex.test(resumeText)) {
                const normName = tech.replace('React.js', 'React').replace('.NET 8+', '.NET');
                if (!skills.some(s => s.name.toLowerCase() === normName.toLowerCase())) {
                  skills.push({ name: normName });
                }
              }
            }
            if (skills.length === 0) {
              skills.push({ name: "C#" }, { name: ".NET Core" }, { name: "React" }, { name: "PostgreSQL" });
            }

            const yearsMatch = resumeText.match(/(\d+)\+?\s*(years?|yrs?)/i);
            const yearsOfExperience = yearsMatch ? parseInt(yearsMatch[1], 10) : 4;

            const preferredRoles = [title];
            if (resumeText.toLowerCase().includes('software engineer') && !preferredRoles.includes('Software Engineer')) preferredRoles.push('Software Engineer');
            if (resumeText.toLowerCase().includes('full-stack') && !preferredRoles.includes('Full-Stack Developer')) preferredRoles.push('Full-Stack Developer');
            if (resumeText.toLowerCase().includes('.net') && !preferredRoles.includes('.NET Developer')) preferredRoles.push('.NET Developer');

            const preferredLocations = [location];
            for (const city of ['Ahmedabad', 'Hyderabad', 'Bangalore', 'Pune', 'Remote']) {
              if (resumeText.toLowerCase().includes(city.toLowerCase()) && !preferredLocations.includes(city)) {
                preferredLocations.push(city);
              }
            }
            if (!preferredLocations.includes('Remote')) preferredLocations.push('Remote');

            return {
              result: {
                success: true,
                data: {
                  fullName,
                  title,
                  email,
                  phone,
                  location,
                  yearsOfExperience,
                  summary: `Full-stack software engineer with ${yearsOfExperience}+ years of experience building enterprise applications using C#, .NET, ASP.NET Core Web API, React, and PostgreSQL.`,
                  skills,
                  preferences: {
                    preferredRoles,
                    preferredLocations,
                    remotePreference: 'all',
                    employmentTypes: ['full-time']
                  },
                  workExperience: [],
                  education: []
                }
              }
            };
          }
          return {
            result: {
              success: true,
              data: {
                fullName: 'Alex Mercer',
                title: 'Senior Software Engineer',
                yearsOfExperience: 5,
                skills: [{ name: 'C#' }, { name: 'React' }, { name: 'PostgreSQL' }],
                workExperience: [],
                education: []
              }
            }
          };
        }
        if (method === 'generate_cover_letter') {
          const profile = args.profile || {};
          const job = args.job || {};
          return {
            result: {
              success: true,
              data: `Dear Hiring Team at ${job.company || 'TechCorp'},\n\nI am writing to express my strong interest in the ${job.title || 'Role'} position. With ${profile.yearsOfExperience || 5} years of experience as a ${profile.title || 'Engineer'}, I bring proven expertise.\n\nSincerely,\n${profile.fullName || 'Alex Mercer'}`
            }
          };
        }
        return {
          result: {
            success: true,
            data: { tool: tool_id, method, args }
          }
        };
      }
    },
    llm: {
      async complete(_req) {
        return {
          role: 'assistant',
          content: { type: 'text', text: 'Grounded response generated by Mock Anna LLM.' },
          model: 'mock-gemini-flash',
          usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 }
        };
      }
    },
    upload: {
      async inline(_args) {
        return {
          file_ref: `file_ref_${Date.now()}`,
          url: `https://anna.host/files/file_ref_${Date.now()}`
        };
      }
    },
    storage: {
      async get({ key }) {
        const val = localStorageState[key];
        return { value: val !== undefined ? val : null, exists: val !== undefined };
      },
      async set({ key, value }) {
        localStorageState[key] = value;
        return { ok: true };
      },
      async delete({ key }) {
        delete localStorageState[key];
        return { ok: true };
      },
      async list({ prefix }) {
        const keys = Object.keys(localStorageState).filter(k => !prefix || k.startsWith(prefix));
        return { items: keys.map(k => ({ key: k, value: localStorageState[k] })) };
      }
    }
  };
}

// Initialize test mock for Vitest runner
setAnnaRuntimeForTesting(createTestMockRuntime());
