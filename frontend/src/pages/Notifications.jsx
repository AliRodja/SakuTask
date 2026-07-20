import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { timeAgo } from '../lib/format';

export default function Notifications() {
  const navigate = useNavigate();
  const [waLogs, setWaLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wa-logs')
      .then(({ data }) => setWaLogs(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Memuat notifikasi..." />;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="glass-card w-9 h-9 flex items-center justify-center text-muted hover:text-hi transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-hi">Notifikasi</h2>
      </div>

      <div className="space-y-2">
        {waLogs.map((log) => (
          <div key={log.id} className="glass-card flex items-start gap-3 p-3">
            {log.status === 'sent' ? (
              <MessageCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-hi truncate">{log.todo?.task_name || 'Tugas dihapus'}</p>
              <p className="text-xs text-faint mt-0.5">
                Pengingat WhatsApp {log.status === 'sent' ? 'terkirim' : 'gagal terkirim'} · {timeAgo(log.sent_at)}
              </p>
            </div>
          </div>
        ))}

        {waLogs.length === 0 && (
          <p className="text-sm text-faint text-center py-12">Belum ada notifikasi.</p>
        )}
      </div>
    </div>
  );
}
