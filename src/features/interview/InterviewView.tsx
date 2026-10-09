import { useState } from 'react';
import { 
  MessageSquareCode, 
  Sparkles, 
  Send, 
  Bot, 
  Play,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../../app/useAppStore';
import { InterviewQuestion, MockAnswerEvaluation, Job } from '../../types';
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../../domain/interviewCopilot';

export function InterviewView() {
  const { candidateProfile, jobs } = useAppStore();
  
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [roleTitle, setRoleTitle] = useState(candidateProfile?.title || 'Software Engineer');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, MockAnswerEvaluation>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const handleStartSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoadingQuestions(true);
    setSessionCompleted(false);
    setEvaluations({});

    try {
      const targetJobToUse: Job = selectedJob || {
        id: 'job_custom',
        provider: 'local',
        providerJobId: 'custom',
        title: roleTitle,
        company: 'Target Enterprise',
        location: candidateProfile?.location || 'Remote',
        remoteType: 'remote',
        employmentType: 'full-time',
        description: `Position looking for experienced ${roleTitle} with skills in ${(candidateProfile?.skills || []).map(s => s.name).join(', ')}.`,
        requirements: (candidateProfile?.skills || []).map(s => s.name),
        preferredSkills: [],
        sourceUrl: '',
        publishedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString()
      };

      const generated = await generateInterviewQuestions(targetJobToUse, candidateProfile || undefined);
      setQuestions(generated);
      setIsSimulating(true);
      setCurrentQuestionIndex(0);
      setUserAnswerInput('');
    } catch (err) {
      console.error('Failed to generate interview questions:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswerInput.trim()) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    setIsEvaluating(true);
    try {
      const evalResult = await evaluateInterviewAnswer(currentQ, userAnswerInput, candidateProfile || undefined);
      setEvaluations(prev => ({ ...prev, [currentQ.id]: evalResult }));
    } catch (err) {
      console.error('Answer evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswerInput('');
    } else {
      setSessionCompleted(true);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const currentEval = currentQ ? evaluations[currentQ.id] : null;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquareCode className="w-6 h-6 text-blue-400" />
          <span>Interview Copilot & Simulator</span>
        </h1>
        <p className="text-sm text-slate-400">
          Practice role-specific interview questions grounded in your background. Receive STAR feedback & scoring.
        </p>
      </div>

      {!isSimulating ? (
        <div className="p-6 md:p-8 rounded-2xl bg-slate-800/60 border border-slate-700/60 max-w-2xl space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configure Mock Interview</h2>
              <p className="text-xs text-slate-400">Select target job or role title for customized questions.</p>
            </div>
          </div>

          <form onSubmit={handleStartSimulation} className="space-y-4">
            {jobs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Target Job Position
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    const j = jobs.find(item => item.id === e.target.value);
                    if (j) setRoleTitle(j.title);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Role Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingQuestions}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoadingQuestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Interview Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Begin Practice Session</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : sessionCompleted ? (
        /* Session Completion Scorecard */
        <div className="p-6 md:p-8 rounded-2xl bg-slate-800/80 border border-slate-700/60 max-w-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Practice Session Complete!</h2>
            <p className="text-xs text-slate-400">
              You reviewed {questions.length} questions for {roleTitle}.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-left space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Question Evaluations</h3>
            {questions.map((q, idx) => {
              const ev = evaluations[q.id];
              return (
                <div key={q.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 max-w-xs">
                    <div className="font-semibold text-white">Q{idx + 1}: {q.question.slice(0, 50)}...</div>
                    <div className="text-[11px] text-slate-400 capitalize">{q.category}</div>
                  </div>
                  {ev ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Score: {ev.score}%
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Skipped</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsSimulating(false)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Another Session</span>
          </button>
        </div>
      ) : (
        /* Active Interview Turn */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length} • {currentQ?.category || 'technical'}
              </span>

              <button
                onClick={() => setIsSimulating(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                End Practice
              </button>
            </div>

            <h2 className="text-lg font-bold text-white leading-snug">
              {currentQ?.question}
            </h2>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Why This Question is Asked & Structure
              </div>
              <p className="text-slate-400">{currentQ?.whyAsked}</p>
              <div className="font-medium text-slate-200 border-t border-slate-800 pt-1">
                Suggested Structure: {currentQ?.suggestedStructure}
              </div>
            </div>
          </div>

          {/* User Answer Input & AI Evaluation Card */}
          {!currentEval ? (
            <form onSubmit={handleAnswerSubmit} className="space-y-3">
              <textarea
                rows={5}
                placeholder="Type your structured answer here (using STAR method)..."
                value={userAnswerInput}
                onChange={(e) => setUserAnswerInput(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Grounded AI evaluation against role requirements.
                </span>

                <button
                  type="submit"
                  disabled={isEvaluating || !userAnswerInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Evaluation</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* AI Evaluation Feedback Card */
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">AI Evaluation Scorecard</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-sm border border-emerald-500/30">
                  Score: {currentEval.score}%
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 space-y-1">
                  <div className="font-semibold text-cyan-300">Relevance</div>
                  <div className="text-slate-300">{currentEval.relevance}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 space-y-1">
                  <div className="font-semibold text-cyan-300">Technical Correctness</div>
                  <div className="text-slate-300">{currentEval.technicalCorrectness}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 space-y-1 md:col-span-2">
                  <div className="font-semibold text-cyan-300">Clarity & STAR Structure</div>
                  <div className="text-slate-300">{currentEval.clarityAndStructure}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Key Improvement Tips
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                  {currentEval.improvementTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <span>{currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Session'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
