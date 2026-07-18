import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Providers from './providers';
import MainLayout from '../components/layout/MainLayout';

const inter = Inter({ subsets: ['latin'] });

// themeColor must live in generateViewport, not metadata (Next.js 14+)
export const viewport: Viewport = {
  themeColor: '#1db954',
};

export const metadata: Metadata = {
  title: { default: 'Music App — Free Music Streaming', template: '%s | Music App' },
  description: 'Stream millions of songs, create playlists, discover new artists.',
  keywords: ['music', 'streaming', 'songs', 'playlists', 'artists'],
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Music App',
    description: 'Stream millions of songs',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
