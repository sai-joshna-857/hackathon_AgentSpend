export type AgentStatus = 'active' | 'paused' | 'flagged' | 'sandbox';

export type X402AssetType = 'ALGO' | 'USDCa';

export interface AlgorandAccountInfo {
  address: string;
  mnemonic: string;
  publicKeyHex: string;
  balanceAlgo: number;
  balanceUSDCa: number;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  role: string;
  algorandAccount: AlgorandAccountInfo;
  dailySpendLimitAlgo: number;
  spentTodayAlgo: number;
  singleTxLimitAlgo: number;
  status: AgentStatus;
  createdAt: string;
  totalSpentAlgo: number;
  txCount: number;
  whitelistedServices: string[];
}

export interface SpendPolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'max_single_tx' | 'daily_budget' | 'monthly_budget' | 'velocity_limit' | 'service_whitelist' | 'hitl_approval_threshold' | 'allowed_assets';
  value: number | string | string[];
  severity: 'block' | 'require_approval' | 'warn';
  appliedToAgents: string[]; // 'all' or agent IDs
}

export interface X402Challenge {
  status: 402;
  statusText: 'Payment Required';
  headers: {
    'X-402-PayTo': string;           // Algorand receiver address
    'X-402-Price': number;           // In ALGO or USDCa
    'X-402-Asset-ID': number;        // 0 for ALGO, 31566704 for USDCa
    'X-402-Asset-Symbol': X402AssetType;
    'X-402-Payment-Nonce': string;
    'X-402-Service-Id': string;
    'X-402-Service-Name': string;
    'X-402-Blockchain': string;      // 'Algorand-Testnet'
    'X-402-Facilitator': string;     // GoPlausible facilitator URL
    'X-402-Spec-Version': string;
    'X-402-Rate-Limit'?: number;     // Calls allowed per proof
    'X-402-Subscription-Model'?: boolean;
  };
}

export interface X402Proof {
  txId: string;
  senderAddress: string;
  receiverAddress: string;
  amountAlgo: number;
  amountUSDCa?: number;
  assetId: number;
  assetSymbol: X402AssetType;
  blockRound: number;
  signature: string;
  nonce: string;
  timestamp: string;
  verifiedOnChain: boolean;
  facilitatorConfirmed: boolean;
  proofHeader: string;   // Full X-402-Proof header string
  callsAllowed?: number; // Rate-limit per proof
  callsUsed?: number;
}

// Subscription / bearer token for x402 pay-once model
export interface X402SubscriptionToken {
  tokenId: string;
  endpointPath: string;
  endpointName: string;
  agentId: string;
  agentAddress: string;
  paidWithAsset: X402AssetType;
  amountPaid: number;
  txId: string;
  issuedAt: string;
  expiresAt: string;    // ISO timestamp
  callsLimit: number;
  callsUsed: number;
  status: 'active' | 'exhausted' | 'expired';
}

// GoPlausible facilitator call log entry
export interface FacilitatorCallLog {
  id: string;
  timestamp: string;
  endpoint: string;
  assetSymbol: X402AssetType;
  amount: number;
  txId: string;
  blockRound: number;
  latencyMs: number;
  status: 'verified' | 'rejected' | 'pending';
  facilitatorNode: string;
  steps: {
    label: string;
    status: 'done' | 'error';
    durationMs: number;
  }[];
}

export type TransactionStatus = 'approved' | 'pending_approval' | 'blocked' | 'rejected' | 'failed';

export interface SpendingTransaction {
  id: string;
  agentId: string;
  agentName: string;
  serviceId: string;
  serviceName: string;
  serviceEndpoint: string;
  amountAlgo: number;
  amountUsd: number;
  assetSymbol: string;
  timestamp: string;
  status: TransactionStatus;
  policyEvaluation: {
    passedRules: string[];
    triggeredRules: string[];
    riskScore: number; // 0 to 100
    recommendation: 'APPROVE' | 'FLAG_FOR_HITL' | 'BLOCK';
    reason: string;
  };
  x402Challenge?: X402Challenge;
  algorandProof?: X402Proof;
  subscriptionToken?: X402SubscriptionToken;
  approver?: string;
  approvedAt?: string;
}

export interface APIServiceOption {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  costAlgo: number;
  costUsd: number;
  recipientAlgoAddress: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  payloadTemplate: string;
  assetId?: number;           // 0=ALGO, 31566704=USDCa
  assetSymbol?: X402AssetType;
  rateLimit?: number;         // calls per proof
  supportsSubscription?: boolean;
}

export interface AlgorandBlock {
  round: number;
  hash: string;
  timestamp: string;
  txCount: number;
  proposer: string;
}
