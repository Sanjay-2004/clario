'use client';
import { useState } from 'react';
import { useIncome, useExpenses, useTransactions, useCards, useAuth, CATEGORIES, getCategoryById, formatCurrency, formatDate, getMonthKey } from '@/lib/store';
import Modal from '@/components/Modal';
import Link from 'next/link';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const income = useIncome();
  const expenses = useExpenses();
  const transactions = useTransactions();
  const cards = useCards();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qAmount, setQAmount] = useState('');
  const [qCategory, setQCategory] = useState('food');
  const [qCard, setQCard] = useState('');
  const [qNote, setQNote] = useState('');

  const currentMonth = getMonthKey();

  const totalIncome = income.data
    .filter(i => i.frequency === 'monthly' || getMonthKey(new Date(i.date)) === currentMonth)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalFixed = expenses.data.reduce((sum, e) => sum + Number(e.amount), 0);

  const monthTransactions = transactions.data.filter(t => getMonthKey(new Date(t.date)) === currentMonth);
  const totalSpent = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const remaining = totalIncome - totalFixed - totalSpent;

  const recentTransactions = [...transactions.data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  // upcoming EMIs (next 7 days)
  const today = new Date();
  const upcomingExpenses = expenses.data.filter(e => {
    const due = new Date(today.getFullYear(), today.getMonth(), Number(e.due_date));
    if (due < today) due.setMonth(due.getMonth() + 1);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  async function handleQuickAdd(e) {
    e.preventDefault();
    if (!qAmount) return;
    const cardId = qCard || (cards.data[0]?.id || null);
    await transactions.add({ amount: Number(qAmount), category: qCategory, card_id: cardId, note: qNote, date: new Date().toISOString().split('T')[0] });
    setQAmount(''); setQNote(''); setShowQuickAdd(false);
  }

  if (!income.loaded) return <div className="page" style={{ paddingTop: 60, textAlign: 'center' }}><span style={{ animation: 'pulse 1.5s infinite' }}>Loading...</span></div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="page-title">FinTrack</h1>
        </div>
        {user && (
          <button onClick={signOut} className="btn btn-sm btn-secondary" style={{ marginTop: 4 }}>
            Sign Out
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="summary-card animate-in">
          <div className="icon-box" style={{ background: 'var(--accent-green-glow)' }}>💰</div>
          <div className="info">
            <div className="label">Income</div>
            <div className="value" style={{ color: 'var(--accent-green)', fontSize: '1.1rem' }}>{formatCurrency(totalIncome)}</div>
          </div>
        </div>
        <div className="summary-card animate-in-delay-1">
          <div className="icon-box" style={{ background: 'var(--accent-red-glow)' }}>📋</div>
          <div className="info">
            <div className="label">Fixed</div>
            <div className="value" style={{ color: 'var(--accent-red)', fontSize: '1.1rem' }}>{formatCurrency(totalFixed)}</div>
          </div>
        </div>
        <div className="summary-card animate-in-delay-2">
          <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>💳</div>
          <div className="info">
            <div className="label">Spent</div>
            <div className="value" style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{formatCurrency(totalSpent)}</div>
          </div>
        </div>
        <div className="summary-card animate-in-delay-3">
          <div className="icon-box" style={{ background: remaining >= 0 ? 'var(--accent-green-glow)' : 'var(--accent-red-glow)' }}>
            {remaining >= 0 ? '✨' : '⚠️'}
          </div>
          <div className="info">
            <div className="label">Left</div>
            <div className="value" style={{ color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '1.1rem' }}>
              {formatCurrency(Math.abs(remaining))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming EMIs */}
      {upcomingExpenses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-header">
            <h2 className="section-title">⏰ Upcoming EMIs</h2>
          </div>
          {upcomingExpenses.map(exp => (
            <div key={exp.id} className="list-item" style={{ borderLeft: '3px solid var(--accent-yellow)', marginBottom: 8 }}>
              <div className="details">
                <div className="name">{exp.name}</div>
                <div className="meta">Due: {exp.due_date}th of month</div>
              </div>
              <div className="amount amount-expense">{formatCurrency(exp.amount)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Recent Transactions</h2>
          <Link href="/transactions" className="section-link">View All →</Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <span className="emoji">💸</span>
            <div className="title">No transactions yet</div>
            <div className="desc">Tap + to add your first spend</div>
          </div>
        ) : (
          recentTransactions.map(t => {
            const cat = getCategoryById(t.category);
            return (
              <div key={t.id} className="list-item">
                <span className="emoji">{cat.emoji}</span>
                <div className="details">
                  <div className="name">{t.note || cat.name}</div>
                  <div className="meta">{formatDate(t.date)}</div>
                </div>
                <div className="amount amount-expense">{formatCurrency(t.amount)}</div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setQCard(cards.data[0]?.id || ''); setShowQuickAdd(true); }}
        style={{
          position: 'fixed', bottom: 'calc(var(--nav-height) + 16px)', right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--gradient-primary)', border: 'none',
          color: 'white', fontSize: '1.75rem', fontWeight: 300,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--transition-fast)', zIndex: 40,
        }}
      >+</button>

      {/* Quick Add Modal */}
      <Modal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick Add Spend">
        <form onSubmit={handleQuickAdd}>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" placeholder="0" value={qAmount}
              onChange={e => setQAmount(e.target.value)} autoFocus style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={qCategory} onChange={e => setQCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Card / Cash</label>
              <select className="form-select" value={qCard} onChange={e => setQCard(e.target.value)}>
                {cards.data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input type="text" className="form-input" placeholder="What was this for?" value={qNote} onChange={e => setQNote(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-16">Add Spend</button>
        </form>
      </Modal>
    </div>
  );
}
