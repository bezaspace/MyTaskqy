
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthSessionProvider from './AuthSessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Task Manager - Time Tracking & Productivity',
  description: 'Professional task management with precision time tracking and activity logging',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}