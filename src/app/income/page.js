'use client';
import { useState } from 'react';
import { useIncome, formatCurrency } from '@/lib/store';
import Modal from '@/components/Modal';

export default function IncomePage() {
  const { data, loaded, add, update, remove } = useIncome();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ source: '', amount: '', frequency: 'monthly', date: new Date().toISOString().split('T')[0] });

  const totalMonthly = data.filter(i => i.frequency === 'monthly').reduce((s, i) => s + Number(i.amount), 0);

  function openAdd() {
    setEditing(null);
    setForm({ source: '', amount: '', frequency: 'monthly', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ source: item.source, amount: item.amount, frequency: item.frequency, date: item.date?.split('T')[0] || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.source || !form.amount) return;
    const payload = { ...form, amount: Number(form.amount) };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await add(payload);
    }
    setShowModal(false);
  }

  async function handleDelete(id) {
    if (confirm('Delete this income source?')) await remove(id);
  }

  if (!loaded) return <div className="page"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Income</h1>
        <p className="page-subtitle">Manage your income sources</p>
      </div>

      {/* Total Card */}
      <div className="card card-glow" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Monthly Income</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>{formatCurrency(totalMonthly)}</div>
          </div>
          <div style={{ fontSize: '2.5rem' }}>💰</div>
        </div>
      </div>

      {/* Income List */}
      {data.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">💵</span>
          <div className="title">No income sources</div>
          <div className="desc">Add your salary, freelance income, or other sources</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Income</button>
        </div>
      ) : (
        <>
          {data.map(item => (
            <div key={item.id} className="list-item" onClick={() => openEdit(item)}>
              <span className="emoji">💵</span>
              <div className="details">
                <div className="name">{item.source}</div>
                <div className="meta">
                  <span className={`chip ${item.frequency === 'monthly' ? 'chip-green' : 'chip-yellow'}`}>
                    {item.frequency}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="amount amount-income">{formatCurrency(item.amount)}</div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', marginTop: 4 }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          <button className="btn btn-primary btn-full mt-24" onClick={openAdd}>+ Add Income Source</button>
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Source Name</label>
            <input type="text" className="form-input" placeholder="e.g. Salary, Freelance" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-16">{editing ? 'Save Changes' : 'Add Income'}</button>
        </form>
      </Modal>
    </div>
  );
}
