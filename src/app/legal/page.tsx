import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal & Policies',
  description: 'GirlFanz legal information, policies, and compliance documentation.',
  robots: {
    index: false, // Legal pages typically not indexed
    follow: true,
  },
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gf-cream">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gf-border">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-3xl font-bold gf-brand-primary">GirlFanz</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gf-border shadow-sm p-8">
          <header className="text-center mb-12">
            <h1 className="font-serif text-4xl font-bold gf-brand-primary mb-4">
              Legal & Policies
            </h1>
            <p className="text-lg text-gf-text-secondary max-w-2xl mx-auto">
              Comprehensive legal information and compliance documentation for the GirlFanz platform,
              part of the FANZ Network.
            </p>
          </header>

          {/* 18+ Age Verification Notice */}
          <div className="bg-gf-pink/10 border-l-4 border-gf-pink p-6 mb-8 rounded-r-lg">
            <h2 className="font-serif text-xl font-semibold gf-brand-primary mb-2">
              ⚠️ Important: 18+ Only Platform
            </h2>
            <p className="text-gf-text-secondary">
              GirlFanz is an adult-oriented platform restricted to users 18 years of age or older.
              By accessing this site, you confirm that you meet this age requirement and consent
              to view adult content in compliance with your local laws.
            </p>
          </div>

          {/* FANZ Foundation Knowledge Base */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold gf-brand-primary mb-6">
              Complete Legal Library
            </h2>
            
            <div className="bg-gradient-to-r from-gf-pink/5 to-gf-gold/5 border border-gf-border rounded-lg p-8 mb-6">
              <h3 className="font-serif text-xl font-semibold gf-brand-accent mb-4">
                📚 FANZ Foundation Knowledge Base
              </h3>
              <p className="text-gf-text-secondary mb-4">
                For comprehensive legal information, policies, procedures, and our complete legal library,
                please visit the official FANZ Foundation Knowledge Base.
              </p>
              <a
                href="https://Fanz.Foundation/knowledge-base"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block gf-bg-primary hover:bg-pink-600 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Visit FANZ Foundation Knowledge Base →
              </a>
            </div>

            <p className="text-sm text-gf-text-secondary italic">
              The FANZ Foundation Knowledge Base is the authoritative source for all FANZ Network
              legal documentation, compliance guidelines, and policy information.
            </p>
          </section>

          {/* Quick Reference */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-semibold gf-brand-primary mb-6">
              Quick Reference
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Essential Policies */}
              <div className="bg-white/40 rounded-lg border border-gf-border p-6">
                <h3 className="font-serif text-lg font-semibold gf-brand-primary mb-4">
                  Essential Policies
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/terms-of-service" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → Terms of Service
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/privacy-policy" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/community-guidelines" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → Community Guidelines
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/cookie-policy" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>

              {/* Compliance & Legal */}
              <div className="bg-white/40 rounded-lg border border-gf-border p-6">
                <h3 className="font-serif text-lg font-semibold gf-brand-primary mb-4">
                  Compliance & Legal
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/usc-2257" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → 18 U.S.C. §2257 Compliance
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/dmca-policy" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → DMCA Policy
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/gdpr-compliance" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → GDPR Compliance
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://Fanz.Foundation/knowledge-base/accessibility" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gf-text-secondary hover:text-gf-pink transition-colors"
                    >
                      → Accessibility Standards (ADA)
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t border-gf-border pt-8">
            <h2 className="font-serif text-2xl font-semibold gf-brand-primary mb-6">
              Legal Contact Information
            </h2>
            
            <div className="bg-white/40 rounded-lg border border-gf-border p-6">
              <p className="text-gf-text-secondary mb-4">
                For legal inquiries, compliance questions, or policy clarification:
              </p>
              
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Legal Department:</span>{' '}
                  <a 
                    href="mailto:legal@fanz.network" 
                    className="text-gf-pink hover:underline"
                  >
                    legal@fanz.network
                  </a>
                </p>
                <p>
                  <span className="font-medium">Compliance Officer:</span>{' '}
                  <a 
                    href="mailto:compliance@fanz.network" 
                    className="text-gf-pink hover:underline"
                  >
                    compliance@fanz.network
                  </a>
                </p>
                <p>
                  <span className="font-medium">DMCA Agent:</span>{' '}
                  <a 
                    href="mailto:dmca@fanz.network" 
                    className="text-gf-pink hover:underline"
                  >
                    dmca@fanz.network
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-block border-2 border-gf-pink hover:bg-gf-pink hover:text-white text-gf-pink px-8 py-3 rounded-full font-medium transition-all duration-200"
            >
              ← Back to GirlFanz Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-gf-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gf-text-secondary">
            <p>
              &copy; 2025 GirlFanz - Part of the FANZ Network. All rights reserved.
            </p>
            <p className="mt-2 text-xs">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}