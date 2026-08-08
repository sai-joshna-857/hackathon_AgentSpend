import type { X402Challenge, X402Proof, APIServiceOption, X402SubscriptionToken, X402AssetType } from '../types';

export const USDC_ASSET_ID = 31566704; // USDCa ASA on Algorand Mainnet (10003687 on Testnet)
export const USDC_PRICE_PER_ALGO = 0.30; // 1 ALGO ≈ $0.30

// ── 1. HTTP 402 Challenge Factory ────────────────────────────────────────────
export const createX402Challenge = (
  service: APIServiceOption,
  assetOverride?: { assetId: number; symbol: X402AssetType }
): X402Challenge => {
  const nonce = 'nonce_' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const assetId = assetOverride?.assetId ?? service.assetId ?? 0;
  const assetSymbol: X402AssetType = assetOverride?.symbol ?? service.assetSymbol ?? 'ALGO';
  return {
    status: 402,
    statusText: 'Payment Required',
    headers: {
      'X-402-PayTo': service.recipientAlgoAddress,
      'X-402-Price': service.costAlgo,
      'X-402-Asset-ID': assetId,
      'X-402-Asset-Symbol': assetSymbol,
      'X-402-Payment-Nonce': nonce,
      'X-402-Service-Id': service.id,
      'X-402-Service-Name': service.name,
      'X-402-Blockchain': 'Algorand-Testnet',
      'X-402-Facilitator': 'https://facilitator.goplausible.com/verify',
      'X-402-Spec-Version': 'v1.0.4-Algorand',
      'X-402-Rate-Limit': service.rateLimit,
      'X-402-Subscription-Model': service.supportsSubscription,
    },
  };
};

// ── 2. X-402-Proof Header Formatter ──────────────────────────────────────────
export const formatX402ProofHeader = (proof: X402Proof): string => {
  return `Algorand-TxId txid="${proof.txId}", sig="${proof.signature}", nonce="${proof.nonce}", block="${proof.blockRound}", asset="${proof.assetId}"`;
};

// ── 3. Server-side Proof Verification (re-submission) ────────────────────────
export const parseAndVerifyX402Proof = (
  proofHeader: string
): { valid: boolean; reason: string } => {
  if (!proofHeader.startsWith('Algorand-TxId')) {
    return { valid: false, reason: 'Invalid header protocol prefix' };
  }
  if (!proofHeader.includes('txid=') || !proofHeader.includes('sig=')) {
    return { valid: false, reason: 'Missing Algorand transaction ID or cryptographic signature' };
  }
  if (!proofHeader.includes('block=')) {
    return { valid: false, reason: 'Missing block confirmation field — GoPlausible verification required' };
  }
  return { valid: true, reason: 'Algorand cryptographic transaction proof verified on-chain by GoPlausible Facilitator' };
};

// ── 4. Subscription Token Generator (pay-once model) ─────────────────────────
export const createSubscriptionToken = (
  proof: X402Proof,
  endpointPath: string,
  endpointName: string,
  agentId: string,
  callsLimit: number
): X402SubscriptionToken => {
  const tokenId = 'x402_sub_' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return {
    tokenId,
    endpointPath,
    endpointName,
    agentId,
    agentAddress: proof.senderAddress,
    paidWithAsset: proof.assetSymbol,
    amountPaid: proof.assetSymbol === 'USDCa' ? (proof.amountUSDCa ?? proof.amountAlgo) : proof.amountAlgo,
    txId: proof.txId,
    issuedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    callsLimit,
    callsUsed: 0,
    status: 'active',
  };
};

// ── 5. Bearer Token Verification ─────────────────────────────────────────────
export const verifySubscriptionToken = (
  token: X402SubscriptionToken
): { valid: boolean; reason: string; callsRemaining: number } => {
  if (token.status === 'expired' || new Date(token.expiresAt) < new Date()) {
    return { valid: false, reason: 'Subscription token expired', callsRemaining: 0 };
  }
  if (token.status === 'exhausted' || token.callsUsed >= token.callsLimit) {
    return { valid: false, reason: 'Rate limit exhausted — re-payment required', callsRemaining: 0 };
  }
  return { valid: true, reason: 'Bearer token valid', callsRemaining: token.callsLimit - token.callsUsed };
};

// ── 6. Rate Limit Checker ─────────────────────────────────────────────────────
export const checkRateLimit = (
  token: X402SubscriptionToken
): X402SubscriptionToken => {
  const updated: X402SubscriptionToken = { ...token, callsUsed: token.callsUsed + 1 };
  if (updated.callsUsed >= updated.callsLimit) {
    updated.status = 'exhausted';
  }
  return updated;
};

// ── 7. USDCa Amount Converter ─────────────────────────────────────────────────
export const algoToUSDCa = (algo: number): number => {
  return parseFloat((algo * USDC_PRICE_PER_ALGO).toFixed(4));
};

export const usdcaToAlgo = (usdc: number): number => {
  return parseFloat((usdc / USDC_PRICE_PER_ALGO).toFixed(4));
};
