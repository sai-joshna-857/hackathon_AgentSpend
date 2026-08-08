import algosdk from 'algosdk';
import type { AlgorandAccountInfo, X402Proof, AlgorandBlock, FacilitatorCallLog, X402AssetType } from '../types';
import { formatX402ProofHeader, USDC_ASSET_ID } from './x402Protocol';

// ── Account Creation ──────────────────────────────────────────────────────────
export const createAlgorandAccount = (): AlgorandAccountInfo => {
  try {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    const addrStr = typeof account.addr === 'string' ? account.addr : String(account.addr);
    const pubKeyHex = '0x' + Array.from(account.sk.slice(0, 32), (b) => b.toString(16).padStart(2, '0')).join('');
    return {
      address: addrStr,
      mnemonic,
      publicKeyHex: pubKeyHex,
      balanceAlgo: 250.0 + Math.floor(Math.random() * 500),
      balanceUSDCa: 1000.0 + Math.floor(Math.random() * 2000),
    };
  } catch (err) {
    console.warn('Fallback algosdk key generation:', err);
    const randHex = Array.from({ length: 58 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join('');
    return {
      address: randHex,
      mnemonic: 'sandbox test mnemonic key pair for agent spend policy engine algorand integration',
      publicKeyHex: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      balanceAlgo: 300.0,
      balanceUSDCa: 1500.0,
    };
  }
};

// ── Merchant Addresses ────────────────────────────────────────────────────────
export const ALGORAND_MERCHANT_ADDRESSES = {
  openai: 'ALGO402OPENAI7777777777777777777777777777777777777777777',
  anthropic: 'ALGO402ANTHROPIC8888888888888888888888888888888888888',
  replicate: 'ALGO402REPLICATE9999999999999999999999999999999999999',
  serper: 'ALGO402SERPER1111111111111111111111111111111111111111',
  aws_gpu: 'ALGO402AWSGPU22222222222222222222222222222222222222222',
  untrusted: 'ALGO402UNTRUSTED9999999999999999999999999999999999999',
};

// ── Core Tx ID & Signature Generator ─────────────────────────────────────────
const generateTxId = (raw: string): string => {
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Array.from({ length: 52 }, (_, idx) =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.abs((hash + idx * 13) % 32)]
  ).join('');
};

const generateSignature = (): string =>
  'sig_algo_' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// ── ALGO Native Payment ───────────────────────────────────────────────────────
export const processAlgorandX402Payment = (
  senderAccount: AlgorandAccountInfo,
  receiverAddress: string,
  amountAlgo: number,
  nonce: string,
  serviceId: string,
  assetId: number = 0
): X402Proof => {
  const noteObj = {
    protocol: 'x402-algorand-v1',
    service: serviceId,
    nonce,
    timestamp: new Date().toISOString(),
    sender: senderAccount.address,
    recipient: receiverAddress,
    amount: amountAlgo,
    assetId,
  };
  const noteEncoded = new TextEncoder().encode(JSON.stringify(noteObj));
  console.log('Encoded x402 Note Payload Bytes:', noteEncoded.length);

  const rawTxString = `${senderAccount.address}:${receiverAddress}:${amountAlgo}:${nonce}:${Date.now()}`;
  const txIdHex = generateTxId(rawTxString);
  const currentBlockRound = 38492010 + Math.floor(Math.random() * 50);
  const signatureHex = generateSignature();

  const proof: X402Proof = {
    txId: txIdHex,
    senderAddress: senderAccount.address,
    receiverAddress,
    amountAlgo,
    assetId,
    assetSymbol: 'ALGO',
    blockRound: currentBlockRound,
    signature: signatureHex,
    nonce,
    timestamp: new Date().toISOString(),
    verifiedOnChain: true,
    facilitatorConfirmed: true,
    proofHeader: '',
    callsAllowed: undefined,
    callsUsed: 0,
  };
  proof.proofHeader = formatX402ProofHeader(proof);
  return proof;
};

// ── USDCa ASA Payment ─────────────────────────────────────────────────────────
export const processAlgorandASAPayment = (
  senderAccount: AlgorandAccountInfo,
  receiverAddress: string,
  amountUSDCa: number,
  nonce: string,
  serviceId: string
): X402Proof => {
  const noteObj = {
    protocol: 'x402-algorand-v1',
    service: serviceId,
    nonce,
    timestamp: new Date().toISOString(),
    sender: senderAccount.address,
    recipient: receiverAddress,
    amountUSDCa,
    assetId: USDC_ASSET_ID,
    assetSymbol: 'USDCa',
  };
  const noteEncoded = new TextEncoder().encode(JSON.stringify(noteObj));
  console.log('Encoded x402 USDCa ASA Note Payload Bytes:', noteEncoded.length);

  const rawTxString = `${senderAccount.address}:${receiverAddress}:USDCa:${amountUSDCa}:${nonce}:${Date.now()}`;
  const txIdHex = generateTxId(rawTxString);
  const currentBlockRound = 38492010 + Math.floor(Math.random() * 50);
  const signatureHex = generateSignature();

  // Simulate algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject
  console.log('[x402 ASA] algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject:', {
    from: senderAccount.address,
    to: receiverAddress,
    assetIndex: USDC_ASSET_ID,
    amount: Math.floor(amountUSDCa * 1_000_000), // USDCa has 6 decimals
    note: noteEncoded,
  });

  const algoEquivalent = parseFloat((amountUSDCa / 0.30).toFixed(4));

  const proof: X402Proof = {
    txId: txIdHex,
    senderAddress: senderAccount.address,
    receiverAddress,
    amountAlgo: algoEquivalent,
    amountUSDCa,
    assetId: USDC_ASSET_ID,
    assetSymbol: 'USDCa',
    blockRound: currentBlockRound,
    signature: signatureHex,
    nonce,
    timestamp: new Date().toISOString(),
    verifiedOnChain: true,
    facilitatorConfirmed: true,
    proofHeader: '',
    callsAllowed: undefined,
    callsUsed: 0,
  };
  proof.proofHeader = formatX402ProofHeader(proof);
  return proof;
};

// ── GoPlausible Facilitator Simulation ────────────────────────────────────────
export const simulateGoPlausibleFacilitatorCall = async (
  proof: X402Proof,
  onStep: (step: number, label: string) => void
): Promise<FacilitatorCallLog> => {
  const steps: FacilitatorCallLog['steps'] = [];
  const t0 = Date.now();

  const runStep = async (label: string, ms: number): Promise<void> => {
    onStep(steps.length + 1, label);
    await new Promise(r => setTimeout(r, ms));
    steps.push({ label, status: 'done', durationMs: ms });
  };

  await runStep('Signature Ed25519 verification', 180);
  await runStep('Account balance check (Algorand Node)', 140);
  if (proof.assetId === USDC_ASSET_ID) {
    await runStep('ASA opt-in verification (USDCa 31566704)', 120);
  }
  await runStep('Transaction broadcast to Algorand Testnet', 200);
  await runStep('Block confirmation (round +1)', 160);
  await runStep('GoPlausible on-chain proof anchoring', 100);

  const totalMs = Date.now() - t0;

  return {
    id: 'fcl_' + Date.now().toString(16),
    timestamp: new Date().toISOString(),
    endpoint: proof.nonce.split('_').slice(0, -1).join('/') || '/api/service',
    assetSymbol: proof.assetSymbol,
    amount: proof.assetSymbol === 'USDCa' ? (proof.amountUSDCa ?? proof.amountAlgo) : proof.amountAlgo,
    txId: proof.txId,
    blockRound: proof.blockRound,
    latencyMs: totalMs,
    status: 'verified',
    facilitatorNode: `goplausible-node-${Math.floor(Math.random() * 4) + 1}.algo.network`,
    steps,
  };
};

// ── Explorer URLs ─────────────────────────────────────────────────────────────
export const getAlgorandExplorerUrl = (txId: string): string => {
  return `https://testnet.algoexplorer.io/tx/${txId}`;
};

export const getAlgorandAccountExplorerUrl = (address: string): string => {
  return `https://testnet.algoexplorer.io/address/${address}`;
};

export const getASAExplorerUrl = (assetId: number): string => {
  return `https://testnet.algoexplorer.io/asset/${assetId}`;
};

// ── Recent Algorand Blocks ────────────────────────────────────────────────────
export const generateRecentAlgorandBlocks = (): AlgorandBlock[] => {
  const latestRound = 38492045;
  return Array.from({ length: 6 }, (_, i) => {
    const round = latestRound - i;
    const hash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return {
      round,
      hash,
      timestamp: new Date(Date.now() - i * 3700).toLocaleTimeString(),
      txCount: Math.floor(Math.random() * 12) + 1,
      proposer: 'ALGO_VALIDATOR_NODE_' + (Math.floor(Math.random() * 5) + 1),
    };
  });
};

// ── Asset Symbol from ID ──────────────────────────────────────────────────────
export const getAssetSymbol = (assetId: number): X402AssetType => {
  return assetId === USDC_ASSET_ID ? 'USDCa' : 'ALGO';
};
