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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Keuangan</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 bg-blue-600 text-white text-sm rounded-lg px-3 py-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 mb-4 space-y-3 shadow-sm">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'in' })}
              className={`flex-1 rounded-lg py-2 text-sm font-medium border ${
                form.type === 'in' ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'out' })}
              className={`flex-1 rounded-lg py-2 text-sm font-medium border ${
                form.type === 'out' ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          <input
            type="number"
            placeholder="Nominal (Rp)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            placeholder="Catatan (opsional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      )}

      {loading ? (
        <Spinner label="Memuat transaksi..." />
      ) : (
        <ul className="space-y-2">
          {finances.map((f) => (
            <li key={f.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              {f.type === 'in' ? (
                <ArrowUpCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{f.category}</p>
                <p className="text-xs text-gray-400">
                  {f.date?.slice(0, 10)} {f.description ? `· ${f.description}` : ''}
                </p>
              </div>

              <p className={`text-sm font-semibold ${f.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                {f.type === 'in' ? '+' : '-'}{formatRupiah(f.amount)}
              </p>

              <button onClick={() => removeFinance(f.id)} className="text-gray-300 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}

          {finances.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada transaksi.</p>
          )}
        </ul>
      )}
    </div>
  );
}
