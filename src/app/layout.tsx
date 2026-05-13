
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CalculatorProvider } from '@/context/calculator-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { WhatsAppButton } from '@/components/whatsapp-button';

export const metadata: Metadata = {
  title: 'SI-LATECH | SilaCalc Construction Calculator',
  description: 'Precision construction material calculator for blocks and beams by SI-LATECH. Get instant official quotes for your construction projects.',
  keywords: ['SI-LATECH', 'SilaCalc', 'Construction Calculator', 'Beam and Block', 'Kenya Construction', 'Material Estimator'],
  authors: [{ name: 'SI-LATECH' }],
  openGraph: {
    title: 'SI-LATECH | Precision Construction Calculator',
    description: 'The definitive tool for beam and block construction calculations.',
    url: 'https://si-latech.com',
    siteName: 'SI-LATECH',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'SI-LATECH Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SI-LATECH | Precision Construction Calculator',
    description: 'The definitive tool for beam and block construction calculations.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <CalculatorProvider>
            {children}
            <WhatsAppButton />
            <Toaster />
          </CalculatorProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
