import React, { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ExternalLink,
  Wallet,
  ShieldCheck,
  Copy,
  Lock,
  Zap,
  Key,
  Activity,
} from 'lucide-react';
import type { AIAgent, X402Proof, X402SubscriptionToken } from '../types';
import type { X402EndpointConfig } from '../../x402-server/endpoints.config';
import { USDC_ASSET_ID } from '../services/x402Protocol';
import {
  processAlgorandX402Payment,
  processAlgorandASAPayment,
  getAlgorandExplorerUrl,
  getASAExplorerUrl,
} from '../services/algorand';
import { createSubscriptionToken } from '../services/x402Protocol';

type PaymentStep = 'confirm' | 'signing' | 'broadcasting' | 'success' | 'failed';
type PaymentAsset = 'ALGO' | 'USDCa';

interface FacilitatorStep {
  label: string;
  done: boolean;
  active: boolean;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: X402EndpointConfig;
  agent: AIAgent;
  onPaymentSuccess: (proof: X402Proof, subscriptionToken?: X402SubscriptionToken) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  endpoint,
  agent,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<PaymentStep>('confirm');
  const [proof, setProof] = useState<X402Proof | null>(null);
  const [subscriptionToken, setSubscriptionToken] = useState<X402SubscriptionToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PaymentAsset>(
    endpoint.acceptedAssets?.includes('ALGO') ? 'ALGO' : 'USDCa'
  );
  const [facilitatorSteps, setFacilitatorSteps] = useState<FacilitatorStep[]>([]);

  if (!isOpen) return null;

  const price = selectedAsset === 'USDCa' && endpoint.priceUSDCa
    ? endpoint.priceUSDCa
    : endpoint.priceAlgo;
  const usdValue = (endpoint.priceAlgo * 0.30).toFixed(4);
  const networkFee = selectedAsset === 'USDCa' ? '0.001 ALGO + opt-in' : '0.001 ALGO';

  const FACILITATOR_STEPS = [
    'Ed25519 signature verification',
    'Account balance check (Algorand Node)',
    ...(selectedAsset === 'USDCa' ? ['ASA opt-in verification (USDCa 31566704)'] : []),
    'Transaction broadcast to Algorand Testnet',
    'Block confirmation (round +1, ~3.3s)',
    'GoPlausible on-chain proof anchoring',
  ];

