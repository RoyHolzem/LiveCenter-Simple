import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || '';
const SECRET_NAME = 'xena/gateway-token';
const REGION = 'eu-central-1';

const secretsClient = new SecretsManagerClient({ region: REGION });

let cachedToken = '';
let cachedAt = 0;
const CACHE_TTL = 300_000;

async function getGatewayToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - cachedAt < CACHE_TTL) return cachedToken;
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: SECRET_NAME })
  );
  const parsed = JSON.parse(response.SecretString || '{}');
  const token = parsed.token || '';
  cachedToken = token;
  cachedAt = now;
  return cachedToken;
}

export type ModelEntry = {
  id: string;         // full provider id: "zai/glm-4.7-flash"
  name: string;       // display name: "GLM-4.7 Flash"
  provider: string;   // provider name: "zai"
};

const FALLBACK_MODELS: ModelEntry[] = [
  { id: 'zai/glm-5', name: 'GLM-5', provider: 'zai' },
  { id: 'zai/glm-5-turbo', name: 'GLM-5 Turbo', provider: 'zai' },
  { id: 'zai/glm-5.1', name: 'GLM-5.1', provider: 'zai' },
  { id: 'zai/glm-4.7', name: 'GLM-4.7', provider: 'zai' },
  { id: 'zai/glm-4.7-flash', name: 'GLM-4.7 Flash', provider: 'zai' },
  { id: 'zai/glm-4.7-flashx', name: 'GLM-4.7 FlashX', provider: 'zai' },
  { id: 'zai/glm-4.6', name: 'GLM-4.6', provider: 'zai' },
  { id: 'zai/glm-4.6v', name: 'GLM-4.6V', provider: 'zai' },
  { id: 'zai/glm-4.5', name: 'GLM-4.5', provider: 'zai' },
  { id: 'zai/glm-4.5-air', name: 'GLM-4.5 Air', provider: 'zai' },
  { id: 'zai/glm-4.5-flash', name: 'GLM-4.5 Flash', provider: 'zai' },
  { id: 'zai/glm-4.5v', name: 'GLM-4.5V', provider: 'zai' },
  { id: 'inceptionlabs/mercury-2', name: 'Mercury 2', provider: 'inceptionlabs' },
];

/**
 * Returns the raw provider models from the OpenClaw Gateway.
 * Falls back to a hardcoded list on any failure.
 */
export async function GET() {
  try {
    const token = await getGatewayToken();

    const res = await fetch(`${GATEWAY_URL}/v1/models`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn('[models] Gateway /v1/models returned', res.status, '- using fallback');
      return Response.json({ models: FALLBACK_MODELS });
    }

    // Guard: ensure the response is actually JSON
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn('[models] Gateway returned non-JSON content-type:', contentType, '- using fallback');
      return Response.json({ models: FALLBACK_MODELS });
    }

    const data = await res.json();

    // If the gateway returns models in a known shape, pass through;
    // otherwise use fallback.
    if (data?.models && Array.isArray(data.models)) {
      return Response.json(data);
    }

    // Gateway returned valid JSON but unexpected shape — use fallback
    return Response.json({ models: FALLBACK_MODELS });
  } catch (err: any) {
    console.error('[models] Error fetching models:', err.message);
    // Never 500 — always return the fallback so the UI keeps working
    return Response.json({ models: FALLBACK_MODELS });
  }
}
