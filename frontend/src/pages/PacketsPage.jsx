import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PROTOCOL_COLORS = {
  TCP:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  UDP:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ICMP:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  HTTP:  'bg-green-500/20 text-green-400 border-green-500/30',
  HTTPS: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  DNS:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  SSH:   'bg-rose-500/20 text-rose-400 border-rose-500/30',
};
const DEFAULT_COLOR = 'bg-slate-500/20 text-slate-400 border-slate-500/30';

const TipCard = ({ icon, title, description, color = 'indigo' }) => {
  const bg = {
    indigo: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400',
    amber:  'bg-amber-600/20 border-amber-500/30 text-amber-400',
    green:  'bg-green-600/20 border-green-500/30 text-green-400',
    rose:   'bg-rose-600/20 border-rose-500/30 text-rose-400',
    blue:   'bg-blue-600/20 border-blue-500/30 text-blue-400',
  }[color] || 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
          <i className={`fa-solid ${icon} text-sm`} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-200 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

const PROTOCOLS = ['ALL', 'TCP', 'UDP', 'DNS', 'HTTP', 'HTTPS', 'SSH', 'ICMP'];

const PacketsPage = ({ packets = [], isPaused, setIsPaused }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter]   = useState('ALL');
  const [search, setSearch]   = useState('');
  const [showTips, setShowTips] = useState(true);

  const filtered = packets.filter(p => {
    const matchProto  = filter === 'ALL' || p.protocol === filter;
    const matchSearch = !search ||
      p.src_ip?.includes(search) ||
      p.dst_ip?.includes(search) ||
      p.protocol?.includes(search.toUpperCase());
    return matchProto && matchSearch;
  });

  const exportCSV = () => {
    const header = ['Time', 'Source IP', 'Src Port', 'Dest IP', 'Dst Port', 'Protocol', 'Size (B)', 'TLS'];
    const rows = filtered.map(p => [
      p.timestamp ? format(new Date(p.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
      p.src_ip, p.src_port, p.dst_ip, p.dst_port, p.protocol, p.size,
      p.is_encrypted ? 'Yes' : 'No',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `packets_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`ส่งออก ${filtered.length} แพ็กเกจเป็น CSV สำเร็จ`);
  };

  const uniqueProtocols  = [...new Set(packets.map(p => p.protocol))].length;
  const encryptedCount   = packets.filter(p => p.is_encrypted).length;
  const uniqueIPs        = [...new Set(packets.flatMap(p => [p.src_ip, p.dst_ip]))].length;

  return (
    <div className="space-y-6">

      {/* ─── Page Header ─────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">แพ็กเกจเครือข่ายแบบเรียลไทม์</h2>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลการจราจรเครือข่ายที่ดักจับแบบสด —&nbsp;
            <span className="text-slate-300 font-bold">{filtered.length.toLocaleString()}</span> รายการที่แสดง
          </p>
        </div>
        <button
          onClick={() => setShowTips(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 transition-all"
        >
          <i className="fa-solid fa-circle-info text-sm" />
          {showTips ? 'ซ่อนคำแนะนำ' : 'แสดงคำแนะนำ'}
        </button>
      </div>

      {/* ─── Info Tips ───────────────────────────────── */}
      {showTips && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <TipCard icon="fa-eye" title="ข้อมูลที่คุณเห็น" color="indigo"
            description={
              isAdmin
                ? 'ในฐานะแอดมิน คุณเห็นแพ็กเกจทั้งหมดจากทุกอุปกรณ์บนเครือข่ายที่ตรวจสอบแบบเรียลไทม์ ไม่มีการกรองใดๆ'
                : `ในฐานะผู้ใช้ เซิร์ฟเวอร์จะกรองแพ็กเกจให้แสดงเฉพาะที่ตรงกับ IP ของคุณ (${user?.ip_subnet}) เท่านั้น ทราฟฟิกอื่นจะถูกซ่อนเพื่อความปลอดภัย`
            }
          />
          <TipCard icon="fa-arrows-left-right" title="ต้นทาง / ปลายทาง" color="blue"
            description="แต่ละแถวคือหนึ่งแพ็กเกจ IP:port ต้นทางคือผู้ส่ง, IP:port ปลายทางคือผู้รับ หมายเลขพอร์ตระบุแอปพลิเคชัน เช่น 80=HTTP, 443=HTTPS, 22=SSH, 53=DNS"
          />
          <TipCard icon="fa-layer-group" title="ความหมายของโปรโตคอล" color="green"
            description="TCP = ส่งข้อมูลแบบเรียงลำดับและเชื่อถือได้ (เว็บ, SSH) | UDP = ส่งเร็วแต่ไม่รับประกัน (วิดีโอ, DNS) | ICMP = วินิจฉัยเครือข่าย (ping) แต่ละสีแทนประเภททราฟฟิก"
          />
          <TipCard icon="fa-pause" title="หยุดชั่วคราว / เล่นต่อ" color="amber"
            description="กด Pause เพื่อหยุดการเพิ่มแพ็กเกจใหม่ในตาราง (การดักจับยังทำงานเบื้องหลัง) ใช้เพื่อตรวจสอบแพ็กเกจที่สนใจโดยไม่ให้รายการเลื่อนหนีไป"
          />
          {isAdmin && (
            <TipCard icon="fa-shield-halved" title="คอลัมน์ TLS (เข้ารหัส)" color="green"
              description="คอลัมน์สำหรับแอดมินเท่านั้น ไอคอนกุญแจล็อคแสดงว่า payload ของแพ็กเกจถูกเข้ารหัสด้วย TLS/SSL ทราฟฟิกที่เข้ารหัสปกป้องข้อมูล แต่อาจซ่อนภัยคุกคามได้เช่นกัน"
            />
          )}
          {isAdmin && (
            <TipCard icon="fa-file-csv" title="ส่งออก CSV" color="amber"
              description="ฟีเจอร์สำหรับแอดมินเท่านั้น ส่งออกรายการแพ็กเกจที่กรองแล้วเป็นไฟล์ CSV สำหรับวิเคราะห์แบบ Forensic ใน Wireshark, Excel หรือ Python (pandas/scapy)"
            />
          )}
          {!isAdmin && (
            <TipCard icon="fa-user-shield" title="ขอบเขตเครือข่ายของคุณ" color="amber"
              description="มุมมองของคุณถูกจำกัดตาม IP ที่ลงทะเบียนไว้ เซิร์ฟเวอร์บังคับใช้การกรองนี้ฝั่งเซิร์ฟเวอร์ ทราฟฟิกของผู้ใช้รายอื่นจะไม่ถูกส่งมาถึง session ของคุณเลย"
            />
          )}
          <TipCard icon="fa-magnifying-glass" title="ค้นหาและกรอง" color="blue"
            description="ใช้กล่องค้นหาเพื่อกรองตาม IP แล้วกดปุ่มโปรโตคอลเพื่อแสดงเฉพาะประเภทนั้น ฟิลเตอร์ทำงานร่วมกันได้ เช่น ค้นหา '192.168' พร้อมกรอง 'DNS' ไปพร้อมกัน"
          />
        </div>
      )}

      {/* ─── Role Banner ─────────────────────────────── */}
      {!isAdmin ? (
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-filter text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-black text-indigo-300 uppercase tracking-wide">ขอบเขตเครือข่าย: มุมมองแบบกรอง</p>
            <p className="text-[11px] text-indigo-400/70 mt-0.5">
              คุณเห็นเฉพาะแพ็กเกจที่เกี่ยวข้องกับ IP ของคุณ&nbsp;
              <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono text-indigo-300 text-[10px]">{user?.ip_subnet}</code>
              &nbsp;เซิร์ฟเวอร์บังคับใช้ฟิลเตอร์นี้ — ทราฟฟิกของผู้ใช้รายอื่นจะไม่ถูกส่งมาถึง session ของคุณเลย
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-globe text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-black text-amber-300 uppercase tracking-wide">สิทธิ์เต็มรูปแบบ — เห็นทุกอุปกรณ์บนเครือข่าย</p>
            <p className="text-[11px] text-amber-400/70 mt-0.5">
              มุมมองแอดมินแสดงแพ็กเกจทุกตัวที่ดักจับได้จากทุกอุปกรณ์ คอลัมน์สถานะ TLS และการส่งออก CSV สงวนไว้สำหรับแอดมินเท่านั้น
            </p>
          </div>
        </div>
      )}

      {/* ─── Controls ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            placeholder="กรองตาม IP หรือโปรโตคอล..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          )}
        </div>

        {/* Protocol Pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {PROTOCOLS.map(p => (
            <button key={p} onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                filter === p
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300'
              }`}
            >{p}</button>
          ))}
        </div>

        {/* Pause / Resume */}
        <button
          onClick={() => setIsPaused && setIsPaused(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${
            isPaused
              ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-900/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
          }`}
        >
          <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'} text-xs`} />
          {isPaused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}
        </button>

        {/* Export CSV (Admin only) */}
        {isAdmin && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-600/30 transition-all"
          >
            <i className="fa-solid fa-file-csv text-sm" />
            ส่งออก CSV
          </button>
        )}
      </div>

      {/* ─── Stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'จับได้ทั้งหมด', value: packets.length.toLocaleString(),  icon: 'fa-inbox',       color: 'text-indigo-400' },
          { label: 'แสดงหลังกรอง',  value: filtered.length.toLocaleString(), icon: 'fa-filter',      color: 'text-blue-400' },
          { label: 'โปรโตคอล',      value: uniqueProtocols,                  icon: 'fa-layer-group',  color: 'text-purple-400' },
          isAdmin
            ? { label: 'เข้ารหัส TLS', value: encryptedCount.toLocaleString(), icon: 'fa-lock',     color: 'text-green-400' }
            : { label: 'IP ที่ไม่ซ้ำ',    value: uniqueIPs.toLocaleString(),       icon: 'fa-sitemap',  color: 'text-teal-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className={`fa-solid ${s.icon} ${s.color} text-sm`} />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</span>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Packet Table ────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-130">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <i className="fa-solid fa-clock mr-1.5" />เวลา
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <i className="fa-solid fa-arrow-up-from-bracket mr-1.5" />ต้นทาง
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <i className="fa-solid fa-arrow-down-to-bracket mr-1.5" />ปลายทาง
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <i className="fa-solid fa-layer-group mr-1.5" />โปรโตคอล
                </th>
                <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <i className="fa-solid fa-weight-scale mr-1.5" />ขนาด
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                    <i className="fa-solid fa-shield-halved mr-1.5" />TLS
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-14 text-center">
                    <i className="fa-solid fa-satellite-dish text-4xl block mb-3 text-slate-700" />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-wide">รอรับแพ็กเกจ</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {isPaused ? 'หยุดสตรีมชั่วคราวอยู่ กดเล่นต่อเพื่อรับข้อมูลใหม่' : 'การดักจับแบบสดทำงานอยู่ แพ็กเกจจะปรากฏที่นี่โดยอัตโนมัติ'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 500).map((p, i) => {
                  const colorClass = PROTOCOL_COLORS[p.protocol] || DEFAULT_COLOR;
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {p.timestamp ? format(new Date(p.timestamp), 'HH:mm:ss.SSS') : '--'}
                      </td>
                      <td className="px-4 py-2 font-mono text-[10px] whitespace-nowrap">
                        <span className="text-slate-300">{p.src_ip}</span>
                        <span className="text-slate-600">:{p.src_port}</span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[10px] whitespace-nowrap">
                        <span className="text-slate-300">{p.dst_ip}</span>
                        <span className="text-slate-600">:{p.dst_port}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase ${colorClass}`}>
                          {p.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[10px] text-slate-400 font-mono">{p.size} B</td>
                      {isAdmin && (
                        <td className="px-4 py-2">
                          {p.is_encrypted
                            ? <span className="flex items-center gap-1.5 text-[9px] font-black text-green-400"><i className="fa-solid fa-lock text-xs" />ใช่</span>
                            : <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-600"><i className="fa-solid fa-unlock text-xs" />ไม่</span>
                          }
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 500 && (
          <div className="px-4 py-2.5 border-t border-slate-700 text-[10px] text-slate-500 text-center bg-slate-900/50">
            <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-1.5" />
            แสดง 500 รายการแรกจากทั้งหมด <strong className="text-slate-300">{filtered.length.toLocaleString()}</strong> แพ็กเกจ
            &nbsp;ใช้ฟิลเตอร์หรือค้นหาเพื่อลดจำนวนผลลัพธ์
          </div>
        )}
      </div>

    </div>
  );
};

export default PacketsPage;
