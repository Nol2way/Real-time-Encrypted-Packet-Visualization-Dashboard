import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-[#0f172a]/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="text-indigo-400" size={24} />
            <span className="font-bold text-white tracking-tight uppercase text-sm">EASY Encrypted</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">เข้าสู่ระบบ</h1>
            <p className="text-slate-500 text-sm mt-1 italic">Identify yourself to access the telemetry.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" required 
                  className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-white shadow-inner"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" required 
                  className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-white shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/40"
            >
              <span>{loading ? 'Connecting...' : 'เข้าสู่ระบบ'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm font-bold">
              New Operator? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 ml-1">Register Access</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
