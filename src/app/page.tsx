import Link from "next/link";

// Ad placement components (will be implemented with FANZ ads SDK)
function AdHeader() {
  return (
    <div 
      className="w-full h-20 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg flex items-center justify-center"
      role="banner"
      aria-label="Advertisement"
    >
      <span className="text-sm text-gray-400 font-medium">Header Ad Placement - 970x90</span>
      <span className="sr-only">Sponsored content</span>
    </div>
  );
}

function AdHero() {
  return (
    <div 
      className="w-full h-32 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg flex items-center justify-center mb-8"
      role="banner"
      aria-label="Advertisement"
    >
      <span className="text-sm text-gray-400 font-medium">Hero Ad Placement - 1200x400</span>
      <span className="sr-only">Sponsored content</span>
    </div>
  );
}

function AdFooter() {
  return (
    <div 
      className="w-full h-16 bg-gradient-to-r from-pink-50 to-yellow-50 border border-gf-border rounded-lg flex items-center justify-center"
      role="contentinfo"
      aria-label="Advertisement"
    >
      <span className="text-sm text-gray-500 font-medium">Footer Ad Placement - 728x90</span>
      <span className="sr-only">Sponsored content</span>
    </div>
  );
}

function AdSidebar() {
  return (
    <div 
      className="w-full h-96 bg-gradient-to-b from-pink-50 to-yellow-50 border border-gf-border rounded-lg flex items-center justify-center"
      role="complementary"
      aria-label="Advertisement"
    >
      <span className="text-sm text-gray-500 font-medium">Sidebar Ad - 300x600</span>
      <span className="sr-only">Sponsored content</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen fanz-bg-page">
      {/* Header Ad */}
      <header className="sticky top-0 z-40 fanz-bg-elevated/80 backdrop-blur-sm border-b border-muted">
        <div className="container mx-auto px-4 py-2">
          <AdHeader />
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 container mx-auto px-4 py-8">
        {/* Main Content */}
        <main className="lg:col-span-3" id="main-content">
          {/* Hero Ad */}
          <AdHero />
          
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="font-serif text-6xl md:text-8xl font-bold fanz-brand-primary mb-4">
              GirlFanz
            </h1>
            <p className="text-2xl md:text-3xl fanz-brand-secondary font-medium mb-6">
              Empowered Expression
            </p>
            <p className="text-lg text-secondary max-w-2xl mx-auto mb-8">
              The premier creator platform where empowerment meets elegance. 
              Connect with your audience, monetize your content, and build your brand 
              in a space designed for sophisticated expression.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register?type=creator"
                className="fanz-bg-primary hover:opacity-90 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Creating
              </Link>
              <Link
                href="/auth/register?type=fan"
                className="fanz-bg-secondary hover:opacity-90 text-black px-8 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Join as Fan
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-primary hover:fanz-bg-primary hover:text-white text-primary px-8 py-3 rounded-full font-medium transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </section>

          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-lg border border-gf-border shadow-sm">
              <h3 className="font-serif text-2xl font-semibold gf-brand-primary mb-4">Creator Studio</h3>
              <p className="text-gf-text-secondary mb-4">
                Comprehensive tools for content creation, audience management, and earnings optimization.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gf-pink rounded-full"></span>
                  <span>Advanced analytics & insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gf-pink rounded-full"></span>
                  <span>Multiple monetization options</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gf-pink rounded-full"></span>
                  <span>24/7 creator support</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-lg border border-gf-border shadow-sm">
              <h3 className="font-serif text-2xl font-semibold gf-brand-accent mb-4">Fan Experience</h3>
              <p className="text-gf-text-secondary mb-4">
                Curated content discovery and meaningful connections with your favorite creators.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gf-gold rounded-full"></span>
                  <span>Personalized recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gf-gold rounded-full"></span>
                  <span>Exclusive content access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gf-gold rounded-full"></span>
                  <span>Interactive features</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Native Ad Placement */}
          <div className="mb-12">
            <div 
              className="w-full bg-gradient-to-r from-pink-100 to-yellow-100 border border-gf-border rounded-lg p-6 text-center"
              role="banner"
              aria-label="Advertisement"
            >
              <span className="text-sm text-gray-600 font-medium">Native Ad Placement - In-Feed</span>
              <span className="sr-only">Sponsored content</span>
            </div>
          </div>

          {/* Community Section */}
          <section className="text-center mb-12">
            <h2 className="font-serif text-4xl font-semibold gf-brand-primary mb-6">Join Our Community</h2>
            <p className="text-lg text-gf-text-secondary max-w-2xl mx-auto mb-8">
              Be part of a platform that celebrates creativity, authenticity, and empowerment.
              Your voice matters, your content is valued, and your success is our mission.
            </p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold gf-brand-primary">10K+</div>
                <div className="text-sm text-gf-text-secondary">Active Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gf-brand-accent">50K+</div>
                <div className="text-sm text-gf-text-secondary">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gf-brand-primary">$2M+</div>
                <div className="text-sm text-gf-text-secondary">Creator Earnings</div>
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <AdSidebar />
          
          {/* Quick Links */}
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-lg border border-gf-border shadow-sm">
            <h3 className="font-serif text-xl font-semibold gf-brand-primary mb-4">Quick Links</h3>
            <nav className="space-y-2">
              <Link href="/creator/studio" className="block text-gf-text-secondary hover:text-gf-pink transition-colors">
                Creator Studio
              </Link>
              <Link href="/discovery" className="block text-gf-text-secondary hover:text-gf-pink transition-colors">
                Discover Creators
              </Link>
              <Link href="/support" className="block text-gf-text-secondary hover:text-gf-pink transition-colors">
                Help & Support
              </Link>
              <Link href="/legal" className="block text-gf-text-secondary hover:text-gf-pink transition-colors">
                Legal & Policies
              </Link>
            </nav>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-gf-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <AdFooter />
          
          <div className="mt-8 text-center text-sm text-gf-text-secondary">
            <p className="mb-2">
              &copy; 2025 GirlFanz - Part of the FANZ Network. All rights reserved.
            </p>
            <p className="mb-4">
              <span className="gf-brand-accent font-medium">18+ Only</span> - 
              Age verification required. By using this site, you agree to our 
              <Link href="/legal" className="text-gf-pink hover:underline ml-1">Terms of Service</Link> and 
              <Link href="/legal" className="text-gf-pink hover:underline ml-1">Privacy Policy</Link>.
            </p>
            <p className="text-xs">
              For policies and compliance information, visit 
              <a 
                href="https://Fanz.Foundation/knowledge-base" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gf-pink hover:underline ml-1"
              >
                Fanz.Foundation/knowledge-base
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
  );
}
