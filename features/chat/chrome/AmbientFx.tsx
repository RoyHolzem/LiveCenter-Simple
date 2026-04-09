import styles from '../chat-shell.module.css';

export function AmbientFx() {
  return (
    <>
      <div className={styles.noise} />
      <div className={styles.silverWash} />
      <div className={styles.grid} />
      <div className={styles.particleField} />
      <div className={styles.lightSweep} />
    </>
  );
}
