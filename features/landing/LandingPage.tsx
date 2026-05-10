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
          <div className={styles.navActions}>
            <button className={styles.btnGhost} onClick={() => setAuthMode('signin')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => setAuthMode('signup')}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ─── Fluid agentic showcase ─── */}
      <section className={styles.showcase}>
        <div className={styles.showcaseContent}>
          <h1 className={styles.showcaseTitle}>
            <GlitchWord text="Agentic" /> operations cockpit.
          </h1>
          <p className={styles.showcaseSub}>
            AI agents that run your back-office — from ticket triage to network ops.
            <br />
            Real tools, real actions, real-time.
          </p>
        </div>

        <div className={styles.opsCardFluid}>
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

              {/* Streaming agent task */}
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
