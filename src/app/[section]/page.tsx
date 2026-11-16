import { notFound } from 'next/navigation';
import FinanceApp from '@/components/FinanceApp';

const sections = ['transactions', 'wallets', 'budgets', 'recurring', 'reports', 'settings'];

export function generateStaticParams() { return sections.map(section => ({ section })); }

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <FinanceApp />;
}
