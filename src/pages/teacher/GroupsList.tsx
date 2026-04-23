import { useState, useEffect } from 'react';
import { authFetch } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { Users, Plus } from 'lucide-react';

export default function GroupsList() {
  const { user } = useStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  const loadGroups = async () => {
    try {
      const res = await authFetch('/api/groups');
      setGroups(res);
    } catch(e) {}
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await authFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name, teacherId: user?.id })
      });
      setName('');
      loadGroups();
    } catch(e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <h1 className="text-sm font-bold tracking-tight uppercase flex items-center text-slate-800">
          <Users className="w-5 h-5 mr-2 text-indigo-600" /> Group Management
        </h1>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 w-full max-w-xl">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Create New Class/Group</h3>
        <form onSubmit={createGroup} className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Mathematics 101"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-medium transition-all shadow-sm"
            required
          />
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-md flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Provision
          </button>
        </form>
      </div>

      <div className="pt-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Active Groups / Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map(g => (
            <div key={g.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h3 className="text-base font-bold tracking-tight text-slate-800 uppercase">{g.name}</h3>
              <div className="mt-4 flex items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">SYS-ID:</span>
                <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono rounded">
                  {g.id}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 pt-4 border-t border-slate-100 opacity-60">Distribute ID to students</p>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="col-span-full py-12 px-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              No groups provisioned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
