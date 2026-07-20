import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';

const categories = ['Makanan', 'Transportasi', 'Tugas Kuliah', 'Kosan', 'Hiburan'];

function formatRupiah(value) {
  return 'Rp' + Math.round(value).toLocaleString('id-ID');
}

export default function Finances() {
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'out',
    amount: '',
    category: categories[0],
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadFinances();
  }, []);

  async function loadFinances() {
    setLoading(true);
    try {
      const { data } = await api.get('/finances');
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFinances(data);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/finances', form);
      setForm({ ...form, amount: '', description: '' });
      setShowForm(false);
      await loadFinances();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeFinance(id) {
    await api.delete(`/finances/${id}`);
    loadFinances();
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-hi">Keuangan</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="gradient-btn text-sm px-3 py-1.5"
        >
          <Plus className="w-4 h-4" /> <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-4 mb-4 space-y-3">
          {error && (
            <div className="app-error" role="alert">
              <div className="app-error-dot" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'in' })}
              className={`ghost-btn flex-1 py-2 text-sm ${form.type === 'in' ? 'ghost-btn-active-in' : ''}`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'out' })}
              className={`ghost-btn flex-1 py-2 text-sm ${form.type === 'out' ? 'ghost-btn-active-out' : ''}`}
            >
              Pengeluaran
            </button>
          </div>

          <input
            type="number"
            placeholder="Nominal (Rp)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="app-input"
            required
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="app-input"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#14162a]">{c}</option>
            ))}
          </select>

          <input
            placeholder="Catatan (opsional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="app-input"
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="app-input"
            required
          />

          <button type="submit" disabled={submitting} className="gradient-btn w-full py-2.5 text-sm">
            <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </form>
      )}

      {loading ? (
        <Spinner label="Memuat transaksi..." />
      ) : (
        <ul className="space-y-2">
          {finances.map((f) => (
            <li key={f.id} className="glass-card flex items-center gap-3 p-3">
              {f.type === 'in' ? (
                <ArrowUpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-hi">{f.category}</p>
                <p className="text-xs text-faint">
                  {f.date?.slice(0, 10)} {f.description ? `· ${f.description}` : ''}
                </p>
              </div>

              <p className={`text-sm font-semibold ${f.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {f.type === 'in' ? '+' : '-'}{formatRupiah(f.amount)}
              </p>

              <button onClick={() => removeFinance(f.id)} className="text-faint hover:text-rose-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}

          {finances.length === 0 && (
            <p className="text-sm text-faint text-center py-8">Belum ada transaksi.</p>
          )}
        </ul>
      )}
    </div>
  );
}
