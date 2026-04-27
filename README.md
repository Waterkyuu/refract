
# Refract - 24/7 Agent Helper
<p align="center">
<a href="./README.md">English</a> | <a href="./README-ZH.md">中文</a>
</p>

<p align="center">
  <img src="public/logo.svg" alt="Fire Wave Agent Logo" width="120" />
</p>

<p align="center">
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
<!-- <a href="https://twitter.com/Refract.ai"><img src="https://img.shields.io/twitter/follow/Refract.ai?style=social" alt="Twitter Follow"></a> -->
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/Waterkyuu/refract&env=ZHIPU_API_KEY,E2B_API_KEY,PUBLIC_NEON_AUTH_URL,NEON_DATA_PUBLIC_API_URL,CLOUDFLARE_ACCOUNT_ID,R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY&envDescription=API%20keys%20and%20service%20credentials%20required%20by%20Fire%20Wave%20Agent&project-name=refract&repository-name=refract"><img src="https://vercel.com/button" alt="Deploy on Vercel" height="32" /></a>
  <a href="https://railway.com/new/template?templateUrl=https://github.com/Waterkyuu/refract"><img src="https://railway.app/button.svg" alt="Deploy on Railway" height="32" /></a>
  <a href="https://zeabur.com/templates/new?repoUrl=https://github.com/Waterkyuu/refract"><img src="https://zeabur.com/button.svg" alt="Deploy on Zeabur" height="32" /></a>
</p>

Multi-agent orchestration supports data analysis and resume generation, with other features under development. The goal is to create intelligent agents that work 24/7.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
git clone https://github.com/Waterkyuu/refract.git
cd refract
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Zhipu AI (Required)
ZHIPU_API_KEY=your_zhipu_api_key

# E2B Sandbox (Required)
E2B_API_KEY=your_e2b_api_key

# Model (Optional, defaults to glm-4-flash)
GLM_MODLE=glm-4-flash

# Neon Auth (Required for authentication)
NEON_AUTH_BASE_URL=your_neon_auth_url
NEON_AUTH_COOKIE_SECRET=your_cookie_secret

# Cloudflare R2 (Required for file upload)
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

NPM_REGISTRY = "https://registry.npmmirror.com"
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
pnpm build
pnpm start
```

### Docker

Build and run with Docker Compose:

```bash
docker compose up -d --build
```

If you keep environment variables in a local file, you can pass them in when starting Compose:

```bash
docker compose --env-file .env.local up -d --build
```

Or build and run the image directly:

```bash
docker build -t refract .
docker run -d -p 3000:3000 --env-file .env.local --name refract refract
```

### Authentication on Vercel

If authentication works locally but fails on your deployed Vercel domain with an error like `{"code":"INVALID_ORIGIN","message":"Invalid origin"}`, your Neon Auth project is rejecting the site origin.

Add every deployed app origin to your Neon Auth / Better Auth trusted origins configuration, for example:

```txt
http://localhost:3000
https://fire-wave-agent.vercel.app
```

You should also make sure the same production domain is allowed in any OAuth provider callback or redirect settings you use.

## Scripts

| Command | Description |
|---------|------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm check:write` | Lint & format code |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |

## Architecture

![Refract agent orchestration architecture](screenshots/agent-orchestration-architecture.png)

## License

MIT
