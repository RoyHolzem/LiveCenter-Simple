import type { CSSProperties } from 'react';
import styles from '../chat-shell.module.css';
import { cn } from '../chat-utils';
import type { AvatarState } from '../chat-types';

type AvatarStageProps = {
  appName: string;
  assistantName: string;
  avatarState: AvatarState;
  statusText: string;
  pointerStyle: CSSProperties;
};

export function AvatarStage({
  appName,
  assistantName,
  avatarState,
  statusText,
  pointerStyle
}: AvatarStageProps) {
  return (
    <section
      className={styles.avatarLayer}
      aria-label={`${assistantName} avatar backdrop`}
      data-app={appName}
      data-status={statusText}
    >
      <div className={styles.avatarMist} />
      <div className={styles.avatarSpotlight} />
      <div className={styles.avatarRain} />

      <div className={styles.avatarStage} style={pointerStyle}>
        <div className={styles.avatarGlow} />
        <div className={styles.avatarAuraRing} />

        <div className={cn(styles.avatarFrame, styles[avatarState])}>
          <div className={styles.headCables}>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.avatarHead}>
            <div className={styles.crownLight} />
            <div className={styles.headShell} />
            <div className={styles.facePlate}>
              <div className={styles.visor}>
                <span className={styles.visorGlow} />
                <span className={styles.visorScan} />
              </div>
              <div className={styles.templeLeft} />
              <div className={styles.templeRight} />
              <div className={styles.cheekLines}>
                <span />
                <span />
              </div>
              <div className={styles.mouthPanel}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div className={styles.neck}>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.avatarTorso}>
            <div className={styles.shoulderLeft} />
            <div className={styles.shoulderRight} />
            <div className={styles.chestShell}>
              <div className={styles.collarArc} />
              <div className={styles.coreColumn}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.corePulse} />
              <div className={styles.circuitGrid}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles.waistHalo} />
            <div className={styles.waistPanels}>
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className={styles.energyVeil} />
          <div className={styles.avatarReflection} />
        </div>
      </div>
    </section>
  );
}
