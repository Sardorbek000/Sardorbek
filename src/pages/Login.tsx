import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/api';
import { useStore } from '../store/useStore';
import { ShieldCheck, GraduationCap, User } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loadingRole, setLoadingRole] = useState('');
  const navigate = useNavigate();
  const { setUser } = useStore();

  const handleDevLogin = async (role: string) => {
    setError('');
    setLoadingRole(role);
    try {
      const res = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoadingRole('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col items-center relative overflow-hidden">
        {/* Subtle decorative top border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-2xl text-white mb-4 shadow-inner">Σ</div>
        <h1 className="text-xl font-bold tracking-tight uppercase text-slate-800 mb-1">MAQSAD PRO</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 text-center leading-relaxed">
          Development Mode<br/>
          <span className="text-slate-400">Passwordless Entry Enabled</span>
        </p>
        
        {error && (
          <div className="mb-6 w-full text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-4 py-3 rounded-lg uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => handleDevLogin('admin')}
            disabled={loadingRole !== ''}
            className="w-full flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <div className="flex items-center">
              <ShieldCheck className="w-5 h-5 mr-3 text-emerald-400" />
              <span className="font-bold text-sm tracking-widest uppercase">Admin Panel</span>
            </div>
            {loadingRole === 'admin' ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>→</span>}
          </button>

          <button 
            onClick={() => handleDevLogin('teacher')}
            disabled={loadingRole !== ''}
            className="w-full flex items-center justify-between bg-indigo-50 text-indigo-700 border border-indigo-100 p-4 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm disabled:opacity-50"
          >
             <div className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-3 text-indigo-500" />
              <span className="font-bold text-sm tracking-widest uppercase">Teacher Panel</span>
            </div>
            {loadingRole === 'teacher' ? <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" /> : <span>→</span>}
          </button>

          <button 
            onClick={() => handleDevLogin('student')}
            disabled={loadingRole !== ''}
            className="w-full flex items-center justify-between bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
          >
             <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-emerald-500" />
              <span className="font-bold text-sm tracking-widest uppercase">Student Portal</span>
            </div>
            {loadingRole === 'student' ? <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" /> : <span>→</span>}
          </button>
        </div>

        <p className="mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center">
          Authentication system is temporarily bypassed<br/>for rapid testing and demonstration.
        </p>
      </div>
    </div>
  );
}
