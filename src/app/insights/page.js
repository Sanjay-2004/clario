'use client';
import { useMemo } from 'react';
import { useIncome, useExpenses, useTransactions, CATEGORIES, getCategoryById, formatCurrency, getMonthKey } from '@/lib/store';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function InsightsPage() {
  const income = useIncome();
  const expenses = useExpenses();
  const txns = useTransactions();

  const currentMonth = getMonthKey();

  const totalIncome = income.data
    .filter(i => i.frequency === 'monthly' || getMonthKey(new Date(i.date)) === currentMonth)
    .reduce((s, i) => s + Number(i.amount), 0);

  const totalFixed = expenses.data.reduce((s, e) => s + Number(e.amount), 0);

  const monthTxns = txns.data.filter(t => getMonthKey(new Date(t.date)) === currentMonth);
  const totalSpent = monthTxns.reduce((s, t) => s + Number(t.amount), 0);
  const disposable = totalIncome - totalFixed - totalSpent;

  // Category breakdown
  const catBreakdown = useMemo(() => {
    const map = {};
    monthTxns.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([id, amount]) => ({
      ...getCategoryById(id), amount,
    }));
  }, [monthTxns]);

  const topCategory = catBreakdown[0];

  // Pie chart data
  const pieData = {
    labels: catBreakdown.map(c => c.name),
    datasets: [{
      data: catBreakdown.map(c => c.amount),
      backgroundColor: catBreakdown.map(c => c.color),
      borderColor: 'var(--bg-primary)',
      borderWidth: 2,
    }],
  };

  // Last 6 months bar chart
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = getMonthKey(d);
      const label = d.toLocaleDateString('en-IN', { month: 'short' });

      const inc = income.data
        .filter(item => item.frequency === 'monthly' || getMonthKey(new Date(item.date)) === key)
        .reduce((s, item) => s + (item.frequency === 'monthly' ? Number(item.amount) : (getMonthKey(new Date(item.date)) === key ? Number(item.amount) : 0)), 0);

      const exp = expenses.data.reduce((s, e) => s + Number(e.amount), 0);
      const spent = txns.data.filter(t => getMonthKey(new Date(t.date)) === key).reduce((s, t) => s + Number(t.amount), 0);

      months.push({ label, income: inc, expenses: exp + spent });
    }
    return months;
  }, [income.data, expenses.data, txns.data]);

  const barData = {
    labels: monthlyData.map(m => m.label),
    datasets: [
      { label: 'Income', data: monthlyData.map(m => m.income), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 6 },
      { label: 'Expenses', data: monthlyData.map(m => m.expenses), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 6 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 } },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: '#334155', borderWidth: 1, cornerRadius: 8, padding: 12 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, callback: v => '₹' + (v/1000) + 'k' } },
    },
  };

  if (!txns.loaded) return <div className="page"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">Your spending behavior at a glance</p>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
        <div className="card animate-in" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Income</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: 4 }}>{formatCurrency(totalIncome)}</div>
        </div>
        <div className="card animate-in-delay-1" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Out</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-red)', marginTop: 4 }}>{formatCurrency(totalFixed + totalSpent)}</div>
        </div>
        <div className="card animate-in-delay-2" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Disposable</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: disposable >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: 4 }}>{formatCurrency(Math.abs(disposable))}</div>
        </div>
      </div>

      {/* Top Category */}
      {topCategory && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, borderLeft: `3px solid ${topCategory.color}` }}>
          <span style={{ fontSize: '2rem' }}>{topCategory.emoji}</span>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Highest Spend</div>
            <div style={{ fontWeight: 700, marginTop: 2 }}>{topCategory.name}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontWeight: 700, color: topCategory.color, fontSize: '1.1rem' }}>{formatCurrency(topCategory.amount)}</div>
        </div>
      )}

      {/* Pie Chart */}
      {catBreakdown.length > 0 ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>Spending by Category</h3>
          <div style={{ height: 260, position: 'relative' }}>
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 10 } } } }} />
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 32 }}>
          <span style={{ fontSize: '2rem' }}>📊</span>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.875rem' }}>Add transactions to see your spending breakdown</p>
        </div>
      )}

      {/* Category Breakdown List */}
      {catBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Category Breakdown</h3>
          {catBreakdown.map(cat => {
            const pct = totalSpent > 0 ? (cat.amount / totalSpent * 100).toFixed(0) : 0;
            return (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: cat.color }}>{formatCurrency(cat.amount)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>Income vs Expenses (6 Months)</h3>
        <div style={{ height: 220, position: 'relative' }}>
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
