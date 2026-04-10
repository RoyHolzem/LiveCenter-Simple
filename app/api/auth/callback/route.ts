import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { clearOAuthCookies, createSessionCookie, readOAuthState, readOAuthVerifier } from '@/lib/auth';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Invalid token');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    sub?: string;
    email?: string;
    exp?: number;
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  const storedState = readOAuthState();
  const storedVerifier = readOAuthVerifier();
  if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=oauth_state_mismatch', request.url));
  }

  const tokenUrl = `${serverConfig.cognitoDomain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: serverConfig.cognitoClientId,
    code,
    redirect_uri: serverConfig.oauthRedirectUri,
    code_verifier: storedVerifier
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  if (serverConfig.cognitoClientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${serverConfig.cognitoClientId}:${serverConfig.cognitoClientSecret}`).toString('base64')}`;
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: body.toString(),
    cache: 'no-store'
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(text || 'oauth_exchange_failed')}`, request.url));
  }

  const tokens = (await tokenResponse.json()) as { id_token?: string };
  if (!tokens.id_token) {
    return NextResponse.redirect(new URL('/?error=missing_id_token', request.url));
  }

  const payload = decodeJwtPayload(tokens.id_token);
  if (!payload.sub || !payload.exp) {
    return NextResponse.redirect(new URL('/?error=invalid_id_token', request.url));
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  for (const cookie of clearOAuthCookies()) {
    response.cookies.set(cookie);
  }
  response.cookies.set(
    createSessionCookie({
      sub: payload.sub,
      email: payload.email,
      exp: payload.exp
    })
  );
  return response;
}