  const handleCopyTxId = () => {
    if (proof?.txId) {
      navigator.clipboard.writeText(proof.txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    setStep('signing');
    await new Promise(r => setTimeout(r, 1000));

    setStep('broadcasting');

    // Animate facilitator steps
    const steps: FacilitatorStep[] = FACILITATOR_STEPS.map(label => ({ label, done: false, active: false }));
    setFacilitatorSteps([...steps]);

    for (let i = 0; i < steps.length; i++) {
      setFacilitatorSteps(prev => prev.map((s, idx) => ({
        ...s,
        active: idx === i,
        done: idx < i,
      })));
      await new Promise(r => setTimeout(r, 320 + Math.random() * 150));
    }
    setFacilitatorSteps(prev => prev.map(s => ({ ...s, done: true, active: false })));
    await new Promise(r => setTimeout(r, 300));

    const nonce = 'nonce_pay_' + Date.now().toString(16);
    let result: X402Proof;

    if (selectedAsset === 'USDCa' && endpoint.priceUSDCa) {
      result = processAlgorandASAPayment(
        agent.algorandAccount,
        endpoint.recipientAddress,
        endpoint.priceUSDCa,
        nonce,
        endpoint.path
      );
    } else {
      result = processAlgorandX402Payment(
        agent.algorandAccount,
        endpoint.recipientAddress,
        endpoint.priceAlgo,
        nonce,
        endpoint.path,
        selectedAsset === 'USDCa' ? USDC_ASSET_ID : 0
      );
    }

    // Generate subscription token if supported
    let subToken: X402SubscriptionToken | undefined;
    if (endpoint.supportsSubscription && endpoint.rateLimit) {
      subToken = createSubscriptionToken(result, endpoint.path, endpoint.name, agent.id, endpoint.rateLimit);
      setSubscriptionToken(subToken);
    }

    setProof(result);
    onPaymentSuccess(result, subToken);
    setStep('success');
  };

  const handleClose = () => {
    setStep('confirm');
    setProof(null);
    setSubscriptionToken(null);
    setFacilitatorSteps([]);
    onClose();
  };

  const canPayUSDCa = endpoint.acceptedAssets?.includes('USDCa') && !!endpoint.priceUSDCa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-2xl border-cyan-500/40 overflow-hidden shadow-2xl shadow-cyan-950/40 max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">x402 Algorand Payment</h3>
          </div>
          {step !== 'signing' && step !== 'broadcasting' && (
            <button onClick={handleClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="flex h-1 bg-gray-900">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
            style={{
              width:
                step === 'confirm' ? '25%' :
                step === 'signing' ? '50%' :
                step === 'broadcasting' ? '75%' :
                '100%',
            }}
          />
        </div>

        <div className="p-6 space-y-5">

          {/* ─── STEP 1: CONFIRM ─── */}
          {step === 'confirm' && (
            <>
              {/* Asset Selector */}
              {canPayUSDCa && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Pay With
                  </label>
                  <div className="flex space-x-2">
                    {(['ALGO', 'USDCa'] as const).filter(a => endpoint.acceptedAssets?.includes(a)).map(asset => (
                      <button
                        key={asset}
                        onClick={() => setSelectedAsset(asset)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          selectedAsset === asset
                            ? asset === 'USDCa'
                              ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                              : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                            : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {asset === 'USDCa'
                          ? `💵 ${endpoint.priceUSDCa} USDCa`
                          : `⚡ ${endpoint.priceAlgo} ALGO`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Summary */}
              <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Accessing Service</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    selectedAsset === 'USDCa'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}>
                    HTTP 402 → {selectedAsset} Payment
                  </span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{endpoint.name}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{endpoint.path}</p>
                </div>
                <div className="flex items-baseline space-x-3 pt-1 border-t border-gray-800">
                  <span className="text-3xl font-extrabold text-white font-mono">{price}</span>
                  <span className={`text-lg font-bold ${selectedAsset === 'USDCa' ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {selectedAsset}
                  </span>
                  {selectedAsset === 'ALGO' && (
                    <span className="text-sm text-gray-400 font-mono">≈ ${usdValue} USD</span>
                  )}
                  {selectedAsset === 'USDCa' && (
                    <a
                      href={getASAExplorerUrl(USDC_ASSET_ID)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <span>ASA #{USDC_ASSET_ID}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                {endpoint.rateLimit && (
                  <div className="text-[10px] text-gray-500 flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>Grants {endpoint.rateLimit} API call{endpoint.rateLimit > 1 ? 's' : ''} after payment</span>
                    {endpoint.supportsSubscription && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        + Bearer Token
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Paying Wallet */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Paying Agent Wallet</span>
                </label>
                <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-xs">{agent.avatar} {agent.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{agent.algorandAccount.address.slice(0, 20)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono font-bold text-xs">{agent.algorandAccount.balanceAlgo} ALGO</p>
                    {selectedAsset === 'USDCa' && (
                      <p className="text-blue-400 font-mono font-bold text-xs">{agent.algorandAccount.balanceUSDCa} USDCa</p>
                    )}
                    <p className="text-[10px] text-gray-500">Available</p>
                  </div>
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recipient (Merchant)</span>
                </label>
                <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <p className="text-[11px] text-gray-300 font-mono break-all">{endpoint.recipientAddress}</p>
                </div>
              </div>

              {/* Fee breakdown */}
              <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                selectedAsset === 'USDCa'
                  ? 'bg-blue-950/30 border-blue-500/25'
                  : 'bg-emerald-950/30 border-emerald-500/25'
              }`}>
                <div className="flex justify-between text-gray-400">
                  <span>Service Fee</span>
                  <span className="font-mono text-white">{price} {selectedAsset}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Network Tx Fee</span>
                  <span className="font-mono text-gray-300">{networkFee}</span>
                </div>
                <div className={`flex justify-between font-bold border-t pt-1.5 ${
                  selectedAsset === 'USDCa' ? 'border-blue-500/20 text-blue-400' : 'border-emerald-500/20 text-emerald-400'
                }`}>
                  <span>Total Deducted</span>
                  <span className="font-mono">{selectedAsset === 'ALGO' ? `${(endpoint.priceAlgo + 0.001).toFixed(3)} ALGO` : `${price} USDCa + 0.001 ALGO`}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmPayment}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.01] transition-transform ${
                  selectedAsset === 'USDCa'
                    ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white shadow-blue-950/50'
                    : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-gray-950 shadow-cyan-950/50'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Authorize & Sign with {selectedAsset === 'USDCa' ? 'USDCa ASA' : 'Algorand'} Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-[10px] text-gray-500">
                Ed25519 signed, verified by GoPlausible Facilitator on Algorand Testnet.
              </p>
            </>
          )}

          {/* ─── STEP 2 & 3: SIGNING / BROADCASTING ─── */}
          {(step === 'signing' || step === 'broadcasting') && (
            <div className="py-6 flex flex-col items-center space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              </div>

              <div>
                <p className="font-bold text-white text-base">
                  {step === 'signing' ? '🔐 Ed25519 Signing...' : '📡 GoPlausible Facilitator'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {step === 'signing'
                    ? 'Agent keypair signing Algorand payment transaction with x402 note payload...'
                    : 'Broadcasting & verifying through GoPlausible on-chain facilitator...'}
                </p>
              </div>

              {/* Facilitator Pipeline Steps */}
              <div className="w-full space-y-1.5 text-xs font-mono">
                {/* Static: 402 challenge */}
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>HTTP 402 Challenge Received</span>
                </div>
                {/* Ed25519 */}
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                  step === 'signing'
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse'
                    : 'bg-gray-900 border-gray-800 text-emerald-300'
                }`}>
                  {step === 'broadcasting'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 flex-shrink-0" />}
                  <span>Ed25519 Wallet Signing</span>
                </div>
                {/* Facilitator Steps */}
                {step === 'broadcasting' && facilitatorSteps.map((fs, i) => (
                  <div
                    key={i}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                      fs.done
                        ? 'bg-gray-900 border-gray-800 text-emerald-300'
                        : fs.active
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse'
                        : 'bg-gray-900/50 border-gray-800/50 text-gray-600'
                    }`}
                  >
                    {fs.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      : <Loader2 className={`w-3.5 h-3.5 flex-shrink-0 ${fs.active ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />}
                    <span>{fs.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 4: SUCCESS ─── */}
          {step === 'success' && proof && (
            <>
              {/* Success Banner */}
              <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="font-extrabold text-white text-lg">Payment Successful!</p>
                <p className="text-xs text-emerald-300">
                  x402 proof verified — API access granted for <strong>{endpoint.name}</strong>
                </p>
                {proof.assetSymbol === 'USDCa' && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                    USDCa ASA Payment — GoPlausible Opt-in Verified
                  </span>
                )}
              </div>

              {/* Transaction Receipt */}
              <div className="space-y-2.5 text-xs font-mono">
                <p className="text-gray-400 font-sans font-bold uppercase tracking-wider text-[10px]">Transaction Receipt</p>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Algorand TxID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400">{proof.txId.slice(0, 14)}...</span>
                      <button onClick={handleCopyTxId} className="text-gray-400 hover:text-white transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copied && <span className="text-emerald-400 text-[10px]">Copied!</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Block Round:</span>
                    <span className="text-white">#{proof.blockRound}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className={`font-bold ${proof.assetSymbol === 'USDCa' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {proof.assetSymbol === 'USDCa' ? `${proof.amountUSDCa} USDCa` : `${proof.amountAlgo} ALGO`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Asset:</span>
                    <span className="text-gray-300">{proof.assetSymbol} (ID: {proof.assetId})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Facilitator:</span>
                    <span className="text-cyan-300">GoPlausible ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">On-Chain Verified:</span>
                    <span className="text-emerald-400">✓ Confirmed</span>
                  </div>
                  {endpoint.rateLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Calls Granted:</span>
                      <span className="text-purple-300">{endpoint.rateLimit} API calls</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof Header */}
              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-[10px] font-mono">
                <p className="text-gray-500 mb-1 font-sans">X-402-Proof Header:</p>
                <p className="text-purple-300 break-all leading-relaxed">{proof.proofHeader}</p>
              </div>

              {/* Subscription Token (if generated) */}
              {subscriptionToken && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                    <Key className="w-4 h-4" />
                    <span>Bearer Token Issued ({subscriptionToken.callsLimit} calls)</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-950 rounded-lg p-2 border border-gray-800">
                    <span className="font-mono text-[10px] text-gray-400 truncate">{subscriptionToken.tokenId}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(subscriptionToken.tokenId); }}
                      className="ml-2 flex-shrink-0 text-gray-500 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Expires: {new Date(subscriptionToken.expiresAt).toLocaleDateString()} · {subscriptionToken.callsLimit} calls included
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <a
                  href={getAlgorandExplorerUrl(proof.txId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View on Explorer</span>
                </a>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-extrabold text-xs flex items-center justify-center space-x-2"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Access API Payload</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
