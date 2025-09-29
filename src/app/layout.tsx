import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { AppShell } from '../components/AppShell';
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: 'swap',
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "GirlFanz - Empowered Expression",
    template: "%s | GirlFanz"
  },
  description: "The premier creator platform for empowered expression. Connect with your fans, monetize your content, and build your brand on GirlFanz - part of the FANZ Network.",
  keywords: ["creator platform", "content creation", "fan engagement", "monetization", "empowerment"],
  authors: [{ name: "FANZ Network" }],
  creator: "FANZ Network",
  publisher: "FANZ Network",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: false, // Adult content - no indexing in development
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'GirlFanz - Empowered Expression',
    description: 'The premier creator platform for empowered expression.',
    siteName: 'GirlFanz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GirlFanz - Empowered Expression',
    description: 'The premier creator platform for empowered expression.',
    creator: '@GirlFanz',
  },
  verification: {
    // Add verification meta tags as needed
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" data-theme="dark">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} antialiased h-full fanz-bg-page`}
        data-brand="girlfanz"
        data-platform="girlfanz"
      >
        <div id="girlfanz-app" className="h-full">
          <AppShell>
            {children}
          </AppShell>
        </div>
        
        {/* Age verification and compliance notices */}
        <div id="age-gate-portal" />
        <div id="modal-portal" />
        <div id="toast-portal" />
        
        {/* Accessibility skip link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
        >
          Skip to main content
        </a>
        
        {/* No-JS fallback */}
        <noscript>
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
            <div className="bg-white p-8 rounded-lg max-w-md text-center">
              <h1 className="text-xl font-bold mb-4">JavaScript Required</h1>
              <p className="mb-4">GirlFanz requires JavaScript to function properly. Please enable JavaScript in your browser.</p>
              <p className="text-sm text-gray-600">This ensures the security and proper functionality of our creator platform.</p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  );
}
