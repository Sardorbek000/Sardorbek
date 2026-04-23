import { useState, useEffect } from 'react';
import { authFetch } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { BookOpen, Plus, ArrowRight, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function TestsList() {
  const { user } = useStore();
  const [tests, setTests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) loadTests();
  }, [user]);

  const loadTests = async () => {
    try {
      const res = await authFetch('/api/tests');
      setTests(res);
    } catch(e) {}
  };

  const createTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await authFetch('/api/tests', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          createdBy: user?.id,
          startTime: Date.now(),
          endTime: Date.now() + 86400000 * 7,
          durationLimit: 60,
          showResult: true,
          showAnswers: true,
          groupIds: []
        })
      });
      setShowModal(false);
      navigate(`/teacher/tests/${res.id}`);
    } catch (e: any) {
      alert("Failed to create test: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-sm font-bold tracking-tight uppercase flex items-center text-slate-800">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" /> Exam Configurations
        </h1>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-md flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Initialize Test
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold uppercase tracking-widest text-xs text-slate-800">New Exam</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createTest} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Exam Designation (Title)</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Midterm Computing"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all"
                  autoFocus
                  required
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-md">
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {tests.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-snug">{t.title}</h3>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-mono rounded">
                ID: {t.id.substring(0, 8)}
              </span>
            </div>
            
            <div className="flex-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {t.groupIds?.length || 0} Target Groups
               </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <Link to={`/teacher/tests/${t.id}`} className="inline-flex items-center text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors">
                Configure Exam Parameters <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>
        ))}
        
        {tests.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            No exams configured yet. Initialize a new test to begin.
          </div>
        )}
      </div>
    </div>
  );
}
