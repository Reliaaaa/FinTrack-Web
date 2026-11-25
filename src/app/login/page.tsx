import type { Metadata } from 'next';
import FinanceApp from '@/components/FinanceApp';

export const metadata: Metadata = {
  title: 'Masuk atau daftar — FinTrack',
  description: 'Masuk ke akun FinTrack atau mulai mencatat keuangan di browser ini.',
};

export default function LoginPage() {
  return <FinanceApp startOnLogin />;
}
