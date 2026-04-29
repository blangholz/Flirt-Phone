import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlirtPhone',
  description: 'Voice-first community dating. Pick up the phone.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-amber-50 text-stone-900 font-mono antialiased">{children}</body>
    </html>
  );
}
