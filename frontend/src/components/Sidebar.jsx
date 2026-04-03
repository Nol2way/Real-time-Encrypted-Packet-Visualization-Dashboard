import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',                    icon: 'fa-chart-line',        roles: ['admin', 'user'] },
  { id: 'packets',    label: 'Live Packets',                 icon: 'fa-network-wired',     roles: ['admin', 'user'] },
  { id: 'encryption', label: 'RSA Encryption',               icon: 'fa-lock',              roles: ['admin', 'user'] },
  { id: 'history',    label: 'Packet Archive',               icon: 'fa-clock-rotate-left', roles: ['admin', 'user'] },
  { id: 'account',   label: 'บัญชีของฉัน',                  icon: 'fa-circle-user',       roles: ['admin', 'user'] },
  { id: 'users',      label: 'User Management',              icon: 'fa-users-gear',        roles: ['admin'] },
  { id: 'logs',       label: 'ประวัติการเข้าสู่ระบบ',       icon: 'fa-rectangle-list',    roles: ['admin'] },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">

      {/* Logo */}
      <div className="h-20 flex items-center px-5 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
            <i className="fa-solid fa-shield-halved text-white text-base" />
          </div>
          <div>
            <p className="text-white font-black tracking-tight text-sm uppercase leading-none">EASY Encrypted</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Realtime Packet Monitor</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
          isAdmin
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        }`}>
          <i className={`fa-solid ${isAdmin ? 'fa-crown' : 'fa-user'} text-xs`} />
          <span>{isAdmin ? 'Administrator' : 'Standard User'}</span>
        </div>
      </div>

      {/* Network scope */}
      <div className="px-4 pt-2">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black mb-1">Network Scope</p>
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-globe text-green-400 text-xs" />
              <p className="text-[11px] text-green-400 font-bold">All Traffic</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-filter text-indigo-400 text-xs" />
              <p className="text-[11px] text-indigo-300 font-mono truncate">{user?.ip_subnet || 'unset'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="text-[9px] text-slate-700 uppercase tracking-widest font-black px-3 mb-2">Navigation</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            if (!item.roles.includes(user?.role)) return null;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} w-4 text-center text-sm`} />
                  <span className="text-xs">{item.label}</span>
                  {item.roles.includes('admin') && !item.roles.includes('user') && (
                    <span className="ml-auto text-[8px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">
                      Admin
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-user text-indigo-400 text-xs" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-0.5">Logged in as</p>
            <p className="text-xs font-black text-slate-200 truncate">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-600 hover:text-rose-400 transition-all"
            title="Sign out"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
