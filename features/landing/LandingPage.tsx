'use client';

import { useState, useEffect, useCallback } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import styles from './landing.module.css';

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

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  return (
    <div className={styles.page}>
      {/* Auth Modal */}
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
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <img src="/logo.png" alt="Xena" className={styles.navLogo} />
          <div className={styles.navLinks}>
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
          </div>
          <div className={styles.navActions}>
            <button className={styles.btnText} onClick={() => setAuthMode('signin')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => setAuthMode('signup')}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Live Agentic UI</div>
          <h1 className={styles.heroTitle}>
            AI agents that run<br />
            <span className={styles.heroAccent}>your operations.</span>
          </h1>
          <p className={styles.heroSub}>
            Xena deploys autonomous AI agents that triage tickets, reconcile data,
            manage incidents, and execute back-office workflows — in real-time, with full observability.
          </p>
          <div className={styles.heroCta}>
            <button className={styles.btnHero} onClick={() => setAuthMode('signup')}>
              Start free trial
              <span className={styles.btnArrow}>→</span>
            </button>
            <button className={styles.btnGhost} onClick={() => setAuthMode('signin')}>
              Watch demo
            </button>
          </div>
          <div className={styles.heroMeta}>
            <span>✓ No credit card</span>
            <span>✓ SOC 2 compliant</span>
            <span>✓ EU-hosted</span>
          </div>
        </div>

        {/* ─── Live agentic showcase card ─── */}
        <div className={styles.heroCard}>
          <div className={styles.cardSidebar}>
            <div className={styles.cardSidebarHeader}>
              <span className={styles.liveDot} />
              <span>Live agents</span>
            </div>
            <div className={styles.agentList}>
              <AgentRow name="triage-agent" status="running" tasks={28} color="#1E73E8" />
              <AgentRow name="reconcile" status="running" tasks={14} color="#10B981" />
              <AgentRow name="procurement" status="idle" tasks={9} color="#7C3AED" />
              <AgentRow name="compliance" status="running" tasks={6} color="#F59E0B" />
              <AgentRow name="network-ops" status="running" tasks={21} color="#E1182C" />
            </div>
          </div>
          <div className={styles.cardMain}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <div>
                  <div className={styles.cardTitle}>Operations overview</div>
                  <div className={styles.cardSub}>
                    Last 24h · <CountUp to={12408} /> tasks completed autonomously
                  </div>
                </div>
                <div className={styles.cardRange}>
                  <button>1H</button>
                  <button className={styles.rangeActive}>24H</button>
                  <button>7D</button>
                  <button>30D</button>
                </div>
              </div>
            </div>

            <div className={styles.cardKpis}>
              <Kpi label="Throughput" value="12.4k" delta="+18%" up />
              <Kpi label="Avg. handle" value="4.2s" delta="-31%" up />
              <Kpi label="Cost / task" value="$0.018" delta="-42%" up />
            </div>

            <div className={styles.cardChart}>
              <svg viewBox="0 0 600 160" preserveAspectRatio="none" width="100%" height="160">
                <defs>
                  <linearGradient id="cline" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#0E2347" />
                    <stop offset="100%" stopColor="#E1182C" />
                  </linearGradient>
                  <linearGradient id="cfill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0E2347" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#0E2347" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,130 C50,125 100,118 150,110 C200,102 250,95 300,88 C350,80 400,72 450,62 C500,52 550,46 600,38 L600,160 L0,160 Z"
                  fill="url(#cfill)"
                />
                <path
                  d="M0,130 C50,125 100,118 150,110 C200,102 250,95 300,88 C350,80 400,72 450,62 C500,52 550,46 600,38"
                  fill="none" stroke="url(#cline)" strokeWidth="2.5" strokeLinecap="round"
                >
                  <animate attributeName="stroke-dasharray" from="0 2000" to="2000 0" dur="2s" fill="freeze" />
                </path>
              </svg>
            </div>

            <div className={styles.cardTask}>
              <div className={styles.cardTaskAvatar}>
                <img src="/logo.png" alt="" className={styles.cardTaskLogo} />
              </div>
              <div className={styles.cardTaskBody}>
                <div className={styles.cardTaskHead}>
                  <span className={styles.cardTaskName}>triage-agent</span>
                  <span className={styles.badgeOk}>resolved</span>
                  <span className={styles.cardTaskTime}>just now</span>
                </div>
                <TypingText text="Ticket #4821 routed to network-ops · severity downgraded to SEV4 · customer notified via email." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>How it works</div>
          <h2 className={styles.sectionTitle}>Three steps to autonomous operations</h2>
        </div>
        <div className={styles.stepsGrid}>
          <Step num="01" title="Connect your systems" desc="Plug in ticketing, APIs, databases, and messaging. Xena agents learn your workflows in minutes." icon="🔌" />
          <Step num="02" title="Deploy agents" desc="Choose from pre-built agent templates or create custom ones. Each agent has specific skills and guardrails." icon="🤖" />
          <Step num="03" title="Watch them work" desc="Agents execute tasks 24/7 with full observability. Every action is logged, auditable, and reversible." icon="📊" />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>Capabilities</div>
          <h2 className={styles.sectionTitle}>Enterprise-grade agentic infrastructure</h2>
        </div>
        <div className={styles.featuresGrid}>
          <Feature icon="⚡" title="Real-time execution" desc="Agents act in milliseconds. No queues, no batch processing. Live tool execution visible in the cockpit." />
          <Feature icon="🔒" title="Guardrails & RBAC" desc="Every agent operates within strict permission boundaries. Role-based access, approval flows, and audit trails." />
          <Feature icon="👁" title="Full observability" desc="See every tool call, API request, and decision your agents make. Real-time logs with CloudWatch integration." />
          <Feature icon="🇪🇺" title="EU-hosted & compliant" desc="All data processed in EU regions. SOC 2 Type II certified. GDPR-compliant by design." />
          <Feature icon="🔄" title="Self-healing" desc="Agents detect failures, retry with backoff, and escalate to humans when confidence drops below threshold." />
          <Feature icon="🧩" title="API-first" desc="REST API for everything. Integrate with ServiceNow, Jira, Slack, Teams, or your custom tooling." />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to deploy your first agent?</h2>
        <p className={styles.ctaSub}>Start with pre-built templates for telecom, IT ops, and back-office automation.</p>
        <button className={styles.btnHero} onClick={() => setAuthMode('signup')}>
          Get started free <span className={styles.btnArrow}>→</span>
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <img src="/logo.png" alt="Xena" className={styles.footerLogo} />
          <div className={styles.footerLinks}>
            <a href="https://github.com/RoyHolzem/Xena" target="_blank" rel="noopener">GitHub</a>
            <a href="#">Documentation</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <div className={styles.footerCopy}>© 2026 Xena. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

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
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 20);
    return () => clearTimeout(t);
  }, [displayed, started, text]);

  return <span>{displayed}<span className={styles.cursor}>▍</span></span>;
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

function AgentRow({ name, status, tasks, color }: { name: string; status: string; tasks: number; color: string }) {
  return (
    <div className={styles.agentRow}>
      <span className={styles.agentDot} style={{ background: color }} />
      <span className={styles.agentName}>{name}</span>
      <span className={styles.agentTasks}>{tasks}</span>
      <span className={`${styles.agentStatus} ${status === 'running' ? styles.statusActive : ''}`}>
        {status}
      </span>
    </div>
  );
}

function Kpi({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={`${styles.kpiDelta} ${up ? styles.kpiUp : styles.kpiDown}`}>{delta}</div>
    </div>
  );
}

function Step({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: string }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNum}>{num}</div>
      <div className={styles.stepIcon}>{icon}</div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className={styles.feature}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{desc}</p>
    </div>
  );
}
