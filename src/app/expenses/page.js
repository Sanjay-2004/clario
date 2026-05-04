'use client';
import { useState } from 'react';
import { useExpenses, CATEGORIES, formatCurrency } from '@/lib/store';
import Modal from '@/components/Modal';

export default function ExpensesPage() {
  const { data, loaded, add, update, remove } = useExpenses();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', due_date: '1', category: 'emi' });

  const total = data.reduce((s, e) => s + Number(e.amount), 0);
  const today = new Date().getDate();

  function getDueStatus(dueDate) {
    const d = Number(dueDate);
    const diff = d - today;
    if (diff < 0) return { label: 'Overdue', cls: 'chip-red' };
    if (diff <= 3) return { label: 'Due Soon', cls: 'chip-yellow' };
    return { label: `Due ${d}th`, cls: 'chip-green' };
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', amount: '', due_date: '1', category: 'emi' });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name, amount: item.amount, due_date: String(item.due_date), category: item.category });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    const payload = { ...form, amount: Number(form.amount), due_date: Number(form.due_date) };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    setShowModal(false);
  }

  const fixedCategories = CATEGORIES.filter(c => ['emi', 'rent', 'subscriptions', 'bills', 'other'].includes(c.id));

  if (!loaded) return <div className="page"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fixed Expenses</h1>
        <p className="page-subtitle">EMIs, rent & recurring payments</p>
      </div>

      {/* Total */}
      <div className="card card-glow" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(236,72,153,0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Obligations</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: 4 }}>{formatCurrency(total)}</div>
          </div>
          <div style={{ fontSize: '2.5rem' }}>📋</div>
        </div>
      </div>

      {/* List */}
      {data.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🏦</span>
          <div className="title">No fixed expenses</div>
          <div className="desc">Add EMIs, rent, subscriptions and recurring bills</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
        </div>
      ) : (
        <>
          {[...data].sort((a, b) => Number(a.due_date) - Number(b.due_date)).map(item => {
            const status = getDueStatus(item.due_date);
            const cat = CATEGORIES.find(c => c.id === item.category);
            return (
              <div key={item.id} className="list-item" onClick={() => openEdit(item)}>
                <span className="emoji">{cat?.emoji || '📦'}</span>
                <div className="details">
                  <div className="name">{item.name}</div>
                  <div className="meta"><span className={`chip ${status.cls}`}>{status.label}</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="amount amount-expense">{formatCurrency(item.amount)}</div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) remove(item.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', marginTop: 4 }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          <button className="btn btn-primary btn-full mt-24" onClick={openAdd}>+ Add Fixed Expense</button>
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Expense' : 'Add Fixed Expense'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" placeholder="e.g. Home Loan EMI" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date (Day)</label>
              <select className="form-select" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {fixedCategories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-16">{editing ? 'Save Changes' : 'Add Expense'}</button>
        </form>
      </Modal>
    </div>
  );
}
