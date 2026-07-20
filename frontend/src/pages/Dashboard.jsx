import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  ListTodo,
  BarChart3,
  Wallet,
  Check,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../lib/format';

const today = new Date();
const todayLabel = today.toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function isSameDay(dateStr, ref) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

const CATEGORY_COLORS = [
  { bar: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  { bar: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  { bar: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { bar: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { bar: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  { bar: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { bar: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
];

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finances, setFinances] = useState([]);
  const [todos, setTodos] = useState([]);
  const [waLogs, setWaLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/finances'), api.get('/todos'), api.get('/wa-logs').catch(() => ({ data: [] }))])
      .then(([financesRes, todosRes, waLogsRes]) => {
        setFinances(financesRes.data);
        setTodos(todosRes.data);
        setWaLogs(waLogsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const { balance, monthIncome, monthExpense, categoryTotals, weeklyExpense } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let balance = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    const totals = {};

    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d, amount: 0, label: WEEKDAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1] };
    });

    finances.forEach((f) => {
      const amount = parseFloat(f.amount);
      balance += f.type === 'in' ? amount : -amount;

      const date = new Date(f.date);
      const isThisMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;

      if (isThisMonth) {
        if (f.type === 'in') {
          monthIncome += amount;
        } else {
          monthExpense += amount;
          totals[f.category] = (totals[f.category] || 0) + amount;
        }
      }

      if (f.type === 'out') {
        const bucket = week.find((w) => isSameDay(f.date, w.date));
        if (bucket) bucket.amount += amount;
      }
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    return { balance, monthIncome, monthExpense, categoryTotals: sorted, weeklyExpense: week };
  }, [finances]);

  const todosToday = useMemo(
    () => todos.filter((t) => isSameDay(t.due_date, today)),
    [todos]
  );
  const todosDoneCount = todosToday.filter((t) => t.status === 'completed').length;
  const todosProgress = todosToday.length ? (todosDoneCount / todosToday.length) * 100 : 0;

  const recentTransactions = useMemo(
    () => [...finances].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [finances]
  );

  const maxCategory = categoryTotals[0]?.[1] || 1;
  const maxWeekly = Math.max(...weeklyExpense.map((w) => w.amount), 1);
  const totalCategoryAmount = categoryTotals.reduce((sum, [, amt]) => sum + amt, 0);

  async function toggleTodo(todo) {
    const newStatus = todo.status === 'pending' ? 'completed' : 'pending';
    await api.put(`/todos/${todo.id}`, { status: newStatus });
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t)));
  }

  if (loading) return <Spinner label="Memuat dashboard..." />;

  const isSafe = balance >= 0;
  const greetHour = today.getHours();
  const greeting =
    greetHour < 12 ? 'Selamat Pagi' : greetHour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="dash-root">
      {/* ─── Header ─── */}
      <div className="dash-header">
        <div>
          <h2 className="dash-greeting">
            {greeting}, <span className="dash-greeting-name">{user.name}</span>
            <Sparkles className="dash-greeting-icon" />
          </h2>
          <p className="dash-date">{todayLabel}</p>
        </div>
        <div className="dash-header-actions">
          <button onClick={() => navigate('/search')} className="dash-icon-btn">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/notifications')} className="dash-icon-btn">
            <Bell className="w-4 h-4" />
            {waLogs.length > 0 && <span className="dash-notif-dot" />}
          </button>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="dash-quick-actions">
        <button onClick={() => navigate('/finances')} className="dash-action-btn dash-action-primary">
          <CreditCard className="w-4 h-4" />
          <span>Catat Keuangan</span>
        </button>
        <button onClick={() => navigate('/todos')} className="dash-action-btn dash-action-secondary">
          <ListTodo className="w-4 h-4" />
          <span>Tambah Tugas</span>
        </button>
        <button
          onClick={() => document.getElementById('kategori-chart')?.scrollIntoView({ behavior: 'smooth' })}
          className="dash-action-btn dash-action-secondary"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analitik</span>
        </button>
      </div>

      {/* ─── Hero Balance Card ─── */}
      <div className="dash-balance-card">
        <div className="dash-balance-glow" />
        <div className="dash-balance-content">
          <div className="dash-balance-top">
            <div>
              <p className="dash-balance-label">Total Saldo</p>
              <p className="dash-balance-amount">{formatRupiah(balance)}</p>
            </div>
            <div className="dash-balance-icon">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="dash-balance-bottom">
            <div className="dash-balance-status">
              {isSafe ? (
                <TrendingUp className="w-4 h-4" style={{ color: '#86efac' }} />
              ) : (
                <TrendingDown className="w-4 h-4" style={{ color: '#fca5a5' }} />
              )}
              <span style={{ color: isSafe ? '#86efac' : '#fca5a5' }}>
                {isSafe ? 'Aman & Terkendali' : 'Defisit, Waspada!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-icon dash-kpi-icon-income">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
          <div className="dash-kpi-info">
            <p className="dash-kpi-label">Pemasukan</p>
            <p className="dash-kpi-value">{formatRupiah(monthIncome)}</p>
            <p className="dash-kpi-period">Bulan ini</p>
          </div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-icon dash-kpi-icon-expense">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <div className="dash-kpi-info">
            <p className="dash-kpi-label">Pengeluaran</p>
            <p className="dash-kpi-value">{formatRupiah(monthExpense)}</p>
            <p className="dash-kpi-period">Bulan ini</p>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="dash-content-grid">
        {/* Tugas hari ini */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <ListTodo className="w-4 h-4" style={{ color: '#818cf8' }} />
              Tugas Hari Ini
            </h3>
            <button onClick={() => navigate('/todos')} className="dash-card-link">
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress */}
          <div className="dash-todo-progress">
            <div className="dash-todo-progress-info">
              <span className="dash-todo-progress-text">
                {todosDoneCount}/{todosToday.length} selesai
              </span>
              <span className="dash-todo-progress-pct">{Math.round(todosProgress)}%</span>
            </div>
            <div className="dash-progress-track">
              <div
                className="dash-progress-fill"
                style={{ width: `${todosProgress}%` }}
              />
            </div>
          </div>

          {/* Todo items */}
          <div className="dash-todo-list">
            {todosToday.slice(0, 4).map((todo) => (
              <button
                key={todo.id}
                onClick={() => toggleTodo(todo)}
                className="dash-todo-item"
              >
                <span
                  className={`dash-todo-check ${
                    todo.status === 'completed' ? 'dash-todo-check-done' : ''
                  }`}
                >
                  {todo.status === 'completed' && <Check className="w-3 h-3" />}
                </span>
                <span
                  className={`dash-todo-name ${
                    todo.status === 'completed' ? 'dash-todo-name-done' : ''
                  }`}
                >
                  {todo.task_name}
                </span>
                <span className="dash-todo-time">{todo.reminder_time?.slice(0, 5)}</span>
              </button>
            ))}

            {todosToday.length === 0 && (
              <div className="dash-empty">
                <ListTodo className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p>Tidak ada tugas hari ini</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaksi Terakhir + Mini Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <CreditCard className="w-4 h-4" style={{ color: '#38bdf8' }} />
              Transaksi Terakhir
            </h3>
            <button onClick={() => navigate('/finances')} className="dash-card-link">
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="dash-txn-list">
            {recentTransactions.map((f) => (
              <div key={f.id} className="dash-txn-item">
                <div
                  className="dash-txn-icon"
                  style={{
                    background: f.type === 'in' ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                  }}
                >
                  {f.type === 'in' ? (
                    <ArrowUpCircle className="w-4 h-4 dash-text-income" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4 dash-text-expense" />
                  )}
                </div>
                <div className="dash-txn-info">
                  <p className="dash-txn-cat">{f.category}</p>
                  <p className="dash-txn-date">{f.date?.slice(0, 10)}</p>
                </div>
                <span className={`dash-txn-amount ${f.type === 'in' ? 'dash-text-income' : 'dash-text-expense'}`}>
                  {f.type === 'in' ? '+' : '-'}{formatRupiah(f.amount)}
                </span>
              </div>
            ))}

            {recentTransactions.length === 0 && (
              <div className="dash-empty">
                <CreditCard className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p>Belum ada transaksi</p>
              </div>
            )}
          </div>

          {/* Weekly mini bar chart */}
          {recentTransactions.length > 0 && (
            <div className="dash-weekly">
              <p className="dash-weekly-label">Pengeluaran 7 Hari Terakhir</p>
              <div className="dash-weekly-chart">
                {weeklyExpense.map((w, i) => (
                  <div key={i} className="dash-weekly-col">
                    <div className="dash-weekly-bar-track">
                      <div
                        className={`dash-weekly-bar ${i === weeklyExpense.length - 1 ? 'dash-weekly-bar-today' : ''}`}
                        style={{ height: `${Math.max((w.amount / maxWeekly) * 100, 6)}%` }}
                      />
                    </div>
                    <span className="dash-weekly-day">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Category Breakdown ─── */}
      <div id="kategori-chart" className="dash-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">
            <BarChart3 className="w-4 h-4" style={{ color: '#a78bfa' }} />
            Pengeluaran per Kategori
          </h3>
          <span className="dash-category-month">Bulan ini</span>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="dash-empty" style={{ padding: '32px 0' }}>
            <BarChart3 className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p>Belum ada pengeluaran bulan ini</p>
          </div>
        ) : (
          <div className="dash-category-list">
            {categoryTotals.map(([category, amount], idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const pct = totalCategoryAmount > 0 ? ((amount / totalCategoryAmount) * 100).toFixed(1) : 0;
              return (
                <div key={category} className="dash-category-row">
                  <div className="dash-category-info">
                    <div className="dash-category-dot" style={{ background: color.bar }} />
                    <span className="dash-category-name">{category}</span>
                    <span className="dash-category-pct">{pct}%</span>
                  </div>
                  <div className="dash-category-bar-row">
                    <div className="dash-category-track">
                      <div
                        className="dash-category-fill"
                        style={{
                          width: `${(amount / maxCategory) * 100}%`,
                          background: `linear-gradient(90deg, ${color.bar}, ${color.bar}88)`,
                        }}
                      />
                    </div>
                    <span className="dash-category-amount">{formatRupiah(amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{dashStyles}</style>
    </div>
  );
}

const dashStyles = `
  /* ═══════════════════════════════════════════
     DASHBOARD — PREMIUM REDESIGN
     ═══════════════════════════════════════════ */

  .dash-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── Color tokens ── */
  .dash-text-income  { color: #34d399; }
  .dash-text-expense { color: #fb7185; }

  /* ── Header ── */
  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    row-gap: 10px;
    position: relative;
    z-index: 30;
  }
  .dash-greeting {
    font-size: 1.125rem;
    font-weight: 700;
    color: rgba(255,255,255,0.92);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    letter-spacing: -0.01em;
  }
  @media (min-width: 640px) {
    .dash-greeting { font-size: 1.25rem; }
  }
  .dash-greeting-name {
    background: linear-gradient(135deg, #818cf8, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .dash-greeting-icon {
    width: 18px;
    height: 18px;
    color: #fbbf24;
    animation: dash-sparkle 2s ease-in-out infinite;
  }
  @keyframes dash-sparkle {
    0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.15) rotate(8deg); }
  }
  .dash-date {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.35);
    margin-top: 2px;
  }

  .dash-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dash-icon-btn {
    width: 36px; height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  .dash-icon-btn:hover {
    border-color: rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.08);
  }

  .dash-notif-dot {
    position: absolute;
    top: 7px; right: 7px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #f87171;
    box-shadow: 0 0 8px rgba(248,113,113,0.6);
  }

  /* ── Quick Actions ── */
  .dash-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .dash-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 0.8125rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    white-space: nowrap;
  }
  .dash-action-primary {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: #fff;
    box-shadow: 0 4px 16px rgba(99,102,241,0.25);
  }
  .dash-action-primary:hover {
    box-shadow: 0 6px 24px rgba(99,102,241,0.35);
    transform: translateY(-1px);
  }
  .dash-action-secondary {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.55);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .dash-action-secondary:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.15);
  }

  /* ── Balance Hero ── */
  .dash-balance-card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(135deg, #312e81, #1e1b4b 50%, #1e3a5f);
    border: 1px solid rgba(99,102,241,0.2);
  }
  .dash-balance-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(99,102,241,0.25) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 15%, rgba(56,189,248,0.15) 0%, transparent 55%);
    pointer-events: none;
  }
  .dash-balance-content {
    position: relative; z-index: 1;
    padding: 24px;
  }
  .dash-balance-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .dash-balance-label {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
    margin-bottom: 4px;
  }
  .dash-balance-amount {
    font-size: 2.25rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  @media (min-width: 640px) {
    .dash-balance-amount { font-size: 2.75rem; }
  }
  .dash-balance-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.6);
    flex-shrink: 0;
  }
  .dash-balance-bottom {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .dash-balance-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  /* ── KPI Grid ── */
  .dash-kpi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .dash-kpi-card {
    border-radius: 16px;
    padding: 16px;
    background: rgba(20, 20, 42, 0.6);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: 14px;
    transition: border-color 0.2s;
  }
  .dash-kpi-card:hover {
    border-color: rgba(255,255,255,0.12);
  }
  .dash-kpi-icon {
    width: 44px; height: 44px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dash-kpi-icon-income {
    background: rgba(52,211,153,0.12);
    color: #34d399;
  }
  .dash-kpi-icon-expense {
    background: rgba(251,113,133,0.12);
    color: #fb7185;
  }
  .dash-kpi-info { min-width: 0; }
  .dash-kpi-label {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.35);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }
  .dash-kpi-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.01em;
  }
  .dash-kpi-period {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.25);
    margin-top: 1px;
  }

  /* ── Cards ── */
  .dash-card {
    border-radius: 18px;
    padding: 20px;
    background: rgba(20, 20, 42, 0.6);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color 0.2s;
  }
  .dash-card:hover {
    border-color: rgba(255,255,255,0.1);
  }
  .dash-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .dash-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255,255,255,0.88);
  }
  .dash-card-link {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #818cf8;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s, gap 0.2s;
    padding: 0;
  }
  .dash-card-link:hover {
    color: #a5b4fc;
    gap: 4px;
  }

  .dash-content-grid {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .dash-content-grid { grid-template-columns: 1fr 1fr; }
  }

  /* ── Todo Section ── */
  .dash-todo-progress { margin-bottom: 16px; }
  .dash-todo-progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .dash-todo-progress-text {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
  }
  .dash-todo-progress-pct {
    font-size: 0.75rem;
    font-weight: 600;
    color: #818cf8;
  }
  .dash-progress-track {
    height: 6px;
    border-radius: 99px;
    background: rgba(255,255,255,0.06);
    overflow: hidden;
  }
  .dash-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, #6366f1, #38bdf8);
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dash-todo-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .dash-todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 0.15s;
  }
  .dash-todo-item:hover { background: rgba(255,255,255,0.04); }

  .dash-todo-check {
    width: 20px; height: 20px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    color: transparent;
  }
  .dash-todo-check-done {
    background: #34d399;
    border-color: #34d399;
    color: #fff;
  }

  .dash-todo-name {
    flex: 1;
    min-width: 0;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.72);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dash-todo-name-done {
    text-decoration: line-through;
    color: rgba(255,255,255,0.25);
  }
  .dash-todo-time {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.25);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  /* ── Transactions ── */
  .dash-txn-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .dash-txn-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
  }
  .dash-txn-icon {
    width: 36px; height: 36px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dash-txn-info {
    flex: 1;
    min-width: 0;
  }
  .dash-txn-cat {
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255,255,255,0.72);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dash-txn-date {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.28);
  }
  .dash-txn-amount {
    font-size: 0.8125rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  /* ── Weekly mini chart ── */
  .dash-weekly {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .dash-weekly-label {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.3);
    font-weight: 500;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .dash-weekly-chart {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 64px;
  }
  .dash-weekly-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    gap: 6px;
  }
  .dash-weekly-bar-track {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }
  .dash-weekly-bar {
    width: 100%;
    border-radius: 4px 4px 2px 2px;
    background: rgba(255,255,255,0.08);
    transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .dash-weekly-bar-today {
    background: linear-gradient(180deg, #818cf8, #6366f1);
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  }
  .dash-weekly-day {
    font-size: 0.5625rem;
    color: rgba(255,255,255,0.25);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── Category Breakdown ── */
  .dash-category-month {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.3);
    font-weight: 500;
    background: rgba(255,255,255,0.04);
    padding: 3px 10px;
    border-radius: 99px;
  }
  .dash-category-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .dash-category-row { }
  .dash-category-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .dash-category-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dash-category-name {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.65);
    font-weight: 500;
    flex: 1;
  }
  .dash-category-pct {
    font-size: 0.6875rem;
    color: rgba(255,255,255,0.3);
    font-variant-numeric: tabular-nums;
  }
  .dash-category-bar-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dash-category-track {
    flex: 1;
    height: 8px;
    border-radius: 99px;
    background: rgba(255,255,255,0.04);
    overflow: hidden;
  }
  .dash-category-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .dash-category-amount {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    min-width: 70px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Empty state ── */
  .dash-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
  }
  .dash-empty p {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.25);
  }
`;
