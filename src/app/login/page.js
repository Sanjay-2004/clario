'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [authError, setAuthError] = useState('');

  async function handleGoogleLogin() {
    setLoading(true);
    setAuthError('');
    const supabase = createClient();
    if (!supabase) { alert('Supabase not configured'); setLoading(false); return; }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      const unsupportedProvider =
        error.code === 'validation_failed' &&
        /Unsupported provider/i.test(error.message || '');

      if (unsupportedProvider) {
        setAuthError('Google sign-in is disabled in Supabase. Enable Google in Authentication > Providers and save your Google OAuth client credentials.');
      } else {
        alert(error.message);
      }
      setLoading(false);
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setAuthError('');
    const supabase = createClient();
    if (!supabase) { alert('Supabase not configured'); setLoading(false); return; }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { alert(error.message); }
    else { setSent(true); }
  }

  return (
    <div className="page" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>💰</div>
        <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: 8 }}>FinTrack</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your personal finance companion</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {authError && (
          <div
            style={{
              background: '#fff4e5',
              border: '1px solid #ffd199',
              color: '#8a4b08',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.85rem',
              marginBottom: 16,
            }}
          >
            {authError}
          </div>
        )}

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn btn-full"
          style={{
            background: 'white', color: '#333', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 24px', borderRadius: 'var(--radius-md)', marginBottom: 20,
            fontSize: '0.95rem', border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>

        {/* Magic Link */}
        {sent ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <span style={{ fontSize: '2rem' }}>📧</span>
            <p style={{ fontWeight: 600, marginTop: 8 }}>Check your email!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
              We sent a magic link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            <button onClick={() => setSent(false)} className="btn btn-secondary btn-sm mt-16">Try again</button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 24 }}>
        Your data is encrypted and stored securely
      </p>
    </div>
  );
}
