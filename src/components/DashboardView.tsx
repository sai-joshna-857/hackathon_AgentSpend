import React from 'react';
import {
  DollarSign,
  Bot,
  ShieldCheck,
  Zap,
  AlertTriangle,
  ExternalLink,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { AIAgent, SpendingTransaction } from '../types';
import { getAlgorandExplorerUrl } from '../services/algorand';

interface DashboardViewProps {
  agents: AIAgent[];
  transactions: SpendingTransaction[];
  onNavigateToSimulator: () => void;
  onNavigateToApprovals: () => void;
  pendingApprovalsCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agents,
  transactions,
  onNavigateToSimulator,
  onNavigateToApprovals,
  pendingApprovalsCount,
}) => {
  const totalSpentTodayAlgo = agents.reduce((acc, curr) => acc + curr.spentTodayAlgo, 0);
  const totalDailyLimitAlgo = agents.reduce((acc, curr) => acc + curr.dailySpendLimitAlgo, 0);
  const activeAgentsCount = agents.filter((a) => a.status === 'active').length;
  const totalBlockedCount = transactions.filter((t) => t.status === 'blocked').length;
  const approvedTxCount = transactions.filter((t) => t.status === 'approved').length;

  // Chart data 1: Agent Daily Spend vs Daily Limit
  const agentChartData = agents.map((agent) => ({
    name: agent.name.split(' ')[0],
    spent: agent.spentTodayAlgo,
    limit: agent.dailySpendLimitAlgo,
  }));

  // Chart data 2: Category breakdown
  const categoryMap: { [key: string]: number } = {
    'LLM & Reasoning': 35.5,
    'Infrastructure': 63.0,
    'Computer Vision': 18.0,
    'Data Mining': 9.5,
  };
  const categoryChartData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  const COLORS = ['#00eb88', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Call to Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-emerald-950/60 to-gray-900 border border-emerald-500/30 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Algorand x402 Security Engine Online</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Autonomous Agent Financial Governance
            </h2>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              Intercepting, authorizing, and auditing AI agent spend calls. All transactions verified via cryptographic Ed25519 x402 payment headers on Algorand.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {pendingApprovalsCount > 0 && (
              <button
                onClick={onNavigateToApprovals}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all font-semibold text-sm animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{pendingApprovalsCount} Approvals Pending</span>
              </button>
            )}
            <button
              onClick={onNavigateToSimulator}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Test x402 Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spent Today */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Spent Today
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {totalSpentTodayAlgo.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-emerald-400">ALGO</span>
            <span className="text-xs text-gray-400 font-mono">
              (~${(totalSpentTodayAlgo * 0.3).toFixed(2)} USD)
            </span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Limit: {totalDailyLimitAlgo} ALGO</span>
              <span>{((totalSpentTodayAlgo / totalDailyLimitAlgo) * 100).toFixed(0)}% Utilized</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalSpentTodayAlgo / totalDailyLimitAlgo) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Active AI Agents */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Registered AI Agents
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {agents.length}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {activeAgentsCount} Active
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400 flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>5 Wallets Provisioned on Algorand</span>
          </p>
        </div>

        {/* Card 3: Violations Blocked */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover glass-card-red">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Policy Violations Blocked
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-red-400 font-mono">
              {totalBlockedCount}
            </span>
            <span className="text-xs text-gray-400">Attempts Prevented</span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Unapproved domains & over-budget limits caught
          </p>
        </div>

        {/* Card 4: Algorand x402 Settlements */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              On-Chain x402 Proofs
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-purple-400 font-mono">
              {approvedTxCount}
            </span>
            <span className="text-xs text-gray-400">Settled on Algorand</span>
          </div>
          <p className="mt-3 text-xs text-gray-400 flex items-center space-x-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Avg Block Time: ~3.3s</span>
          </p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Agent Spend vs Daily Cap */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Daily Spend by AI Agent</h3>
              <p className="text-xs text-gray-400">Comparing current daily usage vs authorized ceiling in ALGO</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Spent</span>
              </span>
              <span className="flex items-center space-x-1.5 text-gray-400">
                <span className="w-3 h-3 rounded bg-gray-700"></span>
                <span>Limit</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agentChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                style={{ background: 'transparent' }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    borderColor: '#30363d',
                    borderRadius: '12px',
                    color: '#e6edf3',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                  labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
                  itemStyle={{ color: '#00eb88' }}
                />
                <Bar dataKey="spent" fill="#00eb88" radius={[4, 4, 0, 0]} />
                <Bar dataKey="limit" fill="#2d3748" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Service Category Distribution</h3>
            <p className="text-xs text-gray-400">Algorand x402 spend split by API service type</p>

            <div className="h-48 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{ background: 'transparent' }}>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1117',
                      borderColor: '#30363d',
                      borderRadius: '8px',
                      color: '#e6edf3',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    }}
                    itemStyle={{ color: '#e6edf3' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {categoryChartData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center space-x-2 text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Transaction Feed Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Recent x402 Agent Spend Stream</h3>
            <p className="text-xs text-gray-400">Real-time authorized payment transactions settled on Algorand</p>
          </div>
          <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>LIVE FEED</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Target API Service</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Policy Result</th>
                <th className="px-4 py-3">Algorand Tx Proof</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-4 py-3 font-sans font-medium text-white flex items-center space-x-2">
                    <span className="text-base">{agents.find((a) => a.id === tx.agentId)?.avatar || '🤖'}</span>
                    <span>{tx.agentName}</span>
                  </td>
                  <td className="px-4 py-3 font-sans text-gray-300">
                    <div>{tx.serviceName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{tx.serviceEndpoint}</div>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">
                    {tx.amountAlgo} ALGO
                  </td>
                  <td className="px-4 py-3 font-sans">
                    {tx.status === 'approved' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        APPROVED
                      </span>
                    )}
                    {tx.status === 'pending_approval' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        PENDING HITL
                      </span>
                    )}
                    {tx.status === 'blocked' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                        BLOCKED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {tx.algorandProof ? (
                      <a
                        href={getAlgorandExplorerUrl(tx.algorandProof.txId)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 text-emerald-400 hover:underline"
                      >
                        <span>{tx.algorandProof.txId.slice(0, 10)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-600">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{tx.timestamp.split(' ')[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
