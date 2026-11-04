import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteChrome } from '@/components/SiteChrome';

const fontEditorial = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif-loaded',
  display: 'swap',
});

const fontUi = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GLAMORA | Estilo · Cultura · Sociedad',
    template: '%s | GLAMORA',
  },
  description:
    'Revista digital de moda, sociedad, cultura, tendencias y estilo de vida en Bolivia y el mundo.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  openGraph: {
    siteName: 'GLAMORA',
    locale: 'es_BO',
    type: 'website',
    title: 'GLAMORA | Estilo · Cultura · Sociedad',
    description:
      'Revista digital de moda, sociedad, cultura, tendencias y estilo de vida en Bolivia y el mundo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GLAMORA | Estilo · Cultura · Sociedad',
    description:
      'Revista digital de moda, sociedad, cultura, tendencias y estilo de vida en Bolivia y el mundo.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${fontEditorial.variable} ${fontUi.variable}`}
    >
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
