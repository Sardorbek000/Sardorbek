import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { setToken, authFetch } from '../../lib/api';
import { BookOpen, Users, LayoutDashboard, LogOut } from 'lucide-react';
import GroupsList from './GroupsList';
import TestsList from './TestsList';
import TestEditor from './TestEditor';
import Header from '../../components/Header';

export default function TeacherDashboard() {
  const { user, setUser } = useStore();
  const location = useLocation();

  const handleLogout = () => {
    setToken('');
    setUser(null);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
    { name: 'My Groups', path: '/teacher/groups', icon: Users },
    { name: 'My Tests', path: '/teacher/tests', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 p-4">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navigation</p>
            <nav className="space-y-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || (link.path !== '/teacher' && location.pathname.startsWith(`${link.path}/`));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-tight transition-colors ${
                      isActive ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="mt-auto">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-center px-4 py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-[11px] uppercase tracking-widest transition">
              <LogOut className="w-4 h-4" />
              <span>Secure Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col bg-slate-50 p-6 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-8 overflow-y-auto w-full max-w-5xl mx-auto space-y-6">
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/groups" element={<GroupsList />} />
                <Route path="/tests" element={<TestsList />} />
                <Route path="/tests/:testId" element={<TestEditor />} />
              </Routes>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function DashboardHome() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await authFetch('/api/teacher/summary');
        setSummary(res);
      } catch(e) {}
    };
    loadSummary();
  }, []);

  if (!summary) return <div className="p-8 text-[11px] font-bold text-slate-400 tracking-widest uppercase">Fetching Diagnostics...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight uppercase text-slate-800 mb-8">System Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/teacher/groups" className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm flex flex-col group">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Groups</h3>
             <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{summary.totalGroups}</p>
        </Link>
        <Link to="/teacher/tests" className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm flex flex-col group">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Exams</h3>
             <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{summary.totalTests}</p>
        </Link>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Submissions</h3>
             <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
               <span className="w-2 h-2 rounded-full bg-amber-500"></span>
             </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{summary.totalAttempts}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-800 tracking-tight uppercase text-sm">Recent Student Activity</h3>
        </div>
        {summary.recentAttempts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 border-2 border-dashed border-slate-200 m-6 rounded-xl">
             No recent submissions found. Deploy tests to evaluate your students.
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Student Name</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Exam Designation</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Score Result</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-right">Timestamp</th>
                 </tr>
               </thead>
               <tbody className="text-sm font-medium text-slate-700">
                 {summary.recentAttempts.map((a: any) => (
                   <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                     <td className="py-4 px-6">{a.studentName}</td>
                     <td className="py-4 px-6 text-slate-500 font-bold uppercase tracking-tight text-xs line-clamp-1">{a.testTitle || 'Untitled Test'}</td>
                     <td className="py-4 px-6 font-bold text-indigo-600">{a.score}</td>
                     <td className="py-4 px-6 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                       {new Date(a.finishedAt).toLocaleString()}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
