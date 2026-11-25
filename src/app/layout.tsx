import type { Metadata } from 'next';
import ScrollEnhancements from '@/components/ScrollEnhancements';
import 'lenis/dist/lenis.css';
import 'overlayscrollbars/overlayscrollbars.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinTrack — Keuangan lebih jelas',
  description: 'Catat transaksi, pantau dompet, dan rencanakan anggaran dalam satu tempat.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<ScrollEnhancements /></body></html>;
}
