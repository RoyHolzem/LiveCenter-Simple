'use client';

import { useEffect, useState, type CSSProperties } from 'react';
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

const chatLines = [
  { role: 'user', text: 'Show me SEV1 incidents affecting Luxembourg sites.' },
  { role: 'assistant', text: 'Searching incidents, matching fibers, and preparing the operational context.' },
  { role: 'assistant', text: 'Found the active impact cluster. Opening the record and drafting customer-safe next steps.' },
];

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

      <nav className={`${styles.nav} navbar navbar-expand`}>
        <div className="container-fluid px-0">
          <a className={`${styles.brand} navbar-brand`} href="#top" aria-label="Xena home">
            <img src="/logo.png" alt="Xena" className={styles.brandLogo} />
          </a>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <button className="btn btn-sm btn-outline-dark" onClick={() => setAuthMode('signin')} type="button">Sign in</button>
            <button className="btn btn-sm btn-primary" onClick={() => setAuthMode('signup')} type="button">Create account</button>
          </div>
        </div>
      </nav>

      <section id="top" className={`${styles.hero} container`}>
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className={styles.logoStage}>
              <img src="/logo.png" alt="Xena" className={styles.heroLogo} />
            </div>

            <div className={`${styles.showcase} card border-0 shadow-lg`}>
              <div className={`${styles.browserBar} card-header d-flex align-items-center justify-content-between`}>
                <div className="d-flex gap-2" aria-hidden="true">
                  <span className={styles.dotRed} />
                  <span className={styles.dotBlue} />
                  <span className={styles.dotInk} />
                </div>
                <div className={styles.urlPill}>app.xena.lu</div>
                <div className={styles.livePill}>LIVE</div>
              </div>

              <div className={`${styles.cardBody} card-body`}>
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
                  <div className="card-body p-4 p-md-5">
                    <div className="row align-items-center g-4">
                      <div className="col-md">
                        <p className={styles.eyebrow}>Agentic operations cockpit</p>
                        <h1 className={styles.title}>Clean command center. Fast operator actions. One Xena interface.</h1>
                        <p className={styles.subtitle}>
                          Streaming chat, structured operations panels, voice, Cognito security, and DynamoDB-backed telecom context stay intact behind a calmer Bootstrap-first UI.
                        </p>
                      </div>
                      <div className="col-md-auto d-grid gap-2">
                        <button className="btn btn-primary btn-lg px-4" onClick={() => setAuthMode('signup')} type="button">Launch Xena</button>
                        <button className="btn btn-outline-dark btn-lg px-4" onClick={() => setAuthMode('signin')} type="button">Sign in</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
