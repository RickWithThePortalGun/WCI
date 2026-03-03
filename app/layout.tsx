import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'World Conflict Intel | Real-Time Geopolitical Dashboard',
  description: 'Live intelligence dashboard aggregating global conflict news from BBC, Al Jazeera, Reuters, DW, and more — with interactive globe, regional risk analysis, and AI-powered briefings.',
  keywords: ['geopolitics', 'conflict', 'world news', 'intelligence', 'live news', 'global security'],
  openGraph: {
    title: 'World Conflict Intel',
    description: 'Real-time geopolitical intelligence platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
      </head>
      <body className="scanlines min-h-screen">
        {children}
      </body>
    </html>
  );
}
