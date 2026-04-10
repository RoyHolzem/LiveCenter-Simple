import { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isAuthenticated()) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!serverConfig.gatewayUrl || !serverConfig.gatewayToken) {
    return Response.json({ ok: false, error: 'Gateway server configuration is incomplete.' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ ok: false, error: 'Invalid request payload.' }, { status: 400 });
  }

  const upstream = await fetch(`${serverConfig.gatewayUrl}${serverConfig.chatPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverConfig.gatewayToken}`
    },
    body: JSON.stringify({
      ...body,
      model: body.model || serverConfig.model,
      stream: body.stream ?? true
    }),
    cache: 'no-store'
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return Response.json(
      { ok: false, error: text || 'Failed to connect to gateway.' },
      { status: upstream.status || 502 }
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
