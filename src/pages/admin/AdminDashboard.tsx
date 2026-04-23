import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { LogOut, UserPlus, Users } from 'lucide-react';
import Header from '../../components/Header';
import { authFetch, setToken } from '../../lib/api';

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [name, setName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const { setUser } = useStore();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await authFetch('/api/users');
      setUsers(res);
    } catch(e) {}
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: 'Processing...', type: 'info' });
    try {
      await authFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role })
      });
      
      setEmail(''); setPassword(''); setName('');
      loadUsers();
      setMsg({ text: `User ${name} provisioned successfully!`, type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (error: any) {
      console.error(error);
      setMsg({ text: error.message || 'Failed to create user', type: 'error' });
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
  };

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 p-4">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Admin Menu</p>
            <nav className="space-y-1">
              <button className="w-full flex items-center space-x-3 text-left px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg font-bold text-xs uppercase tracking-tight">
                <Users className="w-4 h-4" />
                <span>Manage Users</span>
              </button>
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
        <section className="flex-1 flex flex-col bg-slate-50 p-6 overflow-y-auto">
          
          {msg.text && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest border ${
              msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {msg.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
            <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800 mb-6 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
              Create New System User
            </h3>
            
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Initial Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Role</label>
                <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div className="md:col-span-2 mt-4 flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-md">
                  Provision User
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800">Directory Index</h3>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-8">User Name</th>
                    <th className="py-4 px-8">Email Identifier</th>
                    <th className="py-4 px-8">System Password</th>
                    <th className="py-4 px-8">System Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                   {users.map(u => (
                     <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                       <td className="py-4 px-8 font-medium text-slate-800">{u.name}</td>
                       <td className="py-4 px-8 text-slate-500">{u.email}</td>
                       <td className="py-4 px-8 font-mono text-slate-500">{u.password || '******'}</td>
                       <td className="py-4 px-8">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                           u.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 
                           u.role === 'admin' ? 'bg-slate-800 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                         }`}>
                           {u.role}
                         </span>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
