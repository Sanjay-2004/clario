'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

let _supabase = null;
let _initialized = false;
function getSupabase() {
  if (!_initialized) {
    _supabase = createClient();
    _initialized = true;
  }
  return _supabase;
}

// Generic Supabase hook for CRUD operations
function useSupabaseTable(table, options = {}) {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { orderBy = 'created_at' } = options;

  const fetchData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) { setLoaded(true); return; }
    const { data: rows, error } = await sb
      .from(table)
      .select('*')
      .order(orderBy, { ascending: true });

    if (!error && rows) setData(rows);
    setLoaded(true);
  }, [table, orderBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const add = useCallback(async (item) => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const row = { ...item, user_id: user.id };
    const { data: inserted, error } = await sb
      .from(table)
      .insert(row)
      .select()
      .single();

    if (!error && inserted) {
      setData(prev => [...prev, inserted]);
      return inserted;
    }
    return null;
  }, [table]);

  const update = useCallback(async (id, updates) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb
      .from(table)
      .update(updates)
      .eq('id', id);

    if (!error) {
      setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  }, [table]);

  const remove = useCallback(async (id) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb
      .from(table)
      .delete()
      .eq('id', id);

    if (!error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  }, [table]);

  return { data, loaded, add, update, remove, refetch: fetchData };
}

export function useIncome() {
  return useSupabaseTable('income_sources');
}

export function useExpenses() {
  return useSupabaseTable('fixed_expenses');
}

export function useTransactions() {
  return useSupabaseTable('transactions');
}

export function useCards() {
  return useSupabaseTable('cards');
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    window.location.href = '/login';
  }, []);

  return { user, loading, signOut };
}

export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', emoji: '🍔', color: '#f97316' },
  { id: 'travel', name: 'Travel', emoji: '✈️', color: '#3b82f6' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { id: 'bills', name: 'Bills & Utilities', emoji: '💡', color: '#f59e0b' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#a855f7' },
  { id: 'health', name: 'Health', emoji: '💊', color: '#10b981' },
  { id: 'education', name: 'Education', emoji: '📚', color: '#06b6d4' },
  { id: 'groceries', name: 'Groceries', emoji: '🛒', color: '#84cc16' },
  { id: 'fuel', name: 'Fuel', emoji: '⛽', color: '#f43f5e' },
  { id: 'emi', name: 'EMI', emoji: '🏦', color: '#6366f1' },
  { id: 'rent', name: 'Rent', emoji: '🏠', color: '#8b5cf6' },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '📱', color: '#14b8a6' },
  { id: 'other', name: 'Other', emoji: '📦', color: '#64748b' },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
