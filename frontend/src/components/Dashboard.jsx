import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import DataGrid from './DataGrid';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Dashboard = ({ packets }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [protocolFilter, setProtocolFilter] = useState('');
  const [trafficData, setTrafficData] = useState([]);

  const COLORS = {
    TCP: '#3b82f6', UDP: '#10b981', HTTP: '#f59e0b', HTTPS: '#6366f1',
    DNS: '#ec4899', SSH: '#ef4444', ICMP: '#f97316', Unknown: '#475569'
  };

  const protocolData = useMemo(() => {
    const counts = packets.reduce((acc, p) => {
      acc[p.protocol] = (acc[p.protocol] || 0) + 1;
      return acc;
    }, {});
    const total = packets.length || 1;
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, percent: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [packets]);

  const [activeProtocols, setActiveProtocols] = useState([]);

  // Ref เพื่อให้ interval อ่านค่า packets ล่าสุดโดยไม่ต้อง reset interval
  const packetsRef = useRef(packets);
  useEffect(() => {
    packetsRef.current = packets;
  }, [packets]);

  // ตั้ง interval ครั้งเดียว — ไม่ใส่ packets ใน dependency
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const recent = packetsRef.current.filter(p => p.timestamp >= now - 1000);
      const perProto = recent.reduce((acc, p) => {
        acc[p.protocol] = (acc[p.protocol] || 0) + 1;
        return acc;
      }, {});
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      setTrafficData(prev => {
        const next = [...prev, { time: timeStr, ...perProto }].slice(-20);
        // อัปเดต active protocols จาก history ทั้งหมด
        const protos = new Set();
        next.forEach(d => Object.keys(d).filter(k => k !== 'time').forEach(k => protos.add(k)));
        setActiveProtocols([...protos]);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const exportToCSV = () => {
    try {
      const headers = ['TIME', 'SOURCE', 'DESTINATION', 'PROTOCOL', 'SIZE'];
      const rows = packets.map(p => [
        new Date(p.timestamp).toISOString(),
        p.src_ip,
        p.dst_ip,
        p.protocol,
        p.size
      ].join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `packets_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('ส่งออก CSV สำเร็จ');
    } catch (e) {
      toast.error('ไม่สามารถส่งออก CSV ได้');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Role Banner */}
      {!isAdmin && (
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
          <i className="fa-solid fa-filter text-indigo-400 text-sm" />
          <p className="text-[11px] text-indigo-400">
            <span className="font-black uppercase tracking-wide text-indigo-300">มุมมองผู้ใช้: </span>
            แสดงเฉพาะแพ็กเกจที่ผ่าน IP ของคุณ&nbsp;
            <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono text-indigo-300 text-[10px]">{user?.ip_subnet}</code>
            &nbsp;— เซิร์ฟเวอร์กรองข้อมูลให้โดยอัตโนมัติ
          </p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ความเร็วปัจจุบัน</span>
            <i className="fa-solid fa-bolt text-emerald-500 text-sm" />
          </div>
          <div className="text-3xl font-bold text-white leading-none">
            {trafficData.length > 0
              ? Object.entries(trafficData[trafficData.length - 1])
                  .filter(([k]) => k !== 'time')
                  .reduce((s, [, v]) => s + v, 0)
              : 0}
            <span className="text-xs font-medium text-slate-500 ml-2 uppercase">pkts/s</span>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">แพ็กเกจที่ตรวจพบ</span>
            <i className="fa-solid fa-database text-indigo-500 text-sm" />
          </div>
          <div className="text-3xl font-bold text-white leading-none">{packets.length}</div>
          {!isAdmin && (
            <p className="text-[9px] text-indigo-400/60 mt-1 font-bold uppercase tracking-widest">เฉพาะ IP ของคุณ</p>
          )}
        </div>

        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl flex flex-col justify-center">
          {isAdmin ? (
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-all font-bold text-sm"
            >
              <i className="fa-solid fa-file-csv text-sm" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-700">
              <i className="fa-solid fa-lock text-2xl" />
              <p className="text-[10px] font-black uppercase tracking-widest">ส่งออก CSV</p>
              <p className="text-[10px] text-slate-600 text-center">เฉพาะแอดมินเท่านั้น</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Traffic Intensity — pkts/s by Protocol</h2>
          </div>
          {/* Mini legend */}
          {activeProtocols.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              {activeProtocols.map(proto => (
                <div key={proto} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[proto] || COLORS.Unknown }} />
                  <span className="text-[9px] font-mono font-black" style={{ color: COLORS[proto] || COLORS.Unknown }}>{proto}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e3a5f" />
                <XAxis dataKey="time" hide />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: 11 }}
                  formatter={(value, name) => [`${value} pkts/s`, name]}
                />
                {activeProtocols.map(proto => (
                  <Area
                    key={proto}
                    type="monotone"
                    dataKey={proto}
                    stackId="1"
                    stroke={COLORS[proto] || COLORS.Unknown}
                    fill={COLORS[proto] || COLORS.Unknown}
                    fillOpacity={0.25}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Protocols</h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={75}
                  paddingAngle={4} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                  onClick={(data) => setProtocolFilter(prev => prev === data.name ? '' : data.name)}
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Unknown} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: 11 }}
                  formatter={(value, name, props) => [`${props.payload.percent.toFixed(1)}%  (${value} pkts)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 space-y-1.5 max-h-28 overflow-auto">
            {protocolData.map(p => (
              <div key={p.name} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[p.name] || COLORS.Unknown }} />
                  <span className="text-slate-400 font-mono">{p.name}</span>
                </div>
                <span className="font-black" style={{ color: COLORS[p.name] || COLORS.Unknown }}>{p.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packet Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fa-solid fa-server text-slate-500 text-sm" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Analysis Feed</span>
            {protocolFilter && (
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black uppercase">
                {protocolFilter}
              </span>
            )}
          </div>
          {protocolFilter && (
            <button onClick={() => setProtocolFilter('')} className="text-[10px] font-bold text-rose-500 uppercase hover:underline">
              Clear Filter
            </button>
          )}
        </div>
        <div className="h-96">
          <DataGrid
            packets={packets}
            defaultFilter={protocolFilter ? { id: 'protocol', value: protocolFilter } : null}
            limit={100}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
