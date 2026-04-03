import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

/* ─── Tip Card ─────────────────────────────────────── */
const TipCard = ({ icon, title, desc, color = 'indigo' }) => {
  const c = {
    indigo: { wrap: 'bg-indigo-600/20 border-indigo-500/30', icon: 'text-indigo-400', title: 'text-indigo-300' },
    green:  { wrap: 'bg-green-600/20 border-green-500/30',   icon: 'text-green-400',  title: 'text-green-300'  },
    amber:  { wrap: 'bg-amber-600/20 border-amber-500/30',   icon: 'text-amber-400',  title: 'text-amber-300'  },
    rose:   { wrap: 'bg-rose-600/20 border-rose-500/30',     icon: 'text-rose-400',   title: 'text-rose-300'   },
  }[color];
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${c.wrap}`}>
        <i className={`fa-solid ${icon} text-sm ${c.icon}`} />
      </div>
      <div>
        <p className={`text-xs font-black uppercase tracking-wide mb-1 ${c.title}`}>{title}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

/* ─── Password Input — defined OUTSIDE AccountPage to prevent remount on state change ── */
const PwdInput = ({ name, label, placeholder, value, onChange, show, onToggle }) => (
  <div>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
      >
        <i className={`fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
      </button>
    </div>
  </div>
);

