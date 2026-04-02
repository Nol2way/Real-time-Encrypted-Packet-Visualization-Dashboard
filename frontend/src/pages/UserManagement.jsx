import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Trash2, Edit2, UserPlus, X, Save, History, Globe } from 'lucide-react';
import { format, isValid } from 'date-fns';

const UserManagement = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    username: '', password: '', role: 'user', ip_subnet: '*', status: 'active'
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('โหลดข้อมูลล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) await api.put(`/users/${editingUser.id}`, formData);
      else await api.post('/users', formData);
      toast.success('ดำเนินการสำเร็จ');
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) { toast.error('ล้มเหลว'); }
  };

  return (
    <div className="space-y-6 font-inter">
      <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Control</h2>
          <p className="text-slate-500 text-sm">จัดการสิทธิ์และเครือข่ายผู้ใช้งาน</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({username:'', password:'', role:'user', ip_subnet:'*', status:'active'}); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all flex items-center space-x-2"
        >
          <UserPlus size={16} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0f172a] border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Network Scope (IP)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs uppercase">{u.username.charAt(0)}</div>
                    <span className="text-sm font-bold text-slate-200">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${u.role === 'admin' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-indigo-400 bg-indigo-900/10 px-2 py-1 rounded-md w-fit border border-indigo-900/20">
                    <Globe size={12} />
                    <span>{u.ip_subnet}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">{u.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => { setEditingUser(u); setFormData({...u, password:''}); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                    {u.username !== 'admin' && (
                      <button onClick={async () => { if(window.confirm('Delete?')){ await api.delete(`/users/${u.id}`); fetchUsers(); } }} className="p-2 text-slate-500 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-800">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-white">Identity Configuration</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Username</label>
                <input type="text" required disabled={!!editingUser} className="w-full px-3 py-2 bg-[#0f172a] border border-slate-800 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Password</label>
                <input type="password" required={!editingUser} className="w-full px-3 py-2 bg-[#0f172a] border border-slate-800 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">IP Subnet Scope</label>
                <input type="text" required className="w-full px-3 py-2 bg-[#0f172a] border border-slate-800 rounded-xl text-indigo-400 text-sm font-mono font-bold focus:outline-none focus:border-indigo-500 shadow-inner" value={formData.ip_subnet} onChange={e => setFormData({...formData, ip_subnet: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex justify-center items-center space-x-2">
                <Save size={16} />
                <span>Save Configuration</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
