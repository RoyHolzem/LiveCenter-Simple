# LiveCenter Simple

A production-ready **standalone chat UI** for **Xena** that talks to an **OpenClaw Gateway** through a **server-side Next.js relay** and is protected by **Amazon Cognito Hosted UI / OAuth** before any live content loads.

This is **not** the OpenClaw dashboard — it is a custom Next.js frontend with a matrix-blue dark theme, streaming replies, a real-time presence indicator, and an AWS activity panel.

## Security model

- Browser users do **not** receive the OpenClaw gateway bearer token
- Browser users do **not** receive AWS access keys for activity lookups
- Authentication happens **before** the main UI is shown
- Cognito Hosted UI handles user sign-in
- The app uses the **OAuth authorization code flow** with a server-side callback
- The app stores only a **secure HTTP-only session cookie** after successful sign-in
- Chat requests flow through the app server, which injects the gateway auth token server-side
- CloudTrail activity is read server-side only

This follows AWS best practice direction for separating public clients from secrets, delegating identity to Cognito, and keeping operational credentials server-side.

## Features

- **Pure IaC deployment** for Amplify Hosting via CloudFormation
- **Amazon Cognito Hosted UI / OAuth** provisioned by IaC
- **Custom standalone chat UI** built with Next.js App Router
- **Server-side gateway proxy** so the OpenClaw auth token never reaches the browser
- **SSE streaming** from `POST /v1/chat/completions`
- **Real AWS activity panel** backed by CloudTrail lookup
- **DynamoDB incident-management table** aligned to ITIL-style incident operations

## Architecture

```text
Browser
  -> Cognito Hosted UI (OAuth authorization code flow)
  -> /api/auth/callback on Next.js server
  -> secure HTTP-only app session cookie
  -> main UI
  -> /api/chat route (server-side proxy)
  -> OpenClaw Gateway HTTP API

Browser
  -> /api/activity
  -> CloudTrail lookup via server-side AWS SDK
```

## Required environment variables

These should be configured in **AWS Amplify Hosting**. Keep secrets server-side only.

| Variable | Required | Description |
|---|---:|---|
| `OPENCLAW_GATEWAY_URL` | yes | Public HTTPS base URL for your OpenClaw Gateway |
| `OPENCLAW_GATEWAY_AUTH_TOKEN` | yes | Gateway bearer token |
| `OPENCLAW_GATEWAY_CHAT_PATH` | no | Defaults to `/v1/chat/completions` |
| `OPENCLAW_MODEL` | no | Defaults to `openclaw` |
| `COGNITO_REGION` | yes | AWS region for Cognito |
| `COGNITO_USER_POOL_ID` | yes | Cognito user pool ID |
| `COGNITO_CLIENT_ID` | yes | Cognito app client ID |
| `COGNITO_CLIENT_SECRET` | no | Cognito app client secret when using a confidential client |
| `COGNITO_DOMAIN` | yes | Full Cognito Hosted UI domain, e.g. `https://name.auth.eu-central-1.amazoncognito.com` |
| `OAUTH_REDIRECT_URI` | yes | Callback URI, e.g. `https://app.example.com/api/auth/callback` |
| `OAUTH_LOGOUT_URI` | yes | Post-logout redirect URI |
| `NEXT_PUBLIC_APP_NAME` | no | UI title |
| `NEXT_PUBLIC_ASSISTANT_NAME` | no | Display name in the chat UI |

> Do **not** use `NEXT_PUBLIC_*` for secrets. If a value should not be visible to anyone opening devtools, it must stay server-side.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

For local development, point Cognito callback/logout URLs at your local origin if you want the full hosted OAuth flow to work locally.

## One-click deploy with CloudFormation

Use [`infra/amplify-app.template.yaml`](./infra/amplify-app.template.yaml) to provision:

- an Amplify app
- a production branch
- Amazon Cognito user pool + hosted OAuth client
- the required app environment variables
- a DynamoDB incident-management table aligned to ITIL-style incident operations

### Deploy from the AWS Console

1. Open CloudFormation
2. Create stack with `infra/amplify-app.template.yaml`
3. Fill in the parameters:
   - GitHub repository URL
   - Amplify access token
   - OpenClaw gateway public URL
   - OpenClaw gateway auth token
   - app base URL
   - Cognito domain prefix
   - initial Cognito admin email/temporary password
   - incident table settings if needed
4. Deploy
5. Sign in through Cognito Hosted UI before accessing the main UI

## OpenClaw gateway requirements

This app expects the gateway HTTP API to expose:

- `POST /v1/chat/completions`

OpenClaw docs: `docs/gateway/openai-http-api.md`

## Public gateway note

If your gateway is currently bound to loopback (`127.0.0.1`) you must expose it safely before Amplify can reach it. Recommended approaches:

- reverse proxy with HTTPS (Nginx / Caddy)
- trusted proxy mode if you want identity-aware access control
- firewall allowlist if exposing directly by IP

Do **not** expose the raw gateway to the public internet without understanding the auth/security model. The bearer token is effectively operator access.

## Cheap AWS activity log via CloudTrail

This repo includes:

- `app/api/activity/route.ts`
  - server-side CloudTrail lookup endpoint
- `infra/terraform/`
  - Terraform for dedicated Xena operator and activity-reader roles
- an activity panel in the UI sidebar

## Terraform

See [`infra/terraform/README.md`](./infra/terraform/README.md).

This Terraform intentionally keeps the activity system cheap and simple.

## Immediate post-hardening cleanup

If you previously deployed an older direct-browser version:

1. rotate the exposed gateway token
2. rotate any exposed AWS access keypair
3. remove obsolete Amplify vars such as:
   - `NEXT_PUBLIC_GATEWAY_AUTH_TOKEN`
   - `NEXT_PUBLIC_CT_AWS_ACCESS_KEY_ID`
   - `NEXT_PUBLIC_CT_AWS_SECRET_ACCESS_KEY`
4. redeploy with the new server-side env model and Cognito OAuth settings

## License

MIT
