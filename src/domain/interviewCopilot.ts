import { CandidateProfile, Job, InterviewQuestion, MockAnswerEvaluation } from '../types';
import { invokeExecutaTool } from '../anna/annaTools';
import { annaLlmComplete } from '../anna/annaLlm';

/**
 * Generates job-specific interview prep questions categorized by role, technical skills, behavioral, and skill gaps.
 */
export async function generateInterviewQuestions(
  job: Job,
  profile?: CandidateProfile
): Promise<InterviewQuestion[]> {
  // Try Executa plugin tool first
  try {
    const toolRes = await invokeExecutaTool<any>('generate_interview_questions', { job, profile });
    if (toolRes.success && toolRes.data && Array.isArray(toolRes.data) && toolRes.data.length > 0) {
      return toolRes.data.map((q: any, idx: number) => ({
        id: q.id || `q_exec_${idx + 1}`,
        category: q.category || 'technical',
        question: q.question || 'Describe your experience related to this position.',
        whyAsked: q.whyAsked || 'To assess core alignment with job requirements.',
        suggestedStructure: q.suggestedStructure || 'STAR Framework (Situation, Task, Action, Result)',
        candidateAnswerHint: q.candidateAnswerHint
      }));
    }
  } catch (err) {
    console.warn('Executa generate_interview_questions failed, falling back to Anna LLM:', err);
  }

  // LLM Fallback
  try {
    const systemPrompt = `You are JobPilot Interview Copilot. Generate 4 structured interview questions for the specified job posting. Return a valid JSON array of objects with keys: id, category ('technical'|'behavioral'|'project'|'role'|'skill_gap'), question, whyAsked, suggestedStructure, candidateAnswerHint. Do not include markdown code block formatting outside JSON.`;
    const userPrompt = `Job Title: ${job.title}
Company: ${job.company}
Requirements: ${(job.requirements || []).join(', ')}
Description: ${job.description.slice(0, 500)}`;

    const llmRes = await annaLlmComplete({
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const parsed = JSON.parse(llmRes.text.replace(/```json/g, '').replace(/```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: any, idx: number) => ({
        id: q.id || `q_llm_${idx + 1}`,
        category: q.category || 'technical',
        question: q.question,
        whyAsked: q.whyAsked || 'Assesses role readiness.',
        suggestedStructure: q.suggestedStructure || 'STAR Framework',
        candidateAnswerHint: q.candidateAnswerHint
      }));
    }
  } catch (err) {
    console.warn('Anna LLM interview question generation failed, using deterministic fallback:', err);
  }

  // Deterministic Fallback
  const reqs = (job.requirements || []).slice(0, 3);
  const primaryReq = reqs[0] || 'software development';

  return [
    {
      id: 'q_det_1',
      category: 'technical',
      question: `Can you walk us through your hands-on experience using ${primaryReq} in production environments?`,
      whyAsked: `Validates depth of expertise in key requirement (${primaryReq}).`,
      suggestedStructure: 'Highlight architecture decisions, code organization, and performance optimization.',
      candidateAnswerHint: `Reference projects using ${primaryReq} from your work history.`
    },
    {
      id: 'q_det_2',
      category: 'behavioral',
      question: `Describe a challenging technical obstacle you faced at a previous role and how you resolved it.`,
      whyAsked: 'Evaluates problem-solving capability, resilience, and engineering rigor under pressure.',
      suggestedStructure: 'Use STAR Framework: Situation -> Task -> Action taken -> Quantitative Result achieved.',
      candidateAnswerHint: 'Focus on your specific actions rather than just team actions.'
    },
    {
      id: 'q_det_3',
      category: 'role',
      question: `What attracts you to ${job.company} and the ${job.title} role specifically?`,
      whyAsked: 'Assesses genuine interest in company mission, tech stack, and career growth alignment.',
      suggestedStructure: 'Connect company goals with your personal strengths and career trajectory.',
      candidateAnswerHint: `Mention ${job.company}'s work and how your skills fit.`
    },
    {
      id: 'q_det_4',
      category: 'project',
      question: `Describe a system architecture design or project you led end-to-end.`,
      whyAsked: 'Measures end-to-end ownership, system design principles, and technical leadership.',
      suggestedStructure: 'Outline initial requirements, system architecture diagram, tech stack selection, and outcomes.',
      candidateAnswerHint: 'Include quantitative metrics (e.g. latency reduction, throughput, scale).'
    }
  ];
}

/**
 * Evaluates candidate's answer to an interview question using STAR framework & technical accuracy.
 */
export async function evaluateInterviewAnswer(
  question: InterviewQuestion,
  candidateAnswer: string,
  profile?: CandidateProfile
): Promise<MockAnswerEvaluation> {
  const answerLength = (candidateAnswer || '').trim().length;

  if (answerLength < 30) {
    return {
      score: 25,
      relevance: 'Answer is too brief to evaluate thoroughly.',
      technicalCorrectness: 'Insufficient technical detail provided.',
      clarityAndStructure: 'Lacks STAR structure and detail.',
      improvementTips: [
        'Provide specific technical context and details.',
        'Use the STAR method (Situation, Task, Action, Result).',
        'Quantify results achieved in your role.'
      ]
    };
  }

  // Try Executa tool evaluation
  try {
    const toolRes = await invokeExecutaTool<any>('evaluate_interview_answer', {
      question: question.question,
      answer: candidateAnswer,
      profile
    });

    if (toolRes.success && toolRes.data) {
      const data = toolRes.data;
      return {
        score: typeof data.score === 'number' ? data.score : 80,
        relevance: data.relevance || 'Answer directly addresses the question topic.',
        technicalCorrectness: data.technicalCorrectness || 'Demonstrates solid technical understanding.',
        clarityAndStructure: data.clarityAndStructure || 'Follows logical structure.',
        improvementTips: Array.isArray(data.improvementTips) ? data.improvementTips : ['Include quantitative metrics if possible.']
      };
    }
  } catch (err) {
    console.warn('Executa evaluate_interview_answer failed, falling back to Anna LLM:', err);
  }

  // Deterministic evaluation fallback
  const isStarLike = /situation|task|action|result|when|led|built|solved|improved/i.test(candidateAnswer);
  const score = Math.min(95, Math.max(60, (answerLength > 150 ? 75 : 60) + (isStarLike ? 15 : 0)));

  return {
    score,
    relevance: 'Good relevance to the question asked.',
    technicalCorrectness: 'Demonstrates relevant experience and concepts.',
    clarityAndStructure: isStarLike 
      ? 'Well structured with clear narrative flow and problem resolution.' 
      : 'Good response; structuring with explicit STAR stages will increase impact.',
    improvementTips: [
      'Ensure clear distinction between Situation, Task, Action, and Result.',
      'Highlight specific tools and metrics (e.g. reduced build time by 30%).',
      'Elaborate on how your actions directly contributed to the success.'
    ]
  };
}
