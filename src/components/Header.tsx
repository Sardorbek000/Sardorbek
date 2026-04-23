import { useStore } from '../store/useStore';

export default function Header() {
  const { user } = useStore();
  
  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 shadow-lg z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-lg">Σ</div>
        <h1 className="font-bold tracking-tight text-lg uppercase">MAQSAD <span className="font-normal opacity-70">PRO</span></h1>
      </div>
      
      {user && (
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-xs font-semibold text-slate-400 uppercase">{user.role} SESSION</span>
             <span className="text-sm font-mono text-indigo-300 uppercase">ID: {user.id.substring(0,8)}</span>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-none">
               <p className="text-sm font-semibold">{user.name}</p>
               <p className="text-[10px] text-slate-400 uppercase">{user.username}</p>
            </div>
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600 font-bold uppercase text-sm">
               {user.name.substring(0, 2)}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
