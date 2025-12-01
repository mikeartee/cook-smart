import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SkipToContent } from '@/components/skip-to-content';
import { ConditionalFooter } from '@/components/conditional-footer';
import { CookieConsent } from '@/components/cookie-consent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cook Smart - Your Personal Cooking Assistant',
  description: 'Discover recipes, plan meals, and cook smarter with our mobile app',
  keywords: ['cooking', 'recipes', 'meal planning', 'food', 'nutrition'],
  authors: [{ name: 'Cook Smart Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cooksmartapp.com',
    siteName: 'Cook Smart',
    title: 'Cook Smart - Your Personal Cooking Assistant',
    description: 'Discover recipes, plan meals, and cook smarter with our mobile app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cook Smart - Your Personal Cooking Assistant',
    description: 'Discover recipes, plan meals, and cook smarter with our mobile app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SkipToContent />
        <main id="main-content">{children}</main>
        <ConditionalFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
