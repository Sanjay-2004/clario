'use client';
import { useState, useMemo } from 'react';
import { useTransactions, useCards, CATEGORIES, getCategoryById, formatCurrency, formatDate, getMonthKey } from '@/lib/store';
import Modal from '@/components/Modal';

export default function TransactionsPage() {
  const txns = useTransactions();
  const cards = useCards();
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ amount: '', category: 'food', card_id: '', note: '', date: new Date().toISOString().split('T')[0] });
  const [cardForm, setCardForm] = useState({ name: '', type: 'credit', color: '#6366f1' });

  const currentMonth = getMonthKey();
  const sorted = useMemo(() => {
    let filtered = [...txns.data];
    if (filter !== 'all') filtered = filtered.filter(t => t.category === filter);
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [txns.data, filter]);

  const monthTotal = txns.data.filter(t => getMonthKey(new Date(t.date)) === currentMonth).reduce((s, t) => s + Number(t.amount), 0);

  function openAdd() {
    setEditing(null);
    setForm({ amount: '', category: 'food', card_id: cards.data[0]?.id || '', note: '', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ amount: item.amount, category: item.category, card_id: item.card_id || '', note: item.note || '', date: item.date?.split('T')[0] || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount) return;
    const payload = { ...form, amount: Number(form.amount), card_id: form.card_id || null };
    if (editing) await txns.update(editing.id, payload);
    else await txns.add(payload);
    setShowModal(false);
  }

  async function handleAddCard(e) {
    e.preventDefault();
    if (!cardForm.name) return;
    await cards.add(cardForm);
    setCardForm({ name: '', type: 'credit', color: '#6366f1' });
    setShowCardModal(false);
  }

  if (!txns.loaded) return <div className="page"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">Track every spend</p>
      </div>

      {/* Month Total */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>This Month</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: 4 }}>{formatCurrency(monthTotal)}</div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowCardModal(true)}>+ Card</button>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
        <button
          style={{ background: filter === 'all' ? 'var(--accent-primary)' : 'var(--bg-input)', color: filter === 'all' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-family)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          onClick={() => setFilter('all')}>All</button>
        {CATEGORIES.slice(0, 8).map(c => (
          <button key={c.id}
            style={{ background: filter === c.id ? c.color : 'var(--bg-input)', color: filter === c.id ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-family)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            onClick={() => setFilter(c.id)}>{c.emoji} {c.name}</button>
        ))}
      </div>

      {/* Transactions List */}
      {sorted.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">💳</span>
          <div className="title">{filter === 'all' ? 'No transactions yet' : 'No transactions in this category'}</div>
          <div className="desc">Add your card spends and daily expenses</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
        </div>
      ) : (
        <>
          {sorted.map(t => {
            const cat = getCategoryById(t.category);
            const card = cards.data.find(c => c.id === t.card_id);
            return (
              <div key={t.id} className="list-item" onClick={() => openEdit(t)}>
                <span className="emoji">{cat.emoji}</span>
                <div className="details">
                  <div className="name">{t.note || cat.name}</div>
                  <div className="meta">{formatDate(t.date)} {card ? `• ${card.name}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="amount amount-expense">{formatCurrency(t.amount)}</div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) txns.remove(t.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', marginTop: 2 }}>Delete</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* FAB */}
      <button onClick={openAdd}
        style={{
          position: 'fixed', bottom: 'calc(var(--nav-height) + 16px)', right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--gradient-primary)', border: 'none',
          color: 'white', fontSize: '1.75rem', fontWeight: 300,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 40,
        }}>+</button>

      {/* Transaction Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" placeholder="0" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} autoFocus
              style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Card / Cash</label>
              <select className="form-select" value={form.card_id} onChange={e => setForm({ ...form, card_id: e.target.value })}>
                {cards.data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <input type="text" className="form-input" placeholder="Swiggy, Uber, Amazon..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-16">{editing ? 'Save' : 'Add Transaction'}</button>
        </form>
      </Modal>

      {/* Card Modal */}
      <Modal isOpen={showCardModal} onClose={() => setShowCardModal(false)} title="Add Card">
        <form onSubmit={handleAddCard}>
          <div className="form-group">
            <label className="form-label">Card Name</label>
            <input type="text" className="form-input" placeholder="e.g. HDFC Credit Card" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={cardForm.type} onChange={e => setCardForm({ ...cardForm, type: e.target.value })}>
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-16">Add Card</button>
        </form>
      </Modal>
    </div>
  );
}
