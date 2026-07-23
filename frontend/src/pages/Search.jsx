import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, ListTodo, CreditCard, X } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { formatRupiah, formatDateOnly } from '../lib/format';

export default function Search() {
  const navigate = useNavigate();
  const [finances, setFinances] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([api.get('/finances'), api.get('/todos')])
      .then(([financesRes, todosRes]) => {
        setFinances(financesRes.data);
        setTodos(todosRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const { todoMatches, financeMatches } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { todoMatches: [], financeMatches: [] };

    return {
      todoMatches: todos.filter((t) => t.task_name.toLowerCase().includes(q)),
      financeMatches: finances.filter(
        (f) =>
          f.category.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      ),
    };
  }, [query, finances, todos]);

  const hasQuery = query.trim().length > 0;
  const hasResults = todoMatches.length > 0 || financeMatches.length > 0;

  if (loading) return <Spinner label="Memuat..." />;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="glass-card w-9 h-9 flex items-center justify-center text-muted hover:text-hi transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-hi">Cari</h2>
      </div>

      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <SearchIcon className="w-4 h-4 text-faint shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari transaksi atau tugas..."
          className="bg-transparent outline-none text-sm text-hi placeholder:text-faint flex-1 min-w-0"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-faint hover:text-hi shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!hasQuery && (
        <p className="text-sm text-faint text-center py-12">Ketik untuk mencari tugas atau transaksi.</p>
      )}

      {hasQuery && !hasResults && (
        <p className="text-sm text-faint text-center py-12">Tidak ada hasil untuk "{query}".</p>
      )}

      {todoMatches.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2 px-1">Tugas</p>
          <div className="space-y-2">
            {todoMatches.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate('/todos')}
                className="glass-card w-full flex items-center gap-3 p-3 text-left"
              >
                <ListTodo className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary-light)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-hi truncate">{t.task_name}</p>
                  <p className="text-xs text-faint">
                    {t.due_date && formatDateOnly(t.due_date)} · {t.reminder_time?.slice(0, 5)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {financeMatches.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2 px-1">Transaksi</p>
          <div className="space-y-2">
            {financeMatches.map((f) => (
              <button
                key={f.id}
                onClick={() => navigate('/finances')}
                className="glass-card w-full flex items-center gap-3 p-3 text-left"
              >
                <CreditCard className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent-cyan)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-hi truncate">{f.category}</p>
                  <p className="text-xs text-faint">{f.date && formatDateOnly(f.date)}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${f.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {f.type === 'in' ? '+' : '-'}{formatRupiah(f.amount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
