# STACK.md - Cloud-Native Operating Context

This file is the source of truth for the working architecture. Update it whenever infra, repos, environments, or deployment flow changes.

## Purpose
- Xena runs inside Roy's AWS Lightsail VPS.
- Primary mission: help build, operate, and improve a cloud-native environment.
- Prefer updating this file over relying on chat history.

## Environments

### Primary Host
- **Type:** AWS Lightsail VPS
- **Name:** Xena-RoyClaw
- **Blueprint:** OpenClaw (`openclaw_ls_1_0`)
- **State:** running
- **Region:** eu-central-1
- **Availability Zone:** eu-central-1a
- **Public IPv4:** 18.153.145.14
- **Private IPv4:** 172.26.14.215
- **Public IPv6:** 2a05:d014:152a:b500:6f66:f6ce:ccb3:2785
- **Static IP:** yes
- **Username:** ubuntu
- **SSH Key:** LightsailDefaultKeyPair
- **Specs:** 2 vCPU / 4.0 GB RAM / 80 GB disk
- **Monthly transfer allocation:** 4096 GB
- **Role:** Main OpenClaw host / automation node

### Host Networking
- **Inbound 80/tcp:** public
- **Inbound 443/tcp:** public
- **Inbound 22/tcp:** restricted to `185.40.61.205/32` plus Lightsail setup/connect aliases
- **Metadata service:** IMDSv2 required

## AWS
- **Account ID:** 883099622260
- **CLI Profile:** xena
- **Default Region:** eu-central-1
- **Known Permissions:** LightsailFullAccess, AmplifyFullAccess

### Known Resources
- Lightsail instance: `Xena-RoyClaw`
- Amplify apps: 6 discovered in `eu-central-1`
- Additional resources may exist outside current permissions or discovery scope; add them here when verified.

## GitHub
- **Primary Account:** RoyHolzem
- **Auth Method:** `GH_TOKEN` env var

### Priority Repositories
- **LiveCenter-Simple**
  - Repo: `RoyHolzem/LiveCenter-Simple`
  - URL: `https://github.com/RoyHolzem/LiveCenter-Simple`
  - Visibility: public
  - Purpose: LiveCenter Simple
- **RoyClaw**
  - Repo: `RoyHolzem/RoyClaw`
  - URL: `https://github.com/RoyHolzem/RoyClaw`
  - Visibility: private
  - Purpose: RoyClaw is a customized OpenClaw deployment for PaaS
- **openclaw-aws**
  - Repo: `RoyHolzem/openclaw-aws`
  - URL: `https://github.com/RoyHolzem/openclaw-aws`
  - Visibility: private
  - Purpose: Deploy OpenClaw to AWS ECS Fargate with Terraform and GitHub Actions
- **livecenter**
  - Repo: `RoyHolzem/livecenter`
  - URL: `https://github.com/RoyHolzem/livecenter`
  - Visibility: public
  - Purpose: LiveCenter - Real-time dashboard and monitoring platform
- **Portfolio**
  - Repo: `RoyHolzem/Portfolio`
  - URL: `https://github.com/RoyHolzem/Portfolio`
  - Visibility: private
  - Purpose: _(no description captured)_
- **cyberstrike**
  - Repo: `RoyHolzem/cyberstrike`
  - URL: `https://github.com/RoyHolzem/cyberstrike`
  - Visibility: private
  - Purpose: Anti CyberAttack Platform powered by AI
- **gpu-inference-hub**
  - Repo: `RoyHolzem/gpu-inference-hub`
  - URL: `https://github.com/RoyHolzem/gpu-inference-hub`
  - Visibility: public
  - Purpose: Live GPU inference comparison platform - Personal & Enterprise
- **lux-housing**
  - Repo: `RoyHolzem/lux-housing`
  - URL: `https://github.com/RoyHolzem/lux-housing`
  - Visibility: public
  - Purpose: _(no description captured)_

## Amplify
- **cyberstrike**
  - App ID: `d1kjx31vqqbsc0`
  - Repo: `https://github.com/RoyHolzem/cyberstrike`
  - Platform: `WEB_COMPUTE`
  - Production branch: `main`
  - Default domain: `d1kjx31vqqbsc0.amplifyapp.com`
  - Last known production status: `SUCCEED`
- **gpu-inference-hub**
  - App ID: `d2n4ylgu9f0pc8`
  - Repo: `https://github.com/RoyHolzem/gpu-inference-hub`
  - Platform: `WEB_COMPUTE`
  - Production branch: `master`
  - Default domain: `d2n4ylgu9f0pc8.amplifyapp.com`
  - Last known production status: `SUCCEED`
- **livecenter**
  - App ID: `dl5iyvnws81xx`
  - Repo: `https://github.com/RoyHolzem/livecenter`
  - Platform: `WEB_COMPUTE`
  - Production branch: `main`
  - Default domain: `dl5iyvnws81xx.amplifyapp.com`
  - Last known production status: `SUCCEED`
