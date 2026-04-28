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

/**
 * Returns the raw provider models from the OpenClaw Gateway config.
 * These can be used as model_override values in chat completions requests.
 */
export async function GET() {
  try {
    const token = await getGatewayToken();
    // Call the gateway's config/models endpoint — returns the raw config
    const res = await fetch(`${GATEWAY_URL}/v1/config/models`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Fallback: return a hardcoded list if the endpoint doesn't exist
      return Response.json({
        models: [
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
        ],
      });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
