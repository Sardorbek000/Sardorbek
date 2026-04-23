import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { LogOut, UserPlus, Users, LayoutGrid, ClipboardList, CheckCircle2, Download, Trash2, Plus } from 'lucide-react';
import Header from '../../components/Header';
import { authFetch, setToken } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'bulk'>('users');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [name, setName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [generatedUsers, setGeneratedUsers] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const { setUser } = useStore();
  const { t } = useLanguage();

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  const generateCredentials = (stdName: string) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const password = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const username = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    return { name: stdName, username, password };
  };

  const addStudentToList = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || !selectedGroup) return;
    const student = {
       ...generateCredentials(newName.trim()),
       groupId: selectedGroup
    };
    setPendingStudents(prev => [...prev, student]);
    setNewName('');
  };

  const removePendingStudent = (index: number) => {
    const studentToRemove = pendingStudents.filter(s => s.groupId === selectedGroup)[index];
    setPendingStudents(prev => prev.filter(s => s !== studentToRemove));
  };

  const handleExportCSV = () => {
    const data = generatedUsers.length > 0 ? generatedUsers : pendingStudents;
    if (data.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,Name,Username,Password\n";
    data.forEach(u => {
      csvContent += `${u.name},${u.username},${u.password}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credentials_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadUsers = async () => {
    try {
      const res = await authFetch('/api/users');
      setUsers(res);
    } catch(e) {}
  };

  const loadGroups = async () => {
    try {
      const res = await authFetch('/api/groups');
      setGroups(res);
    } catch(e) {}
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: 'Processing...', type: 'info' });
    try {
      await authFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, name, role })
      });
      
      setUsername(''); setPassword(''); setName('');
      loadUsers();
      setMsg({ text: `User ${name} provisioned successfully!`, type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (error: any) {
      setMsg({ text: error.message || 'Failed to create user', type: 'error' });
    }
  };

  const handleBulkCreate = async () => {
    const studentsForGroup = pendingStudents.filter(s => s.groupId === selectedGroup);
    if (studentsForGroup.length === 0) return;
    setMsg({ text: 'Generating users...', type: 'info' });

    try {
      const res = await authFetch('/api/admin/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ 
          students: studentsForGroup,
          groupId: selectedGroup
        })
      });
      // Ensure res is handled correctly
      if (!res || !res.users) throw new Error('Invalid response from server');
      
      setGeneratedUsers(prev => [...prev, ...res.users.map((u: any) => ({ ...u, groupId: selectedGroup }))]);
      setPendingStudents(prev => prev.filter(s => s.groupId !== selectedGroup));
      loadUsers();
      setMsg({ text: `${res.users.length} users generated!`, type: 'success' });
    } catch (e: any) {
      console.error('Bulk creation error:', e);
      setMsg({ text: e.message || 'Bulk creation failed. Please try again.', type: 'error' });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await authFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      setNewGroupName('');
      loadGroups();
      setMsg({ text: 'Group created successfully', type: 'success' });
    } catch (e) {}
  };

  const handleAssignToGroup = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;
    setMsg({ text: 'Assigning users...', type: 'info' });
    try {
      await authFetch(`/api/admin/groups/${selectedGroup}/assign`, {
        method: 'POST',
        body: JSON.stringify({ userIds: selectedUsers })
      });
      setMsg({ text: 'Users assigned to group successfully', type: 'success' });
      setSelectedUsers([]);
      loadUsers();
    } catch (e: any) {
      setMsg({ text: e.message || 'Assignment failed', type: 'error' });
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('adminDashboard')}</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-tight transition ${activeTab === 'users' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Users className="w-4 h-4" />
                <span>{t('totalUsers')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('bulk')}
                className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-tight transition ${activeTab === 'bulk' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ClipboardList className="w-4 h-4" />
                <span>{t('adminProvision')}</span>
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

          {activeTab === 'users' && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
                <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800 mb-6 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                  {t('createNewUser')}
                </h3>
                
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('studentName')}</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('emailPlaceholder')}</label>
                    <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('passwordPlaceholder')}</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('systemRole')}</label>
                    <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all">
                      <option value="student">{t('studentPortal')}</option>
                      <option value="teacher">{t('teacherPanel')}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 mt-4 flex justify-end pt-4 border-t border-slate-100">
                    <button type="submit" className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-md">
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[400px]">
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                   <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800">{t('directoryIndex')}</h3>
                   
                   <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('filterByGroup')}:</span>
                      <select 
                        value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value)}
                        className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                         <option value="all">{t('allUsers')}</option>
                         {groups.map(g => (
                           <option key={g.id} value={g.id}>{g.name}</option>
                         ))}
                      </select>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{users.filter(u => filterGroup === 'all' || u.groupIds?.includes(filterGroup)).length} {t('records')}</span>
                   </div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Group List Column */}
                  <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">{t('filterByGroup')}</p>
                    <div className="space-y-1">
                      <button 
                        onClick={() => setFilterGroup('all')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-tight transition ${filterGroup === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        {t('allUsers')}
                      </button>
                      {groups.map(g => (
                        <button 
                          key={g.id}
                          onClick={() => setFilterGroup(g.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-tight transition ${filterGroup === g.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users Table Column */}
                  <div className="flex-1 overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-4 px-8">{t('studentName')}</th>
                          <th className="py-4 px-8">{t('emailPlaceholder')}</th>
                          <th className="py-4 px-8">{t('systemRole')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                         {users
                           .filter(u => {
                              if (filterGroup === 'all') return true;
                              let ids = u.groupIds;
                              if (typeof ids === 'string') {
                                try { ids = JSON.parse(ids); } catch(e) { ids = []; }
                              }
                              return Array.isArray(ids) && ids.includes(filterGroup);
                           })
                           .map(u => (
                           <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                             <td className="py-4 px-8 font-medium text-slate-800">{u.name}</td>
                             <td className="py-4 px-8 text-slate-500">{u.username}</td>
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
                       {users
                           .filter(u => {
                              if (filterGroup === 'all') return true;
                              let ids = u.groupIds;
                              if (typeof ids === 'string') {
                                try { ids = JSON.parse(ids); } catch(e) { ids = []; }
                              }
                              return Array.isArray(ids) && ids.includes(filterGroup);
                           }).length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-slate-400 text-sm italic">
                              No students found in this group.
                            </td>
                          </tr>
                       )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6 pb-20">
               {/* Group Creation Section */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800 mb-6 flex items-center">
                    <LayoutGrid className="w-5 h-5 mr-2 text-indigo-600" />
                    {t('createGroup')}
                  </h3>
                  <form onSubmit={handleCreateGroup} className="flex gap-3">
                    <input 
                      type="text"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder={t('groupName')}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                    />
                    <button type="submit" className="px-6 bg-indigo-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition">
                      {t('save')}
                    </button>
                  </form>
               </div>

               {/* Student Provisioning Section */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                 <h3 className="text-sm font-bold tracking-tight uppercase text-slate-800 mb-6 flex items-center">
                   <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
                   {t('bulkProvisionStudents')}
                 </h3>

                 <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('selectTargetGroup')}</label>
                    <div className="flex flex-wrap gap-2">
                       {groups.map(g => (
                         <button 
                           key={g.id}
                           onClick={() => setSelectedGroup(g.id)}
                           className={`px-4 py-2 rounded-full border-2 text-[10px] font-bold uppercase tracking-widest transition ${
                             selectedGroup === g.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                           }`}
                         >
                           {g.name}
                         </button>
                       ))}
                       {groups.length === 0 && <p className="text-xs text-slate-400 italic">No groups created yet. Create one above.</p>}
                    </div>
                 </div>

                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-6">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">{t('instruction')}</p>
                    <p className="text-xs text-indigo-600 font-medium">
                      {t('individualProvisionNotice')}
                    </p>
                 </div>
                 
                 <form onSubmit={addStudentToList} className="flex gap-3 mb-8 pb-8 border-b border-slate-100">
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder={t('studentNamePlaceholder')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!selectedGroup}
                      className="px-6 bg-slate-900 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center space-x-2 hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('addStudent')}</span>
                    </button>
                 </form>

                 {pendingStudents.filter(s => s.groupId === selectedGroup).length > 0 && (
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('provisionList')} ({pendingStudents.filter(s => s.groupId === selectedGroup).length})</h4>
                            <p className="text-[11px] font-bold text-indigo-600 uppercase mt-1">Target Group: {groups.find(g => g.id === selectedGroup)?.name}</p>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={handleExportCSV}
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition flex items-center"
                            >
                               <Download className="w-4 h-4 mr-2" />
                               {t('exportToCSV')}
                            </button>
                            <button 
                              onClick={() => setPendingStudents(prev => prev.filter(s => s.groupId !== selectedGroup))}
                              className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 transition flex items-center"
                            >
                               <Trash2 className="w-4 h-4 mr-2" />
                               {t('clear')}
                            </button>
                         </div>
                      </div>
                      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <th className="py-4 px-6">{t('studentName')}</th>
                              <th className="py-4 px-6">Login (ID)</th>
                              <th className="py-4 px-6">Password</th>
                              <th className="py-4 px-6"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                             {pendingStudents.filter(s => s.groupId === selectedGroup).map((s, i) => (
                               <tr key={i} className="text-xs group hover:bg-slate-50">
                                 <td className="py-4 px-6 font-bold">{s.name}</td>
                                 <td className="py-4 px-6 font-mono text-indigo-600">{s.username}</td>
                                 <td className="py-4 px-6 font-mono text-slate-500">{s.password}</td>
                                 <td className="py-4 px-6 text-right">
                                    <button onClick={() => removePendingStudent(i)} className="text-slate-300 hover:text-rose-500 transition">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                 </td>
                               </tr>
                             ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={handleBulkCreate}
                          className="px-10 py-3 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-lg shadow-indigo-100"
                        >
                          {t('batchGenerateAccounts')}
                        </button>
                      </div>
                   </div>
                 )}
               </div>

               {generatedUsers.filter(u => u.groupId === selectedGroup).length > 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="px-8 py-5 border-b border-emerald-100 bg-emerald-50/50 flex justify-between items-center text-emerald-800 font-bold uppercase tracking-widest text-[10px]">
                       <span>{t('generatedCredentials')} ({groups.find(g => g.id === selectedGroup)?.name})</span>
                       <div className="flex gap-4">
                         <button onClick={handleExportCSV} className="flex items-center text-emerald-600 hover:text-emerald-800">
                            <Download className="w-4 h-4 mr-2" />
                            {t('exportToCSV')}
                         </button>
                         <button onClick={() => setGeneratedUsers(prev => prev.filter(u => u.groupId !== selectedGroup))} className="text-emerald-500 hover:text-emerald-700">{t('clear')}</button>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <tr>
                              <th className="py-4 px-8">{t('studentName')}</th>
                              <th className="py-4 px-8">Login (ID)</th>
                              <th className="py-4 px-8">{t('passwordPlaceholder')}</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-mono">
                          {generatedUsers.filter(u => u.groupId === selectedGroup).map((u, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                               <td className="py-4 px-8 font-sans font-bold">{u.name}</td>
                               <td className="py-4 px-8">{u.username}</td>
                               <td className="py-4 px-8 text-emerald-600 font-black">{u.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
