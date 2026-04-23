import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight, GraduationCap, ShieldCheck, User } from 'lucide-react';
import { setToken } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import { useStore } from '../store/useStore';

export default function Login() {
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingRole, setLoadingRole] = useState('');
  const navigate = useNavigate();
  const { setUser } = useStore();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingRole('login');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        if (data.user.role === 'admin') navigate('/admin');
        else if (data.user.role === 'teacher') navigate('/teacher');
        else navigate('/student');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoadingRole('');
    }
  };

  const handleDevLogin = async (role: string) => {
    setError('');
    setLoadingRole(role);
    try {
      // Direct login simulation for dev mode
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        if (role === 'admin') navigate('/admin');
        else if (role === 'teacher') navigate('/teacher');
        else navigate('/student');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed');
    } finally {
      setLoadingRole('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-10 text-center bg-slate-50 border-b border-slate-100">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transition-transform hover:rotate-0">
               <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{t('loginTitle')}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{t('loginSubtitle')}</p>
          </div>

          <div className="p-10 space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none text-sm font-medium transition-all"
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none text-sm font-medium transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={loadingRole === 'login'}
                className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
              >
                {loadingRole === 'login' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <LogIn className="w-4 h-4" />}
                <span>{t('loginButton')}</span>
              </button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white px-2 text-slate-300">OR</span></div>
            </div>

            <div className="space-y-4">
               <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t('devMode')}</span>
                     <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest">{t('passwordlessEntry')}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleDevLogin('admin')}
                      disabled={!!loadingRole}
                      className="w-full group flex items-center justify-between p-4 bg-white hover:bg-slate-900 hover:text-white border border-indigo-100 rounded-xl transition duration-300 shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-lg bg-slate-900 group-hover:bg-indigo-600 flex items-center justify-center transition">
                           <ShieldCheck className="text-white w-5 h-5" />
                         </div>
                         <div className="text-left">
                            <p className="text-xs font-bold uppercase tracking-tight">{t('adminPanel')}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500">System Root</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                    </button>

                    <button 
                      onClick={() => handleDevLogin('teacher')}
                      disabled={!!loadingRole}
                      className="w-full group flex items-center justify-between p-4 bg-white hover:bg-slate-900 hover:text-white border border-indigo-100 rounded-xl transition duration-300 shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-lg bg-emerald-600 group-hover:bg-indigo-600 flex items-center justify-center transition">
                           <User className="text-white w-5 h-5" />
                         </div>
                         <div className="text-left">
                            <p className="text-xs font-bold uppercase tracking-tight">{t('teacherPanel')}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500">Academic Manager</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                    </button>

                    <button 
                      onClick={() => handleDevLogin('student')}
                      disabled={!!loadingRole}
                      className="w-full group flex items-center justify-between p-4 bg-white hover:bg-slate-900 hover:text-white border border-indigo-100 rounded-xl transition duration-300 shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center transition">
                           <GraduationCap className="text-white w-5 h-5" />
                         </div>
                         <div className="text-left">
                            <p className="text-xs font-bold uppercase tracking-tight">{t('studentPortal')}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500">Secure Access</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                    </button>
                  </div>
               </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                {t('authBypassNotice')}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          © 2024 SecureExam Engine • All nodes verified
        </p>
      </div>
    </div>
  );
}