- **LiveCenter-Simple**
  - App ID: `ddgx4w3cc9nlb`
  - Repo: `https://github.com/royholzem/livecenter-simple`
  - Platform: `WEB_COMPUTE`
  - Production branch: `main`
  - Default domain: `ddgx4w3cc9nlb.amplifyapp.com`
  - Last known production status: `SUCCEED`
- **lux-housing**
  - App ID: `d1nrljgqtvvmwd`
  - Repo: `https://github.com/RoyHolzem/lux-housing`
  - Platform: `WEB`
  - Production branch: `main`
  - Default domain: `d1nrljgqtvvmwd.amplifyapp.com`
  - Last known production status: `SUCCEED`
- **Portfolio**
  - App ID: `dvxlisxwe97c9`
  - Repo: `https://github.com/RoyHolzem/Portfolio`
  - Platform: `WEB_COMPUTE`
  - Production branch: `main`
  - Default domain: `dvxlisxwe97c9.amplifyapp.com`
  - Last known production status: `SUCCEED`

## Domains / DNS
- Current verified public app domains are Amplify default domains.
- Add custom domains, registrars, DNS providers, certificates, and routing notes when confirmed.

## Deployment Flows

### LiveCenter-Simple
- Source repo: `RoyHolzem/LiveCenter-Simple`
- Deploy platform: AWS Amplify (`ddgx4w3cc9nlb`)
- Runtime: Next.js on Amplify Hosting (`WEB_COMPUTE`)
- Trigger method: production branch `main`
- Build config: `npm ci` -> `npm run build`, artifacts from `.next`
- App role: standalone chat UI for Xena talking to OpenClaw Gateway through a server-side proxy
- Gateway pattern: browser -> login gate -> Next.js API route -> OpenClaw Gateway HTTP API
- Auth gate: Cognito Hosted UI / OAuth authorization-code flow before main UI load; app holds only a secure signed session cookie after callback
- Security note: public secret env vars were identified as unsafe; cleanup/rotation is required in Amplify before considering the deployment clean
- IaC note: CloudFormation template now provisions Cognito User Pool + client alongside Amplify and the incident table so the repo is redeployable in a safer shape

### livecenter
- Source repo: `RoyHolzem/livecenter`
- Deploy platform: AWS Amplify (`dl5iyvnws81xx`)
- Runtime: Next.js / SSR-style Amplify app (`WEB_COMPUTE`)
- Trigger method: production branch `main`

### cyberstrike
- Source repo: `RoyHolzem/cyberstrike`
- Deploy platform: AWS Amplify (`d1kjx31vqqbsc0`)
- Runtime: Amplify `WEB_COMPUTE`
- Trigger method: production branch `main`

### gpu-inference-hub
- Source repo: `RoyHolzem/gpu-inference-hub`
- Deploy platform: AWS Amplify (`d2n4ylgu9f0pc8`)
- Runtime: Amplify `WEB_COMPUTE`
- Trigger method: production branch `master`

### lux-housing
- Source repo: `RoyHolzem/lux-housing`
- Deploy platform: AWS Amplify (`d1nrljgqtvvmwd`)
- Runtime: Amplify `WEB`
- Trigger method: production branch `main`

### Portfolio
- Source repo: `RoyHolzem/Portfolio`
- Deploy platform: AWS Amplify (`dvxlisxwe97c9`)
- Runtime: Amplify `WEB_COMPUTE`
- Trigger method: production branch `main`

## Local Workspace
- Current workspace appears to be the `LiveCenter-Simple` project.
- Top-level indicators found: `.git`, `package.json`, `amplify.yml`, `README.md`, `infra/terraform/README.md`
- Local infra notes indicate a cheap CloudTrail-based AWS activity feed design and Terraform for Xena operator/activity-reader roles.

## Secrets / Auth Notes
- Do not store raw secrets here.
- Store locations, methods, and safe usage rules only.
- `GH_TOKEN` is available via shell config but may need manual export in elevated exec sessions.
- Amplify app environment variables exist; some currently contain sensitive values and should be treated as secrets, not copied into docs or chat.

## Operating Rules
- Safe to inspect local state, AWS, GitHub, Amplify, and deployment context.
- Ask before destructive actions, public/external actions, or changes that may incur cost/downtime.
- When new infra or repos appear, update this file before closing the task.

## Change Log
- 2026-04-10: Created initial stack inventory template and anchored Xena's mission around Roy's Lightsail/cloud-native environment.
- 2026-04-10: Populated verified Lightsail, Amplify, GitHub, and local workspace context from live inspection.
- 2026-04-10: Refactored `LiveCenter-Simple` to server-side gateway relay + login gate and documented required secret rotation/Amplify env cleanup.
- 2026-04-10: Reworked `LiveCenter-Simple` to Cognito-first auth and updated CloudFormation for redeployable secure auth defaults.
- 2026-04-10: Upgraded `LiveCenter-Simple` to Cognito Hosted UI / OAuth authorization-code flow and removed the earlier temporary login-route approach.
