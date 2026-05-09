/**
 * Web Request plugin for OpenClaw gateway.
 *
 * Registers two tools — `web_post` and `web_put` — that allow agents to make
 * HTTP POST and PUT requests to a configured set of allowlisted base URLs.
 *
 * Security rules:
 *  - Only http/https URLs pointing to allowlisted base URLs are accepted.
 *  - API keys are read from environment variables; model input never supplies them.
 *  - Content-Type is always set to application/json; the body is auto-stringified.
 *  - Arbitrary Authorization headers from model input are stripped.
 *  - Secrets are never echoed back in the response.
 *
 * Configuration (in openclaw.json → plugins.entries["web-request"]):
 *   {
 *     "enabled": true,
 *     "config": {
 *       "allowUrls": "https://tsbmgsi20f.execute-api.eu-central-1.amazonaws.com",
 *       "authEnvVar": "WEB_REQUEST_API_KEY"   // optional
 *     }
 *   }
 *
 * allowUrls: comma-separated list of base URL prefixes that are permitted.
 * authEnvVar: name of an environment variable containing a Bearer token.
 *             If omitted or the env var is empty, requests are sent without auth.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const HTTP_URL_RE = /^https?:\/\//i

/**
 * Read the allowlisted base URLs from plugin config (primary) or env (fallback).
 */
function resolveAllowList (pluginConfig) {
  const raw = pluginConfig?.allowUrls || process.env.WEB_REQUEST_ALLOW_URLS || ''
  return raw
    .split(',')
    .map(u => u.trim())
    .filter(Boolean)
}

/**
 * Check that a target URL starts with at least one allowlisted prefix.
 */
function isUrlAllowed (url, allowList) {
  if (!HTTP_URL_RE.test(url)) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    // Reject URLs with userinfo (e.g. https://user:pass@host)
    if (parsed.username || parsed.password) return false
  } catch {
    return false
  }
  return allowList.some(prefix => url.startsWith(prefix))
}

/**
 * Read an auth token from the environment and return a Bearer header value,
 * or null if no env var is configured / value is empty.
 */
function resolveAuthHeader (pluginConfig) {
  const envName = pluginConfig?.authEnvVar || process.env.WEB_REQUEST_AUTH_ENV
  if (!envName) return null
  const value = (process.env[envName] || '').trim()
  if (!value) return null
  return `Bearer ${value}`
}

/**
 * Collect all secret strings for redaction.
 */
function collectSecrets (pluginConfig) {
  const secrets = []
  const envName = pluginConfig?.authEnvVar || process.env.WEB_REQUEST_AUTH_ENV
  if (envName && process.env[envName]) {
    secrets.push(process.env[envName])
  }
  const authHeader = resolveAuthHeader(pluginConfig)
  if (authHeader) secrets.push(authHeader)
  return secrets
}

/**
 * Strip secrets from a response body for safe return to the model.
 */
function redactSecrets (text, secrets) {
  let result = text
  for (const secret of secrets) {
    if (!secret || secret.length < 4) continue
    // Replace all occurrences of the secret value
    while (result.includes(secret)) {
      result = result.replace(secret, '[REDACTED]')
    }
  }
  return result
}

/**
 * Truncate text to maxChars, appending a marker if truncated.
 */
function truncateText (text, maxChars = 50000) {
  if (!text) return { text: '', truncated: false }
  if (text.length <= maxChars) return { text, truncated: false }
  return {
    text: text.slice(0, maxChars) + '\n...[truncated]',
    truncated: true
  }
}

// ── Shared schema & execution ────────────────────────────────────────────────

function buildToolSchema (method) {
  return {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: `The full URL to send the ${method} request to. Must start with one of the configured allowlisted base URLs.`
      },
      body: {
        description: `JSON-serializable value to send as the request body. Pass an object or string — it will be auto-stringified as JSON.`,
        type: 'string'
      },
      maxChars: {
        type: 'number',
        description: 'Maximum characters of the response body to return (default 50 000).',
        minimum: 100
      }
    },
    required: ['url']
  }
}

