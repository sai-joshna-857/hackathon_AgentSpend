import React, { useState } from 'react';
import { FileCode2, Search, ExternalLink, Eye, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import type { SpendingTransaction } from '../types';
import { getAlgorandExplorerUrl } from '../services/algorand';

interface AuditLedgerViewProps {
  transactions: SpendingTransaction[];
  onSelectTransaction: (tx: SpendingTransaction) => void;
}

type LedgerTab = 'transactions' | 'x402-proofs';

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>('transactions');
  const [expandedProofId, setExpandedProofId] = useState<string | null>(null);
  const [assetFilter, setAssetFilter] = useState<string>('all');

  const filteredTx = transactions.filter(tx => {
    const matchesSearch =
      tx.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.algorandProof?.txId && tx.algorandProof.txId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // x402 proof log — only transactions that have an algorandProof
  const proofTxs = transactions
    .filter(tx => tx.algorandProof)
    .filter(tx => {
      const matchesSearch =
        tx.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.algorandProof?.txId && tx.algorandProof.txId.includes(searchTerm));
      const matchesAsset = assetFilter === 'all' || tx.algorandProof?.assetSymbol === assetFilter;
      return matchesSearch && matchesAsset;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <FileCode2 className="w-6 h-6 text-emerald-400" />
          <span>Algorand Audit Vault & x402 Ledger</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Cryptographically immutable audit trail of all agent spend authorizations and x402 on-chain proofs
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center space-x-2">
        {([
          { id: 'transactions', label: `All Transactions (${transactions.length})` },
          { id: 'x402-proofs', label: `x402 Proof Log (${proofTxs.length})` },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setLedgerTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              ledgerTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Agent, Service, or Tx Hash..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {ledgerTab === 'transactions' && (
            <>
              <span className="text-xs text-gray-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All ({transactions.length})</option>
                <option value="approved">Approved</option>
                <option value="pending_approval">Pending HITL</option>
                <option value="blocked">Blocked</option>
              </select>
            </>
          )}
          {ledgerTab === 'x402-proofs' && (
            <>
              <span className="text-xs text-gray-400 font-medium">Asset:</span>
              <select
                value={assetFilter}
                onChange={e => setAssetFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Assets</option>
                <option value="ALGO">ALGO</option>
                <option value="USDCa">USDCa</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* ─── Tab: All Transactions ─── */}
      {ledgerTab === 'transactions' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/90 text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">AI Agent</th>
                  <th className="px-4 py-3">Target Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Algorand TxID & Block</th>
                  <th className="px-4 py-3">Policy Audit</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-sans whitespace-nowrap">{tx.timestamp}</td>
                    <td className="px-4 py-3 text-white font-sans font-medium">{tx.agentName}</td>
                    <td className="px-4 py-3 text-gray-300 font-sans">
                      <div>{tx.serviceName}</div>
                      <div className="text-[10px] text-gray-500">{tx.serviceEndpoint}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`font-bold ${tx.assetSymbol === 'USDCa' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {tx.amountAlgo} {tx.assetSymbol || 'ALGO'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tx.algorandProof ? (
                        <div className="space-y-0.5">
                          <a
                            href={getAlgorandExplorerUrl(tx.algorandProof.txId)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-1 text-emerald-400 hover:underline"
                          >
                            <span>{tx.algorandProof.txId.slice(0, 12)}...</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <div className="text-[10px] text-gray-500">Block #{tx.algorandProof.blockRound}</div>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-sans">Not Broadcasted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {tx.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">APPROVED</span>
                      )}
                      {tx.status === 'pending_approval' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">PENDING HITL</span>
                      )}
                      {tx.status === 'blocked' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">BLOCKED</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectTransaction(tx)}
                        className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-emerald-400 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Tab: x402 Proof Log ─── */}
      {ledgerTab === 'x402-proofs' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">x402 On-Chain Proof Registry</span>
            <span className="text-xs text-gray-500">— All proofs anchored via GoPlausible Facilitator</span>
          </div>
          {proofTxs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No x402 proofs recorded yet.</p>
              <p className="text-xs mt-1">Run the simulator or use the Payment Tester to generate proofs.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {proofTxs.map(tx => {
                const proof = tx.algorandProof!;
                const isExpanded = expandedProofId === tx.id;
                return (
                  <div key={tx.id}>
                    <div
                      className="px-4 py-3 hover:bg-gray-900/40 cursor-pointer transition-colors"
                      onClick={() => setExpandedProofId(isExpanded ? null : tx.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            proof.assetSymbol === 'USDCa' ? 'bg-blue-400' : 'bg-emerald-400'
                          }`} />
                          <div>
                            <div className="text-xs font-mono text-white">{proof.txId.slice(0, 24)}...</div>
                            <div className="text-[10px] text-gray-500">{tx.agentName} → {tx.serviceName}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`font-mono font-bold text-xs ${proof.assetSymbol === 'USDCa' ? 'text-blue-300' : 'text-emerald-300'}`}>
                            {proof.assetSymbol === 'USDCa' && proof.amountUSDCa
                              ? `${proof.amountUSDCa} USDCa`
                              : `${proof.amountAlgo} ALGO`}
                          </span>
                          <span className="text-gray-500 text-[10px] font-mono">Block #{proof.blockRound}</span>
                          <a
                            href={getAlgorandExplorerUrl(proof.txId)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-gray-500 hover:text-cyan-400"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-950/60 space-y-2">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider pt-2 mb-2">X-402-Proof Header</div>
                        <div className="p-3 rounded-xl bg-gray-900 border border-purple-500/30 font-mono text-[10px] text-purple-300 break-all leading-relaxed">
                          {proof.proofHeader || `Algorand-TxId txid="${proof.txId}", sig="${proof.signature?.slice(0, 20)}...", nonce="${proof.nonce}", block="${proof.blockRound}", asset="${proof.assetId}"`}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                            <span className="text-gray-500">Asset Symbol: </span>
                            <span className={proof.assetSymbol === 'USDCa' ? 'text-blue-300' : 'text-emerald-300'}>{proof.assetSymbol}</span>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                            <span className="text-gray-500">Asset ID: </span>
                            <span className="text-white">{proof.assetId}</span>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                            <span className="text-gray-500">On-chain: </span>
                            <span className="text-emerald-400">{proof.verifiedOnChain ? '✓ Verified' : '✗ Pending'}</span>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                            <span className="text-gray-500">Facilitator: </span>
                            <span className="text-cyan-300">{proof.facilitatorConfirmed ? '✓ GoPlausible' : 'Pending'}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Sender: <span className="text-gray-300 font-mono">{proof.senderAddress.slice(0, 30)}...</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
