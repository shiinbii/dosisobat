import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dosis Obat — Admin',
  description: 'Admin panel: kelola katalog obat & ICD-10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-stone-50 text-stone-900 min-h-screen">{children}</body>
    </html>
  );
}
