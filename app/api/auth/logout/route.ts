import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const fallback = new URL('/', request.url);
  const response = NextResponse.redirect(fallback);
  response.cookies.set(clearSessionCookie());

  if (!serverConfig.cognitoDomain || !serverConfig.cognitoClientId || !serverConfig.oauthLogoutUri) {
    return response;
  }

  const logoutUrl = new URL(`${serverConfig.cognitoDomain}/logout`);
  logoutUrl.searchParams.set('client_id', serverConfig.cognitoClientId);
  logoutUrl.searchParams.set('logout_uri', serverConfig.oauthLogoutUri);
  return NextResponse.redirect(logoutUrl, { headers: response.headers });
}
