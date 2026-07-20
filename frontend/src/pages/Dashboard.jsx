import { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/Spinner';

function formatRupiah(value) {
  return 'Rp' + Math.round(value).toLocaleString('id-ID');
}

export default function Dashboard() {
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finances')
      .then(({ data }) => setFinances(data))
      .finally(() => setLoading(false));
  }, []);

  const { balance, monthIncome, monthExpense, categoryTotals } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let balance = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    const totals = {};

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
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    return { balance, monthIncome, monthExpense, categoryTotals: sorted };
  }, [finances]);

  const maxCategory = categoryTotals[0]?.[1] || 1;

  if (loading) return <Spinner label="Memuat dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <p className="text-sm text-muted mb-1">Sisa Saldo</p>
        <p className={`text-5xl font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatRupiah(balance)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="text-xs text-muted">Pemasukan bulan ini</span>
          </div>
          <p className="text-lg font-semibold text-hi">{formatRupiah(monthIncome)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-xs text-muted">Pengeluaran bulan ini</span>
          </div>
          <p className="text-lg font-semibold text-hi">{formatRupiah(monthExpense)}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="text-sm font-medium text-hi mb-4">Pengeluaran per Kategori (bulan ini)</p>

        {categoryTotals.length === 0 && (
          <p className="text-sm text-faint text-center py-6">Belum ada pengeluaran bulan ini.</p>
        )}

        <div className="space-y-3">
          {categoryTotals.map(([category, amount]) => (
            <div key={category}>
              <div className="flex items-center justify-between text-xs text-mid mb-1">
                <span>{category}</span>
                <span className="text-hi font-medium">{formatRupiah(amount)}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-white/6">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(amount / maxCategory) * 100}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
