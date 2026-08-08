import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Clock, ExternalLink, Server, Zap, TrendingUp, RefreshCw } from 'lucide-react';
import type { FacilitatorCallLog } from '../types';
import { getAlgorandExplorerUrl } from '../services/algorand';

interface FacilitatorDashboardProps {
  callLogs: FacilitatorCallLog[];
}

const MOCK_INITIAL_LOGS: FacilitatorCallLog[] = [
  {
    id: 'fcl_init_1',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    endpoint: '/api/analytics',
    assetSymbol: 'ALGO',
    amount: 1.5,
    txId: 'ANALYTICSALGO1TXABCDE12345FGHIJ67890KLMNOPQRST',
    blockRound: 38491920,
    latencyMs: 890,
    status: 'verified',
    facilitatorNode: 'goplausible-node-2.algo.network',
    steps: [
      { label: 'Ed25519 signature verification', status: 'done', durationMs: 180 },
      { label: 'Account balance check', status: 'done', durationMs: 140 },
      { label: 'Transaction broadcast', status: 'done', durationMs: 200 },
      { label: 'Block confirmation', status: 'done', durationMs: 160 },
      { label: 'On-chain proof anchoring', status: 'done', durationMs: 100 },
    ],
  },
  {
    id: 'fcl_init_2',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    endpoint: '/api/ai-analysis',
    assetSymbol: 'USDCa',
    amount: 0.75,
    txId: 'AIANALYSISUSDCA2TXABCDE12345FGHIJ67890KLMNOPQRST',
    blockRound: 38491860,
    latencyMs: 1120,
    status: 'verified',
    facilitatorNode: 'goplausible-node-1.algo.network',
    steps: [
      { label: 'Ed25519 signature verification', status: 'done', durationMs: 180 },
      { label: 'Account balance check', status: 'done', durationMs: 140 },
      { label: 'ASA opt-in verification (USDCa)', status: 'done', durationMs: 120 },
      { label: 'Transaction broadcast', status: 'done', durationMs: 200 },
      { label: 'Block confirmation', status: 'done', durationMs: 160 },
      { label: 'On-chain proof anchoring', status: 'done', durationMs: 100 },
    ],
  },
  {
    id: 'fcl_init_3',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    endpoint: '/api/weather',
    assetSymbol: 'ALGO',
    amount: 0.5,
    txId: 'WEATHERALGO3TXABCDE12345FGHIJ67890KLMNOPQRST',
    blockRound: 38491800,
    latencyMs: 760,
    status: 'verified',
    facilitatorNode: 'goplausible-node-3.algo.network',
    steps: [
      { label: 'Ed25519 signature verification', status: 'done', durationMs: 180 },
      { label: 'Account balance check', status: 'done', durationMs: 140 },
      { label: 'Transaction broadcast', status: 'done', durationMs: 200 },
      { label: 'Block confirmation', status: 'done', durationMs: 160 },
      { label: 'On-chain proof anchoring', status: 'done', durationMs: 100 },
    ],
  },
];

export const FacilitatorDashboard: React.FC<FacilitatorDashboardProps> = ({ callLogs: externalLogs }) => {
  const [allLogs, setAllLogs] = useState<FacilitatorCallLog[]>([...MOCK_INITIAL_LOGS]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    // Merge external logs (from payments made during this session) with initial mock logs
    const existingIds = new Set(allLogs.map(l => l.id));
    const newExternal = externalLogs.filter(l => !existingIds.has(l.id));
    if (newExternal.length > 0) {
      setAllLogs(prev => [...newExternal, ...prev]);
    }
  }, [externalLogs]);

  const totalVolume = allLogs.reduce((sum, l) => sum + l.amount, 0);
  const avgLatency = allLogs.length ? Math.round(allLogs.reduce((s, l) => s + l.latencyMs, 0) / allLogs.length) : 0;
  const successRate = allLogs.length ? Math.round((allLogs.filter(l => l.status === 'verified').length / allLogs.length) * 100) : 0;
  const algoVolume = allLogs.filter(l => l.assetSymbol === 'ALGO').reduce((s, l) => s + l.amount, 0);
  const usdcVolume = allLogs.filter(l => l.assetSymbol === 'USDCa').reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>GoPlausible Facilitator — Live Call Log</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Real-time x402 verification pipeline: Ed25519 → Balance Check → Broadcast → Block Confirm → Proof Anchor
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Proofs Verified', value: allLogs.length, unit: '', color: 'text-cyan-300', icon: CheckCircle2 },
          { label: 'Avg Latency', value: avgLatency, unit: 'ms', color: 'text-purple-300', icon: Clock },
          { label: 'Success Rate', value: successRate, unit: '%', color: 'text-emerald-300', icon: TrendingUp },
          { label: 'Total Volume', value: totalVolume.toFixed(2), unit: ' ALGO', color: 'text-yellow-300', icon: Zap },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-4 rounded-xl">
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
            <div className={`text-xl font-extrabold ${stat.color}`}>
              {stat.value}{stat.unit}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Asset Volume Breakdown */}
      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Asset Volume Split</span>
          <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-300">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-400 font-semibold">ALGO</span>
              <span className="text-white font-mono">{algoVolume.toFixed(2)} ALGO</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${totalVolume ? (algoVolume / totalVolume) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400 font-semibold">USDCa</span>
              <span className="text-white font-mono">{usdcVolume.toFixed(2)} USDCa</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-400"
                style={{ width: `${totalVolume ? (usdcVolume / totalVolume) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Call Log Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Facilitator Call History ({allLogs.length})</span>
          </span>
        </div>
        <div className="divide-y divide-gray-800/60">
          {allLogs.map(log => (
            <div key={log.id}>
              <div
                className="px-4 py-3 hover:bg-gray-900/60 cursor-pointer transition-colors"
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'verified' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div>
                      <div className="text-sm font-mono font-bold text-white">{log.endpoint}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{log.txId.slice(0, 20)}...</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={`font-bold font-mono ${log.assetSymbol === 'USDCa' ? 'text-blue-300' : 'text-emerald-300'}`}>
                      {log.amount} {log.assetSymbol}
                    </span>
                    <span className="text-purple-300 font-mono">{log.latencyMs}ms</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      log.status === 'verified'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                    <a
                      href={getAlgorandExplorerUrl(log.txId)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-gray-500 hover:text-cyan-400"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Expanded Pipeline Trace */}
              {expandedLogId === log.id && (
                <div className="px-4 pb-4 bg-gray-950/50 space-y-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider pt-2">GoPlausible Verification Pipeline</div>
                  <div className="space-y-1.5">
                    {log.steps.map((step, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300 flex-1">{step.label}</span>
                        <span className="text-[10px] font-mono text-purple-300">{step.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                      <span className="text-gray-500">Block Round: </span>
                      <span className="text-emerald-300">#{log.blockRound}</span>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                      <span className="text-gray-500">Node: </span>
                      <span className="text-cyan-300">{log.facilitatorNode.split('.')[0]}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
