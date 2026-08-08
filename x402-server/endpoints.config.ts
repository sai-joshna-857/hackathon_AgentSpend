/**
 * x402 Algorand Hackathon Starter Kit - Endpoints Configuration
 * Reference: https://github.com/marotipatre/x402-Project.git
 * Extended: Full x402 spec — ALGO + USDCa ASA, rate limits, subscription model
 */

export interface X402EndpointConfig {
  path: string;
  name: string;
  description: string;
  priceAlgo: number;
  priceUSDCa?: number;           // USDCa stablecoin price (optional)
  recipientAddress: string;
  assetId: number;               // 0 = native ALGO, 31566704 = USDCa ASA
  assetSymbol: 'ALGO' | 'USDCa';
  category: string;
  rateLimit?: number;            // API calls allowed per x402 proof
  supportsSubscription?: boolean;// pay-once bearer token model
  acceptedAssets: ('ALGO' | 'USDCa')[]; // which assets this endpoint accepts
}

export const USDC_ASSET_ID_TESTNET = 10003687;  // USDCa on Algorand Testnet
export const USDC_ASSET_ID_MAINNET = 31566704;  // USDCa on Algorand Mainnet

export const X402_ENDPOINTS_CONFIG: X402EndpointConfig[] = [
  // ─ Basic Sensor Data (ALGO only, single-call) ─
  {
    path: '/api/weather',
    name: 'Real-time Weather & Climate Data',
    description: 'High-precision satellite weather telemetry for autonomous drone agents. Includes METAR, TAF, SIGMET streams.',
    priceAlgo: 0.5,
    recipientAddress: 'ALGO402WEATHER5555555555555555555555555555555555555',
    assetId: 0,
    assetSymbol: 'ALGO',
    category: 'Basic Sensor Data',
    rateLimit: 1,
    acceptedAssets: ['ALGO'],
  },

  // ─ DeFi Analytics (ALGO + USDCa dual-asset) ─
  {
    path: '/api/analytics',
    name: 'Algorand On-Chain Liquidity Analytics',
    description: 'Deep market depth & DEX pool arbitrage telemetry feed. Tinyman + Pact pool stats, TVL, slippage models.',
    priceAlgo: 1.5,
    priceUSDCa: 0.45,
    recipientAddress: 'ALGO402ANALYTICS666666666666666666666666666666666666',
    assetId: 0,
    assetSymbol: 'ALGO',
    category: 'DeFi Analytics',
    rateLimit: 5,
    supportsSubscription: false,
    acceptedAssets: ['ALGO', 'USDCa'],
  },

  // ─ AI Governance (USDCa preferred, subscription model) ─
  {
    path: '/api/ai-analysis',
    name: 'AI Agent Governance Reasoning',
    description: 'LLM multimodal analysis for risk scoring, smart contract audit & governance proposals. GPT-4 + Claude via x402.',
    priceAlgo: 2.5,
    priceUSDCa: 0.75,
    recipientAddress: 'ALGO402AIANALYSIS7777777777777777777777777777777777',
    assetId: USDC_ASSET_ID_MAINNET,
    assetSymbol: 'USDCa',
    category: 'AI / LLM API',
    rateLimit: 10,
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },

  // ─ Creator Content (USDCa only, subscription model) ─
  {
    path: '/api/creator-content',
    name: 'Premium Creator Media Feed',
    description: 'Monetized media stream unlock for content curation agents. NFT-gated video, audio, and article feeds.',
    priceAlgo: 3.0,
    priceUSDCa: 0.90,
    recipientAddress: 'ALGO402CREATOR8888888888888888888888888888888888888',
    assetId: USDC_ASSET_ID_MAINNET,
    assetSymbol: 'USDCa',
    category: 'Monetized Media',
    rateLimit: 50,
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },

  // ─ Premium Data (USDCa only, high rate limit) ─
  {
    path: '/api/premium-data',
    name: 'Premium Algorand Chain Data Feed',
    description: 'Sub-second Algorand block data, mempool analytics, validator stats, and archival node access via x402.',
    priceAlgo: 5.0,
    priceUSDCa: 1.50,
    recipientAddress: 'ALGO402PREMDATA9999999999999999999999999999999999999',
    assetId: USDC_ASSET_ID_MAINNET,
    assetSymbol: 'USDCa',
    category: 'Blockchain Data',
    rateLimit: 100,
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },

  // ─ Streaming Feed (micro-payment per stream chunk) ─
  {
    path: '/api/stream-feed',
    name: 'Real-time AI Agent Event Stream',
    description: 'WebSocket-based live event stream for agent-to-agent coordination. Pay per 1000 events via x402 micro-payments.',
    priceAlgo: 0.1,
    priceUSDCa: 0.03,
    recipientAddress: 'ALGO402STREAM1010101010101010101010101010101010101010',
    assetId: 0,
    assetSymbol: 'ALGO',
    category: 'Event Streaming',
    rateLimit: 1000,
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },
];
