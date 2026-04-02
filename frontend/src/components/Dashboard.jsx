import React, { useState, useMemo, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import DataGrid from './DataGrid';
import { Download, Activity, Database, Server } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = ({ packets }) => {
  const [protocolFilter, setProtocolFilter] = useState('');
  const [trafficData, setTrafficData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const protocolData = useMemo(() => {
    const counts = packets.reduce((acc, p) => {
      acc[p.protocol] = (acc[p.protocol] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [packets]);

  const COLORS = {
    TCP: '#3b82f6', UDP: '#10b981', HTTP: '#f59e0b', HTTPS: '#6366f1', DNS: '#ec4899', SSH: '#ef4444', Unknown: '#475569'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const count = packets.filter(p => p.timestamp >= now - 1000).length;
      setTrafficData(prev => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev, { time: timeStr, count }].slice(-20);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [packets]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ความเร็วปัจจุบัน</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-white leading-none">
            {trafficData.length > 0 ? trafficData[trafficData.length - 1].count : 0}
            <span className="text-xs font-medium text-slate-500 ml-2 uppercase">pkts/s</span>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">แพ็กเกจที่ตรวจพบ</span>
            <Database size={16} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-white leading-none">{packets.length}</div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl flex flex-col justify-center">
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-all font-bold text-sm"
          >
            <Download size={16} />
            <span>ดาวน์โหลด CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Traffic Intensity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="time" hide />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff'}} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.1} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Protocols</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value"
                  onClick={(data) => setProtocolFilter(prev => prev === data.name ? '' : data.name)}
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Unknown} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Analysis Feed</span>
            {protocolFilter && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black uppercase">{protocolFilter}</span>}
          </div>
          {protocolFilter && (
            <button onClick={() => setProtocolFilter('')} className="text-[10px] font-bold text-rose-500 uppercase hover:underline">Clear Filter</button>
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
