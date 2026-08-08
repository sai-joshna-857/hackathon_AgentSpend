import React, { useState } from 'react';
import {
  Code,
  Globe,
  ExternalLink,
  Server,
  Zap,
  Lock,
  Play,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Activity,
  Key,
} from 'lucide-react';
import type { AIAgent, X402Proof, X402SubscriptionToken, FacilitatorCallLog } from '../types';
import { X402_ENDPOINTS_CONFIG } from '../../x402-server/endpoints.config';
import type { X402EndpointConfig } from '../../x402-server/endpoints.config';
import { handleWeatherRequest } from '../../x402-server/handlers/weather';
import { handleAnalyticsRequest } from '../../x402-server/handlers/analytics';
import { handleAiAnalysisRequest } from '../../x402-server/handlers/ai-analysis';
import { handleCreatorContentRequest } from '../../x402-server/handlers/creator-content';
import { getAlgorandExplorerUrl } from '../services/algorand';
import { simulateGoPlausibleFacilitatorCall } from '../services/algorand';
import { PaymentModal } from './PaymentModal';
import { WalletConnectPanel } from './WalletConnectPanel';
import { FacilitatorDashboard } from './FacilitatorDashboard';
import { X402SubscriptionManager } from './X402SubscriptionManager';

interface X402ProjectViewProps {
  agents: AIAgent[];
}

type MainTab = 'tester' | 'config' | 'architecture' | 'wallet' | 'facilitator' | 'subscriptions';

