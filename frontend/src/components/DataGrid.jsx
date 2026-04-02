import React, { useState, useMemo, useEffect } from 'react';
import { formatBytes } from '../utils';
import { ArrowUpDown, Search, Shield, Globe, Terminal, Cpu } from 'lucide-react';
import { format } from 'date-fns';

const DataGrid = ({ packets, defaultFilter = null, limit = null }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (defaultFilter) {
      setFilters(prev => ({ ...prev, [defaultFilter.id]: defaultFilter.value }));
    } else {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters['protocol'];
        return newFilters;
      });
    }
  }, [defaultFilter]);

  const sortedAndFilteredPackets = useMemo(() => {
    let result = [...packets];
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key]?.toLowerCase();
      if (filterValue) {
        result = result.filter(packet => String(packet[key] || '').toLowerCase().includes(filterValue));
      }
    });
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return limit ? result.slice(0, limit) : result;
  }, [packets, sortConfig, filters, limit]);

  const columns = [
    { id: 'timestamp', label: 'Captured At', icon: <Terminal size={12} /> },
    { id: 'src_ip', label: 'Source', icon: <Globe size={12} /> },
    { id: 'dst_ip', label: 'Destination', icon: <Cpu size={12} /> },
    { id: 'protocol', label: 'Protocol', icon: <Shield size={12} /> },
    { id: 'size', label: 'Size' },
    { id: 'tls_version', label: 'Security' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#1e293b]">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-fixed font-inter">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#0f172a] border-b border-slate-800">
              {columns.map((col) => (
                <th key={col.id} className="p-0 w-48">
                  <div className="p-4 border-r border-slate-800 last:border-0 h-full">
                    <button
                      className="flex items-center space-x-2 font-bold text-[10px] text-slate-500 uppercase tracking-widest hover:text-white transition-colors group mb-3"
                      onClick={() => setSortConfig({ key: col.id, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      {col.icon}
                      <span>{col.label}</span>
                      <ArrowUpDown size={10} className="ml-auto opacity-0 group-hover:opacity-100" />
                    </button>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="w-full px-2 py-1.5 text-[10px] bg-[#1e293b] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-all"
                      value={filters[col.id] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedAndFilteredPackets.map((packet, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50 transition-all group">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-[11px] font-bold text-slate-300">{format(new Date(packet.timestamp), 'HH:mm:ss')}</div>
                  <div className="text-[9px] text-slate-500">{format(new Date(packet.timestamp), 'SSS')}ms</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-[11px] font-bold text-indigo-400">{packet.src_ip}</div>
                  <div className="text-[9px] text-slate-500">Port {packet.src_port}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-[11px] font-bold text-slate-300">{packet.dst_ip}</div>
                  <div className="text-[9px] text-slate-500">Port {packet.dst_port}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                    packet.protocol === 'HTTPS' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {packet.protocol}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-400">{formatBytes(packet.size)}</td>
                <td className="px-4 py-3">
                  {packet.tls_version ? (
                    <span className="text-[10px] font-bold text-emerald-500">{packet.tls_version}</span>
                  ) : (
                    <span className="text-slate-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGrid;
