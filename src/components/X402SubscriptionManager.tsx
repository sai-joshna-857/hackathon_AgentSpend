import React, { useState } from 'react';
import {
  Key,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  BarChart3,
} from 'lucide-react';
import type { AIAgent, X402SubscriptionToken } from '../types';
import type { X402EndpointConfig } from '../../x402-server/endpoints.config';
import { X402_ENDPOINTS_CONFIG } from '../../x402-server/endpoints.config';
import { processAlgorandX402Payment, processAlgorandASAPayment, getAlgorandExplorerUrl } from '../services/algorand';
import { createSubscriptionToken, verifySubscriptionToken, checkRateLimit, USDC_ASSET_ID } from '../services/x402Protocol';

interface X402SubscriptionManagerProps {
  agents: AIAgent[];
  onTokenCreated?: (token: X402SubscriptionToken) => void;
}

type SubscribeStep = 'idle' | 'paying' | 'signing' | 'issuing' | 'done';

const subscribableEndpoints = X402_ENDPOINTS_CONFIG.filter(ep => ep.supportsSubscription);

export const X402SubscriptionManager: React.FC<X402SubscriptionManagerProps> = ({ agents, onTokenCreated }) => {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');
  const [selectedEndpoint, setSelectedEndpoint] = useState<X402EndpointConfig>(subscribableEndpoints[0]);
  const [selectedAsset, setSelectedAsset] = useState<'ALGO' | 'USDCa'>('ALGO');
  const [subscribeStep, setSubscribeStep] = useState<SubscribeStep>('idle');
  const [tokens, setTokens] = useState<X402SubscriptionToken[]>([]);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleSubscribe = async () => {
    if (!selectedAgent) return;
    setSubscribeStep('paying');
    await new Promise(r => setTimeout(r, 800));

    setSubscribeStep('signing');
    await new Promise(r => setTimeout(r, 1000));

    const nonce = 'nonce_sub_' + Date.now().toString(16);
    let proof;
    if (selectedAsset === 'USDCa' && selectedEndpoint.priceUSDCa) {
      proof = processAlgorandASAPayment(
        selectedAgent.algorandAccount,
        selectedEndpoint.recipientAddress,
        selectedEndpoint.priceUSDCa,
        nonce,
        selectedEndpoint.path
      );
    } else {
      proof = processAlgorandX402Payment(
        selectedAgent.algorandAccount,
        selectedEndpoint.recipientAddress,
        selectedEndpoint.priceAlgo,
        nonce,
        selectedEndpoint.path,
        selectedAsset === 'USDCa' ? USDC_ASSET_ID : 0
      );
    }

    setSubscribeStep('issuing');
    await new Promise(r => setTimeout(r, 600));

    const token = createSubscriptionToken(
      proof,
      selectedEndpoint.path,
      selectedEndpoint.name,
      selectedAgent.id,
      selectedEndpoint.rateLimit ?? 10
    );

    setTokens(prev => [token, ...prev]);
    if (onTokenCreated) onTokenCreated(token);
    setSubscribeStep('done');
    setTimeout(() => setSubscribeStep('idle'), 1500);
  };

  const handleSimulateCall = (tokenId: string) => {
    setTokens(prev => prev.map(t => t.tokenId === tokenId ? checkRateLimit(t) : t));
  };

  const copyToken = (tokenId: string) => {
    navigator.clipboard.writeText(tokenId);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const getStatusColor = (t: X402SubscriptionToken) => {
    if (t.status === 'active') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (t.status === 'exhausted') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Key className="w-5 h-5 text-purple-400" />
          <span>x402 Subscription Manager</span>
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Pay once via x402 to receive a bearer token that allows multiple API calls without re-paying each time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscribe Form */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white">Create New Subscription</h4>

          {/* Agent Selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Paying Agent</label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
              ))}
            </select>
          </div>

          {/* Endpoint Selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Endpoint</label>
            <div className="space-y-1.5">
              {subscribableEndpoints.map(ep => (
                <div
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedEndpoint.path === ep.path
                      ? 'bg-purple-950/40 border-purple-500/60 text-white'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-xs text-purple-300">{ep.path}</div>
                      <div className="text-xs font-semibold mt-0.5">{ep.name}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-emerald-400 font-mono font-bold">{ep.priceAlgo} ALGO</div>
                      {ep.priceUSDCa && (
                        <div className="text-blue-400 font-mono">{ep.priceUSDCa} USDCa</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center space-x-2 text-[10px] text-gray-500">
                    <span>{ep.rateLimit} calls/subscription</span>
                    <span>·</span>
                    <span>30 day expiry</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Selector */}
          {selectedEndpoint.acceptedAssets.length > 1 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Pay With</label>
              <div className="flex space-x-2">
                {(['ALGO', 'USDCa'] as const).filter(a => selectedEndpoint.acceptedAssets.includes(a)).map(asset => (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedAsset === asset
                        ? asset === 'USDCa'
                          ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                          : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {asset === 'USDCa' ? `💵 ${selectedEndpoint.priceUSDCa} USDCa` : `⚡ ${selectedEndpoint.priceAlgo} ALGO`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={subscribeStep !== 'idle' && subscribeStep !== 'done'}
            className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 transition-all ${
              subscribeStep !== 'idle' && subscribeStep !== 'done'
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:scale-[1.01]'
            }`}
          >
            {subscribeStep === 'idle' && (
              <>
                <Key className="w-4 h-4" />
                <span>Subscribe & Generate Bearer Token</span>
              </>
            )}
            {subscribeStep === 'paying' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing x402 Payment...</span>
              </>
            )}
            {subscribeStep === 'signing' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing with Ed25519...</span>
              </>
            )}
            {subscribeStep === 'issuing' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Issuing Bearer Token...</span>
              </>
            )}
            {subscribeStep === 'done' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Token Issued!</span>
              </>
            )}
          </button>
        </div>

        {/* Active Subscriptions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Active Subscriptions ({tokens.length})</h4>
          {tokens.length === 0 ? (
            <div className="h-40 rounded-2xl border border-dashed border-gray-800 flex items-center justify-center text-xs text-gray-500 text-center p-4">
              <div>
                <Key className="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p>No subscriptions yet.<br />Subscribe to an endpoint to get a bearer token.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map(token => {
                const verification = verifySubscriptionToken(token);
                const pct = (token.callsUsed / token.callsLimit) * 100;
                return (
                  <div key={token.tokenId} className="glass-panel p-4 rounded-xl space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs text-purple-300">{token.endpointPath}</div>
                        <div className="text-sm font-semibold text-white">{token.endpointName}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(token)}`}>
                        {token.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Token ID */}
                    <div className="flex items-center justify-between bg-gray-950 rounded-lg p-2 border border-gray-800">
                      <span className="font-mono text-[10px] text-gray-400 truncate">{token.tokenId}</span>
                      <button onClick={() => copyToken(token.tokenId)} className="ml-2 flex-shrink-0 text-gray-500 hover:text-white">
                        {copiedTokenId === token.tokenId
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Rate Limit Gauge */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>{token.callsUsed} / {token.callsLimit} calls used</span>
                        <span className={pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}>
                          {token.callsLimit - token.callsUsed} remaining
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="text-gray-500">
                        <span>Paid: </span>
                        <span className={token.paidWithAsset === 'USDCa' ? 'text-blue-300' : 'text-emerald-300'}>
                          {token.amountPaid} {token.paidWithAsset}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        <span>Expires: </span>
                        <span className="text-gray-300">{new Date(token.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-gray-800">
                      <button
                        onClick={() => handleSimulateCall(token.tokenId)}
                        disabled={!verification.valid}
                        className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Simulate API Call</span>
                      </button>
                      <a
                        href={getAlgorandExplorerUrl(token.txId)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 py-1.5 px-3 rounded-lg text-[11px] font-bold bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
