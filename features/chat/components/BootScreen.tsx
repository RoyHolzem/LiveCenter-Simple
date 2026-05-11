'use client';

import type { BootStep, BootState } from '../hooks/useBootSequence';
import { XenaLogo } from '@/features/landing/XenaLogo';
import { cn } from '../chat-utils';
import styles from '../chat-shell.module.css';

interface BootScreenProps {
  bootState: BootState;
  steps: BootStep[];
  progress: number;
  onStart: () => void;
  assistantName: string;
  assistantInitial: string;
}

export function BootScreen({ bootState, steps, progress, onStart, assistantName }: BootScreenProps) {
  const isIdle = bootState === 'idle';
  const isBooting = bootState === 'booting';
  const isError = bootState === 'error';

  if (isBooting) {
    return (
      <div className={styles.bootScreen} aria-label="Loading Xena">
        <div className={styles.bootOnlySpinner} />
      </div>
    );
  }

  return (
    <div className={styles.bootScreen}>
      <div className={styles.bootContainer}>
        <div className={styles.bootLogo}>
          <XenaLogo size={88} withWordmark={false} className={styles.bootLogoMark} />
          <div className={styles.bootLogoGlow} />
        </div>

        <h1 className={styles.bootTitle}>{assistantName}</h1>
        <p className={styles.bootSubtitle}>
          {isIdle && 'AI Operations Cockpit'}
          {isError && 'Startup failed'}
        </p>

        {isIdle && (
          <button className={styles.bootStartBtn} onClick={onStart} type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,3 20,12 6,21" />
            </svg>
            <span>Start Agent</span>
          </button>
        )}

        {isError && (
          <>
            <div className={styles.bootProgressBar}>
              <div
                className={cn(styles.bootProgressFill, styles.bootProgressError)}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className={styles.bootSteps}>
              {steps.map((step, i) => (
                <div key={i} className={cn(
                  styles.bootStep,
                  step.status === 'running' && styles.bootStepRunning,
                  step.status === 'ok' && styles.bootStepOk,
                  step.status === 'fail' && styles.bootStepFail,
                )}>
                  <span className={styles.bootStepIcon}>
                    {step.status === 'pending' && '○'}
                    {step.status === 'running' && '●'}
                    {step.status === 'ok' && '✓'}
                    {step.status === 'fail' && '✗'}
                  </span>
                  <span className={styles.bootStepLabel}>{step.label}</span>
                  {step.detail && (
                    <span className={styles.bootStepDetail}>
                      {step.detail}
                      {step.ms ? ` (${step.ms}ms)` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button className={styles.bootRetryBtn} onClick={onStart} type="button">
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
