import { NextRequest } from 'next/server';
import { getServerConfig } from '@/lib/config';
import type { ChatMessage } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { messages?: ChatMessage[] };
  const inputMessages = Array.isArray(body.messages) ? body.messages : [];
  const serverConfig = getServerConfig();

  const upstreamMessages = [
    { role: 'system', content: serverConfig.systemPrompt },
    ...inputMessages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({ role: message.role, content: message.content }))
  ];

  const upstream = await fetch(`${serverConfig.gatewayUrl}${serverConfig.chatPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverConfig.gatewayToken}`
    },
    body: JSON.stringify({
      model: 'openclaw',
      stream: false,
      messages: upstreamMessages
    }),
    cache: 'no-store'
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return new Response(text || 'Gateway request failed', {
      status: upstream.status || 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  let content = '';
  try {
    const json = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    content = json.choices?.[0]?.message?.content || '';
  } catch {
    content = text;
  }

  return Response.json({
    ok: true,
    content
  });
}
