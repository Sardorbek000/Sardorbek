import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { Activity, Clock, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { BlockMath } from 'react-katex';
import { useLanguage } from '../../lib/LanguageContext';

export default function TestEngine() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const { t } = useLanguage();
  
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [isSubmit, setIsSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [blockedQuestions, setBlockedQuestions] = useState<string[]>([]);
  const [showViolationOverlay, setShowViolationOverlay] = useState(false);
  const [violationTimeLeft, setViolationTimeLeft] = useState(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-cheat detection
  useEffect(() => {
    if (isSubmit || !test || !hasStarted) return;

    const handleViolation = () => {
      if (showViolationOverlay) return; // Already dealing with a violation

      // Block current question
      const currentQId = questions[currentQ]?.id;
      if (currentQId && !blockedQuestions.includes(currentQId)) {
         setBlockedQuestions(prev => [...prev, currentQId]);
      }

      setWarnings(w => {
        const newW = w + 1;
        if (newW >= 3) {
           submitTest(true);
        }
        return newW;
      });

      setShowViolationOverlay(true);
      setViolationTimeLeft(5);

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setViolationTimeLeft(prev => {
           if (prev <= 1) {
              clearInterval(countdownTimerRef.current!);
              submitTest(true);
              return 0;
           }
           return prev - 1;
        });
      }, 1000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [test, isSubmit, hasStarted, currentQ, questions, blockedQuestions, showViolationOverlay]);

  // Initial Load
  useEffect(() => {
    async function init() {
      if (!testId || !user) return;
      
      try {
        const testData = await authFetch(`/api/tests/${testId}`);
        setTest(testData);
        let durationMs = (testData.durationLimit || 60) * 60 * 1000;
        setTimeLeft(durationMs);
        const qs = await authFetch(`/api/tests/${testId}/questions`);
        setQuestions(qs);

        // Check for active attempt to resume
        const activeRes = await authFetch(`/api/student/tests/${testId}/active-attempt`);
        if (activeRes && activeRes.attempt) {
          setAttemptId(activeRes.attempt.id);
          setWarnings(activeRes.attempt.warnings || 0);
          
          // Construct answers from server
          const serverAnswers: Record<string, string> = {};
          activeRes.answers.forEach((a: any) => {
            serverAnswers[a.questionId] = a.answer;
          });
          
          // Recover autosaved answers (local storage takes priority for fresh input)
          const saved = localStorage.getItem(`exam_draft_${testId}`);
          if (saved) {
            try {
              const localAnswers = JSON.parse(saved);
              setAnswers({ ...serverAnswers, ...localAnswers });
            } catch(e) {
              setAnswers(serverAnswers);
            }
          } else {
            setAnswers(serverAnswers);
          }

          // Calculate remaining time based on start time and duration
          const elapsed = Date.now() - activeRes.attempt.startedAt;
          const remaining = durationMs - elapsed;
          
          if (remaining <= 0) {
            // If time is up, we can set hasStarted to true and let the timer submit it, 
            // but safer to just set it to a very small positive or zero
            setTimeLeft(0);
          } else {
            setTimeLeft(remaining);
          }
          
          setHasStarted(true);
        } else {
          // Recover autosaved answers for fresh attempt
          const saved = localStorage.getItem(`exam_draft_${testId}`);
          if (saved) {
            try {
              setAnswers(JSON.parse(saved));
            } catch(e) {}
          }
        }
      } catch(e) {}
    }
    init();
  }, [testId, user]);

  // Auto-save Answers
  useEffect(() => {
    if (Object.keys(answers).length > 0 && testId && !isSubmit) {
      localStorage.setItem(`exam_draft_${testId}`, JSON.stringify(answers));
    }
  }, [answers, testId, isSubmit]);

  const startExam = async () => {
    try {
      const dbElement = document.documentElement;
      if (dbElement.requestFullscreen) await dbElement.requestFullscreen();
    } catch (e) {}

    try {
       const attempt = await authFetch('/api/attempts', {
          method: 'POST',
          body: JSON.stringify({
            testId,
            userId: user?.id,
            startedAt: Date.now(),
            status: 'in_progress',
            warnings: 0
          })
       });
       setAttemptId(attempt.id);
       setHasStarted(true);
    } catch(e) {}
  };

  // Timer Countdown
  useEffect(() => {
    if (!test || isSubmit || !hasStarted) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          submitTest(false);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test, isSubmit, hasStarted]);

  const submitTest = async (forceFail = false) => {
    if (!attemptId || isSubmit) return;
    setIsSubmit(true);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch(e) {}

    let calculatedScore = 0;
    
    try {
      for (const q of questions) {
        const studentAns = answers[q.id] || '';
        
        // Precise grading logic
        let isCorrect = false;
        if (!forceFail) {
          if (q.type === 'mcq') {
            isCorrect = studentAns === q.correctAnswer;
          } else {
            // Case-insensitive, space-insensitive grading for text/math
            isCorrect = studentAns.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          }
        }

        if (isCorrect) calculatedScore += (q.points || 1);

        await authFetch(`/api/attempts/${attemptId}/answers`, {
          method: 'POST',
          body: JSON.stringify({
            questionId: q.id,
            answer: studentAns,
            isCorrect
          })
        });
      }

      setScore(calculatedScore);

      await authFetch(`/api/attempts/${attemptId}`, {
         method: 'PUT',
         body: JSON.stringify({
           status: 'completed',
           finishedAt: Date.now(),
           score: forceFail ? 0 : calculatedScore,
           totalQuestions: questions.length,
           warnings,
           forceFailed: forceFail
         })
      });

      // Clear draft on successful completion
      localStorage.removeItem(`exam_draft_${testId}`);
    } catch(e) {}
  };

  const handleResume = async () => {
     try {
       if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
       }
     } catch (e) {}
     setShowViolationOverlay(false);
     if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  if (!test) return <div className="p-10 text-center font-mono text-[10px] uppercase text-slate-500 tracking-widest">{t('initializingEngine')}</div>;

  if (showViolationOverlay) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-rose-900 min-h-screen fixed inset-0 z-50 text-white selection:bg-rose-500">
        <ShieldAlert className="w-24 h-24 mb-6 text-rose-400 animate-pulse" />
        <h1 className="text-4xl font-black uppercase tracking-widest mb-4 text-center">{t('securityViolation')}</h1>
        <p className="text-rose-200 text-center max-w-lg text-lg mb-8 font-medium">
          {t('violationNotice')}
        </p>
        <div className="text-8xl font-black font-mono mb-12 drop-shadow-2xl">{violationTimeLeft}s</div>
        <button onClick={handleResume} className="px-10 py-5 bg-white text-rose-900 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-rose-50 transition transform hover:scale-105 shadow-2xl">
          {t('resumeSecureExam')}
        </button>
      </div>
    );
  }

  if (!hasStarted && !isSubmit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-screen">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-slate-200 max-w-lg w-full text-center">
          <ShieldAlert className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-800 mb-2">{test.title}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">{t('secureEnvironment')}</p>
          
          <div className="text-left space-y-4 mb-8 bg-slate-50 p-6 rounded-lg text-sm text-slate-700 font-medium border border-slate-100">
            <p>{t('fullscreenPolicy')}</p>
            <p>{t('antiCheatNotice')}</p>
            <p>{t('duration')}: <strong>{test.durationLimit} {t('minLimit')}</strong>.</p>
            <p className="text-rose-600">{t('violationPolicy')}</p>
          </div>

          <button onClick={startExam} className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-md">
            {t('acknowledgeStart')}
          </button>
        </div>
      </div>
    );
  }

  if (isSubmit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-slate-200 max-w-lg w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-800 mb-2">{t('examCompleted')}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">{t('responsesUploaded')}</p>
          
          <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-100 text-center">
             <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
               {t('submissionNotice')}<br/><br/>
               <span className="text-indigo-600">{t('gradeNotice')}</span>
             </p>
          </div>

          <button onClick={() => navigate('/student')} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-colors uppercase tracking-widest">
            {t('returnToDirectory')}
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const q = questions[currentQ];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center space-x-6">
           <h1 className="text-sm font-bold uppercase tracking-tight text-slate-800">{test.title}</h1>
           <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
             Q {currentQ + 1} {t('of')} {questions.length}
           </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
            <ShieldAlert className="w-4 h-4 mr-2" />
            <span className="text-[11px] font-bold uppercase tracking-widest">{t('warnings')}: {warnings}/3</span>
          </div>
          <div className="flex items-center text-indigo-700 bg-indigo-50 px-4 py-1.5 rounded-lg border border-indigo-100">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm font-bold font-mono tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div 
        className="flex-1 flex overflow-hidden select-none outline-none"
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onPaste={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Left Side: Navigation Map */}
        <div className="w-64 bg-white border-r border-slate-200 p-6 overflow-y-auto hidden md:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t('questionMap')}</p>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentQ(idx)}
                className={`w-10 h-10 rounded font-mono text-xs font-bold transition-colors flex items-center justify-center ${
                  blockedQuestions.includes(questions[idx].id) ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                  currentQ === idx ? 'bg-indigo-600 text-white shadow-md' :
                  answers[questions[idx].id] ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {blockedQuestions.includes(questions[idx].id) ? <Lock className="w-4 h-4" /> : (idx + 1)}
              </button>
            ))}
          </div>
        </div>

        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
          <div className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
             
             {/* Render Prompt */}
             <div className="mb-8 min-h-[120px]">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t('problemStatement')}</h3>
               {!q ? (
                 <p className="text-slate-500 italic text-sm">{t('noQuestionsAvailable') || 'No questions available'}</p>
               ) : q.type === 'math' ? (
                 <div className="text-lg"><BlockMath math={q.question || '\\text{No Question Content}'} errorColor={'#cc0000'} /></div>
               ) : (
                 <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">{q.question || 'No Question Content'}</p>
               )}
             </div>

             {/* Render Inputs */}
             {blockedQuestions.includes(q?.id) ? (
                <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-xl text-center my-6">
                  <Lock className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                  <h4 className="text-rose-800 font-black uppercase tracking-widest text-sm mb-2">{t('questionLocked')}</h4>
                  <p className="text-rose-600 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                    {t('lockNotice')}
                  </p>
                </div>
             ) : (
               <div className="space-y-4">
                 {q?.type === 'mcq' && q.options?.map((opt: string, i: number) => (
                   <button 
                    key={i}
                    onClick={() => setAnswers(prev => ({...prev, [q.id]: opt}))}
                    className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all font-medium text-sm flex items-center ${
                      answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                    }`}
                   >
                      <div className={`w-4 h-4 rounded-full border-2 mr-4 flex-shrink-0 flex items-center justify-center ${answers[q.id] === opt ? 'border-indigo-600' : 'border-slate-300'}`}>
                         {answers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      {opt}
                   </button>
                 ))}

                 {(q?.type === 'text' || q?.type === 'math') && (
                   <div>
                     <input 
                       type="text" 
                       value={answers[q?.id] || ''} 
                       onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                       placeholder={q?.type === 'math' ? t('enterFormula') : t('typeAnswer')}
                       className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:bg-white transition-colors outline-none font-mono text-sm shadow-inner"
                     />
                   </div>
                 )}
               </div>
             )}

             {/* Action Buttons */}
             <div className="mt-12 flex justify-between items-center pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
                  disabled={currentQ === 0}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  {t('previous')}
                </button>
                
                {currentQ === questions.length - 1 ? (
                  <button 
                    onClick={() => submitTest(false)} 
                    className="px-8 py-2.5 bg-rose-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-rose-700 transition"
                  >
                    {t('submitExam')}
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentQ(p => Math.min(questions.length - 1, p + 1))}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 transition"
                  >
                    {t('nextQuestion')}
                  </button>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
