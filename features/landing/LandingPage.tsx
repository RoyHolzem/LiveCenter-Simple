'use client';

import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import styles from './landing.module.css';
import { XenaLogo } from './XenaLogo';

const formFields = {
  signIn: {
    username: { placeholder: 'Email', isRequired: true },
    password: { placeholder: 'Password', isRequired: true },
  },
  signUp: {
    username: { order: 1, placeholder: 'Email', label: 'Email', isRequired: true },
    password: { order: 2, placeholder: 'Password', isRequired: true },
    confirm_password: { order: 3, placeholder: 'Confirm password', isRequired: true },
  },
  confirmResetPassword: {
    confirmation_code: { placeholder: 'Code', label: 'Verification code' },
    password: { placeholder: 'New password' },
  },
  confirmSignIn: {
    confirmation_code: { label: 'Verification code', placeholder: 'Code' },
  },
};

export function LandingPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [authMode, setAuthMode] = useState<'none' | 'signin' | 'signup'>('none');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    document.body.style.overflow = 'auto';
    document.documentElement.setAttribute('data-theme', 'light');
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.removeAttribute('data-theme');
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className={styles.page}>
      {/* ─── Auth Modal ─── */}
      {authMode !== 'none' && (
        <div className={styles.authOverlay} onClick={() => setAuthMode('none')}>
          <div className={styles.authModal} onClick={e => e.stopPropagation()}>
            <button className={styles.authClose} onClick={() => setAuthMode('none')}>✕</button>
            <Authenticator
              formFields={formFields}
              initialState={authMode === 'signup' ? 'signUp' : 'signIn'}
              variation="modal"
            >
              {() => { onAuthenticated(); return <div />; }}
            </Authenticator>
          </div>
        </div>
      )}

      {/* ─── Navbar ─── */}
      <nav className={`${styles.nav} ${scrollY > 40 ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <XenaLogo size={32} />
            <span className={styles.logoDot}>.</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#platform">Platform</a>
            <a href="#agents">Agents</a>
            <a href="#security">Security</a>
            <a href="#customers">Customers</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className={styles.navActions}>
            <button className={styles.btnGhost} onClick={() => setAuthMode('signin')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => setAuthMode('signup')}>Book a demo</button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroGrid} />
          <div className={styles.heroAura} />
          <div className={styles.warpField}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={styles.warpRing} style={{ animationDelay: `${i * 1.4}s` }} />
            ))}
          </div>
        </div>

        <div className={styles.heroContent}>
          <a href="#platform" className={styles.heroPill}>
            <span className={styles.heroPillDot} />
            New · Xena 3 — Multi-agent orchestration
            <span className={styles.heroPillArrow}>→</span>
          </a>

          <h1 className={styles.heroTitle}>
            <GlitchWord text="The agentic cockpit" />
            <br />
            for modern operations.
          </h1>

          <p className={styles.heroSub}>
            Deploy, observe and govern fleets of AI agents that
            <br />
            run your back-office — from ticket triage to financial
            <br />
            close. Enterprise-grade. Human-in-the-loop.
          </p>

          <div className={styles.heroActions}>
            <button className={styles.btnPrimaryLarge} onClick={() => setAuthMode('signup')}>
              Start free pilot
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className={styles.btnSecondaryLarge} onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Watch 90-sec tour
            </button>
          </div>

          <div className={styles.complianceRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
            </svg>
            SOC 2 Type II · ISO 27001 · HIPAA · EU AI Act ready
          </div>
        </div>

        {/* ─── Operations card (the agentic visuals) ─── */}
        <div id="demo" className={styles.opsCard}>
          <div className={styles.opsCardInner}>
            <aside className={styles.opsSidebar}>
              <div className={styles.opsSidebarHeader}>
                <span className={styles.opsLiveDot} />
                142 agents live
              </div>
              <ul className={styles.opsList}>
                <OpsRow color="#1E73E8" name="Triage" count={28} />
                <OpsRow color="#10B981" name="Reconcile" count={14} />
                <OpsRow color="#E1182C" name="Procurement" count={9} />
                <OpsRow color="#7C3AED" name="Outreach" count={21} />
                <OpsRow color="#F59E0B" name="Compliance" count={6} />
              </ul>
            </aside>

            <div className={styles.opsMain}>
              <div className={styles.opsHeader}>
                <div>
                  <div className={styles.opsTitle}>Operations overview</div>
                  <div className={styles.opsSub}>
                    Last 24h · <CountUp to={12408} /> tasks completed autonomously
                  </div>
                </div>
                <div className={styles.opsRange}>
                  <button>1H</button>
                  <button className={styles.opsRangeActive}>24H</button>
                  <button>7D</button>
                  <button>30D</button>
                </div>
              </div>

              <div className={styles.opsKpis}>
                <Kpi label="Throughput" value="12.4k" delta="+18%" positive />
                <Kpi label="Avg. handle" value="4.2s" delta="-31%" positive />
                <Kpi label="Cost / task" value="$0.018" delta="-42%" positive />
              </div>

              <div className={styles.opsChart}>
                <svg viewBox="0 0 600 180" preserveAspectRatio="none" width="100%" height="180">
                  <defs>
                    <linearGradient id="opsLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#1E73E8" />
                      <stop offset="100%" stopColor="#E1182C" />
                    </linearGradient>
                    <linearGradient id="opsFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1E73E8" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1E73E8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,150 C40,140 80,135 120,128 C160,121 200,112 240,104 C280,96 320,90 360,82 C400,74 440,66 480,58 C520,50 560,44 600,38 L600,180 L0,180 Z"
                    fill="url(#opsFill)"
                  />
                  <path
                    d="M0,150 C40,140 80,135 120,128 C160,121 200,112 240,104 C280,96 320,90 360,82 C400,74 440,66 480,58 C520,50 560,44 600,38"
                    fill="none"
                    stroke="url(#opsLine)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <animate attributeName="stroke-dasharray" from="0 2000" to="2000 0" dur="2.4s" fill="freeze" />
                  </path>
                </svg>
              </div>

              {/* Streaming agent task — keep the agentic chat-card vibe */}
              <div className={styles.opsTask}>
                <div className={styles.opsTaskAvatar}>
                  <XenaLogo size={20} withWordmark={false} />
                </div>
                <div className={styles.opsTaskBody}>
                  <div className={styles.opsTaskHead}>
                    <span className={styles.opsTaskName}>triage-agent</span>
                    <span className={styles.opsBadgeOk}>resolved</span>
                    <span className={styles.opsTaskTime}>just now</span>
                  </div>
                  <TypingText text="Ticket #4821 routed to network-ops · severity downgraded to SEV4 · customer notified." />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos / social proof ─── */}
      <section className={styles.logos}>
        <div className={styles.logosInner}>
          <div className={styles.logosLabel}>Operating across regulated industries</div>
          <div className={styles.logosRow}>
            {['NorthBank', 'Helio', 'Avant', 'Polaris', 'Meridian', 'Quanta'].map(n => (
              <span key={n} className={styles.logoChip}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform ─── */}
      <section id="platform" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Platform</div>
          <h2 className={styles.sectionTitle}>One control plane for every agent you ship.</h2>
          <p className={styles.sectionSub}>
            Xena gives operators a single cockpit to deploy, observe and govern AI agents — across
            tools, models and teams. Built for production, not demos.
          </p>
          <div className={styles.featuresGrid}>
            <FeatureCard title="Agentic Operator"
              desc="Real tools, not suggestions — web_post, web_put, web_fetch and your own. Agents execute, log, and hand off." />
            <FeatureCard title="Streaming UI"
              desc="Server-sent events with token deltas and xena_ui control lines. Watch the operator think and act in real time." />
            <FeatureCard title="Enterprise Security"
              desc="Cognito auth, JWT on every route, Secrets Manager, least-privilege IAM. Zero exposed secrets." />
            <FeatureCard title="Fully Serverless"
              desc="Lambda + API Gateway + DynamoDB. Auto-scaling. Pay per task. Provisioned via CloudFormation." />
            <FeatureCard title="Modular VPS Layer"
              desc="Detachable OpenClaw gateway. Swap models, add plugins, customise agents — without touching the cloud stack." />
            <FeatureCard title="CI/CD &amp; IaC"
              desc="GitHub → Amplify auto-deploy. CloudFormation for AWS. Lambda direct deploy for the API. Infra as code, always." />
          </div>
        </div>
      </section>

      {/* ─── Security ─── */}
      <section id="security" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Security &amp; compliance</div>
          <h2 className={styles.sectionTitle}>Trust is not optional.</h2>
          <div className={styles.securityGrid}>
            <SecurityItem title="Zero exposed credentials"
              desc="No NEXT_PUBLIC_ secrets. Gateway tokens and API keys live in AWS Secrets Manager, fetched server-side." />
            <SecurityItem title="JWT on every route"
              desc="Every API call verifies the Cognito access token before proceeding. Unauth requests are rejected at the server." />
            <SecurityItem title="Least-privilege IAM"
              desc="The Operations API Lambda can only Get / Put / Update / Query / Scan four specific DynamoDB tables. Nothing else." />
            <SecurityItem title="DSGVO &amp; ISO 27001"
              desc="Data stays in eu-central-1. No cross-region replication. Audit trail through CloudTrail and Lambda logs." />
            <SecurityItem title="Sandboxed agent"
              desc="The operator runs in an OpenClaw Docker sandbox — no shell access, no AWS credentials, no arbitrary code." />
            <SecurityItem title="Governance &amp; audit"
              desc="All API calls are logged. DynamoDB streams track every record change. Fully auditable, governance-compliant paths." />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="pricing" className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            <GlitchWord text="Ready" /> to put your operations on autopilot?
          </h2>
          <p className={styles.ctaSub}>Deploy in minutes. Start talking to your infrastructure.</p>
          <div className={styles.ctaActions}>
            <button className={styles.btnPrimaryLarge} onClick={() => setAuthMode('signup')}>
              Start free pilot
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className={styles.btnSecondaryLarge} onClick={() => setAuthMode('signin')}>Sign in</button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <XenaLogo size={26} />
          </div>
          <div className={styles.footerLinks}>
            <a href="#platform">Platform</a>
            <a href="#agents">Agents</a>
            <a href="#security">Security</a>
            <a href="#customers">Customers</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Xena · Built on AWS · OpenClaw Powered
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function GlitchWord({ text }: { text: string }) {
  return (
    <span className={styles.glitch} data-text={text}>
      {text}
    </span>
  );
}

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 22);
    return () => clearTimeout(t);
  }, [displayed, started, text]);

  return <span className={styles.opsTaskText}>{displayed}<span className={styles.cursor}>▍</span></span>;
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

function OpsRow({ color, name, count }: { color: string; name: string; count: number }) {
  return (
    <li className={styles.opsRow}>
      <span className={styles.opsRowDot} style={{ background: color }} />
      <span className={styles.opsRowName}>{name}</span>
      <span className={styles.opsRowCount}>{count}</span>
    </li>
  );
}

function Kpi({ label, value, delta, positive }: { label: string; value: string; delta: string; positive?: boolean }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={`${styles.kpiDelta} ${positive ? styles.kpiDeltaUp : ''}`}>{delta}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureMark}>
        <XenaLogo size={20} withWordmark={false} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function SecurityItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.securityItem}>
      <div className={styles.securityMark}>
        <XenaLogo size={18} withWordmark={false} />
      </div>
      <div>
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}
