import React from 'react';
import { LayoutDashboard, List, Users, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  
  const navItems = [
    { id: 'dashboard', label: 'แผงควบคุม', icon: LayoutDashboard, adminOnly: false },
    { id: 'history', label: 'ประวัติแพ็กเกจ', icon: List, adminOnly: false },
    { id: 'users', label: 'จัดการผู้ใช้', icon: Users, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300">
      <div className="h-20 flex items-center px-6 shrink-0 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Shield className="text-indigo-400" size={24} />
          <span className="text-white font-bold tracking-tight text-sm uppercase">EASY Encrypted <br/><span className="text-[10px] text-slate-500">Realtime packets</span></span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">ผู้ใช้</span>
            <span className="text-xs font-bold text-slate-200 truncate">{user?.username}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-400 transition-all"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
