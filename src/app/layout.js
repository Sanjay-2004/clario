import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata = {
  title: 'FinTrack — Personal Finance Tracker',
  description: 'Track your income, expenses, EMIs, and card spends. Get insights on your spending behavior.',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0e1a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
