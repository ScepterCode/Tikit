import { useState, useEffect } from 'react';

export function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={styles.container}>

      {/* Overlay */}
      {menuOpen && (
        <div
          style={styles.overlay}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Animated Background Orbs */}
      <div style={styles.backgroundOrbs}>
        <div style={{ ...styles.orb, ...styles.orb1 }}></div>
        <div style={{ ...styles.orb, ...styles.orb2 }}></div>
        <div style={{ ...styles.orb, ...styles.orb3 }}></div>
      </div>

      {/* Navigation */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎵</span>
            <span style={styles.logoText}>Grooovy</span>
          </div>

          {/* Desktop buttons */}
          {!isMobile && (
            <div style={styles.navButtons}>
              <a href="/demo" style={styles.navButton}>🎉 Demo</a>
              <a href="/auth/login" style={styles.navButton}>Login</a>
              <a href="/auth/register" style={styles.navButtonPrimary}>Get Started</a>
              <a href="/admin/login" style={styles.adminLink} title="Admin Access">🛡️</a>
            </div>
          )}

          {/* Hamburger (mobile) */}
          {isMobile && (
            <button
              style={styles.hamburger}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span style={{ ...styles.bar, ...(menuOpen ? styles.barTopOpen : {}) }} />
              <span style={{ ...styles.bar, ...(menuOpen ? styles.barMidOpen : {}) }} />
              <span style={{ ...styles.bar, ...(menuOpen ? styles.barBotOpen : {}) }} />
            </button>
          )}
        </div>

        {/* Mobile drawer */}
        {isMobile && (
          <div style={{
            ...styles.mobileDrawer,
            ...(menuOpen ? styles.mobileDrawerOpen : {}),
          }}>
            <div style={styles.drawerDivider} />
            <div style={styles.mobileLinks}>
              <a href="/demo" style={styles.mobileDemoLink} onClick={() => setMenuOpen(false)}>
                🎉 Demo
              </a>
              <a href="/auth/login" style={styles.mobileLoginLink} onClick={() => setMenuOpen(false)}>
                Login
              </a>
              <a href="/auth/register" style={styles.mobileCtaLink} onClick={() => setMenuOpen(false)}>
                Get Started
              </a>
            </div>
            <div style={styles.mobileAdminRow}>
              <a href="/admin/login" style={styles.mobileAdminLink} onClick={() => setMenuOpen(false)}>
                🛡️ Admin Access
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>🇳🇬 Made for Nigeria</div>
          <h1 style={styles.heroTitle}>
            <span style={styles.gradientText}>Experience Events</span>
            <br />
            Like Never Before
          </h1>
          <p style={styles.heroSubtitle}>
            Nigeria's most innovative event ticketing platform. From weddings to concerts, 
            crusades to conferences - discover, book, and manage tickets with ease. 
            Works offline, accepts multiple payment methods, and puts you in control.
          </p>
          <div style={styles.heroCTA}>
            <a href="/auth/register" style={styles.ctaButton}>
              Start Exploring
              <span style={styles.arrow}>→</span>
            </a>
            <a href="/auth/register?role=organizer" style={styles.ctaButtonSecondary}>
              I'm an Organizer
            </a>
          </div>
          <div style={styles.trustBadges}>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>✓</span>
              <span>Secure Payments</span>
            </div>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>✓</span>
              <span>Offline Access</span>
            </div>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>✓</span>
              <span>Instant Tickets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.stats}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>10K+</div>
            <div style={styles.statLabel}>Active Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>500+</div>
            <div style={styles.statLabel}>Events Hosted</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>50K+</div>
            <div style={styles.statLabel}>Tickets Sold</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>98%</div>
            <div style={styles.statLabel}>Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Why Choose Grooovy?</h2>
          <p style={styles.sectionSubtitle}>
            Built specifically for the Nigerian market with features that matter
          </p>
        </div>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Lightning Fast</h3>
            <p style={styles.featureText}>
              Book tickets in seconds with our streamlined checkout. No complicated forms or endless steps.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📱</div>
            <h3 style={styles.featureTitle}>Works Offline</h3>
            <p style={styles.featureText}>
              Access your tickets even without internet. Perfect for areas with poor connectivity.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💰</div>
            <h3 style={styles.featureTitle}>Flexible Payments</h3>
            <p style={styles.featureText}>
              Pay with cards, bank transfer, USSD, or even airtime. Installment plans available.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>👥</div>
            <h3 style={styles.featureTitle}>Group Buying</h3>
            <p style={styles.featureText}>
              Save money when buying with friends. Create or join group purchases for better deals.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Bank-Grade Security</h3>
            <p style={styles.featureText}>
              Your data and payments are protected with enterprise-level encryption and security.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🎯</div>
            <h3 style={styles.featureTitle}>Smart Discovery</h3>
            <p style={styles.featureText}>
              Find events near you based on your interests, location, and preferences.
            </p>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section style={styles.eventTypes}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>All Types of Events</h2>
          <p style={styles.sectionSubtitle}>
            From intimate gatherings to massive festivals
          </p>
        </div>
        <div style={styles.eventTypesGrid}>
          <div style={styles.eventTypeCard}>
            <div style={styles.eventTypeIcon}>💒</div>
            <h4 style={styles.eventTypeTitle}>Weddings</h4>
            <p style={styles.eventTypeText}>Traditional & white weddings with guest management</p>
          </div>
          <div style={styles.eventTypeCard}>
            <div style={styles.eventTypeIcon}>🎤</div>
            <h4 style={styles.eventTypeTitle}>Concerts</h4>
            <p style={styles.eventTypeText}>Live music, shows, and entertainment events</p>
          </div>
          <div style={styles.eventTypeCard}>
            <div style={styles.eventTypeIcon}>⛪</div>
            <h4 style={styles.eventTypeTitle}>Crusades</h4>
            <p style={styles.eventTypeText}>Religious gatherings and spiritual events</p>
          </div>
          <div style={styles.eventTypeCard}>
            <div style={styles.eventTypeIcon}>🎓</div>
            <h4 style={styles.eventTypeTitle}>Conferences</h4>
            <p style={styles.eventTypeText}>Professional events, seminars, and workshops</p>
          </div>
          <div style={styles.eventTypeCard}>
            <div style={styles.eventTypeIcon}>🎉</div>
            <h4 style={styles.eventTypeTitle}>Parties</h4>
            <p style={styles.eventTypeText}>Birthday parties, celebrations, and social events</p>
          </div>
          <div style={styles.eventTypeCard}>
            <div style={styles.eventTypeIcon}>⚽</div>
            <h4 style={styles.eventTypeTitle}>Sports</h4>
            <p style={styles.eventTypeText}>Football matches, tournaments, and sporting events</p>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section style={styles.userTypes}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Built for Everyone</h2>
          <p style={styles.sectionSubtitle}>
            Whether you're attending or organizing, we've got you covered
          </p>
        </div>
        <div style={styles.userTypesGrid}>
          <div style={styles.userTypeCard}>
            <div style={styles.userTypeIcon}>🎉</div>
            <h3 style={styles.userTypeTitle}>For Attendees</h3>
            <ul style={styles.userTypeList}>
              <li>Discover events near you</li>
              <li>Buy tickets instantly</li>
              <li>Access tickets offline</li>
              <li>Share tickets with friends</li>
              <li>Get event reminders</li>
              <li>Earn rewards & referrals</li>
            </ul>
            <a href="/auth/register" style={styles.userTypeButton}>
              Join as Attendee
            </a>
          </div>
          <div style={styles.userTypeCard}>
            <div style={styles.userTypeIcon}>🎪</div>
            <h3 style={styles.userTypeTitle}>For Organizers</h3>
            <ul style={styles.userTypeList}>
              <li>Create & manage events</li>
              <li>Sell tickets online</li>
              <li>Track sales in real-time</li>
              <li>Manage attendees</li>
              <li>Send broadcast messages</li>
              <li>Get detailed analytics</li>
            </ul>
            <a href="/auth/register?role=organizer" style={styles.userTypeButton}>
              Join as Organizer
            </a>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.howItWorks}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <p style={styles.sectionSubtitle}>
            Get started in three simple steps
          </p>
        </div>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>1</div>
            <h4 style={styles.stepTitle}>Create Account</h4>
            <p style={styles.stepText}>
              Sign up in seconds with just your phone number. No lengthy forms required.
            </p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>2</div>
            <h4 style={styles.stepTitle}>Find Events</h4>
            <p style={styles.stepText}>
              Browse events by category, location, or date. Get personalized recommendations.
            </p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNumber}>3</div>
            <h4 style={styles.stepTitle}>Book & Enjoy</h4>
            <p style={styles.stepText}>
              Purchase tickets securely and access them instantly. Show up and have fun!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Get Started?</h2>
          <p style={styles.ctaText}>
            Join thousands of Nigerians experiencing events the smart way. 
            Create your free account today and never miss another event.
          </p>
          <a href="/auth/register" style={styles.ctaButtonLarge}>
            Create Free Account
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.logoIcon}>🎵</span>
            <span style={styles.logoText}>Grooovy</span>
          </div>
          <p style={styles.footerText}>
            © 2024 Grooovy. Making events accessible to everyone in Nigeria.
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    color: '#ffffff',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  backgroundOrbs: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  orb: {
    position: 'absolute' as const,
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.3,
  },
  orb1: {
    width: '500px',
    height: '500px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    top: '-10%',
    left: '-10%',
  },
  orb2: {
    width: '400px',
    height: '400px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    bottom: '-10%',
    right: '-10%',
  },
  orb3: {
    width: '300px',
    height: '300px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  nav: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(15, 12, 41, 0.6)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s ease',
  },
  navScrolled: {
    background: 'rgba(15, 12, 41, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 98,
    background: 'rgba(0, 0, 0, 0.5)',
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5px',
    width: '42px',
    height: '42px',
    background: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    zIndex: 101,
    padding: 0,
  },
  bar: {
    width: '20px',
    height: '2px',
    background: '#ffffff',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
    transformOrigin: 'center' as const,
    display: 'block',
  },
  barTopOpen: {
    transform: 'translateY(7px) rotate(45deg)',
  },
  barMidOpen: {
    opacity: 0,
    transform: 'scaleX(0)',
  },
  barBotOpen: {
    transform: 'translateY(-7px) rotate(-45deg)',
  },
  mobileDrawer: {
    position: 'fixed' as const,
    top: '68px',
    left: 0,
    right: 0,
    zIndex: 99,
    background: 'rgba(15, 12, 41, 0.97)',
    backdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0 20px 28px',
    transform: 'translateY(-10px)',
    opacity: 0,
    pointerEvents: 'none' as const,
    transition: 'all 0.3s ease',
  },
  mobileDrawerOpen: {
    transform: 'translateY(0)',
    opacity: 1,
    pointerEvents: 'all' as const,
  },
  drawerDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.07)',
    margin: '0 0 20px',
  },
  mobileLinks: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  mobileDemoLink: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 18px',
    border: '1px solid rgba(167, 139, 250, 0.3)',
    borderRadius: '12px',
    color: '#a78bfa',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    background: 'rgba(167, 139, 250, 0.06)',
  },
  mobileLoginLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 18px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    background: 'rgba(255, 255, 255, 0.05)',
    textAlign: 'center' as const,
  },
  mobileCtaLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 18px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
    textAlign: 'center' as const,
  },
  mobileAdminRow: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'center',
  },
  mobileAdminLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '13px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '24px',
    fontWeight: '700',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navButtons: {
    display: 'flex',
    gap: '16px',
  },
  navButton: {
    padding: '10px 24px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
  navButtonPrimary: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
  adminLink: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    opacity: 0.7,
  },
  hero: {
    position: 'relative' as const,
    zIndex: 1,
    paddingTop: '140px',
    paddingBottom: '80px',
    textAlign: 'center' as const,
  },
  heroContent: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 24px',
  },
  badge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    fontSize: '14px',
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '800',
    lineHeight: '1.2',
    marginBottom: '24px',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '20px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '40px',
    maxWidth: '700px',
    margin: '0 auto 40px',
  },
  heroCTA: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '40px',
  },
  ctaButton: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  ctaButtonSecondary: {
    padding: '16px 32px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
  arrow: {
    fontSize: '20px',
  },
  trustBadges: {
    display: 'flex',
    gap: '32px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  trustIcon: {
    color: '#10b981',
    fontSize: '18px',
  },
  stats: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '60px 24px',
  },
  statsGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center' as const,
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  features: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '80px 24px',
  },
  sectionHeader: {
    textAlign: 'center' as const,
    marginBottom: '60px',
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: '800',
    marginBottom: '16px',
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  featuresGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    transition: 'all 0.3s ease',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  featureText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  eventTypes: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '80px 24px',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  eventTypesGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  eventTypeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
  },
  eventTypeIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  eventTypeTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  eventTypeText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userTypes: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '80px 24px',
  },
  userTypesGrid: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '32px',
  },
  userTypeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '48px',
    textAlign: 'center' as const,
  },
  userTypeIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  userTypeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '24px',
  },
  userTypeList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px 0',
    textAlign: 'left' as const,
  },
  userTypeButton: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    display: 'inline-block',
    width: '100%',
  },
  howItWorks: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '80px 24px',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  stepsGrid: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
  },
  stepCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center' as const,
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 auto 20px',
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  stepText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  ctaSection: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '100px 24px',
  },
  ctaContent: {
    maxWidth: '700px',
    margin: '0 auto',
    textAlign: 'center' as const,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '60px 40px',
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: '800',
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  ctaButtonLarge: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    display: 'inline-block',
  },
  footer: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '40px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
    fontWeight: '700',
  },
  footerText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
};