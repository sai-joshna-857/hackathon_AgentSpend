# 🚀 x402 Algorand Hackathon Starter Kit Server
Reference Repository: [https://github.com/marotipatre/x402-Project.git](https://github.com/marotipatre/x402-Project.git)

This module implements the 10% core x402 HTTP Payment Required protocol specification on the Algorand blockchain for AI agent paywalls.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   AI AGENT                       │
│        React Spend Engine (localhost:3000)       │
│  ├─ Policy Rules Engine                          │
│  ├─ Ed25519 Wallet Signing                       │
│  └─ Payment Header Generation                    │
└──────────────────────────────────────────────────┘
                         │ HTTP POST
                         ▼
┌──────────────────────────────────────────────────┐
│              x402 Hono / Express SERVER          │
│                 (localhost:4021)                 │
│  ├─ endpoints.config.ts                          │
│  ├─ x402 Payment Middleware                      │
│  ├─ Handlers: weather, analytics, ai-analysis    │
│  └─ Returns HTTP 402 or 200 Payload              │
└──────────────────────────────────────────────────┘
                         │ HTTPS Verify
                         ▼
┌──────────────────────────────────────────────────┐
│             GOPLAUSIBLE FACILITATOR              │
│  ├─ Verify Algorand Tx Signatures                │
│  ├─ Check Wallet Balances                        │
│  └─ Confirm On-Chain Settlement                  │
└──────────────────────────────────────────────────┘
```

## Quick Start Endpoints
- `/api/weather` (0.5 ALGO)
- `/api/analytics` (1.5 ALGO)
- `/api/ai-analysis` (2.5 ALGO)
- `/api/creator-content` (3.0 ALGO)
