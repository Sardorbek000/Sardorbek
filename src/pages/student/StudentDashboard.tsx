import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { authFetch, setToken } from '../../lib/api';
import Header from '../../components/Header';
import { LogOut, Play, Search, X, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import TestEngine from './TestEngine';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { useLanguage } from '../../lib/LanguageContext';

export default function StudentDashboard() {
  return (
    <Routes>
      <Route path="/" element={<StudentPortal />} />
      <Route path="/test/:testId" element={<TestEngine />} />
    </Routes>
  );
}

function StudentPortal() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const handleLogout = () => {
    setToken('');
    setUser(null);
  };

  const [tests, setTests] = useState<any[]>([]);
  const [groupId, setGroupId] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'completed'>('overview');
  const [results, setResults] = useState<any[]>([]);
  const [reviewData, setReviewData] = useState<{questions: any[], answers: any[], open: boolean, attemptId: string}>({questions: [], answers: [], open: false, attemptId: ''});

  useEffect(() => {
    if (user) {
      loadAssignedTests();
      loadResults();
    }
  }, [user]);

  const loadReview = async (attemptId: string) => {
    try {
      const res = await authFetch(`/api/student/attempts/${attemptId}/review`);
      setReviewData({ questions: res.questions, answers: res.answers, open: true, attemptId });
    } catch (e: any) {
      alert("Answers are locked! Please wait for the teacher to conclude the session.");
    }
  };

  const loadAssignedTests = async () => {
    try {
      const res = await authFetch('/api/student/tests');
      setTests(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadResults = async () => {
    try {
      const res = await authFetch('/api/student/results');
      setResults(res);
    } catch (e) {}
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId.trim()) return;

    try {
      await authFetch('/api/users/me/groups', {
        method: 'POST',
        body: JSON.stringify({ groupId: groupId.trim() })
      });

      setMsg({ text: 'Successfully joined group!', type: 'success' });
      setGroupId('');
      loadAssignedTests();
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch (e) {
      setMsg({ text: 'Error joining group', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden text-sm">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 p-4">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('portalMenu')}</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-tight transition ${activeTab === 'overview' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}>
                <Activity className="w-4 h-4" />
                <span>{t('overview')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('active')}
                className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-tight transition ${activeTab === 'active' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}>
                <Calendar className="w-4 h-4" />
                <span>{t('activeTasks')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-tight transition ${activeTab === 'completed' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('completedRecords')}</span>
              </button>
            </nav>
          </div>
          
          <div className="mt-auto">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-center px-4 py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-[11px] uppercase tracking-widest transition">
              <LogOut className="w-4 h-4" />
              <span>{t('secureLogout')}</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col bg-slate-50 p-6 overflow-hidden">
          
          {msg.text && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest border ${
              msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {msg.text}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                 <h2 className="text-lg font-bold tracking-tight text-slate-800 uppercase mb-6">{t('performanceDashboard')}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col justify-center items-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('examsTaken')}</span>
                       <span className="text-3xl font-black text-slate-800 font-mono">{results.length}</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex flex-col justify-center items-center">
                       <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">{t('averageScore')}</span>
                       <span className="text-3xl font-black text-indigo-600 font-mono">
                         {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length) : 0}
                       </span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex flex-col justify-center items-center">
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">{t('successRate')}</span>
                       <span className="text-3xl font-black text-emerald-600 font-mono">
                         {results.length > 0 ? Math.round((results.filter(r => (r.score || 0) >= 50).length / results.length) * 100) : 0}%
                       </span>
                    </div>
                 </div>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                 <div className="p-8 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 relative">
                    <div>
                       <h2 className="text-lg font-bold tracking-tight text-slate-800 uppercase mb-1">{t('calendarSchedule')}</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('upcomingExamsDesc')}</p>
                    </div>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {tests.map(tData => (
                       <div key={tData.id} className="bg-slate-50 p-5 rounded-xl border border-indigo-100 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight line-clamp-1">{tData.title}</h3>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 space-y-1">
                              <p>{t('start')}: {new Date(tData.startTime).toLocaleDateString()} {new Date(tData.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p>{t('end')}: {new Date(tData.endTime).toLocaleDateString()} {new Date(tData.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              {tData.attemptCount > 0 && <p className="text-indigo-600 font-black">{t('previousAttempts')}: {tData.attemptCount}</p>}
                           </div>
                          </div>
                          <div className="text-right flex flex-col items-end shrink-0 ml-4">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase tracking-widest rounded mb-2">{t('scheduled')}</span>
                            <span className="text-[10px] font-bold text-slate-500">{tData.durationLimit} {t('minLimit')}</span>
                          </div>
                       </div>
                     ))}
                     {tests.length === 0 && (
                       <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                          <Calendar className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="text-slate-500 font-bold uppercase tracking-tight text-sm">{t('noScheduledExams')}</p>
                       </div>
                     )}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 relative">
                   <div>
                      <h2 className="text-lg font-bold tracking-tight text-slate-800 uppercase mb-1">{t('assignedTasks')}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('verifyNotice')}</p>
                   </div>
                   <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest">{t('networkVerified')}</span>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full max-h-full">
                    {tests.map(t => (
                      <div key={t.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                         <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-2">{t.title}</h3>
                         
                         <div className="flex-1 space-y-2 mt-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                           <p>{t('duration')}: <span className="text-slate-800">{t.durationLimit} {t('minLimit')}</span></p>
                           <p>{t('statusLabel')}: <span className={t.isExhausted ? 'text-rose-500' : 'text-indigo-600'}>{t.isExhausted ? 'EXHAUSTED' : t('active')}</span></p>
                           <p>Attempts: <span className="text-slate-800">{t.attemptCount || 0} / {t.attemptLimit || 1}</span></p>
                         </div>

                         <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
                            {t.isExhausted ? (
                               <span className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-bold uppercase tracking-widest">
                                 Limit Reached
                               </span>
                            ) : t.attemptCount > 0 && (
                              <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-bold uppercase tracking-widest">
                                {t('retakeAvailable')}
                              </span>
                            )}
                           <button 
                             disabled={t.isExhausted}
                             onClick={() => navigate(`/student/test/${t.id}`)}
                             className={`flex items-center px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition shadow-sm ml-auto ${
                               t.isExhausted ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                               t.activeAttemptId ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                             }`}
                           >
                             <Play className="w-3 h-3 mr-2" />
                             {t.isExhausted ? 'Locked' : (t.activeAttemptId ? t('resumeSession') : (t.attemptCount > 0 ? t('retrySession') : t('initiateSession')))}
                           </button>
                         </div>
                      </div>
                    ))}
                    
                    {tests.length === 0 && (
                      <div className="col-span-full h-full w-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Search className="w-8 h-8 text-slate-300 mb-4" />
                        <p className="text-slate-800 font-bold uppercase tracking-tight mb-2">No exams active</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Waiting for administrator group assignment</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          )}

          {activeTab === 'completed' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 relative">
                 <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-800 uppercase mb-1">Completed Records</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical attempt logs</p>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto p-8 relative">
                 {results.length === 0 ? (
                   <div className="h-full w-full flex object-center flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-12">
                      <Search className="w-8 h-8 text-slate-300 mb-4" />
                      <p className="text-slate-800 font-bold uppercase tracking-tight mb-2">No records found</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {results.map((r, i) => (
                       <div key={r.id + i} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col relative overflow-hidden">
                         <div className={`absolute top-0 left-0 w-1 h-full ${r.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                         <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(r.finishedAt).toLocaleString() || 'N/A'}</p>
                           <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                             Attempt #{r.attemptNumber || 1}
                           </span>
                         </div>
                         <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight line-clamp-1">{r.testTitle || 'Unknown Exam'}</h3>
                         <div className="flex items-center justify-between mt-4 text-xs font-bold font-mono">
                           <span className="text-slate-500">Score</span>
                           <span className={r.forceFailed ? 'text-rose-600' : 'text-emerald-600'}>{ (r.showResult === 1 || r.isClosed === 1) ? r.score : 'Pending...' }</span>
                         </div>
                         <div className="flex items-center justify-between mt-2 text-xs font-bold font-mono">
                           <span className="text-slate-500">Status</span>
                           <span className="text-slate-700">{r.forceFailed ? 'TERMINATED' : r.status.toUpperCase()}</span>
                         </div>
                         {r.isClosed && (
                           <button onClick={() => loadReview(r.id)} className="mt-4 px-4 py-2 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest rounded transition">View Blank</button>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

          {reviewData.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                      <div>
                        <h3 className="font-bold uppercase tracking-widest text-sm text-slate-800">Electronic Blank</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail view of your responses</p>
                      </div>
                      <button onClick={() => setReviewData({...reviewData, open: false})} className="p-2 bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-800 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/50">
                        {reviewData.questions.map((q: any, idx: number) => {
                           const ans = reviewData.answers.find((a: any) => a.questionId === q.id);
                           const isCorrect = ans?.isCorrect === 1;

                           return (
                              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Question {idx + 1}</h4>
                                     <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                       {isCorrect ? 'Correct Pass' : 'Failure'} ({q.points} pt)
                                     </span>
                                 </div>
                                 
                                 {q.type === 'math' ? (
                                   <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6 overflow-x-auto text-lg text-slate-800 min-h-[60px] flex items-center justify-center">
                                     <BlockMath math={q.question || '\\text{No content}'} />
                                   </div>
                                 ) : (
                                   <p className="text-slate-700 font-medium mb-6 whitespace-pre-wrap">{q.question}</p>
                                 )}

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Submitted Payload</p>
                                        <div className={`font-mono text-sm font-bold mt-2 overflow-x-auto ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {ans?.answer ? (q.type === 'math' ? <InlineMath math={ans.answer || '\\text{}'} errorColor={'#cc0000'} /> : ans.answer) : '(Null / No Input)'}
                                        </div>
                                     </div>
                                     <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Teacher's Expected Target</p>
                                        <div className="font-mono text-sm font-bold text-indigo-800 mt-2 overflow-x-auto">
                                          {q.type === 'math' ? <InlineMath math={q.correctAnswer || '\\text{No Target provided}'} errorColor={'#cc0000'} /> : (q.correctAnswer || 'None')}
                                        </div>
                                     </div>
                                 </div>
                              </div>
                           );
                        })}
                    </div>
                </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
