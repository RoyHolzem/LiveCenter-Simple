# CUTOVER-RUNBOOK.md — LiveCenter-Simple Cognito OAuth Migration

## Goal
Move `LiveCenter-Simple` from the insecure direct-browser secret model to a redeployable, Cognito OAuth-protected, server-side relay architecture.

## Current risks being removed
- Public browser-visible gateway bearer token
- Public browser-visible AWS access keypair for CloudTrail reads
- No user authentication before loading sensitive UI
- Existing live Amplify app not managed by CloudFormation

## Recommended strategy
Create a **new CloudFormation-managed stack** for a fresh Amplify app + Cognito setup, validate it, then cut over traffic.

This is safer than mutating the existing live app in place.

---

## Phase 0 — Secret rotation (do first)

Rotate these immediately:
- old OpenClaw gateway bearer token
- exposed AWS access key
- exposed AWS secret access key

After rotation, remove these old Amplify env vars from the existing app:
- `NEXT_PUBLIC_GATEWAY_AUTH_TOKEN`
- `NEXT_PUBLIC_CT_AWS_ACCESS_KEY_ID`
- `NEXT_PUBLIC_CT_AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_GATEWAY_URL`
- `NEXT_PUBLIC_GATEWAY_CHAT_PATH`

---

## Phase 1 — Repo and branch prep

### Suggested branch flow
- keep feature work on `experimental-work`
- open a PR into `main` when ready
- point the new test Amplify app at either:
  - `experimental-work` for staging, or
  - `main` after merge

### Current secure env model

#### Public-safe vars
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_ASSISTANT_NAME`

#### Server-only vars
- `OPENCLAW_GATEWAY_URL`
- `OPENCLAW_GATEWAY_AUTH_TOKEN`
- `OPENCLAW_GATEWAY_CHAT_PATH`
- `OPENCLAW_MODEL`
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`
- `COGNITO_DOMAIN`
- `OAUTH_REDIRECT_URI`
- `OAUTH_LOGOUT_URI`
- `ACTIVITY_AWS_REGION`
- `ACTIVITY_LOOKBACK_HOURS`
- `ACTIVITY_CLOUDTRAIL_USERNAME_CONTAINS`
- `ACTIVITY_ALLOWED_EVENT_SOURCES`

---

## Phase 2 — Create new CloudFormation-managed deployment

### Inputs you need
- GitHub repo URL
- GitHub access token for Amplify
- public OpenClaw gateway URL
- new gateway auth token
- app base URL you want to use
- globally unique Cognito domain prefix
- initial Cognito admin email
- initial Cognito temporary password

### Stack deploy shape
Use:
- `infra/amplify-app.template.yaml`

### Expected outputs
- new Amplify app ID
- new Amplify default domain
- Cognito user pool ID
- Cognito app client ID
- Cognito hosted domain URL

---

## Phase 3 — Validate the new deployment

### Auth checks
- unauthenticated visit lands on login screen
- sign-in redirects to Cognito Hosted UI
- callback returns to `/api/auth/callback`
- successful callback creates app session and lands on `/`
- sign-out clears session and hits Cognito logout

### App security checks
- no gateway token in browser JS/env
- no AWS access key or secret in browser JS/env
- `/api/chat` returns 401 without auth
- `/api/activity` returns 401 without auth
- chat works after auth
- activity panel works after auth

### Operational checks
- `npm run build` passes locally
- Amplify build succeeds remotely
- main branch auto-build works if enabled

---

## Phase 4 — Cutover

Choose one:

### Option A — keep Amplify default domain initially
- test on the new `*.amplifyapp.com` domain first
- once verified, move custom domain later

### Option B — move custom domain to new app
- update DNS / domain attachment in Amplify
- ensure Cognito callback/logout URLs match final domain exactly
- retest full OAuth flow after DNS change

---

## Phase 5 — Decommission old insecure setup

After successful cutover:
- disable or delete the old insecure Amplify app
- confirm old public env vars are gone
- confirm old gateway token no longer works
- confirm old AWS keypair is deleted/inactive

---

## Exact env template for the new app

```env
NEXT_PUBLIC_APP_NAME=LiveCenter Simple
NEXT_PUBLIC_ASSISTANT_NAME=Xena
OPENCLAW_GATEWAY_URL=https://your-gateway.example.com
OPENCLAW_GATEWAY_AUTH_TOKEN=replace-with-new-rotated-token
OPENCLAW_GATEWAY_CHAT_PATH=/v1/chat/completions
OPENCLAW_MODEL=openclaw
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=replace-me
COGNITO_CLIENT_ID=replace-me
COGNITO_CLIENT_SECRET=replace-me
COGNITO_DOMAIN=https://your-prefix.auth.eu-central-1.amazoncognito.com
OAUTH_REDIRECT_URI=https://your-app-domain/api/auth/callback
OAUTH_LOGOUT_URI=https://your-app-domain/
ACTIVITY_AWS_REGION=eu-central-1
ACTIVITY_LOOKBACK_HOURS=24
ACTIVITY_CLOUDTRAIL_USERNAME_CONTAINS=xena-
ACTIVITY_ALLOWED_EVENT_SOURCES=cloudformation.amazonaws.com,dynamodb.amazonaws.com,iam.amazonaws.com,lambda.amazonaws.com,amplify.amazonaws.com,apigateway.amazonaws.com
```

## Exact vars that must NOT exist anymore

```env
NEXT_PUBLIC_GATEWAY_AUTH_TOKEN
NEXT_PUBLIC_CT_AWS_ACCESS_KEY_ID
NEXT_PUBLIC_CT_AWS_SECRET_ACCESS_KEY
NEXT_PUBLIC_GATEWAY_URL
NEXT_PUBLIC_GATEWAY_CHAT_PATH
```

---

## IAM note
Current `xena` IAM permissions do not allow `cloudformation:ValidateTemplate`, so full CloudFormation validation/deploy from this session may require broader rights or a different principal.
