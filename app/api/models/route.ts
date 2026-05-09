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
  id: string;
  name: string;
  provider: string;
};

// Models actually available on the VPS gateway (from openclaw.json config)
const AVAILABLE_MODELS: ModelEntry[] = [
  { id: 'inceptionlabs/mercury-2', name: 'Mercury 2', provider: 'inceptionlabs' },
  { id: 'zai/glm-4.7-flash', name: 'GLM-4.7 Flash', provider: 'zai' },
  { id: 'zai/glm-4.7-turbo', name: 'GLM-4.7 Turbo', provider: 'zai' },
  { id: 'zai/glm-5', name: 'GLM-5', provider: 'zai' },
  { id: 'zai/glm-5-turbo', name: 'GLM-5 Turbo', provider: 'zai' },
  { id: 'zai/glm-5.1', name: 'GLM-5.1', provider: 'zai' },
];

/**
 * Returns available provider models.
 * The gateway /v1/models only returns agent IDs (openclaw/*), not provider models.
 * We return the configured available models list directly.
 */
export async function GET() {
  try {
    // Verify the gateway is reachable (health check)
    const token = await getGatewayToken();
    const res = await fetch(`${GATEWAY_URL}/v1/models`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn('[models] Gateway returned', res.status, '- using static list');
      return Response.json({ models: AVAILABLE_MODELS });
    }

    // Gateway is up — return the static model list
    // (gateway /v1/models returns openclaw agents, not provider models)
    return Response.json({ models: AVAILABLE_MODELS });
  } catch (err: any) {
    console.error('[models] Error:', err.message);
    return Response.json({ models: AVAILABLE_MODELS });
  }
}
