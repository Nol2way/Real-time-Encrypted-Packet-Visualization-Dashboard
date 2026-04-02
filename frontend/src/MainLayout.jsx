import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DataGrid from './components/DataGrid';
import UserManagement from './pages/UserManagement';
import { Download, ShieldAlert, LogOut, Play, Pause } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SOCKET_URL = 'http://localhost:3001';

const MainLayout = () => {
  const { user, token, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [packets, setPackets] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPackets(data); 
        }
      } catch(e) {
         console.error("Failed to load history", e);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);
    s.on('connect', () => {
      s.emit('subscribe');
      toast.success('System Online');
    });
    s.on('security_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
      toast.error('Security Alert Detected');
    });
    return () => s.disconnect();
  }, [token]);

  useEffect(() => {
    if (!socket || isPaused) return;
    const handleBatch = (batch) => {
      setPackets(prev => [...batch, ...prev].slice(0, 5000));
    };
    socket.on('packet_batch', handleBatch);
    return () => socket.off('packet_batch', handleBatch);
  }, [socket, isPaused]);

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("EASY Encrypted: FORENSIC REPORT", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Operator: ${user?.username}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Total Records: ${packets.length}`, 14, 44);

      const tableColumn = ["TIME", "SOURCE", "DESTINATION", "PROTOCOL", "SIZE"];
      const tableRows = packets.slice(0, 100).map(p => [
        format(new Date(p.timestamp), 'HH:mm:ss'),
        `${p.src_ip}:${p.src_port}`,
        `${p.dst_ip}:${p.dst_port}`,
        p.protocol,
        `${p.size} B`
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 8, font: 'helvetica' },
        headStyles: { fillColor: [15, 23, 42] },
        theme: 'striped'
      });

      doc.save(`NetViz_Forensic_${Date.now()}.pdf`);
      toast.success('PDF Exported Successfully');
    } catch (e) {
      console.error("PDF Error:", e);
      toast.error('PDF Generation Failed');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 shrink-0 bg-[#0f172a]">
          <div className="flex items-center space-x-6">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {activeTab === 'dashboard' ? 'Real-time Telemetry' : 
               activeTab === 'history' ? 'Packet Archive' : 'Access Control'}
            </h1>
            
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-0.5">
              <button 
                onClick={() => setIsPaused(false)}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all rounded ${!isPaused ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Stream
              </button>
              <button 
                onClick={() => setIsPaused(true)}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all rounded ${isPaused ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Pause
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
                onClick={exportToPDF}
                className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 rounded-lg transition-all"
                title="Download PDF Report"
            >
                <Download size={16} />
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{user?.username}</span>
                <button 
                  onClick={logout}
                  className="p-2 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <LogOut size={16} />
                </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto h-full">
                {activeTab === 'dashboard' && <Dashboard packets={packets} />}
                {activeTab === 'history' && <DataGrid packets={packets} />}
                {activeTab === 'users' && <UserManagement />}
            </div>
        </div>

        {alerts.length > 0 && (
            <div className="fixed bottom-8 right-8 z-50 space-y-2">
                {alerts.map((alert, idx) => (
                    <div key={idx} className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl w-72 flex items-start space-x-3 border border-slate-800 animate-in slide-in-from-right-4">
                        <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-bold leading-tight text-slate-200">{alert.message}</p>
                            <span className="text-[9px] text-slate-500 font-bold uppercase mt-2 block">{format(new Date(), 'HH:mm:ss')}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default MainLayout;
