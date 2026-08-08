import React, { useState } from 'react';
import { X, Bot, Sparkles } from 'lucide-react';
import type { AIAgent } from '../types';
import { createAlgorandAccount } from '../services/algorand';

interface NewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: AIAgent) => void;
}

export const NewAgentModal: React.FC<NewAgentModalProps> = ({
  isOpen,
  onClose,
  onAgentCreated,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Autonomous Worker');
  const [description, setDescription] = useState('');
  const [dailyLimit, setDailyLimit] = useState<number>(20.0);
  const [singleLimit, setSingleLimit] = useState<number>(5.0);
  const [avatar, setAvatar] = useState('🤖');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate real Algorand account via algosdk generator
    const algoAccount = createAlgorandAccount();

    const newAgent: AIAgent = {
      id: 'agent-' + Date.now(),
      name: name.trim(),
      description: description.trim() || 'Autonomous AI Agent performing API calls under governance rules',
      avatar,
      role,
      algorandAccount: algoAccount,
      dailySpendLimitAlgo: dailyLimit,
      spentTodayAlgo: 0.0,
      singleTxLimitAlgo: singleLimit,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      totalSpentAlgo: 0.0,
      txCount: 0,
      whitelistedServices: ['service-openai', 'service-anthropic', 'service-serper'],
    };

    onAgentCreated(newAgent);
    onClose();

    // Reset
    setName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border-emerald-500/40 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-white">Provision New Autonomous AI Agent</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Agent Name & Emoji Avatar:</label>
            <div className="flex space-x-2">
              <select
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-base focus:outline-none"
              >
                <option value="🤖">🤖</option>
                <option value="⚡">⚡</option>
                <option value="🎨">🎨</option>
                <option value="🧠">🧠</option>
                <option value="🕸️">🕸️</option>
                <option value="⚙️">⚙️</option>
              </select>
              <input
                type="text"
                required
                placeholder="e.g. LLM Code Assistant Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Agent Role / Specialty:</label>
            <input
              type="text"
              required
              placeholder="e.g. Code Generation & Refactoring"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Description:</label>
            <textarea
              rows={2}
              placeholder="Brief description of the agent's task scope"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Daily Cap (ALGO):</label>
              <input
                type="number"
                min={1}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Max Single Tx (ALGO):</label>
              <input
                type="number"
                min={1}
                value={singleLimit}
                onChange={(e) => setSingleLimit(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px]">
              Submitting will automatically invoke Algorand <code className="font-mono">algosdk.generateAccount()</code> to provision an Ed25519 keypair address for this agent.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-bold"
            >
              Provision Agent on Algorand
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