/* ─── Main Page ─────────────────────────────────────── */
const AccountPage = () => {
  const { user, api } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [form, setForm]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState({ current: false, next: false, confirm: false });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
    if (form.newPassword.length < 6) return toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
    setLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">บัญชีของฉัน</h2>
        <p className="text-xs text-slate-500 mt-1">ดูข้อมูลโปรไฟล์และเปลี่ยนรหัสผ่านของคุณ</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-id-card text-indigo-400 text-sm" />
          <p className="text-xs font-black text-slate-200 uppercase tracking-wide">ข้อมูลโปรไฟล์</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'ชื่อผู้ใช้',    value: user?.username,  icon: 'fa-user' },
            { label: 'บทบาท',         value: user?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งาน (User)', icon: user?.role === 'admin' ? 'fa-crown' : 'fa-user-shield' },
            { label: 'ขอบเขตเครือข่าย', value: user?.ip_subnet === '*' ? 'ทุก IP (All Traffic)' : user?.ip_subnet, icon: 'fa-globe' },
            { label: 'สถานะบัญชี',   value: 'Active', icon: 'fa-circle-check' },
          ].map(f => (
            <div key={f.label} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="flex items-center gap-1.5 mb-1">
                <i className={`fa-solid ${f.icon} text-slate-600 text-xs`} />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{f.label}</span>
              </div>
              <p className="text-sm font-bold text-slate-200 font-mono">{f.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips — 2 cards only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TipCard icon="fa-shield-halved" title="รหัสผ่านที่แข็งแกร่ง" color="indigo"
          desc="ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร ผสมตัวพิมพ์ใหญ่-เล็ก ตัวเลข และสัญลักษณ์ อย่าใช้ชื่อ วันเกิด หรือรหัสผ่านเดิมซ้ำกับบริการอื่น" />
        <TipCard icon="fa-triangle-exclamation" title="หากรหัสผ่านรั่วไหล" color="rose"
          desc="เปลี่ยนรหัสผ่านทันที แล้วแจ้ง Admin ตรวจสอบ Login Logs ว่ามีการเข้าถึงโดยไม่ได้รับอนุญาตหรือไม่" />
      </div>

      {/* Change Password Form */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-lock text-indigo-400 text-sm" />
          <p className="text-xs font-black text-slate-200 uppercase tracking-wide">เปลี่ยนรหัสผ่าน</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <PwdInput name="currentPassword"  label="รหัสผ่านปัจจุบัน"  placeholder="กรอกรหัสผ่านปัจจุบัน"
            value={form.currentPassword} onChange={handleChange} show={showPwd.current}
            onToggle={() => setShowPwd(v => ({ ...v, current: !v.current }))} />
          <PwdInput name="newPassword"      label="รหัสผ่านใหม่"      placeholder="อย่างน้อย 6 ตัวอักษร"
            value={form.newPassword} onChange={handleChange} show={showPwd.next}
            onToggle={() => setShowPwd(v => ({ ...v, next: !v.next }))} />
          <PwdInput name="confirmPassword"  label="ยืนยันรหัสผ่านใหม่" placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
            value={form.confirmPassword} onChange={handleChange} show={showPwd.confirm}
            onToggle={() => setShowPwd(v => ({ ...v, confirm: !v.confirm }))} />

          {/* Password strength indicator */}
          {form.newPassword && (
            <div className="space-y-1">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">ความแข็งแกร่ง</p>
              <div className="flex gap-1">
                {[6, 10, 14].map((min, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    form.newPassword.length >= min ? ['bg-rose-500', 'bg-amber-500', 'bg-green-500'][i] : 'bg-slate-700'
                  }`} />
                ))}
              </div>
              <p className="text-[9px] text-slate-600">
                {form.newPassword.length < 6 ? 'อ่อนมาก' : form.newPassword.length < 10 ? 'พอใช้' : form.newPassword.length < 14 ? 'ดี' : 'แข็งแกร่ง'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-wide transition-all"
          >
            <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} />
            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>

      {/* Security Notice for all roles */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-lock-open text-slate-400 text-sm" />
          <p className="text-xs font-black text-slate-200 uppercase tracking-wide">สิทธิ์การใช้งานของคุณ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`rounded-xl p-4 border ${isAdmin ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${isAdmin ? 'text-amber-400' : 'text-indigo-400'}`}>
              <i className={`fa-solid ${isAdmin ? 'fa-crown' : 'fa-user'} mr-1.5`} />
              {isAdmin ? 'Admin — สิทธิ์เต็มรูปแบบ' : 'User — สิทธิ์มาตรฐาน'}
            </p>
            <ul className="space-y-1.5">
              {(isAdmin ? [
                { label: 'ดูแพ็กเกจทุกอุปกรณ์บนเครือข่าย', ok: true },
                { label: 'Export CSV / PDF Report', ok: true },
                { label: 'คอลัมน์ TLS Encrypted', ok: true },
                { label: 'จัดการผู้ใช้ (CRUD)', ok: true },
                { label: 'ดู Login Logs ทุก User', ok: true },
                { label: 'Import Public Key ภายนอก', ok: true },
                { label: 'เปิดดู/คัดลอก Private Key', ok: true },
                { label: 'เปลี่ยนรหัสผ่านตัวเอง', ok: true },
              ] : [
                { label: 'ดูแพ็กเกจเฉพาะ IP ของตัวเอง', ok: true },
                { label: 'Export CSV / PDF Report', ok: false },
                { label: 'คอลัมน์ TLS Encrypted', ok: false },
                { label: 'จัดการผู้ใช้ (CRUD)', ok: false },
                { label: 'ดู Login Logs', ok: false },
                { label: 'Import Public Key ภายนอก', ok: false },
                { label: 'เปิดดู Private Key', ok: false },
                { label: 'เปลี่ยนรหัสผ่านตัวเอง', ok: true },
              ]).map(f => (
                <li key={f.label} className="flex items-center gap-2">
                  <i className={`fa-solid ${f.ok ? 'fa-circle-check text-green-400' : 'fa-circle-xmark text-slate-700'} text-xs shrink-0`} />
                  <span className={`text-[11px] ${f.ok ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security tips per role */}
          <div className="space-y-2.5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">คำแนะนำด้านความปลอดภัย</p>
            {(isAdmin ? [
              { icon: 'fa-eye',             c: 'text-amber-400', text: 'Login Logs บันทึก IP ทุกครั้งที่มีการเข้าถึงระบบ ตรวจสอบสม่ำเสมอ' },
              { icon: 'fa-network-wired',   c: 'text-blue-400',  text: 'เข้าใช้งานจาก IP ที่เชื่อถือได้เท่านั้น หลีกเลี่ยง Wi-Fi สาธารณะ' },
              { icon: 'fa-users-gear',      c: 'text-indigo-400',text: 'ตรวจสอบสิทธิ์ผู้ใช้ทุกคนสม่ำเสมอ ปิดบัญชีที่ไม่ได้ใช้งาน' },
              { icon: 'fa-triangle-exclamation', c: 'text-rose-400', text: 'อย่าแชร์ Credential ของ Admin กับผู้อื่น แม้แต่ทีมงาน' },
            ] : [
              { icon: 'fa-filter',          c: 'text-indigo-400',text: 'ข้อมูลที่คุณเห็นถูกกรองเซิร์ฟเวอร์ด้านหลัง ไม่ใช่แค่ซ่อน UI' },
              { icon: 'fa-lock',            c: 'text-green-400', text: 'Private Key RSA ถูกซ่อนไว้เพื่อความปลอดภัยของระบบโดยรวม' },
              { icon: 'fa-user-shield',     c: 'text-blue-400',  text: 'แจ้ง Admin ทันทีหากพบ Traffic ผิดปกติใน IP ของคุณ' },
              { icon: 'fa-key',             c: 'text-amber-400', text: 'เปลี่ยนรหัสผ่านสม่ำเสมอ อย่างน้อยทุก 90 วัน' },
            ]).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <i className={`fa-solid ${s.icon} ${s.c} text-xs mt-0.5 shrink-0`} />
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AccountPage;
