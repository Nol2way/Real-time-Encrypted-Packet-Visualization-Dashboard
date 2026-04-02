import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, Lock, User, ArrowRight, UserPlus } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('รหัสผ่านไม่ตรงกัน');
    }
    setLoading(true);
    try {
      await register(username, password);
      navigate('/');
    } catch (error) {
      // Handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans selection:bg-black selection:text-white">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="text-slate-900" size={24} />
            <span className="font-bold text-slate-900 tracking-tight uppercase text-sm">EASY Encrypted</span>
          </div>
          <UserPlus className="text-slate-400" size={20} />
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">สร้างบัญชี</h1>
            <p className="text-slate-500 text-sm mt-1">สมัครสมาชิกใหม่เพื่อเข้าใช้งานระบบ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อผู้ใช้</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all font-medium text-slate-900"
                placeholder="ชื่อผู้ใช้ใหม่"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">รหัสผ่าน</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all font-medium text-slate-900"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ยืนยันรหัสผ่าน</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all font-medium text-slate-900"
                placeholder="พิมพ์อีกครั้ง"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'กำลังสร้าง...' : 'สร้างบัญชีผู้ใช้'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              มีบัญชีอยู่แล้ว? <Link to="/login" className="text-slate-900 font-bold hover:underline">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
