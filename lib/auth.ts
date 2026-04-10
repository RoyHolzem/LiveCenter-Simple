import { cookies } from 'next/headers';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { serverConfig } from '@/lib/config';

const SESSION_COOKIE = 'livecenter_session';
const OAUTH_STATE_COOKIE = 'livecenter_oauth_state';
const OAUTH_VERIFIER_COOKIE = 'livecenter_oauth_verifier';

type SessionPayload = {
  sub: string;
  email?: string;
  exp: number;
};

function base64UrlEncode(input: string | Buffer) {
  return typeof input === 'string' ? Buffer.from(input, 'utf8').toString('base64url') : input.toString('base64url');
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(value: string) {
  return createHmac('sha256', serverConfig.cognitoClientSecret || serverConfig.cognitoClientId || 'livecenter-session')
    .update(value)
    .digest('base64url');
}

function encodeSigned(payload: string) {
  return `${base64UrlEncode(payload)}.${sign(payload)}`;
}

function decodeSigned(value: string) {
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) return null;
  const payload = base64UrlDecode(encoded);
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  return payload;
}

export function isCognitoConfigured() {
  return Boolean(
    serverConfig.cognitoRegion &&
      serverConfig.cognitoUserPoolId &&
      serverConfig.cognitoClientId &&
      serverConfig.cognitoDomain &&
      serverConfig.oauthRedirectUri &&
      serverConfig.oauthLogoutUri
  );
}

export function getOAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge
  };
}

export function createOAuthStateCookie(state: string) {
  return {
    name: OAUTH_STATE_COOKIE,
    value: encodeSigned(state),
    ...getOAuthCookieOptions(60 * 10)
  };
}

export function createOAuthVerifierCookie(verifier: string) {
  return {
    name: OAUTH_VERIFIER_COOKIE,
    value: encodeSigned(verifier),
    ...getOAuthCookieOptions(60 * 10)
  };
}

export function readOAuthState() {
  const value = cookies().get(OAUTH_STATE_COOKIE)?.value;
  if (!value) return null;
  return decodeSigned(value);
}

export function readOAuthVerifier() {
  const value = cookies().get(OAUTH_VERIFIER_COOKIE)?.value;
  if (!value) return null;
  return decodeSigned(value);
}

export function clearOAuthCookies() {
  return [
    {
      name: OAUTH_STATE_COOKIE,
      value: '',
      ...getOAuthCookieOptions(0)
    },
    {
      name: OAUTH_VERIFIER_COOKIE,
      value: '',
      ...getOAuthCookieOptions(0)
    }
  ];
}

export function createSessionCookie(payload: SessionPayload) {
  return {
    name: SESSION_COOKIE,
    value: encodeSigned(JSON.stringify(payload)),
    ...getOAuthCookieOptions(Math.max(0, payload.exp - Math.floor(Date.now() / 1000)))
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    ...getOAuthCookieOptions(0)
  };
}

export function readSession() {
  const value = cookies().get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const payload = decodeSigned(value);
  if (!payload) return null;
  try {
    const session = JSON.parse(payload) as SessionPayload;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(readSession());
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}
