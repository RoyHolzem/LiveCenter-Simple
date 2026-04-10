import { ChatShell } from '@/components/chat-shell';
import { LoginGate } from '@/components/login-gate';
import { isAuthenticated } from '@/lib/auth';
import { publicConfig } from '@/lib/config';

export default function HomePage() {
  if (!isAuthenticated()) {
    return <LoginGate appName={publicConfig.appName} />;
  }

  return <ChatShell appName={publicConfig.appName} assistantName={publicConfig.assistantName} />;
}
