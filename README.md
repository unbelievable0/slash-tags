# Slash Tags

A Discord Slash Command Tag Bot built on Cloudflare Workers with KV storage.

## Features

- **Modern Cloudflare Workers ES Module architecture**
- **Discord API v10** compatibility and Ed25519 request signature verification via Web Crypto API
- **Discord slash commands management** (create, edit, delete, raw view)
- **Local development workflow** via Wrangler and Node.js test runner

---

## Prerequisites

- **Node.js**: v24+ (Active LTS)
- **npm**: v10+
- **Cloudflare Account & Wrangler**

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `wrangler.example.toml` to `wrangler.toml` and configure your credentials:

```bash
cp wrangler.example.toml wrangler.toml
```

Fill in the required variables and KV namespace:

- `APPLICATION_ID`: Your Discord application client ID
- `BOT_TOKEN`: Your Discord bot token (for syncing guild/global commands)
- `PUBLIC_KEY`: Your Discord application public key (for signature verification)
- `GUILD_TAGS`: KV namespace binding for storing tags per server

For local development secrets, you can also use a `.dev.vars` file:

```env
APPLICATION_ID=your_application_id
BOT_TOKEN=your_bot_token
PUBLIC_KEY=your_public_key
```

---

## Development & Scripts

| Command             | Description                                                           |
|---------------------|-----------------------------------------------------------------------|
| `npm run dev`       | Start local development server via Wrangler (`http://localhost:8787`) |
| `npm test`          | Run unit & integration test suite via Node.js native test runner      |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`)                           |
| `npm run deploy`    | Deploy the Worker to Cloudflare production                            |
| `npm run types`     | Generate Cloudflare Worker TypeScript definitions                     |

---

## Running with Docker

You can also run the local development server via Docker Compose:

```bash
docker compose up
```

---

## Project Structure

```
├── src/
│   ├── commands/        # Slash command definitions (create, edit, delete, raw, tag)
│   ├── constants/       # Discord API constants, emojis, colors, permissions, endpoints
│   ├── framework/       # Client, Command dispatcher, and CommandStore
│   ├── modules/         # TagManagement & tag parser
│   ├── rest/            # Discord REST API client and error handling (v10)
│   ├── router/          # HTTP request router and Ed25519 authorization
│   ├── structures/      # Discord structures (Interaction, User, Member, Permissions, etc.)
│   └── index.js         # Cloudflare Worker fetch handler
├── test/                # Test suite (Node test runner)
├── index.js             # Entrypoint wrapper
├── wrangler.toml        # Wrangler configuration
└── Dockerfile           # Modern container configuration
```
