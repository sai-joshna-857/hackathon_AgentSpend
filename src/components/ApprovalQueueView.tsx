import React from 'react';
import { CheckSquare, CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SpendingTransaction } from '../types';

interface ApprovalQueueViewProps {
  pendingTransactions: SpendingTransaction[];
  onApprove: (txId: string) => void;
  onReject: (txId: string) => void;
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({
  pendingTransactions,
  onApprove,
  onReject,
}) => {
  const handleApprove = (txId: string) => {
    onApprove(txId);
    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <CheckSquare className="w-6 h-6 text-amber-400" />
          <span>Human-in-the-Loop (HITL) Spend Approval Queue</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          High-value or elevated risk agent spending requests held in escrow awaiting administrative cryptographic authorization
        </p>
      </div>

      {pendingTransactions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Approval Queue Clear</h3>
          <p className="text-xs text-gray-400 mt-1">
            All AI agent API payment challenges have been processed or auto-settled via Algorand policy rules.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTransactions.map((tx) => (
            <div
              key={tx.id}
              className="glass-panel p-6 rounded-2xl border-amber-500/30 glass-card-amber flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    Requires Admin Review
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Risk Score: {tx.policyEvaluation.riskScore}/100</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{tx.agentName}</h3>
                    <p className="text-xs text-gray-400">Requesting access to: <strong className="text-gray-200">{tx.serviceName}</strong></p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs space-y-1 font-mono">
                  <div className="text-amber-300 font-sans font-semibold mb-1">
                    Trigger Reason: {tx.policyEvaluation.reason}
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Endpoint:</span>
                    <span className="text-blue-400">{tx.serviceEndpoint}</span>
                  </div>
                </div>
              </div>

              {/* Price & Action Control Box */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-800">
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-white font-mono">{tx.amountAlgo} ALGO</span>
                  <span className="text-xs text-gray-400 block font-mono">(${tx.amountUsd} USD)</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => onReject(tx.id)}
                    className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApprove(tx.id)}
                    className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Authorize & Settle on Algorand</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