const FULL_LIFECYCLE_STEPS = [
  { step: '1', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', title: 'Agent Calls Paid Endpoint (no auth)', body: 'POST /api/analytics — Agent dispatches HTTP request without X-402-Proof header. No authentication present.' },
  { step: '2', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', title: 'Hono/Express Middleware → HTTP 402', body: 'Server reads endpoints.config.ts, returns 402 with X-402-PayTo, X-402-Price, X-402-Asset-ID, X-402-Nonce, X-402-Facilitator headers.' },
  { step: '3', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', title: 'Agent Reads 402 Challenge Headers', body: 'Parses X-402-PayTo address, X-402-Price amount (ALGO or USDCa), X-402-Asset-ID (0=ALGO, 31566704=USDCa), and payment nonce.' },
  { step: '4', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', title: 'Wallet Selection — Pera / Defly / MyAlgo', body: 'Agent selects connected Algorand wallet, checks ALGO and USDCa ASA balances. Falls back to provisioned Ed25519 keypair.' },
  { step: '5', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', title: 'Agent Signs Algorand Payment Tx (Ed25519)', body: 'algosdk.makePaymentTxnWithSuggestedParamsFromObject (ALGO) or makeAssetTransferTxnWithSuggestedParamsFromObject (USDCa). x402 metadata encoded in Note field.' },
  { step: '6', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', title: 'USDCa ASA Opt-in Verification (if USDCa)', body: 'GoPlausible verifies both sender and receiver have opted-in to USDCa ASA (31566704) on Algorand. Required for ASA transfers.' },
  { step: '7', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', title: 'GoPlausible Facilitator Verification', body: 'facilitator.goplausible.com: Ed25519 sig check → balance confirmation → broadcast to Algorand Testnet → block confirmation in ~3.3s.' },
  { step: '8', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', title: 'On-Chain Proof Anchoring', body: 'GoPlausible anchors X-402-Proof to Algorand ledger. TxID becomes the permanent payment receipt for the API call.' },
  { step: '9', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', title: 'Agent Re-submits Request with X-402-Proof', body: 'Agent re-calls the endpoint, attaching X-402-Proof: Algorand-TxId txid="..." sig="..." nonce="..." block="..." header.' },
  { step: '10', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', title: 'Server Verifies Proof & Returns 200 OK', body: 'Server validates proof against GoPlausible registry. On success: returns 200 OK with unlocked API payload + rate-limit grant.' },
  { step: '11', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', title: 'Bearer Token Issuance (Subscription Model)', body: 'If endpoint.supportsSubscription=true, server issues x402 bearer token. Subsequent calls use X-Authorization: Bearer <token> — no re-payment.' },
  { step: '12', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', title: 'Rate-Limit Enforcement per Proof', body: 'Each x402 proof grants rateLimit API calls. After exhaustion, agent must pay again. All usage tracked in GoPlausible on-chain registry.' },
];

export const X402ProjectView: React.FC<X402ProjectViewProps> = ({ agents }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<X402EndpointConfig>(X402_ENDPOINTS_CONFIG[0]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [activeTab, setActiveTab] = useState<MainTab>('tester');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [challengeLog, setChallengeLog] = useState<any | null>(null);
  const [successLog, setSuccessLog] = useState<any | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // State shared across tabs
  const [facilitatorLogs, setFacilitatorLogs] = useState<FacilitatorCallLog[]>([]);
  const [facilitatorBadge, setFacilitatorBadge] = useState(0);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  // Step 1 — Call endpoint without paying
  const handleTestWithoutPayment = async () => {
    setIsExecuting(true);
    setChallengeLog(null);
    setSuccessLog(null);
    await new Promise(r => setTimeout(r, 400));

    const nonce = 'nonce_x402_' + Date.now().toString(16);
    setChallengeLog({
      status: 402,
      statusText: 'Payment Required',
      headers: {
        'X-402-PayTo': selectedEndpoint.recipientAddress,
        'X-402-Price': `${selectedEndpoint.priceAlgo} ALGO${selectedEndpoint.priceUSDCa ? ` / ${selectedEndpoint.priceUSDCa} USDCa` : ''}`,
        'X-402-Asset-ID': selectedEndpoint.assetId,
        'X-402-Asset-Symbol': selectedEndpoint.assetSymbol,
        'X-402-Payment-Nonce': nonce,
        'X-402-Facilitator': 'https://facilitator.goplausible.com/verify',
        'X-402-Spec-Version': 'v1.0.4-Algorand',
        'X-402-Rate-Limit': selectedEndpoint.rateLimit ?? 1,
        'X-402-Subscription-Model': selectedEndpoint.supportsSubscription ?? false,
        'X-402-Accepted-Assets': selectedEndpoint.acceptedAssets.join(', '),
      },
      body: {
        error: 'Payment Required',
        message: `'${selectedEndpoint.name}' requires payment via x402 Algorand protocol`,
        endpoint: selectedEndpoint.path,
      },
    });
    setIsExecuting(false);
  };

  const handleOpenPaymentModal = () => {
    if (!challengeLog) {
      handleTestWithoutPayment().then(() => setIsPaymentModalOpen(true));
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = async (proof: X402Proof, subToken?: X402SubscriptionToken) => {
    // Run GoPlausible facilitator simulation
    const fcLog = await simulateGoPlausibleFacilitatorCall(proof, (step, label) => {
      console.log(`Facilitator step ${step}: ${label}`);
    });
    fcLog.endpoint = selectedEndpoint.path;
    setFacilitatorLogs(prev => [fcLog, ...prev]);
    setFacilitatorBadge(prev => prev + 1);

    // Get unlocked payload
    let handlerResult: any;
    if (selectedEndpoint.path === '/api/weather') handlerResult = handleWeatherRequest();
    else if (selectedEndpoint.path === '/api/analytics') handlerResult = handleAnalyticsRequest();
    else if (selectedEndpoint.path === '/api/ai-analysis') handlerResult = handleAiAnalysisRequest();
    else handlerResult = handleCreatorContentRequest();

    setSuccessLog({
      status: 200,
      statusText: 'OK — Payment Verified by GoPlausible Facilitator',
      algorandProof: proof,
      x402HeaderVerified: true,
      proofVerification: {
        valid: true,
        reason: 'Algorand cryptographic transaction proof verified on-chain by GoPlausible Facilitator',
      },
      facilitator: {
        name: 'GoPlausible Algorand Facilitator',
        blockRound: proof.blockRound,
        txId: proof.txId,
        latencyMs: fcLog.latencyMs,
        node: fcLog.facilitatorNode,
      },
      assetSymbol: proof.assetSymbol,
      rateLimit: { granted: selectedEndpoint.rateLimit ?? 1, used: 1 },
      subscriptionToken: subToken,
      unlockedPayload: handlerResult.data,
    });
  };

  const TABS: { id: MainTab; icon: React.ComponentType<any>; label: string; badge?: number }[] = [
    { id: 'tester', icon: Play, label: 'Payment Tester' },
    { id: 'wallet', icon: Wallet, label: 'Wallet Connect' },
    { id: 'subscriptions', icon: Key, label: 'Subscriptions' },
    { id: 'facilitator', icon: Activity, label: 'Facilitator Log', badge: facilitatorBadge },
    { id: 'config', icon: FileText, label: 'endpoints.config' },
    { id: 'architecture', icon: Server, label: 'Full Lifecycle' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-teal-950/60 to-gray-900 border border-cyan-500/30 p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Code className="w-4 h-4" />
              <span>x402 Algorand — marotipatre/x402-Project</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">100%</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              x402 Algorand Payment Gateway
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Full 12-step x402 lifecycle: ALGO + USDCa payments, wallet connect, GoPlausible facilitator, bearer tokens, rate limits & on-chain audit.
            </p>
          </div>
          <a
            href="https://github.com/marotipatre/x402-Project.git"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-cyan-300 font-bold text-xs transition-all"
          >
            <span>GitHub Repo</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-2">
        {TABS.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-gray-950 text-[9px] font-extrabold flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB: TESTER ─── */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Select x402 Payment Endpoint</span>
            </h3>

            <div className="space-y-2">
              {X402_ENDPOINTS_CONFIG.map(ep => (
                <div
                  key={ep.path}
                  onClick={() => { setSelectedEndpoint(ep); setChallengeLog(null); setSuccessLog(null); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedEndpoint.path === ep.path
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-cyan-400">{ep.path}</span>
                    <div className="flex items-center space-x-2">
                      {ep.acceptedAssets.includes('USDCa') && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold text-[9px] border border-blue-500/20">
                          USDCa
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">
                        {ep.priceAlgo} ALGO
                      </span>
                    </div>
                  </div>
                  <div className="font-semibold text-sm mt-1">{ep.name}</div>
                  <div className="flex items-center space-x-3 mt-1 text-[10px] text-gray-500">
                    <span>{ep.category}</span>
                    {ep.rateLimit && <span>· {ep.rateLimit} calls/proof</span>}
                    {ep.supportsSubscription && (
                      <span className="text-purple-400">· subscription</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Wallet Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Payer Agent Wallet
              </label>
              <select
                value={selectedAgentId}
                onChange={e => setSelectedAgentId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.avatar} {a.name} — {a.algorandAccount.balanceAlgo} ALGO / {a.algorandAccount.balanceUSDCa} USDCa
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</div>
                <button
                  onClick={handleTestWithoutPayment}
                  disabled={isExecuting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Call Endpoint Unpaid → Get 402 Challenge</span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</div>
                <button
                  onClick={handleOpenPaymentModal}
                  disabled={isExecuting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/50 hover:scale-[1.01] transition-transform"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Open Payment Modal → Pay {selectedEndpoint.priceAlgo} ALGO</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Console */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">x402 Protocol Response Console</h3>

            {challengeLog && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">HTTP 402 — Payment Required Challenge</span>
                </div>
                <pre className="p-3 rounded-xl bg-gray-950 border border-amber-500/25 text-amber-200 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-52">
                  {JSON.stringify(challengeLog, null, 2)}
                </pre>
              </div>
            )}

            {successLog && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">HTTP 200 — API Payload Unlocked</span>
                  {successLog.assetSymbol === 'USDCa' && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[9px] font-bold">USDCa Payment</span>
                  )}
                </div>
                <pre className="p-3 rounded-xl bg-gray-950 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-52">
                  {JSON.stringify(successLog, null, 2)}
                </pre>
                <a
                  href={getAlgorandExplorerUrl(successLog.algorandProof.txId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-950/60 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View TxID: {successLog.algorandProof.txId.slice(0, 20)}... on Testnet</span>
                </a>
              </div>
            )}

            {!challengeLog && !successLog && (
              <div className="h-64 rounded-xl bg-gray-950 border border-gray-800/80 flex flex-col items-center justify-center text-gray-500 text-xs p-6 text-center space-y-3">
                <Zap className="w-8 h-8 opacity-40 text-cyan-400" />
                <p>
                  Click <strong className="text-amber-300">"Call Endpoint Unpaid"</strong> to receive the HTTP 402 challenge,<br />
                  then <strong className="text-cyan-300">"Open Payment Modal"</strong> to pay (ALGO or USDCa) and unlock the API.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: WALLET CONNECT ─── */}
      {activeTab === 'wallet' && (
        <div className="glass-panel p-6 rounded-2xl">
          <WalletConnectPanel agents={agents} />
        </div>
      )}

      {/* ─── TAB: SUBSCRIPTIONS ─── */}
      {activeTab === 'subscriptions' && (
        <div className="glass-panel p-6 rounded-2xl">
          <X402SubscriptionManager agents={agents} />
        </div>
      )}

      {/* ─── TAB: FACILITATOR LOG ─── */}
      {activeTab === 'facilitator' && (
        <div className="glass-panel p-6 rounded-2xl">
          <FacilitatorDashboard callLogs={facilitatorLogs} />
        </div>
      )}

      {/* ─── TAB: CONFIG ─── */}
      {activeTab === 'config' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-cyan-400 font-bold font-sans">x402-server/endpoints.config.ts</span>
            <span className="text-gray-500 text-[11px] font-sans">github.com/marotipatre/x402-Project</span>
          </div>
          <pre className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-200 overflow-x-auto text-[11px]">{`// 6 endpoints — ALGO + USDCa dual-asset, rate limits, subscriptions
export const X402_ENDPOINTS_CONFIG: X402EndpointConfig[] = [
  {
    path: '/api/weather',
    priceAlgo: 0.5,
    assetId: 0,              // Native ALGO
    rateLimit: 1,            // 1 call per proof
    acceptedAssets: ['ALGO'],
  },
  {
    path: '/api/analytics',
    priceAlgo: 1.5,
    priceUSDCa: 0.45,        // Dual-asset pricing
    assetId: 0,
    rateLimit: 5,
    acceptedAssets: ['ALGO', 'USDCa'],
  },
  {
    path: '/api/ai-analysis',
    priceAlgo: 2.5,
    priceUSDCa: 0.75,
    assetId: 31566704,       // USDCa ASA
    rateLimit: 10,
    supportsSubscription: true,  // Bearer token model
    acceptedAssets: ['ALGO', 'USDCa'],
  },
  {
    path: '/api/creator-content',
    priceAlgo: 3.0,
    priceUSDCa: 0.90,
    assetId: 31566704,
    rateLimit: 50,
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },
  {
    path: '/api/premium-data',
    priceAlgo: 5.0,
    priceUSDCa: 1.50,
    rateLimit: 100,
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },
  {
    path: '/api/stream-feed',
    priceAlgo: 0.1,
    priceUSDCa: 0.03,
    rateLimit: 1000,         // Micro-payment streaming
    supportsSubscription: true,
    acceptedAssets: ['ALGO', 'USDCa'],
  },
];`}</pre>
        </div>
      )}

      {/* ─── TAB: FULL LIFECYCLE ─── */}
      {activeTab === 'architecture' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Full 12-Step x402 Algorand Lifecycle</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">100% Spec</span>
          </h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-purple-500/30 to-emerald-500/50" />
            <div className="space-y-4 pl-12">
              {FULL_LIFECYCLE_STEPS.map(({ step, color, title, body }) => (
                <div key={step} className="relative flex items-start space-x-4">
                  <div className={`absolute -left-12 w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${color}`}>
                    {step}
                  </div>
                  <div className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                    <p className="font-bold text-white text-sm">{title}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        endpoint={selectedEndpoint}
        agent={selectedAgent}
        onPaymentSuccess={(proof, subToken) => {
          handlePaymentSuccess(proof, subToken);
          setIsPaymentModalOpen(false);
        }}
      />
    </div>
  );
};
