'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { XenaLogo } from './XenaLogo';
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

const chatLines = [
  { role: 'user', text: 'Show me SEV1 incidents affecting Luxembourg sites.' },
  { role: 'assistant', text: 'Searching incidents, matching fibers, and preparing operational context.' },
  { role: 'assistant', text: 'Impact cluster located. I opened the incident record and drafted customer-safe next steps.' },
];

const trustMetrics = [
  { value: '24/7', label: 'Operations coverage' },
  { value: 'SEV1', label: 'Incident-ready workflows' },
  { value: 'AWS', label: 'Cognito-secured access' },
];

const capabilities = [
  {
    icon: '◎',
    title: 'Live command context',
    text: 'Unify incidents, fibers, customer impact, and operator notes in one guided cockpit.',
  },
  {
    icon: '✦',
    title: 'Agentic triage',
    text: 'Let Xena search, summarize, and prepare next-best actions while humans stay in control.',
  },
  {
    icon: '◈',
    title: 'Secure by default',
    text: 'Cognito-backed authentication and structured operational data access built for enterprise teams.',
  },
];

const workflowSteps = ['Detect signal', 'Correlate impact', 'Draft response'];

export function LandingPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [authMode, setAuthMode] = useState<'none' | 'signin' | 'signup'>('none');

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.glitchLayer} aria-hidden="true" />
      <div className={styles.beamLayer} aria-hidden="true" />

      {authMode !== 'none' && (
        <div className={styles.authOverlay} onClick={() => setAuthMode('none')}>
          <div className={styles.authModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.authClose} onClick={() => setAuthMode('none')} type="button" aria-label="Close auth modal">
              ✕
            </button>
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

      <nav className={`${styles.nav} navbar navbar-expand`} aria-label="Primary navigation">
        <div className="container-fluid px-0">
          <a className={`${styles.brand} navbar-brand`} href="#top" aria-label="Xena home">
            <XenaLogo size={40} withWordmark className={styles.brandLogo} />
          </a>
          <div className="d-none d-md-flex align-items-center gap-4 ms-auto me-4">
            <a className={styles.navLink} href="#platform">Platform</a>
            <a className={styles.navLink} href="#trust">Trust</a>
            <a className={styles.navLink} href="#workflow">Workflow</a>
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto ms-md-0">
            <button className="btn btn-sm btn-outline-dark rounded-pill px-3" onClick={() => setAuthMode('signin')} type="button">Sign in</button>
            <button className={`${styles.navCta} btn btn-sm btn-primary rounded-pill px-3`} onClick={() => setAuthMode('signup')} type="button">Launch</button>
          </div>
        </div>
      </nav>

      <section id="top" className={`${styles.hero} container`}>
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-5">
            <div className={`${styles.eyebrow} d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 mb-4`}>
              <span className={styles.statusDot} aria-hidden="true" />
              Agentic operations cockpit
            </div>
            <h1 className={`${styles.title} display-2 fw-bold mb-4`}>
              Resolve critical network incidents with AI-grade command clarity.
            </h1>
            <p className={`${styles.subtitle} lead mb-4`}>
              Xena turns live telecom context into a secure, decision-ready workspace for operators who need fast answers, trustworthy actions, and clean executive visibility.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
              <button className={`${styles.primaryCta} btn btn-primary btn-lg rounded-pill px-4`} onClick={() => setAuthMode('signup')} type="button">
                Launch Xena
              </button>
              <button className="btn btn-outline-dark btn-lg rounded-pill px-4" onClick={() => setAuthMode('signin')} type="button">
                Sign in
              </button>
            </div>
            <div className="row g-3" aria-label="Xena trust metrics">
              {trustMetrics.map((metric) => (
                <div className="col-4" key={metric.label}>
                  <div className={`${styles.metricCard} h-100 rounded-4 p-3`}>
                    <strong className="d-block">{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className={styles.logoStage}>
              <XenaLogo size={68} withWordmark className={styles.heroLogo} />
            </div>

            <div className={`${styles.showcase} card border-0 shadow-lg`} aria-label="app.xena.lu product preview">
              <div className={`${styles.browserBar} card-header d-flex align-items-center justify-content-between gap-3`}>
                <div className="d-flex gap-2" aria-hidden="true">
                  <span className={styles.dotRed} />
                  <span className={styles.dotBlue} />
                  <span className={styles.dotInk} />
                </div>
                <div className={styles.urlPill}>app.xena.lu</div>
                <div className={styles.livePill}>LIVE</div>
              </div>

              <div className={`${styles.cardBody} card-body`}>
                <div className="row g-3 mb-3">
                  <div className="col-sm-4">
                    <div className={`${styles.signalCard} rounded-4 p-3 h-100`}>
                      <span>Active incidents</span>
                      <strong>08</strong>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className={`${styles.signalCard} rounded-4 p-3 h-100`}>
                      <span>Sites protected</span>
                      <strong>142</strong>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className={`${styles.signalCard} ${styles.signalHot} rounded-4 p-3 h-100`}>
                      <span>SEV1 focus</span>
                      <strong>01</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.chatWindow} aria-label="Xena showcase chat">
                  {chatLines.map((line, index) => (
                    <div
                      key={line.text}
                      className={`${styles.message} ${line.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                      style={{ '--line-index': index } as CSSProperties}
                    >
                      <span className={styles.messageLabel}>{line.role === 'user' ? 'Operator' : 'Xena'}</span>
                      <span className={styles.typeText}>{line.text}</span>
                    </div>
                  ))}
                </div>

                <div className={`${styles.accessCard} card border-0`}>
                  <div className="card-body p-4">
                    <div className="row align-items-center g-4">
                      <div className="col-md">
                        <p className={styles.cardEyebrow}>Secure access ready</p>
                        <h2 className="h3 fw-bold mb-2">Move from alert noise to operator-grade decisions.</h2>
                        <p className="text-secondary mb-0">
                          Streaming chat, structured operations panels, voice, Cognito security, and DynamoDB-backed telecom context stay aligned in one premium interface.
                        </p>
                      </div>
                      <div className="col-md-auto d-grid gap-2">
                        <button className={`${styles.primaryCta} btn btn-primary btn-lg rounded-pill px-4`} onClick={() => setAuthMode('signup')} type="button">Create account</button>
                        <button className="btn btn-outline-dark btn-lg rounded-pill px-4" onClick={() => setAuthMode('signin')} type="button">Sign in</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className={`${styles.section} container`}>
        <div className="row align-items-end g-4 mb-4">
          <div className="col-lg-7">
            <p className={styles.cardEyebrow}>Platform advantage</p>
            <h2 className="display-6 fw-bold mb-0">Built for high-stakes teams that cannot wait for dashboards to catch up.</h2>
          </div>
          <div className="col-lg-5">
            <p className="lead text-secondary mb-0">Purpose-built sections replace landing-page clutter with crisp proof: context, automation, and enterprise controls.</p>
          </div>
        </div>
        <div className="row g-4">
          {capabilities.map((item) => (
            <div className="col-md-4" key={item.title}>
              <article className={`${styles.featureCard} h-100 card border-0`}>
                <div className="card-body p-4">
                  <div className={`${styles.iconOrb} mb-4`} aria-hidden="true">{item.icon}</div>
                  <h3 className="h4 fw-bold">{item.title}</h3>
                  <p className="text-secondary mb-0">{item.text}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section id="trust" className={`${styles.section} container`}>
        <div className={`${styles.trustPanel} rounded-5 p-4 p-lg-5`}>
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <p className={styles.cardEyebrow}>Enterprise trust</p>
              <h2 className="display-6 fw-bold mb-3">A calm surface for urgent decisions.</h2>
              <p className="lead mb-0">Readable contrast, clear hierarchy, and operator-first action paths help teams move fast without turning the workspace into another noisy wallboard.</p>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {['Cognito authentication', 'Human-approved actions', 'Live operational context', 'Responsive control room UI'].map((item) => (
                  <div className="col-sm-6" key={item}>
                    <div className={`${styles.checkItem} rounded-4 p-3 h-100 d-flex gap-3 align-items-start`}>
                      <span aria-hidden="true">✓</span>
                      <strong>{item}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className={`${styles.section} ${styles.finalSection} container text-center`}>
        <p className={styles.cardEyebrow}>Conversion workflow</p>
        <h2 className="display-6 fw-bold mx-auto mb-4">One flow from signal to customer-safe response.</h2>
        <div className="row g-3 justify-content-center mb-5">
          {workflowSteps.map((step, index) => (
            <div className="col-md-4" key={step}>
              <div className={`${styles.workflowStep} rounded-4 p-4 h-100`}>
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3">{index + 1}</span>
                <h3 className="h5 fw-bold mb-0">{step}</h3>
              </div>
            </div>
          ))}
        </div>
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <button className={`${styles.primaryCta} btn btn-primary btn-lg rounded-pill px-5`} onClick={() => setAuthMode('signup')} type="button">Launch Xena</button>
          <button className="btn btn-outline-dark btn-lg rounded-pill px-5" onClick={() => setAuthMode('signin')} type="button">Sign in</button>
        </div>
      </section>
    </main>
  );
}
