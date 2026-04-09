# SentinelAI

Real-time security monitoring for AI agents operating on Solana.

SentinelAI watches agent-controlled wallets for suspicious on-chain activity, scores risk using a Claude-powered analysis engine, and fires instant Telegram alerts when threats are detected.

## Architecture

```
Solana RPC (WebSocket)
    |
    v
[Listener] --> [Risk Engine] --> [Alerts]
    |              |                |
    |         Claude AI         Telegram
    |              |
    v              v
         [Supabase DB]
              |
    +---------+---------+
    |                   |
[REST API]        [Dashboard]
 (x402 gated)     (React)
```

**Monorepo packages:**

| Package | Description |
|---------|-------------|
| `@sentinel-ai/listener` | Solana WebSocket subscriber — monitors agent wallets in real-time |
| `@sentinel-ai/risk-engine` | 7 risk rules + Claude AI contextual analysis |
| `@sentinel-ai/alerts` | Telegram bot with alert delivery and wallet registration |
| `@sentinel-ai/api` | Express REST API with x402 micropayment gating |
| `@sentinel-ai/dashboard` | React dashboard with live risk gauges and alert management |
| `@sentinel-ai/shared` | Types, constants, Solana program IDs, Supabase client |

## Risk Rules

1. **Transfer Amount** — flags large transfers relative to wallet balance
2. **Unknown Recipient** — detects transfers to addresses not seen before
3. **Rapid Drain** — detects 3+ outbound transfers within 60 seconds
4. **Balance Threshold** — alerts when balance drops below configured minimum
5. **Durable Nonce** — detects suspicious durable nonce transaction patterns
6. **Time Anomaly** — flags transactions at unusual times for the agent
7. **Allowlist Violation** — catches interactions with non-whitelisted programs

When the combined rule score exceeds 40, Claude AI provides contextual analysis with a risk adjustment of -20 to +20 points.

## x402 Payment Gating

Premium API endpoints are monetized via the x402 protocol — pay-per-query in SOL with no API keys or subscriptions:

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/risk/:wallet` | $0.001 | AI-powered risk score for a wallet |
| `GET /api/alerts` | $0.0005 | Security alerts for monitored agents |

Free endpoints: `/health`, `/api/agents` (CRUD), `/api/alerts/:id/acknowledge`

## Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env

# Run database migration
# (apply supabase/migrations/001_sentinel_schema.sql to your Supabase project)

# Build all packages
npm run build

# Start the API server (includes listener + Telegram bot)
npm run dev
```

### Required Environment Variables

```
SUPABASE_URL=            # Your Supabase project URL
SUPABASE_ANON_KEY=       # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY= # Supabase service role key
SOLANA_RPC_URL=          # Solana RPC endpoint
SOLANA_WS_URL=           # Solana WebSocket endpoint
ANTHROPIC_API_KEY=       # Claude API key for risk analysis
TELEGRAM_BOT_TOKEN=      # Telegram bot token for alerts
X402_TREASURY_WALLET=    # Solana wallet for x402 payments
```

## Tech Stack

- **Solana Web3.js** — real-time transaction monitoring via WebSocket
- **Claude AI** (Anthropic API) — contextual risk analysis
- **Supabase** — PostgreSQL + Realtime subscriptions
- **x402 Protocol** — Solana micropayment API gating
- **Express.js v5** — REST API
- **React + Vite + Tailwind CSS** — dashboard
- **Telegram Bot API** (grammy) — instant alerts
- **Turborepo** — monorepo build orchestration
- **TypeScript** — throughout

## Built With

Built during the [Colosseum Frontier Hackathon](https://colosseum.com/frontier) using [Claude Code](https://claude.ai/claude-code).

## License

MIT
