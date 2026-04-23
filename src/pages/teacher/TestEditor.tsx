import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../lib/api';
import { ArrowLeft, Plus, Save, Trash2, Settings, X } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function TestEditor() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'results'>('editor');

  useEffect(() => {
    loadTest();
    loadQuestions();
    loadGroups();
  }, [testId]);

  const loadTest = async () => {
    if (!testId) return;
    try {
      const res = await authFetch(`/api/tests/${testId}`);
      setTest(res);
      const resultsRes = await authFetch(`/api/tests/${testId}/results`);
      setResults(resultsRes);
    } catch(e) {}
  };

  const loadQuestions = async () => {
    if (!testId) return;
    try {
       const res = await authFetch(`/api/tests/${testId}/questions`);
       setQuestions(res);
    } catch(e) {}
  };

  const loadGroups = async () => {
    try {
      const res = await authFetch('/api/groups');
      setGroups(res);
    } catch(e) {}
  };

  const [reviewModal, setReviewModal] = useState<{ active: boolean, data: any, studentName: string }>({ active: false, data: null, studentName: '' });

  const verifyAttempt = async (attemptId: string, studentName: string) => {
    try {
      const res = await authFetch(`/api/teacher/attempts/${attemptId}/review`);
      setReviewModal({ active: true, data: res, studentName });
    } catch(e: any) {
      alert("Error loading attempt data: " + e.message);
    }
  };

  const allowRetake = async (userId?: string) => {
    if (!confirm(userId ? "Are you sure you want to let this student retake the test?" : "Are you sure you want to let ALL students in the group retake this test?")) return;
    try {
      await authFetch(`/api/teacher/tests/${testId}/retake`, {
        method: 'POST',
        body: JSON.stringify(userId ? { userId } : {})
      });
      loadTest(); // Reload results
    } catch(e: any) {
      alert("Failed to process retake: " + e.message);
    }
  };

  const updateTestSettings = async (field: string, value: any) => {
    if (!test) return;
    const previous = { ...test };
    const updated = { ...test, [field]: value };
    setTest(updated);
    try {
      await authFetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value })
      });
      loadTest(); // Reload just in case
    } catch(e: any) {
      setTest(previous);
      alert("Failed to update test settings: " + e.message);
    }
  };

  const addQuestion = async () => {
    if (!testId) return;
    const newQ = {
      testId,
      question: 'New Question',
      type: 'mcq',
      options: ['Option 1', 'Option 2'],
      correctAnswer: 'Option 1',
      points: 1
    };
    try {
      await authFetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        body: JSON.stringify(newQ)
      });
      loadQuestions();
    } catch(e) {}
  };

  const deleteQuestion = async (qId: string) => {
    if (!testId) return;
    try {
      await authFetch(`/api/questions/${qId}`, { method: 'DELETE' });
      loadQuestions();
    } catch(e) {}
  };

  const deleteTest = async () => {
    if (!testId) return;
    try {
      await authFetch(`/api/tests/${testId}`, { method: 'DELETE' });
      navigate('/teacher/tests');
    } catch (e) {}
  };

  if (!test) return <div className="flex items-center justify-center p-12 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Exam Data...</div>;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto w-full h-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center space-x-6">
          <button onClick={() => navigate('/teacher/tests')} className="p-2 bg-white border border-slate-200 shadow-sm rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">{test.title || 'Untitled Test'}</h1>
            <div className="flex items-center mt-1 space-x-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${test.isClosed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                {test.isClosed ? 'Session Closed' : 'Active Exam'}
              </span>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Configuration System</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
           {!test.isClosed ? (
             <button 
               onClick={() => {
                 updateTestSettings('isClosed', true);
               }}
               className="px-4 py-2 mr-2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-amber-100 transition shadow-sm"
             >
               Stop & Reveal Blanks
             </button>
           ) : (
             <button 
               onClick={() => {
                 updateTestSettings('isClosed', false);
               }}
               className="px-4 py-2 mr-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition shadow-sm"
             >
               Reopen Exam
             </button>
           )}
           <button 
             onClick={() => setActiveTab('editor')}
             className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border rounded hover:bg-slate-50 transition-colors ${activeTab === 'editor' ? 'bg-white border-slate-200 text-slate-800' : 'bg-transparent border-transparent text-slate-500'}`}
           >
             Editor
           </button>
           <button 
             onClick={() => setActiveTab('results')}
             className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border rounded hover:bg-slate-50 transition-colors ${activeTab === 'results' ? 'bg-white border-slate-200 text-slate-800' : 'bg-transparent border-transparent text-slate-500'}`}
           >
             Results
           </button>
           <button 
             onClick={deleteTest}
             className="px-4 py-2 ml-4 flex items-center bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-rose-100 transition shadow-sm"
           >
             <Trash2 className="w-3 h-3 mr-2" />
             Scrap Exam
           </button>
        </div>
      </div>

      {activeTab === 'results' ? (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800 flex items-center">
               Student Attempts Log
             </h3>
             {results.length > 0 && (
               <button 
                 onClick={() => allowRetake()}
                 className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded font-bold text-[10px] uppercase tracking-widest transition"
               >
                 Allow Group Retake
               </button>
             )}
           </div>
           {results.length === 0 ? (
             <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase border border-dashed border-slate-200 p-8 text-center rounded bg-slate-50/50">No results recorded yet.</p>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-4 px-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Student Name</th>
                      <th className="py-4 px-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Score</th>
                      <th className="py-4 px-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Questions</th>
                      <th className="py-4 px-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Status</th>
                      <th className="py-4 px-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Warnings</th>
                      <th className="py-4 px-4 text-[10px] uppercase font-bold tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-slate-700">
                    {results.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{r.studentName}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Attempt #{r.attemptNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-indigo-600 font-bold">{r.score}</td>
                        <td className="py-3 px-4">{r.totalQuestions}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                             r.status==='completed'?'bg-emerald-50 text-emerald-700':
                             r.status==='archived'?'bg-slate-100 text-slate-500':'bg-amber-50 text-amber-700'
                          }`}>
                            {r.forceFailed ? 'Force Terminated' : r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-rose-600 font-mono">{r.warnings}/3</td>
                        <td className="py-3 px-4 text-right flex justify-end space-x-2">
                           {r.status === 'completed' && (
                             <button
                               onClick={() => allowRetake(r.userId)}
                               className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition shadow-sm"
                             >
                               Retake
                             </button>
                           )}
                           <button 
                             onClick={() => verifyAttempt(r.id, r.studentName)}
                             className="px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-sm"
                           >
                             Verify / Blank
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           )}
        </div>
      ) : (
        <>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 shadow-sm">
            <h2 className="text-sm font-bold tracking-tight uppercase text-slate-800 mb-6 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-indigo-600" /> Exam Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Designation / Title</label>
                <input 
                  type="text" 
                  value={test.title} 
                  onChange={e => updateTestSettings('title', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Scheduled Start</label>
                <input 
                  type="datetime-local" 
                  value={test.startTime ? new Date(test.startTime - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => {
                     const date = new Date(e.target.value);
                     if (!isNaN(date.getTime())) updateTestSettings('startTime', date.getTime());
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium font-mono uppercase transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Scheduled End / Deadline</label>
                <input 
                  type="datetime-local" 
                  value={test.endTime ? new Date(test.endTime - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => {
                     const date = new Date(e.target.value);
                     if (!isNaN(date.getTime())) updateTestSettings('endTime', date.getTime());
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium font-mono uppercase transition-all shadow-sm"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assign to Target Groups</label>
                <div className="bg-white border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                  {groups.length === 0 ? (
                    <div className="p-4 text-center text-[10px] uppercase tracking-widest text-slate-400 font-bold border border-dashed border-slate-200 rounded">
                       No groups available. Please provision a group first.
                    </div>
                  ) : (
                    groups.map(g => {
                      const isSelected = (test.groupIds || []).includes(g.id);
                      return (
                        <label key={g.id} className={`flex items-center p-3 rounded-md cursor-pointer transition ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            checked={isSelected}
                            onChange={(e) => {
                              let currentIds = [...(test.groupIds || [])];
                              if (e.target.checked) {
                                currentIds.push(g.id);
                              } else {
                                currentIds = currentIds.filter((id) => id !== g.id);
                              }
                              updateTestSettings('groupIds', currentIds);
                            }}
                          />
                          <div className="ml-3 flex-1 flex justify-between items-center">
                            <span className={`text-sm font-bold uppercase tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{g.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{g.id}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time Limit (Minutes)</label>
                <input 
                  type="number" 
                  value={test.durationLimit || 60} 
                  onChange={e => updateTestSettings('durationLimit', parseInt(e.target.value))} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Attempt Limit</label>
                <input 
                  type="number" 
                  value={test.attemptLimit || 1} 
                  onChange={e => updateTestSettings('attemptLimit', parseInt(e.target.value))} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pb-4 border-b border-slate-200 shrink-0">
            <h2 className="text-sm font-bold tracking-tight uppercase text-slate-800 flex items-center">
              Questions 
              <span className="ml-3 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] tracking-widest font-bold">
                {questions.length} Items
              </span>
            </h2>
            <button onClick={addQuestion} className="px-5 py-2 bg-slate-900 text-white rounded-md font-bold text-[10px] hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-sm flex items-center">
              <Plus className="w-3 h-3 mr-2" /> Insert Question
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <QuestionEditor key={q.id} q={q} idx={idx} testId={testId!} onDelete={() => deleteQuestion(q.id)} onUpdate={loadQuestions} />
            ))}
            {questions.length === 0 && (
              <div className="text-center py-12 border border-slate-200 border-dashed rounded-xl bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Exam framework initialized. Awaiting content insertion.
              </div>
            )}
          </div>
        </>
      )}

      {reviewModal.active && reviewModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-sm text-slate-800">Analytical Blank Review</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target: {reviewModal.studentName}</p>
                  </div>
                  <button onClick={() => setReviewModal({ active: false, data: null, studentName: '' })} className="p-2 bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-800 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/50">
                    {reviewModal.data.questions.map((q: any, idx: number) => {
                       const ans = reviewModal.data.answers.find((a: any) => a.questionId === q.id);
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
                                 <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Student's Input Payload</p>
                                    <p className={`font-mono text-sm font-bold mt-2 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {ans?.answer ? (q.type === 'math' ? <InlineMath math={ans.answer || '\\text{}'} errorColor={'#cc0000'} /> : ans.answer) : '(Null / No Input)'}
                                    </p>
                                 </div>
                                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 border-b border-indigo-200/50 pb-2">Teacher's Expected Target</p>
                                    <p className="font-mono text-sm font-bold text-indigo-800 mt-2">
                                      {q.type === 'math' ? <InlineMath math={q.correctAnswer || '\\text{}'} errorColor={'#cc0000'} /> : q.correctAnswer}
                                    </p>
                                 </div>
                             </div>
                          </div>
                       );
                    })}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ q, testId, idx, onDelete, onUpdate }: { q: any, testId: string, idx: number, onDelete: () => void, onUpdate: () => void }) {
  const [localQ, setLocalQ] = useState(q);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authFetch(`/api/questions/${q.id}`, {
        method: 'PUT',
        body: JSON.stringify(localQ)
      });
    } catch(e) {}
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-4">
          <span className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-bold font-mono">
            {idx + 1}
          </span>
          <select 
            value={localQ.type} 
            onChange={e => setLocalQ({...localQ, type: e.target.value})}
            className="px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-[11px] font-bold uppercase tracking-widest text-slate-700 outline-none"
          >
            <option value="mcq">Standard Choice</option>
            <option value="text">Direct Input</option>
            <option value="math">Mathematical (LaTeX)</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleSave} disabled={saving} className={`px-4 py-1.5 rounded-md flex items-center border text-[10px] font-bold uppercase tracking-widest transition-colors ${
            saving ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}>
            <Save className="w-3 h-3 mr-1.5" /> {saving ? 'Writing...' : 'Commit'}
          </button>
          <button onClick={onDelete} className="text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 p-1.5 rounded-md transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Problem Statement</label>
        <textarea 
          value={localQ.question} 
          onChange={e => setLocalQ({...localQ, question: e.target.value})}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium h-24 font-mono shadow-inner"
          placeholder="Enter problem. LaTeX supported: \frac{1}{2}"
        />
        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[60px] flex flex-col justify-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Rendering Pipeline</span>
          {localQ.type === 'math' ? (
            <div className="text-center py-2"><BlockMath math={localQ.question || '\\text{...}'} errorColor={'#e11d48'} /></div>
          ) : (
             <div className="whitespace-pre-wrap text-slate-800 text-sm font-medium">{localQ.question}</div>
          )}
        </div>
      </div>

      {localQ.type === 'mcq' && (
        <div className="space-y-3 p-5 bg-slate-50/50 rounded-lg border border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Response Options</label>
          <div className="space-y-2">
            {localQ.options?.map((opt: string, i: number) => (
              <div key={i} className={`flex items-center p-3 rounded-lg border ${localQ.correctAnswer === opt ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                <input 
                  type="radio" 
                  name={`correct-${q.id}`} 
                  checked={localQ.correctAnswer === opt} 
                  onChange={() => setLocalQ({...localQ, correctAnswer: opt})} 
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mr-4"
                />
                <input 
                  type="text" 
                  value={opt} 
                  onChange={(e) => {
                    const newOptions = [...localQ.options];
                    newOptions[i] = e.target.value;
                    setLocalQ({...localQ, options: newOptions});
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                  placeholder={`Option ${i+1}`}
                />
                <button 
                  onClick={() => setLocalQ({...localQ, options: localQ.options.filter((_: any, idx: number) => idx !== i)})}
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setLocalQ({...localQ, options: [...(localQ.options || []), `Option ${(localQ.options?.length || 0) + 1}`]})}
            className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
          >
            + Append Option
          </button>
        </div>
      )}

      {(localQ.type === 'text' || localQ.type === 'math') && (
        <div className="p-5 bg-slate-50/50 rounded-lg border border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Expected Target Frame</label>
          <input 
            type="text" 
            value={localQ.correctAnswer} 
            onChange={e => setLocalQ({...localQ, correctAnswer: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium font-mono"
            placeholder={localQ.type === 'math' ? 'e.g. 1/2 or \\frac{1}{2}' : 'Expected text payload'}
          />
          {localQ.type === 'math' && (
             <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex flex-col gap-2 p-3 border border-slate-200 rounded border-dashed bg-slate-50">
               Target Render: <div className="text-slate-800 text-base normal-case font-normal"><InlineMath math={localQ.correctAnswer || '\\text{pending}'} errorColor={'#cc0000'} /></div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
