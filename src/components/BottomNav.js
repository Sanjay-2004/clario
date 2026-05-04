'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/income', label: 'Income', icon: '💰' },
  { href: '/expenses', label: 'Expenses', icon: '📋' },
  { href: '/transactions', label: 'Spends', icon: '💳' },
  { href: '/insights', label: 'Insights', icon: '📊' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--nav-height)',
      background: 'rgba(10, 14, 26, 0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px', paddingBottom: 'var(--safe-bottom)',
      zIndex: 50, maxWidth: '100%',
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            textDecoration: 'none', padding: '8px 12px', borderRadius: 'var(--radius-md)',
            transition: 'all var(--transition-fast)',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
            background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
          }}>
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{
              fontSize: '0.65rem', fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.02em',
            }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
