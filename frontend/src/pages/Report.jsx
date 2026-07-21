import { useEffect, useMemo, useState } from 'react';
import {
  FileDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  ListTodo,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../lib/format';
import { generateReportPdf } from '../lib/reportPdf';

const CATEGORY_COLORS = [
  '#818cf8',
  '#38bdf8',
  '#a78bfa',
  '#34d399',
  '#fb923c',
  '#f472b6',
  '#22d3ee',
];

const PERIODS = [
  { key: 'this_month', label: 'Bulan Ini' },
  { key: 'last_month', label: 'Bulan Lalu' },
  { key: 'this_year', label: 'Tahun Ini' },
  { key: 'custom', label: 'Kustom' },
];

const MONTH_LABELS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function isWithin(dateStr, start, end) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

export default function Report() {
  const { user } = useAuth();
  const [finances, setFinances] = useState([]);
  const [todos, setTodos] = useState([]);
  const [waLogs, setWaLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');

  const now = new Date();
  const [customStart, setCustomStart] = useState(
    toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [customEnd, setCustomEnd] = useState(toDateInputValue(now));

  useEffect(() => {
    Promise.all([api.get('/finances'), api.get('/todos'), api.get('/wa-logs')])
      .then(([financesRes, todosRes, waLogsRes]) => {
        setFinances(financesRes.data);
        setTodos(todosRes.data);
        setWaLogs(waLogsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const today = new Date();

    if (period === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      return {
        rangeStart: start,
        rangeEnd: end,
        rangeLabel: `${MONTH_LABELS_SHORT[start.getMonth()]} ${start.getFullYear()}`,
      };
    }

    if (period === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      return {
        rangeStart: start,
        rangeEnd: end,
        rangeLabel: `${MONTH_LABELS_SHORT[start.getMonth()]} ${start.getFullYear()}`,
      };
    }

    if (period === 'this_year') {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      return { rangeStart: start, rangeEnd: end, rangeLabel: `Tahun ${start.getFullYear()}` };
    }

    // custom
    const start = new Date(customStart + 'T00:00:00');
    const end = new Date(customEnd + 'T23:59:59');
    return {
      rangeStart: start,
      rangeEnd: end,
      rangeLabel: `${customStart} s/d ${customEnd}`,
    };
  }, [period, customStart, customEnd]);

  const report = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap = {};

    finances.forEach((f) => {
      if (!isWithin(f.date, rangeStart, rangeEnd)) return;
      const amount = parseFloat(f.amount);
      if (f.type === 'in') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        categoryMap[f.category] = (categoryMap[f.category] || 0) + amount;
      }
    });

    const categoryTotals = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    const todosInRange = todos.filter((t) => isWithin(t.due_date, rangeStart, rangeEnd));
    const todoTotal = todosInRange.length;
    const todoCompleted = todosInRange.filter((t) => t.status === 'completed').length;
    const completionRate = todoTotal ? (todoCompleted / todoTotal) * 100 : 0;

    const waInRange = waLogs.filter((log) => isWithin(log.sent_at, rangeStart, rangeEnd));
    const waSent = waInRange.filter((l) => l.status === 'sent').length;
    const waFailed = waInRange.filter((l) => l.status === 'failed').length;

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      categoryTotals,
      todoTotal,
      todoCompleted,
      completionRate,
      waSent,
      waFailed,
    };
  }, [finances, todos, waLogs, rangeStart, rangeEnd]);

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0, label: MONTH_LABELS_SHORT[d.getMonth()] };
    });

    finances.forEach((f) => {
      const d = new Date(f.date);
      const bucket = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (!bucket) return;
      const amount = parseFloat(f.amount);
      if (f.type === 'in') bucket.income += amount;
      else bucket.expense += amount;
    });

    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finances]);

  const maxCategory = report.categoryTotals[0]?.[1] || 1;
  const maxTrend = Math.max(...monthlyTrend.flatMap((m) => [m.income, m.expense]), 1);

  function handleExport() {
    generateReportPdf({ userName: user.name, rangeLabel, report, monthlyTrend });
  }

  if (loading) return <Spinner label="Memuat laporan..." />;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="report-root">
      <div className="report-header">
        <h2 className="text-lg font-semibold text-hi">Laporan</h2>
        <button onClick={handleExport} className="gradient-btn text-sm px-4 py-2">
          <FileDown className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Period selector */}
      <div className="report-periods">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`report-period-btn ${period === p.key ? 'report-period-active' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="glass-card p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Dari</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="app-input py-1.5 text-sm"
              style={{ width: 'auto' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Sampai</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="app-input py-1.5 text-sm"
              style={{ width: 'auto' }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-faint">Periode: {rangeLabel}</p>

      {/* Summary tiles */}
      <div className="report-summary-grid">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs text-muted">Pemasukan</span>
          </div>
          <p className="text-lg font-bold text-hi">{formatRupiah(report.totalIncome)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs text-muted">Pengeluaran</span>
          </div>
          <p className="text-lg font-bold text-hi">{formatRupiah(report.totalExpense)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-primary-light)' }}>
            <Wallet className="w-4 h-4" />
            <span className="text-xs text-muted">Saldo Bersih</span>
          </div>
          <p className={`text-lg font-bold ${report.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(report.net)}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium text-hi mb-4">Pengeluaran per Kategori</p>
        {report.categoryTotals.length === 0 ? (
          <p className="text-sm text-faint text-center py-6">Tidak ada pengeluaran di periode ini.</p>
        ) : (
          <div className="space-y-3">
            {report.categoryTotals.map(([category, amount], idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const pct = report.totalExpense > 0 ? ((amount / report.totalExpense) * 100).toFixed(1) : 0;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 text-xs text-mid mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="flex-1">{category}</span>
                    <span className="text-faint">{pct}%</span>
                    <span className="text-hi font-medium">{formatRupiah(amount)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-white/6">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(amount / maxCategory) * 100}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly trend */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-hi">Tren 6 Bulan Terakhir</p>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pemasukan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Pengeluaran
            </span>
          </div>
        </div>
        <div className="report-trend-chart">
          {monthlyTrend.map((m, i) => (
            <div key={i} className="report-trend-col">
              <div className="report-trend-bars">
                <div
                  className="report-trend-bar"
                  style={{ height: `${Math.max((m.income / maxTrend) * 100, 2)}%`, background: '#34d399' }}
                />
                <div
                  className="report-trend-bar"
                  style={{ height: `${Math.max((m.expense / maxTrend) * 100, 2)}%`, background: '#fb7185' }}
                />
              </div>
              <span className="text-xs text-faint mt-1.5">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task stats */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium text-hi mb-4">Ringkasan Tugas</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-muted mb-1">
              <ListTodo className="w-4 h-4" style={{ color: 'var(--color-primary-light)' }} />
              <span className="text-xs">Total Tugas</span>
            </div>
            <p className="text-lg font-bold text-hi">{report.todoTotal}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted mb-1">
              <span className="text-xs">Tingkat Penyelesaian</span>
            </div>
            <p className="text-lg font-bold text-hi">{Math.round(report.completionRate)}%</p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-white/6 mb-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${report.completionRate}%`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-muted">Reminder Terkirim</p>
              <p className="text-sm font-semibold text-hi">{report.waSent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs text-muted">Reminder Gagal</p>
              <p className="text-sm font-semibold text-hi">{report.waFailed}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{reportStyles}</style>
    </div>
  );
}

const reportStyles = `
  .report-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .report-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .report-periods {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .report-period-btn {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .report-period-btn:hover {
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.18);
  }
  .report-period-active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border-color: transparent;
  }
  .report-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  @media (min-width: 640px) {
    .report-summary-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .report-trend-chart {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    height: 120px;
  }
  .report-trend-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }
  .report-trend-bars {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 3px;
  }
  .report-trend-bar {
    width: 40%;
    border-radius: 3px 3px 1px 1px;
    transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;
