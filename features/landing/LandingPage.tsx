'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import styles from './landing.module.css';
import logo from '@/app/logo.png';

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
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    // Enable scrolling for the landing page
    document.body.style.overflow = 'auto';
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.body.style.overflow = 'hidden';
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
      <nav className={`${styles.nav} ${scrollY > 80 ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <Image
              src={logo}
              alt="Xena"
              className={styles.logoWordmarkNav}
              priority
            />
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <a href="#security">Security</a>
            <a href="#integrations">Integrations</a>
          </div>
          <div className={styles.navActions}>
            <button className={styles.btnOutline} onClick={() => setAuthMode('signin')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => setAuthMode('signup')}>Create account</button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroGrid} />
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
          <div className={styles.heroParticles}>
            {Array.from({ length: 20 }, (_, i) => {
              // Deterministic layout (SSR-safe — avoid Math.random in render)
              const left = ((i * 47 + 13) % 100);
              const top = ((i * 71 + 7) % 100);
              const delay = (i * 0.41) % 8;
              const duration = 6 + ((i * 37) % 8);
              return (
                <div
                  key={i}
                  className={styles.particle}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Agentic Operations Platform
          </div>
          <div className={styles.heroLogoWrap}>
            <Image
              src={logo}
              alt="Xena"
              className={styles.heroLogo}
              sizes="(max-width: 480px) 88vw, (max-width: 900px) 70vw, min(620px, 52vw)"
              priority
            />
          </div>
          <h1 className={styles.heroTitle}>
            Your Network&apos;s<br />
            <span className={styles.heroGradient}>AI Command Center</span>
          </h1>
          <p className={styles.heroSub}>
            Real-time streaming chat meets agentic operations. Xena connects your telecom
            infrastructure to an AI operator that searches, creates, and updates incidents,
            events, and maintenance — all through natural conversation.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimaryLarge} onClick={() => setAuthMode('signup')}>
              Get Started Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className={styles.btnGhost} onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              See it in action ↓
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>100%</span>
              <span className={styles.heroStatLabel}>Serverless</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>IaC</span>
              <span className={styles.heroStatLabel}>Full CloudFormation</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>0</span>
              <span className={styles.heroStatLabel}>Exposed Secrets</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>ISO</span>
              <span className={styles.heroStatLabel}>27001 Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Agentic Demo ─── */}
      <section id="demo" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Live Agentic UI</div>
          <h2 className={styles.sectionTitle}>Watch the operator think, act, and respond</h2>
          <p className={styles.sectionSub}>
            The AI operator doesn&apos;t just answer questions — it takes action. Search incidents, update statuses,
            create maintenance records, all through streaming conversation with real-time UI updates.
          </p>
          <div className={styles.demoShell}>
            <div className={styles.demoNav}>
              <div className={styles.demoNavDots}>
                <span /><span /><span />
              </div>
              <div className={styles.demoNavUrl}>app.xena.lu</div>
            </div>
            <div className={styles.demoBody}>
              <DemoActivityStrand />
              <div className={styles.demoChat}>
                <div className={styles.demoMsgUser}>
                  <div className={styles.demoMsgAvatar}>R</div>
                  <div className={styles.demoMsgContent}>
                    <div className={styles.demoMsgRole}>You</div>
                    <div className={styles.demoMsgBubble}>What&apos;s the status of the Remich incident?</div>
                  </div>
                </div>
                <div className={styles.demoMsgAgent}>
                  <div className={styles.demoMsgAvatar}>X</div>
                  <div className={styles.demoMsgContent}>
                    <div className={styles.demoMsgRole}>Xena</div>
                    <div className={styles.demoMsgBubble}>
                      <TypingText text="The Remich incident is INCIDENT-LUX-2026-0036 — an ONU failure at the customer handoff. It's currently OPEN with SEV4 severity. The affected service is FTTH in the Remich area." />
                    </div>
                    <div className={styles.demoContextCard}>
                      <div className={styles.demoCardHeader}>
                        <span className={styles.demoCardType}>Incident · INCIDENT-LUX-2026-0036</span>
                        <div className={styles.demoCardBadges}>
                          <span className={styles.demoBadgeSev}>SEV4</span>
                          <span className={styles.demoBadgeStatus}>OPEN</span>
                        </div>
                      </div>
                      <div className={styles.demoCardTitle}>ONU failure at customer handoff in Remich</div>
                      <div className={styles.demoCardMeta}>
                        <span>Remich · LU</span>
                        <span>FTTH</span>
                        <span>2h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Capabilities</div>
          <h2 className={styles.sectionTitle}>Everything you need for agentic network ops</h2>
          <div className={styles.featuresGrid}>
            <FeatureCard icon="🤖" title="Agentic Operator"
              desc="An AI operator with real tools — web_post, web_put, web_fetch. It doesn't just suggest, it executes. Search incidents, update statuses, create records through natural conversation." />
            <FeatureCard icon="⚡" title="Real-Time Streaming"
              desc="Server-sent events with token deltas, xena_ui control lines, and live context matching. See the operator think, act, and update your dashboard in real-time." />
            <FeatureCard icon="🔒" title="Enterprise Security"
              desc="Cognito authentication, JWT verification on every route, Secrets Manager for credentials, least-privilege IAM. Zero exposed secrets. DSGVO and ISO 27001 aligned." />
            <FeatureCard icon="🏗️" title="Fully Serverless"
              desc="Lambda + API Gateway + DynamoDB. No servers to manage. Auto-scaling. Pay only for what you use. Provisioned entirely through CloudFormation IaC." />
            <FeatureCard icon="🔌" title="Modular VPS Layer"
              desc="Detachable OpenClaw gateway on a Lightsail VPS. Runs independently from the Amplify frontend. Swap models, add plugins, customize agents without touching the cloud stack." />
            <FeatureCard icon="🔄" title="CI/CD & IaC"
              desc="GitHub → Amplify auto-deploy for the frontend. CloudFormation for all AWS resources. Lambda direct deploy for the API. Infra as code, always." />
          </div>
        </div>
      </section>

      {/* ─── Architecture ─── */}
      <section id="architecture" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Architecture</div>
          <h2 className={styles.sectionTitle}>Built on AWS best practices</h2>
          <p className={styles.sectionSub}>
            Every component follows AWS Well-Architected Framework principles. Serverless compute,
            managed services, least-privilege IAM, and zero-trust security.
          </p>
          <div className={styles.archDiagram}>
            <ArchFlow />
          </div>
        </div>
      </section>

      {/* ─── Security ─── */}
      <section id="security" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Security & Compliance</div>
          <h2 className={styles.sectionTitle}>Trust is not optional</h2>
          <div className={styles.securityGrid}>
            <SecurityItem icon="🛡️" title="Zero Exposed Credentials"
              desc="No NEXT_PUBLIC_ secrets. Gateway tokens and API keys live in AWS Secrets Manager, fetched at runtime by server-side API routes. The browser never sees them." />
            <SecurityItem icon="🔐" title="JWT on Every Route"
              desc="Every API call verifies the Cognito access token before proceeding. Unauthenticated requests are rejected at the server — not just hidden in the UI." />
            <SecurityItem icon="📜" title="Least-Privilege IAM"
              desc="The Operations API Lambda can only GetItem, PutItem, UpdateItem, Query, and Scan on four specific DynamoDB tables. Nothing else." />
            <SecurityItem icon="🇪🇺" title="DSGVO & ISO 27001"
              desc="Data stays in eu-central-1. No cross-region replication. SES for transactional email only. Audit trail through CloudTrail and Lambda logs." />
            <SecurityItem icon="🏖️" title="Sandboxed Agent"
              desc="The operator runs in an OpenClaw Docker sandbox with no shell access, no AWS credentials, and no arbitrary code execution. Tools are allowlisted and auditable." />
            <SecurityItem icon="📊" title="Governance & Audit"
              desc="All API calls are logged. DynamoDB streams track every record change. The agentic layer only interacts with fully auditable, governance-compliant paths." />
          </div>
        </div>
      </section>

      {/* ─── Integrations ─── */}
      <section id="integrations" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Integrations</div>
          <h2 className={styles.sectionTitle}>Connect your existing stack</h2>
          <p className={styles.sectionSub}>
            Easy ETL transfer from your current CRM, ERP, or ITSM solution. Xena&apos;s DynamoDB backend
            accepts standard JSON — export, transform, load.
          </p>
          <div className={styles.integrations}>
            {['ServiceNow', 'Salesforce', 'SAP', 'Jira', 'Zendesk', 'BMC Remedy', 'Freshservice', 'Custom API'].map(name => (
              <div key={name} className={styles.integrationChip}>
                <span className={styles.integrationIcon}>🔗</span>
                {name}
              </div>
            ))}
          </div>
          <div className={styles.scaleGrid}>
            <ScaleItem title="Scalable"
              desc="Serverless Lambda auto-scales from zero to thousands. DynamoDB on-demand capacity handles traffic spikes without configuration." />
            <ScaleItem title="Modular"
              desc="Detach the VPS agentic layer, swap the frontend, replace the API. Each component is independent and replaceable." />
            <ScaleItem title="Customizable"
              desc="Custom OpenClaw plugins, configurable agent personas, adjustable IAM policies. Make it yours without forking." />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to command your network?</h2>
          <p className={styles.ctaSub}>Deploy in minutes. Start talking to your infrastructure.</p>
          <div className={styles.ctaActions}>
            <button className={styles.btnPrimaryLarge} onClick={() => setAuthMode('signup')}>
              Create Free Account
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image
              src={logo}
              alt="Xena"
              className={styles.logoWordmarkFooter}
            />
          </div>
          <div className={styles.footerLinks}>
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <a href="#security">Security</a>
            <a href="#integrations">Integrations</a>
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

function DemoActivityStrand() {
  const [phase, setPhase] = useState<'querying' | 'opening' | 'done'>('querying');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('opening'), 1700);
    const t2 = setTimeout(() => setPhase('done'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={styles.demoActivityStrand}>
      <span className={styles.demoActivityDot} />
      <span className={styles.demoActivityText}>
        {phase === 'querying' ? 'Operator is querying incidents…' : 'Opening INCIDENT-LUX-2026-0036…'}
      </span>
    </div>
  );
}

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 25);
    return () => clearTimeout(t);
  }, [displayed, started, text]);

  return <span>{displayed}<span className={styles.cursor}>|</span></span>;
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function SecurityItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className={styles.securityItem}>
      <div className={styles.securityIcon}>{icon}</div>
      <div>
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function ScaleItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.scaleItem}>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

function ArchFlow() {
  return (
    <div className={styles.archFlow}>
      {/* Layer labels */}
      <div className={styles.archLayer}>Frontend</div>
      <div className={styles.archLayer}>API Layer</div>
      <div className={styles.archLayer}>Compute</div>
      <div className={styles.archLayer}>Data</div>
      <div className={styles.archLayer}>AI Gateway</div>

      {/* Nodes */}
      <div className={styles.archNodes}>
        <ArchNode label="Browser" sub="Next.js + Cognito" color="blue" x={1} y={0} />
        <ArchNode label="Amplify" sub="CDN + SSR" color="blue" x={3} y={0} />

        <ArchNode label="API Routes" sub="JWT Verify" color="purple" x={1} y={1} />
        <ArchNode label="API Gateway" sub="HTTP API" color="purple" x={3} y={1} />

        <ArchNode label="Lambda" sub="xena-ops-api" color="green" x={1} y={2} />
        <ArchNode label="OpenClaw" sub="VPS Gateway" color="green" x={3} y={2} />

        <ArchNode label="DynamoDB" sub="4 Tables" color="amber" x={1} y={3} />
        <ArchNode label="Secrets Mgr" sub="Tokens + Keys" color="amber" x={3} y={3} />

        <ArchNode label="Operator" sub="Sandboxed Agent" color="cyan" x={2} y={4} />
      </div>

      {/* Animated connection lines */}
      <svg className={styles.archLines} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Vertical flows */}
        <AnimatedLine x1={100} y1={45} x2={100} y2={95} />
        <AnimatedLine x1={300} y1={45} x2={300} y2={95} />
        <AnimatedLine x1={100} y1={145} x2={100} y2={195} />
        <AnimatedLine x1={100} y1={245} x2={100} y2={295} />
        <AnimatedLine x1={200} y1={345} x2={200} y2={395} />
        {/* Cross connections */}
        <AnimatedLine x1={150} y1={145} x2={250} y2={195} />
        <AnimatedLine x1={250} y1={145} x2={150} y2={195} />
        <AnimatedLine x1={200} y1={245} x2={200} y2={295} />
      </svg>
    </div>
  );
}

function ArchNode({ label, sub, color, x, y }: { label: string; sub: string; color: string; x: number; y: number }) {
  return (
    <div className={`${styles.archNode} ${styles[`arch_${color}`]}`} style={{
      gridColumn: x,
      gridRow: y + 1,
    }}>
      <span className={styles.archNodeLabel}>{label}</span>
      <span className={styles.archNodeSub}>{sub}</span>
    </div>
  );
}

function AnimatedLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#lineGrad)" strokeWidth="1.5">
      <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
    </line>
  );
}
