import React, { useState, useEffect } from 'react';
import { Blocks, Server, RefreshCw } from 'lucide-react';
import { generateRecentAlgorandBlocks } from '../services/algorand';
import type { AlgorandBlock } from '../types';

export const NodeView: React.FC = () => {
  const [blocks, setBlocks] = useState<AlgorandBlock[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setBlocks(generateRecentAlgorandBlocks());
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setBlocks(generateRecentAlgorandBlocks());
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Blocks className="w-6 h-6 text-emerald-400" />
            <span>Algorand Blockchain Node & x402 Escrow Spec</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time consensus ledger status, Pure Proof-of-Stake parameters, and x402 smart contract verification endpoints
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-emerald-400 text-xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Ledger Blocks</span>
        </button>
      </div>

      {/* Node Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
            Consensus Mechanism
          </span>
          <div className="text-lg font-bold text-white">Pure Proof-of-Stake</div>
          <span className="text-xs text-emerald-400">Algorand Mainnet / Testnet</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
            Network Min Fee
          </span>
          <div className="text-lg font-bold text-emerald-400 font-mono">0.001 ALGO</div>
          <span className="text-xs text-gray-400">1,000 MicroAlgos per tx</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
            Block Finality Latency
          </span>
          <div className="text-lg font-bold text-purple-400 font-mono">~3.3 Seconds</div>
          <span className="text-xs text-gray-400">Instant Finality (No Forking)</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
            x402 Spec Standard
          </span>
          <div className="text-lg font-bold text-cyan-400 font-mono">v1.0.4-Algorand</div>
          <span className="text-xs text-gray-400">Ed25519 Signed Proofs</span>
        </div>
      </div>

      {/* Recent Algorand Blocks Queue */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <span>Live Algorand Ledger Block Stream</span>
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {blocks.map((block) => (
            <div
              key={block.round}
              className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  Block #{block.round}
                </span>
                <span className="text-gray-400 text-[11px] truncate max-w-xs">{block.hash}</span>
              </div>

              <div className="flex items-center space-x-4 text-gray-400 text-[11px]">
                <span>{block.txCount} x402 Txs</span>
                <span>Proposer: {block.proposer}</span>
                <span className="text-gray-500">{block.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
