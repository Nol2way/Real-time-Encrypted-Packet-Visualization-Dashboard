import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

/* ─── Tip Card ─────────────────────────────────────── */
const TipCard = ({ icon, title, desc, color = 'indigo' }) => {
  const c = {
    indigo: { wrap: 'bg-indigo-600/20 border-indigo-500/30', icon: 'text-indigo-400', title: 'text-indigo-300' },
    amber:  { wrap: 'bg-amber-600/20 border-amber-500/30',   icon: 'text-amber-400',  title: 'text-amber-300'  },
    rose:   { wrap: 'bg-rose-600/20 border-rose-500/30',     icon: 'text-rose-400',   title: 'text-rose-300'   },
    green:  { wrap: 'bg-green-600/20 border-green-500/30',   icon: 'text-green-400',  title: 'text-green-300'  },
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

/* ─── Stat Badge ────────────────────────────────────── */
const StatBadge = ({ label, value, color = 'slate' }) => {
  const colors = {
    slate:  'bg-slate-700/40 border-slate-600 text-slate-300',
    indigo: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300',
    green:  'bg-green-600/20 border-green-500/30 text-green-300',
    rose:   'bg-rose-600/20 border-rose-500/30 text-rose-300',
    amber:  'bg-amber-600/20 border-amber-500/30 text-amber-300',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${colors[color]}`}>
      <p className="text-lg font-black font-mono">{value ?? '—'}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{label}</p>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────── */
const LogsPage = () => {
  const { api } = useAuth();

  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const perPage = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch {
      toast.error('ไม่สามารถโหลด Login Logs ได้');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* Filter + paginate */
  const filtered = logs.filter(l =>
    !search ||
    l.username?.toLowerCase().includes(search.toLowerCase()) ||
    l.ip_address?.includes(search) ||
    l.device_info?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  /* Stats */
  const uniqueIPs    = [...new Set(logs.map(l => l.ip_address))].length;
  const uniqueUsers  = [...new Set(logs.map(l => l.username))].length;
  const todayStr     = new Date().toLocaleDateString('th-TH');
  const logsToday    = logs.filter(l => new Date(l.timestamp).toLocaleDateString('th-TH') === todayStr).length;

  /* Helpers */
  const fmtTime = (t) => {
    try {
      return new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' });
    } catch { return t; }
  };

  const exportCSV = () => {
    const header = ['ผู้ใช้', 'IP ที่ล็อกอิน', 'อุปกรณ์/เบราว์เซอร์', 'เวลา'];
    const rows   = filtered.map(l => [l.username, l.ip_address, `"${l.device_info ?? ''}"`, l.timestamp]);
    const csv    = [header, ...rows].map(r => r.join(',')).join('\n');
    const url    = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a      = Object.assign(document.createElement('a'), { href: url, download: `login_logs_${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export CSV สำเร็จ');
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">ประวัติการเข้าสู่ระบบ</h2>
            <span className="px-2 py-0.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-wide">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500">ตรวจสอบการเข้าใช้งานระบบของทุกผู้ใช้ · ใช้สำหรับตรวจสอบความปลอดภัย</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-black uppercase transition-colors"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} />
            รีเฟรช
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase transition-colors"
          >
            <i className="fa-solid fa-file-csv" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <TipCard icon="fa-shield-halved" title="Security Audit" color="indigo"
          desc="บันทึกทุก Login Event รวมถึง IP และ User-Agent ช่วยตรวจจับการเข้าถึงที่ผิดปกติ" />
        <TipCard icon="fa-location-dot" title="IP Tracking" color="amber"
          desc="IP ที่ใช้ Login ถูกบันทึกอัตโนมัติ ตรวจหา Login จากประเทศหรือ IP ที่ไม่คุ้นเคย" />
        <TipCard icon="fa-mobile-screen" title="Device Info" color="green"
          desc="User-Agent แสดงเบราว์เซอร์และ OS ที่ใช้เข้าสู่ระบบ ช่วยตรวจจับอุปกรณ์ที่ไม่รู้จัก" />
        <TipCard icon="fa-clock-rotate-left" title="Audit Trail" color="rose"
          desc="ข้อมูลนี้ใช้เป็นหลักฐานเมื่อเกิดเหตุการณ์ด้านความปลอดภัย Export CSV เพื่อเก็บบันทึก" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBadge label="ล็อกอินทั้งหมด"  value={logs.length}   color="indigo" />
        <StatBadge label="ผู้ใช้ทั้งหมด"    value={uniqueUsers}  color="green"  />
        <StatBadge label="IP ที่ไม่ซ้ำกัน"  value={uniqueIPs}    color="amber"  />
        <StatBadge label="วันนี้"            value={logsToday}    color="rose"   />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <i className="fa-solid fa-magnifying-glass text-slate-600 text-sm absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="ค้นหาด้วย ชื่อผู้ใช้ / IP / อุปกรณ์..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-160">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                {['#', 'ผู้ใช้', 'IP ที่ล็อกอิน', 'อุปกรณ์ / เบราว์เซอร์', 'เวลา'].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-600">
                  <i className="fa-solid fa-spinner fa-spin mr-2" />กำลังโหลด...
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-600">
                  <i className="fa-solid fa-inbox mr-2" />ไม่พบข้อมูล
                </td></tr>
              ) : paginated.map((log, i) => (
                <tr key={log.id ?? i} className="border-b border-slate-800 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-600">
                    {(page - 1) * perPage + i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                        <i className="fa-solid fa-user text-indigo-400 text-[9px]" />
                      </div>
                      <span className="text-sm font-bold text-slate-200">{log.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-cyan-400">{log.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 max-w-70 truncate" title={log.device_info}>
                    <i className="fa-solid fa-desktop text-slate-600 mr-1.5 text-xs" />
                    {log.device_info ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    <i className="fa-regular fa-clock text-slate-600 mr-1.5" />
                    {fmtTime(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-mono">
              แสดง {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} จาก {filtered.length} รายการ
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                <i className="fa-solid fa-chevron-left" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const n = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors ${page === n ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default LogsPage;
