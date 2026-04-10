import { NextResponse } from 'next/server';
import { createPkcePair, createOAuthStateCookie, createOAuthVerifierCookie, isCognitoConfigured } from '@/lib/auth';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET() {
  if (!isCognitoConfigured()) {
    return NextResponse.json({ ok: false, error: 'Cognito OAuth is not configured.' }, { status: 500 });
  }

  const state = crypto.randomUUID();
  const { verifier, challenge } = createPkcePair();
  const authorizeUrl = new URL(`${serverConfig.cognitoDomain}/oauth2/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', serverConfig.cognitoClientId);
  authorizeUrl.searchParams.set('redirect_uri', serverConfig.oauthRedirectUri);
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('code_challenge', challenge);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(createOAuthStateCookie(state));
  response.cookies.set(createOAuthVerifierCookie(verifier));
  return response;
}
