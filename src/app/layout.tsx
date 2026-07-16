
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CalculatorProvider } from '@/context/calculator-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { SilaAssistant } from '@/components/silacalc/sila-assistant';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  metadataBase: new URL('https://si-latech.com'),
  title: 'Beam & Block Calculator Kenya | Free Instant Quotes | SI-LATECH',
  description: 'Kenya\'s #1 beam and block construction calculator. Get instant, official material quotes for beams, blocks, cement, sand & BRC for your slab project. Serving Nairobi, Mombasa & across Kenya.',
  keywords: ['SI-LATECH', 'SilaCalc', 'Construction Calculator', 'Beam and Block', 'Kenya Construction', 'Material Estimator', 'Nairobi Construction', 'Beam Block Slab Kenya', 'Construction Quotes Kenya', 'Precast Beams Kenya'],
  authors: [{ name: 'SI-LATECH' }],
  openGraph: {
    title: 'SI-LATECH | Beam & Block Construction Calculator Kenya',
    description: 'Get instant official material quotes for your beam & block slab project. Trusted by 500+ contractors across Kenya.',
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
    title: 'SI-LATECH | Beam & Block Construction Calculator Kenya',
    description: 'Get instant official material quotes for your beam & block slab project.',
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
  verification: {
    other: {
      'facebook-domain-verification': ['e4aits5d2o2uy68il9iyngard55t7j'],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'SilaCalc by SI-LATECH',
        operatingSystem: 'Web',
        applicationCategory: 'BusinessApplication',
        description: 'Precision beam and block construction material calculator for Kenya. Get instant quotes for beams, blocks, cement, sand, BRC and props.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KES',
        },
        url: 'https://si-latech.com',
        author: {
          '@type': 'Organization',
          name: 'SI-LATECH',
        },
      },
      {
        '@type': 'LocalBusiness',
        name: 'SI-LATECH',
        description: 'Beam and block specialists providing precast concrete beams and hollow concrete blocks for construction projects across Kenya.',
        url: 'https://si-latech.com',
        telephone: '+254141981315',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KE',
          addressRegion: 'Ruiru, Kiambu',
          streetAddress: 'Behind Rubis Petrol Station',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+254141981315',
          contactType: 'customer service',
          availableLanguage: 'English',
        },
        sameAs: [
          'https://wa.me/254141981315',
        ],
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '08:00',
          closes: '17:00',
        },
      },
    ],
  };

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18319525008"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-18319525008');
          `}
        </Script>
        <FirebaseClientProvider>
          <CalculatorProvider>
            {children}
            <PwaRegister />
            <WhatsAppButton />
            <SilaAssistant />
            <Toaster />
          </CalculatorProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
