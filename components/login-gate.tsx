import styles from './login-gate.module.css';

type Props = {
  appName: string;
};

export function LoginGate({ appName }: Props) {
  return (
    <main className={styles.screen}>
      <div className={styles.panel}>
        <div className={styles.kicker}>Restricted access</div>
        <h1 className={styles.title}>{appName}</h1>
        <p className={styles.copy}>
          Sign in with Cognito before any live content loads. Authentication happens through the hosted OAuth flow and the app keeps only a secure server session.
        </p>
        <a className={styles.button} href="/api/auth/login">
          Sign in with Cognito
        </a>
      </div>
    </main>
  );
}
