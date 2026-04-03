import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const UserManagement = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'user', ip_subnet: '', status: 'active'
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('โหลดข้อมูลผู้ใช้ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'user', ip_subnet: '', status: 'active' });
    setIsModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setFormData({ username: u.username, password: '', role: u.role, ip_subnet: u.ip_subnet || '', status: u.status });
    setIsModalOpen(true);
  };

  // auto-adjust ip_subnet when role changes
  const handleRoleChange = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      ip_subnet: newRole === 'admin' ? '*' : prev.ip_subnet,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success('อัปเดตผู้ใช้สำเร็จ');
      } else {
        await api.post('/users', payload);
        toast.success('สร้างผู้ใช้สำเร็จ');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'ดำเนินการไม่สำเร็จ');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`ลบผู้ใช้ "${u.username}" ?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Control</h2>
          <p className="text-slate-500 text-sm mt-0.5">จัดการสิทธิ์และ IP ของผู้ใช้งาน</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all flex items-center space-x-2"
        >
          <i className="fa-solid fa-user-plus text-sm" />
          <span>เพิ่มผู้ใช้</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0f172a] border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Network Scope (IP)</th>
              <th className="px-6 py-4">Last Login IP</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">กำลังโหลด...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">ไม่มีผู้ใช้</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-xs uppercase text-slate-300">
                      {u.username.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{u.username}</div>
                      <div className="text-[10px] text-slate-600">ID: {u.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    u.role === 'admin'
                      ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {u.role === 'admin' ? ' ADMIN' : ' USER'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-900/10 px-2 py-1 rounded-md w-fit border border-emerald-900/20">
                    <i className="fa-solid fa-globe text-[10px]" />
                    <span>{u.ip_subnet || '*'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {u.last_login_ip ? (
                    <span className="text-xs font-mono text-cyan-400">{u.last_login_ip}</span>
                  ) : (
                    <span className="text-xs text-slate-600 italic">ยังไม่ได้ login</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-rose-500'}`}></div>
                    <span className={`text-[10px] font-bold uppercase ${u.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {u.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                      title="แก้ไข"
                    >
                      <i className="fa-solid fa-pen-to-square text-sm" />
                    </button>
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-all"
                        title="ลบ"
                      >
                        <i className="fa-solid fa-trash text-sm" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-white text-sm">
                {editingUser ? `แก้ไข: ${editingUser.username}` : 'สร้างผู้ใช้ใหม่'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-all">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Username */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Username</label>
                <input
                  type="text" required disabled={!!editingUser}
                  className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Password {editingUser && <span className="text-slate-600 normal-case font-normal">(เว้นว่างถ้าไม่เปลี่ยน)</span>}
                </label>
                <input
                  type="password" required={!editingUser}
                  placeholder={editingUser ? '••••••  (ไม่เปลี่ยน)' : ''}
                  className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Role</label>
                <select
                  className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  value={formData.role}
                  onChange={e => handleRoleChange(e.target.value)}
                >
                  <option value="user"> User</option>
                  <option value="admin"> Admin</option>
                </select>
              </div>

              {/* IP Subnet */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Network Scope (IP)
                  <span className="text-slate-600 ml-1 normal-case font-normal">— ใส่ * เพื่อดูทุก IP</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น 192.168.1.5 หรือ * (ทุก IP)"
                  className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-emerald-400 text-sm font-mono font-bold focus:outline-none focus:border-indigo-500"
                  value={formData.ip_subnet}
                  onChange={e => setFormData({ ...formData, ip_subnet: e.target.value })}
                />
              </div>

              {/* Status (edit only) */}
              {editingUser && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Status</label>
                  <select
                    className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center space-x-2 mt-2"
              >
                <i className="fa-solid fa-floppy-disk text-sm" />
                <span>{editingUser ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างผู้ใช้'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
