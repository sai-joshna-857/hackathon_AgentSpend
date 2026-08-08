import React, { useState } from 'react';
import {
  Bot,
  Sliders,
  ExternalLink,
  Plus,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import type { AIAgent } from '../types';
import { getAlgorandAccountExplorerUrl } from '../services/algorand';

interface AgentsViewProps {
  agents: AIAgent[];
  onToggleStatus: (agentId: string) => void;
  onUpdateLimit: (agentId: string, dailyLimitAlgo: number, singleLimitAlgo: number) => void;
  onOpenNewAgentModal: () => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  onToggleStatus,
  onUpdateLimit,
  onOpenNewAgentModal,
}) => {
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [tempDailyLimit, setTempDailyLimit] = useState<number>(0);
  const [tempSingleLimit, setTempSingleLimit] = useState<number>(0);

  const handleStartEdit = (agent: AIAgent) => {
    setEditingAgentId(agent.id);
    setTempDailyLimit(agent.dailySpendLimitAlgo);
    setTempSingleLimit(agent.singleTxLimitAlgo);
  };

  const handleSaveEdit = (agentId: string) => {
    onUpdateLimit(agentId, tempDailyLimit, tempSingleLimit);
    setEditingAgentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            <span>Autonomous AI Agents Registry & Algorand Accounts</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage spending limits, view provisioned Algorand Ed25519 addresses, and monitor daily spend ceilings
          </p>
        </div>

        <button
          onClick={onOpenNewAgentModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Agent</span>
        </button>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const isEditing = editingAgentId === agent.id;
          const usagePercent = Math.min(100, Math.round((agent.spentTodayAlgo / agent.dailySpendLimitAlgo) * 100));

          return (
            <div
              key={agent.id}
              className={`glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all ${
                agent.status === 'active'
                  ? 'border-gray-800 hover:border-emerald-500/40'
                  : 'border-red-500/30 bg-red-950/10'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-2xl shadow-inner">
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{agent.name}</h3>
                      <span className="text-xs text-gray-400">{agent.role}</span>
                    </div>
                  </div>

                  {/* Status Toggle Switch */}
                  <button
                    onClick={() => onToggleStatus(agent.id)}
                    className={`p-1 transition-colors ${
                      agent.status === 'active' ? 'text-emerald-400' : 'text-gray-600'
                    }`}
                    title={agent.status === 'active' ? 'Pause Agent' : 'Activate Agent'}
                  >
                    {agent.status === 'active' ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>

                {/* Algorand Wallet Address Badge */}
                <div className="mt-4 p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-semibold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Algorand Account:</span>
                    </span>
                    <a
                      href={getAlgorandAccountExplorerUrl(agent.algorandAccount.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-mono flex items-center space-x-1"
                    >
                      <span>{agent.algorandAccount.address.slice(0, 10)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-500">On-Chain Balance:</span>
                    <span className="text-white font-bold">{agent.algorandAccount.balanceAlgo} ALGO</span>
                  </div>
                </div>

                {/* Spend Limits & Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Daily Spend Today:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {agent.spentTodayAlgo.toFixed(1)} / {agent.dailySpendLimitAlgo} ALGO
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent > 85
                          ? 'bg-red-500'
                          : usagePercent > 60
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Edit Budget Controls Form */}
                {isEditing ? (
                  <div className="mt-4 p-3 rounded-xl bg-gray-900 border border-emerald-500/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400 text-[10px] block">Daily Cap (ALGO):</label>
                        <input
                          type="number"
                          value={tempDailyLimit}
                          onChange={(e) => setTempDailyLimit(Number(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] block">Max Single Tx:</label>
                        <input
                          type="number"
                          value={tempSingleLimit}
                          onChange={(e) => setTempSingleLimit(Number(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingAgentId(null)}
                        className="px-2.5 py-1 rounded bg-gray-800 text-gray-400 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(agent.id)}
                        className="px-3 py-1 rounded bg-emerald-500 text-gray-950 font-bold text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/80 pt-3">
                    <span>Single Tx Cap: <strong className="text-white font-mono">{agent.singleTxLimitAlgo} ALGO</strong></span>
                    <button
                      onClick={() => handleStartEdit(agent)}
                      className="text-gray-400 hover:text-emerald-400 flex items-center space-x-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Adjust Caps</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer Info */}
              <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>{agent.txCount} Executed Txs</span>
                <span>Total Spent: {agent.totalSpentAlgo.toFixed(1)} ALGO</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
