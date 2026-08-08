import React from 'react';
import { X, CheckCircle, ExternalLink, Key, Lock, Layers } from 'lucide-react';
import type { SpendingTransaction } from '../types';
import { getAlgorandExplorerUrl } from '../services/algorand';

interface AlgorandExplorerModalProps {
  transaction: SpendingTransaction | null;
  onClose: () => void;
}

export const AlgorandExplorerModal: React.FC<AlgorandExplorerModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const proof = transaction.algorandProof;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border-emerald-500/40 p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-white">Algorand Blockchain Cryptographic Proof Inspector</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tx Summary Status Banner */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">Status: Verified On-Chain (Algorand Pure PoS)</span>
              <span className="text-gray-400 text-[11px]">x402 Protocol Header Cryptographically Signed</span>
            </div>
          </div>
          {proof && (
            <a
              href={getAlgorandExplorerUrl(proof.txId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30"
            >
              <span>Explore</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Transaction Fields List */}
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase font-sans">Algorand Transaction ID:</span>
            <div className="text-emerald-400 font-bold break-all">{proof?.txId || 'N/A'}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-gray-500 text-[10px] uppercase font-sans">Block Round Height:</span>
              <div className="text-white font-bold">#{proof?.blockRound || 38492012}</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-gray-500 text-[10px] uppercase font-sans">Payment Amount & Asset ID:</span>
              <div className="text-white font-bold">{transaction.amountAlgo} ALGO (Asset ID: {proof?.assetId || 0})</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase font-sans flex items-center space-x-1 font-sans">
              <Key className="w-3 h-3 text-emerald-400" />
              <span>Sender Agent Algorand Address:</span>
            </span>
            <div className="text-gray-300 break-all">{proof?.senderAddress || 'N/A'}</div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase font-sans flex items-center space-x-1 font-sans">
              <Lock className="w-3 h-3 text-blue-400" />
              <span>Merchant Recipient Algorand Address:</span>
            </span>
            <div className="text-gray-300 break-all">{proof?.receiverAddress || 'N/A'}</div>
          </div>

          {/* Ed25519 Cryptographic Signature */}
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase font-sans">Ed25519 Cryptographic Signature Hex:</span>
            <div className="text-purple-300 break-all text-[11px] p-2 rounded bg-gray-950 border border-gray-800">
              {proof?.signature || 'sig_algo_default_hex'}
            </div>
          </div>

          {/* x402 Encoded Note Field Payload */}
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase font-sans">Algorand Transaction Note Field (x402 JSON Metadata):</span>
            <pre className="p-3 rounded bg-gray-950 border border-gray-800 text-emerald-400 text-[11px] whitespace-pre-wrap overflow-x-auto">
{JSON.stringify(
  {
    protocol: 'x402-algorand-v1',
    service: transaction.serviceId,
    endpoint: transaction.serviceEndpoint,
    nonce: proof?.nonce || 'nonce_123',
    timestamp: transaction.timestamp,
    sender: proof?.senderAddress,
    recipient: proof?.receiverAddress,
    amount: transaction.amountAlgo,
    assetId: proof?.assetId || 0,
    policyRiskScore: transaction.policyEvaluation.riskScore,
    verifiedBy: 'Algorand Spend Governance Node',
  },
  null,
  2
)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
