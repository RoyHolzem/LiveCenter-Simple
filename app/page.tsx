'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@/features/auth/AuthWrapper'; // ensures Amplify.configure runs
import { ChatShell } from '@/features/chat/ChatShell';
import { LandingPage } from '@/features/landing/LandingPage';

export default function HomePage() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;
    fetchAuthSession()
      .then(({ tokens }) => {
        if (mounted) setAuthState(tokens ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (mounted) setAuthState('unauthenticated');
      });
    return () => { mounted = false; };
  }, []);

  if (authState === 'loading') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#04060c',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #00ffc8, #0088ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#0a0e17',
          animation: 'pulse 2s ease-in-out infinite',
        }}>X</div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <LandingPage onAuthenticated={() => setAuthState('authenticated')} />
    );
  }

  return <ChatShell />;
}
