import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Bell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDateOnly } from '../lib/format';

const CATEGORY_COLORS = [
  { text: '#818cf8', bg: 'rgba(129,140,248,0.14)' },
  { text: '#38bdf8', bg: 'rgba(56,189,248,0.14)' },
  { text: '#a78bfa', bg: 'rgba(167,139,250,0.14)' },
  { text: '#fb923c', bg: 'rgba(251,146,60,0.14)' },
  { text: '#f472b6', bg: 'rgba(244,114,182,0.14)' },
];

const PAGE_SIZE = 6;
const DAY_MS = 86400000;

function isWithin(dateStr, start, end) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function categoryColorIndex(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % CATEGORY_COLORS.length;
}

export default function Finances() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    type: 'out',
    amount: '',
    category: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);

  const categoryHistory = useMemo(() => {
    const seen = new Set();
    const list = [];
    finances.forEach((f) => {
      if (!seen.has(f.category)) {
        seen.add(f.category);
        list.push(f.category);
      }
    });
    return list;
  }, [finances]);

  const categoryQuery = form.category.trim();
  const filteredCategories = categoryQuery
    ? categoryHistory.filter((c) => c.toLowerCase().includes(categoryQuery.toLowerCase()))
    : categoryHistory;

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
      await api.post('/finances', { ...form, date: formatDateOnly(new Date()) });
      setForm({ ...form, amount: '', description: '' });
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

  const {
    balance,
    balancePct,
    monthIncome,
    monthExpense,
    incomeShare,
    expenseShare,
    insight,
  } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    let balance = 0;
    let lastMonthBalance = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    const startThisWeek = new Date();
    startThisWeek.setHours(0, 0, 0, 0);
    startThisWeek.setDate(startThisWeek.getDate() - 6);
    const startLastWeek = new Date(startThisWeek.getTime() - 7 * DAY_MS);
    const endLastWeek = new Date(startThisWeek.getTime() - 1);

    const thisWeekByCategory = {};
    const lastWeekByCategory = {};

    finances.forEach((f) => {
      const amount = parseFloat(f.amount);
      const signed = f.type === 'in' ? amount : -amount;
      balance += signed;
      if (new Date(f.date) <= lastMonthEnd) lastMonthBalance += signed;

      const date = new Date(f.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        if (f.type === 'in') monthIncome += amount;
        else monthExpense += amount;
      }

      if (f.type === 'out') {
        if (isWithin(f.date, startThisWeek, now)) {
          thisWeekByCategory[f.category] = (thisWeekByCategory[f.category] || 0) + amount;
        } else if (isWithin(f.date, startLastWeek, endLastWeek)) {
          lastWeekByCategory[f.category] = (lastWeekByCategory[f.category] || 0) + amount;
        }
      }
    });

    const balancePct = lastMonthBalance !== 0
      ? ((balance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
      : null;

    const flowTotal = monthIncome + monthExpense;
    const incomeShare = flowTotal > 0 ? (monthIncome / flowTotal) * 100 : 0;
    const expenseShare = flowTotal > 0 ? (monthExpense / flowTotal) * 100 : 0;

    const topCategory = Object.entries(thisWeekByCategory).sort((a, b) => b[1] - a[1])[0];
    const firstName = user?.name?.split(' ')[0] || 'kamu';
    let insight;
    if (!topCategory) {
      insight = 'Belum ada pengeluaran tercatat minggu ini. Yuk mulai catat transaksimu!';
    } else {
      const [category, thisWeekAmount] = topCategory;
      const lastWeekAmount = lastWeekByCategory[category] || 0;
      if (lastWeekAmount > 0) {
        const pct = ((thisWeekAmount - lastWeekAmount) / lastWeekAmount) * 100;
        if (pct <= -1) {
          insight = `Kamu hemat ${Math.abs(pct).toFixed(0)}% untuk ${category} minggu ini dibanding minggu lalu. Pertahankan, ${firstName}!`;
        } else if (pct >= 1) {
          insight = `Pengeluaran ${category} kamu naik ${pct.toFixed(0)}% minggu ini dibanding minggu lalu. Coba lebih hemat, ${firstName}!`;
        } else {
          insight = `Pengeluaran ${category} kamu stabil dibanding minggu lalu.`;
        }
      } else {
        insight = `Kamu mulai belanja ${category} minggu ini sebesar ${formatRupiah(thisWeekAmount)}, tidak ada di minggu lalu.`;
      }
    }

    return { balance, balancePct, monthIncome, monthExpense, incomeShare, expenseShare, insight };
  }, [finances, user]);

  const totalPages = Math.max(1, Math.ceil(finances.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = finances.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isSafe = balance >= 0;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="fin-root">
      <div className="fin-header">
        <h2 className="fin-title">Ringkasan Keuangan</h2>
        <div className="fin-header-actions">
          <button onClick={() => navigate('/search')} className="fin-icon-btn">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/notifications')} className="fin-icon-btn">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Memuat transaksi..." />
      ) : (
        <>
          {/* Hero + KPI row */}
          <div className="fin-summary-grid">
            <div className="fin-hero">
              <div className="fin-hero-glow" />
              <div className="fin-hero-content">
                <div className="fin-hero-top">
                  <div>
                    <p className="fin-hero-label">Saldo Total</p>
                    <p className="fin-hero-amount">{formatRupiah(balance)}</p>
                  </div>
                  <div className="fin-hero-icon">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                {balancePct !== null && (
                  <span className={`fin-hero-badge ${isSafe ? 'fin-badge-up' : 'fin-badge-down'}`}>
                    {balancePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {balancePct >= 0 ? '+' : ''}{balancePct.toFixed(1)}% Sejak bulan lalu
                  </span>
                )}
              </div>
            </div>

            <div className="fin-kpi-card">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Pemasukan Bulanan</span>
                <div className="fin-kpi-icon fin-kpi-icon-in">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="fin-kpi-amount fin-text-income">{formatRupiah(monthIncome)}</p>
              <div className="fin-kpi-track">
                <div className="fin-kpi-fill fin-fill-income" style={{ width: `${Math.max(incomeShare, 3)}%` }} />
              </div>
            </div>

            <div className="fin-kpi-card">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Pengeluaran Bulanan</span>
                <div className="fin-kpi-icon fin-kpi-icon-out">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="fin-kpi-amount fin-text-expense">{formatRupiah(monthExpense)}</p>
              <div className="fin-kpi-track">
                <div className="fin-kpi-fill fin-fill-expense" style={{ width: `${Math.max(expenseShare, 3)}%` }} />
              </div>
            </div>
          </div>

          {/* Form + table */}
          <div className="fin-main-grid">
            <form onSubmit={handleSubmit} className="glass-card fin-form">
              <h3 className="fin-form-title">Tambah Transaksi</h3>

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

              <div>
                <label className="fin-field-label">Jumlah (Nominal Rp)</label>
                <div className="fin-amount-wrap">
                  <span className="fin-amount-prefix">Rp</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="app-input fin-amount-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="fin-field-label">Kategori</label>
                <div className="fin-combobox">
                  <Search className="w-4 h-4 fin-combobox-icon" />
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => {
                      setForm({ ...form, category: e.target.value });
                      setCategoryOpen(true);
                    }}
                    onFocus={() => setCategoryOpen(true)}
                    onBlur={() => setCategoryOpen(false)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setCategoryOpen(false); }}
                    placeholder="Cari atau buat kategori baru..."
                    className="app-input fin-combobox-input"
                    autoComplete="off"
                    required
                  />
                  {categoryOpen && (
                    <ul className="fin-combobox-list">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((c) => (
                          <li key={c}>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setForm({ ...form, category: c });
                                setCategoryOpen(false);
                              }}
                              className={`fin-combobox-option ${c === form.category ? 'fin-combobox-option-active' : ''}`}
                            >
                              {c}
                            </button>
                          </li>
                        ))
                      ) : categoryQuery ? (
                        <li className="fin-combobox-empty">Kategori baru akan disimpan sebagai "{categoryQuery}"</li>
                      ) : (
                        <li className="fin-combobox-empty">Belum ada riwayat kategori. Ketik untuk membuat kategori baru.</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="fin-field-label">Catatan (opsional)</label>
                <textarea
                  placeholder="Contoh: Makan siang di kantin"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="app-input fin-textarea"
                  rows={3}
                />
              </div>

              <button type="submit" disabled={submitting} className="gradient-btn w-full py-2.5 text-sm">
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
              </button>
            </form>

            <div className="glass-card fin-table-card">
              <h3 className="fin-form-title">Transaksi Terakhir</h3>

              {finances.length === 0 ? (
                <p className="text-sm text-faint text-center py-8">Belum ada transaksi.</p>
              ) : (
                <>
                  <div className="fin-table-scroll">
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th>Transaksi</th>
                          <th>Kategori</th>
                          <th>Tanggal</th>
                          <th className="fin-th-right">Jumlah</th>
                          <th className="fin-th-action" />
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((f) => {
                          const colorIdx = categoryColorIndex(f.category);
                          const pill = f.type === 'in'
                            ? { text: '#34d399', bg: 'rgba(52,211,153,0.14)' }
                            : CATEGORY_COLORS[colorIdx];
                          return (
                            <tr key={f.id}>
                              <td>
                                <div className="fin-txn-cell">
                                  <div
                                    className="fin-txn-icon"
                                    style={{ background: f.type === 'in' ? 'rgba(52,211,153,0.14)' : 'rgba(251,113,133,0.14)' }}
                                  >
                                    {f.type === 'in' ? (
                                      <ArrowUpCircle className="w-4 h-4 fin-text-income" />
                                    ) : (
                                      <ArrowDownCircle className="w-4 h-4 fin-text-expense" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="fin-txn-name">{f.description || f.category}</p>
                                    {f.description && <p className="fin-txn-sub">{f.category}</p>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fin-pill" style={{ color: pill.text, background: pill.bg }}>
                                  {f.type === 'in' ? 'Pemasukan' : f.category}
                                </span>
                              </td>
                              <td className="fin-td-date">{f.date && formatDateOnly(f.date)}</td>
                              <td className={`fin-td-amount ${f.type === 'in' ? 'fin-text-income' : 'fin-text-expense'}`}>
                                {f.type === 'in' ? '+' : '-'}{formatRupiah(f.amount)}
                              </td>
                              <td className="fin-th-action">
                                <button onClick={() => removeFinance(f.id)} className="fin-delete-btn">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="fin-pagination">
                    <span className="fin-pagination-text">
                      Menampilkan {pageItems.length} dari {finances.length} transaksi
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="fin-page-btn"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="fin-page-btn"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Insight */}
          <div className="glass-card fin-insight">
            <div className="fin-insight-icon">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="fin-insight-title">Analisis Pintar</p>
              <p className="fin-insight-text">{insight}</p>
            </div>
          </div>
        </>
      )}

      <style>{finStyles}</style>
    </div>
  );
}

const finStyles = `
  .fin-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .fin-text-income  { color: #34d399; }
  .fin-text-expense { color: #fb7185; }

  /* Header */
  .fin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .fin-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.92);
    letter-spacing: -0.01em;
  }
  .fin-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fin-icon-btn {
    width: 36px; height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(var(--ink-rgb),0.08);
    background: rgba(var(--ink-rgb),0.04);
    color: rgba(var(--ink-rgb),0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .fin-icon-btn:hover {
    border-color: rgba(var(--ink-rgb),0.15);
    color: rgba(var(--ink-rgb),0.85);
    background: rgba(var(--ink-rgb),0.08);
  }

  /* Summary row */
  .fin-summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 1024px) {
    .fin-summary-grid { grid-template-columns: 1.3fr 1fr 1fr; }
  }
  .fin-summary-grid > * { min-width: 0; }

  .fin-hero {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(135deg, #312e81, #1e1b4b 50%, #1e3a5f);
    border: 1px solid rgba(99,102,241,0.2);
  }
  .fin-hero-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(99,102,241,0.25) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 15%, rgba(56,189,248,0.15) 0%, transparent 55%);
    pointer-events: none;
  }
  .fin-hero-content {
    position: relative; z-index: 1;
    padding: 22px;
  }
  .fin-hero-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .fin-hero-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.5);
    margin-bottom: 6px;
  }
  .fin-hero-amount {
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  @media (min-width: 640px) {
    .fin-hero-amount { font-size: 2.25rem; }
  }
  .fin-hero-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.7);
    flex-shrink: 0;
  }
  .fin-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 5px 12px;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .fin-badge-up {
    background: rgba(52,211,153,0.18);
    color: #6ee7b7;
  }
  .fin-badge-down {
    background: rgba(251,113,133,0.18);
    color: #fca5a5;
  }

  .fin-kpi-card {
    border-radius: 18px;
    padding: 18px;
    background: rgba(var(--card-rgb), 0.6);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(var(--ink-rgb),0.06);
  }
  .fin-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .fin-kpi-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(var(--ink-rgb),0.4);
  }
  .fin-kpi-icon {
    width: 30px; height: 30px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fin-kpi-icon-in { background: rgba(52,211,153,0.14); color: #34d399; }
  .fin-kpi-icon-out { background: rgba(251,113,133,0.14); color: #fb7185; }
  .fin-kpi-amount {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
  }
  .fin-kpi-track {
    height: 6px;
    border-radius: 99px;
    background: rgba(var(--ink-rgb),0.06);
    overflow: hidden;
  }
  .fin-kpi-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .fin-fill-income { background: linear-gradient(90deg, #34d399, #6ee7b7); }
  .fin-fill-expense { background: linear-gradient(90deg, #fb7185, #fca5a5); }

  /* Main grid: form + table */
  .fin-main-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 1024px) {
    .fin-main-grid { grid-template-columns: minmax(280px, 340px) 1fr; }
  }
  .fin-main-grid > * { min-width: 0; }

  .fin-form {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .fin-form-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.9);
  }
  .fin-field-label {
    display: block;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(var(--ink-rgb),0.4);
    margin-bottom: 6px;
  }
  .fin-amount-wrap {
    position: relative;
  }
  .fin-amount-prefix {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb),0.45);
    pointer-events: none;
  }
  .fin-amount-input {
    padding-left: 40px;
  }

  .fin-combobox {
    position: relative;
  }
  .fin-combobox-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(var(--ink-rgb),0.35);
    pointer-events: none;
  }
  .fin-combobox-input {
    padding-left: 40px;
  }
  .fin-combobox-list {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 20;
    margin: 0;
    padding: 6px;
    list-style: none;
    max-height: 220px;
    overflow-y: auto;
    background: rgba(var(--card-rgb), 0.98);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(var(--ink-rgb),0.1);
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  }
  .fin-combobox-option {
    display: block;
    width: 100%;
    text-align: left;
    padding: 9px 12px;
    border-radius: 8px;
    border: none;
    background: none;
    font-size: 0.875rem;
    font-family: 'Inter', sans-serif;
    color: rgba(var(--ink-rgb),0.75);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .fin-combobox-option:hover {
    background: rgba(99,102,241,0.14);
    color: rgba(var(--ink-rgb),0.95);
  }
  .fin-combobox-option-active {
    background: rgba(99,102,241,0.18);
    color: var(--ink-solid);
    font-weight: 600;
  }
  .fin-combobox-empty {
    padding: 9px 12px;
    font-size: 0.8125rem;
    color: rgba(var(--ink-rgb),0.4);
    font-style: italic;
  }

  .fin-textarea {
    resize: vertical;
    min-height: 72px;
    font-family: 'Inter', sans-serif;
  }

  .fin-table-card {
    padding: 20px;
  }

  .fin-table-scroll {
    overflow-x: auto;
    margin: 0 -4px;
  }
  .fin-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 420px;
  }
  .fin-table thead th {
    text-align: left;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(var(--ink-rgb),0.35);
    padding: 0 4px 12px;
    border-bottom: 1px solid rgba(var(--ink-rgb),0.08);
  }
  .fin-th-right { text-align: right; }
  .fin-th-action { width: 28px; }
  .fin-table tbody td {
    padding: 12px 4px;
    border-bottom: 1px solid rgba(var(--ink-rgb),0.05);
    vertical-align: middle;
  }
  .fin-table tbody tr:last-child td { border-bottom: none; }

  .fin-txn-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fin-txn-icon {
    width: 30px; height: 30px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fin-txn-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb),0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  .fin-txn-sub {
    font-size: 0.6875rem;
    color: rgba(var(--ink-rgb),0.35);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  .fin-pill {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 99px;
    font-size: 0.6875rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .fin-td-date {
    font-size: 0.8125rem;
    color: rgba(var(--ink-rgb),0.5);
    white-space: nowrap;
  }
  .fin-td-amount {
    text-align: right;
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .fin-delete-btn {
    color: rgba(var(--ink-rgb),0.25);
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  .fin-delete-btn:hover { color: #fb7185; }

  .fin-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(var(--ink-rgb),0.06);
  }
  .fin-pagination-text {
    font-size: 0.75rem;
    color: rgba(var(--ink-rgb),0.35);
  }
  .fin-page-btn {
    width: 30px; height: 30px;
    border-radius: 9px;
    border: 1px solid rgba(var(--ink-rgb),0.1);
    background: rgba(var(--ink-rgb),0.03);
    color: rgba(var(--ink-rgb),0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .fin-page-btn:hover:not(:disabled) {
    border-color: rgba(var(--ink-rgb),0.2);
    color: rgba(var(--ink-rgb),0.9);
  }
  .fin-page-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* Insight */
  .fin-insight {
    padding: 18px 20px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .fin-insight-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18));
    color: var(--color-primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fin-insight-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: rgba(var(--ink-rgb),0.9);
    margin-bottom: 3px;
  }
  .fin-insight-text {
    font-size: 0.8125rem;
    color: rgba(var(--ink-rgb),0.55);
    line-height: 1.5;
  }
`;
