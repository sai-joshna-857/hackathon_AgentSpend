import React from 'react';
import {
  LayoutDashboard,
  Bot,
  ShieldAlert,
  Zap,
  CheckSquare,
  FileCode2,
  Blocks,
  Sparkles,
  Code,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'agents' | 'policies' | 'simulator' | 'approvals' | 'ledger' | 'node' | 'x402-server';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'simulator' as ActiveTab, label: 'x402 Spend Simulator', icon: Zap, badge: 'TEST WORKFLOW' },
    { id: 'x402-server' as ActiveTab, label: 'x402 Starter Kit Server', icon: Code, badge: 'GITHUB REPO' },
    { id: 'agents' as ActiveTab, label: 'AI Agents Registry', icon: Bot },
    { id: 'policies' as ActiveTab, label: 'Spend Governance Rules', icon: ShieldAlert },
    {
      id: 'approvals' as ActiveTab,
      label: 'Human Approval Queue',
      icon: CheckSquare,
      countBadge: pendingApprovalsCount,
    },
    { id: 'ledger' as ActiveTab, label: 'Algorand Audit Ledger', icon: FileCode2 },
    { id: 'node' as ActiveTab, label: 'Algorand Node & Escrow', icon: Blocks },
  ];

  return (
    <aside className="w-full md:w-64 bg-gray-950/60 border-r border-gray-800/80 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Navigation Group Header */}
        <div>
          <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            Governance & Control
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-950/40'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.countBadge !== undefined && item.countBadge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-gray-950 animate-pulse">
                      {item.countBadge}
                    </span>
                  )}

                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mandatory Algorand x402 Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-gray-900 to-emerald-950/40 border border-emerald-500/20">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>x402 Protocol Standard</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            All agent payment challenges evaluate rules & emit signed Algorand blockchain payment proofs on-chain.
          </p>
        </div>
      </div>

      {/* Network Footer Info */}
      <div className="pt-4 border-t border-gray-800/80">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Algorand Consensus:</span>
          <span className="text-emerald-400 font-mono">Pure Proof of Stake</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Settlement Time:</span>
          <span className="text-gray-300 font-mono">~3.3s</span>
        </div>
      </div>
    </aside>
  );
};
