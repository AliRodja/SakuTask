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
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-1">Sisa Saldo</p>
        <p className={`text-5xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatRupiah(balance)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="text-xs text-gray-500">Pemasukan bulan ini</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatRupiah(monthIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-xs text-gray-500">Pengeluaran bulan ini</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatRupiah(monthExpense)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-sm font-medium text-gray-900 mb-4">Pengeluaran per Kategori (bulan ini)</p>

        {categoryTotals.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Belum ada pengeluaran bulan ini.</p>
        )}

        <div className="space-y-3">
          {categoryTotals.map(([category, amount]) => (
            <div key={category}>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{category}</span>
                <span className="text-gray-900 font-medium">{formatRupiah(amount)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(amount / maxCategory) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}