function makeExecute (method, pluginConfig) {
  return async function execute (_toolCallId, params) {
    const allowList = resolveAllowList(pluginConfig)
    if (allowList.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'No allowlisted URLs configured. Set allowUrls in plugin config or WEB_REQUEST_ALLOW_URLS env var.' }) }]
      }
    }

    const url = (params.url || '').trim()
    if (!url) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'url is required.' }) }]
      }
    }

    if (!isUrlAllowed(url, allowList)) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: `URL not in allowlist. Allowed prefixes: ${allowList.join(', ')}` }) }]
      }
    }

    // Build headers — always JSON, auth from env only
    const headers = { 'Content-Type': 'application/json' }
    const authHeader = resolveAuthHeader(pluginConfig)
    if (authHeader) headers['Authorization'] = authHeader

    // Collect secrets for redaction
    const secrets = collectSecrets(pluginConfig)

    // Build body — auto-stringify
    let bodyPayload = undefined
    if (params.body !== undefined && params.body !== null) {
      if (typeof params.body === 'string') {
        // Validate it's already valid JSON; if not, wrap it
        try {
          JSON.parse(params.body)
          bodyPayload = params.body
        } catch {
          bodyPayload = JSON.stringify({ value: params.body })
        }
      } else {
        bodyPayload = JSON.stringify(params.body)
      }
    }

    const maxChars = params.maxChars || 50000
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyPayload,
        redirect: 'follow'
      })

      const status = response.status
      const finalUrl = response.url
      const contentType = response.headers.get('content-type') || ''

      const rawText = await response.text()
      const { text, truncated } = truncateText(redactSecrets(rawText, secrets), maxChars)
      const elapsedMs = Date.now() - startTime

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ok: status >= 200 && status < 300,
            status,
            finalUrl,
            contentType,
            body: text,
            truncated,
            elapsedMs
          })
        }]
      }
    } catch (err) {
      const elapsedMs = Date.now() - startTime
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ok: false,
            error: redactSecrets(err.message || String(err), secrets),
            elapsedMs
          })
        }]
      }
    }
  }
}

// ── Plugin export ────────────────────────────────────────────────────────────

const plugin = {
  id: 'web-request',
  name: 'Web Request (POST/PUT)',
  description: 'Provides web_post and web_put tools for making POST and PUT requests to allowlisted URLs.',
  configSchema: {
    safeParse (value) {
      if (value === undefined) return { success: true, data: undefined }
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { success: false, error: 'expected config object' }
      }
      return { success: true, data: value }
    },
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        allowUrls: {
          type: 'string',
          description: 'Comma-separated list of allowed base URL prefixes'
        },
        authEnvVar: {
          type: 'string',
          description: 'Name of env var containing the Bearer token (optional)'
        }
      }
    }
  },
  register (api) {
    const pluginConfig = api.pluginConfig || {}


    // ── web_post ───────────────────────────────────────────────────────────
    api.registerTool({
      name: 'web_post',
      label: 'Web POST',
      description:
        'Send an HTTP POST request with a JSON body to an allowlisted URL. ' +
        'The URL must start with a configured base URL prefix. ' +
        'Content-Type is automatically set to application/json. ' +
        'The body is auto-stringified if needed.',
      parameters: buildToolSchema('POST'),
      execute: makeExecute('POST', pluginConfig)
    })

    // ── web_put ────────────────────────────────────────────────────────────
    api.registerTool({
      name: 'web_put',
      label: 'Web PUT',
      description:
        'Send an HTTP PUT request with a JSON body to an allowlisted URL. ' +
        'The URL must start with a configured base URL prefix. ' +
        'Content-Type is automatically set to application/json. ' +
        'The body is auto-stringified if needed.',
      parameters: buildToolSchema('PUT'),
      execute: makeExecute('PUT', pluginConfig)
    })
  }
}

export default plugin
