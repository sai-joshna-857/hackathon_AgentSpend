import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AgentsView } from './components/AgentsView';
import { PoliciesView } from './components/PoliciesView';
import { SimulatorView } from './components/SimulatorView';
import { ApprovalQueueView } from './components/ApprovalQueueView';
import { AuditLedgerView } from './components/AuditLedgerView';
import { NodeView } from './components/NodeView';
import { X402ProjectView } from './components/X402ProjectView';
import { AlgorandExplorerModal } from './components/AlgorandExplorerModal';
import { NewAgentModal } from './components/NewAgentModal';

import { INITIAL_AGENTS, INITIAL_SERVICES, INITIAL_RULES, INITIAL_TRANSACTIONS } from './services/mockData';
import type { AIAgent, SpendPolicyRule, SpendingTransaction } from './types';
import { processAlgorandX402Payment } from './services/algorand';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AGENTS);
  const [services] = useState(INITIAL_SERVICES);
  const [rules, setRules] = useState<SpendPolicyRule[]>(INITIAL_RULES);
  const [transactions, setTransactions] = useState<SpendingTransaction[]>(INITIAL_TRANSACTIONS);

  // Modal states
  const [isNewAgentOpen, setIsNewAgentOpen] = useState(false);
  const [selectedTxForModal, setSelectedTxForModal] = useState<SpendingTransaction | null>(null);

  // Computed state
  const pendingTransactions = transactions.filter((t) => t.status === 'pending_approval');

  // Agent handlers
  const handleToggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          const nextStatus = agent.status === 'active' ? 'paused' : 'active';
          return { ...agent, status: nextStatus };
        }
        return agent;
      })
    );
  };

  const handleUpdateAgentLimit = (agentId: string, newLimitAlgo: number, newSingleLimitAlgo: number) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          return {
            ...agent,
            dailySpendLimitAlgo: newLimitAlgo,
            singleTxLimitAlgo: newSingleLimitAlgo,
          };
        }
        return agent;
      })
    );
  };

  const handleAgentCreated = (newAgent: AIAgent) => {
    setAgents((prev) => [newAgent, ...prev]);
  };

  // Policy Handlers
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    );
  };

  const handleUpdateRuleValue = (ruleId: string, newValue: number) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, value: newValue } : rule))
    );
  };

  // Transaction Handlers
  const handleTransactionCreated = (newTx: SpendingTransaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUpdateAgentSpent = (agentId: string, amountAlgo: number) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          return {
            ...agent,
            spentTodayAlgo: agent.spentTodayAlgo + amountAlgo,
            totalSpentAlgo: agent.totalSpentAlgo + amountAlgo,
            txCount: agent.txCount + 1,
            algorandAccount: {
              ...agent.algorandAccount,
              balanceAlgo: Math.max(0, agent.algorandAccount.balanceAlgo - amountAlgo),
            },
          };
        }
        return agent;
      })
    );
  };

  // Approval Queue Handlers
  const handleApprovePendingTx = (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    const agent = agents.find((a) => a.id === targetTx.agentId);

    // Generate real Algorand proof on approval
    const proof = processAlgorandX402Payment(
      agent ? agent.algorandAccount : {
        address: 'ALGO402SENDERDEFAULT1111111111111111111111111111111111',
        mnemonic: '',
        publicKeyHex: '',
        balanceAlgo: 100,
        balanceUSDCa: 100,
      },
      targetTx.x402Challenge?.headers['X-402-PayTo'] || 'ALGO402RECEIVERDEFAULT2222222222222222222222222222222222',
      targetTx.amountAlgo,
      targetTx.x402Challenge?.headers['X-402-Payment-Nonce'] || 'nonce_admin_approval',
      targetTx.serviceId
    );

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            status: 'approved',
            approver: 'Admin Governance Lead',
            approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            algorandProof: proof,
          };
        }
        return tx;
      })
    );

    if (agent) {
      handleUpdateAgentSpent(agent.id, targetTx.amountAlgo);
    }
  };

  const handleRejectPendingTx = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            status: 'rejected',
            policyEvaluation: {
              ...tx.policyEvaluation,
              reason: 'Rejected manually by Admin in Human-in-the-Loop review board',
            },
          };
        }
        return tx;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-gray-950">
      {/* Top Header Navigation */}
      <Navbar
        pendingApprovalsCount={pendingTransactions.length}
        onOpenExplorer={() => setActiveTab('node')}
        onOpenNewAgent={() => setIsNewAgentOpen(true)}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingApprovalsCount={pendingTransactions.length}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              agents={agents}
              transactions={transactions}
              onNavigateToSimulator={() => setActiveTab('simulator')}
              onNavigateToApprovals={() => setActiveTab('approvals')}
              pendingApprovalsCount={pendingTransactions.length}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              agents={agents}
              services={services}
              rules={rules}
              onTransactionCreated={handleTransactionCreated}
              onUpdateAgentSpent={handleUpdateAgentSpent}
            />
          )}

          {activeTab === 'x402-server' && (
            <X402ProjectView agents={agents} />
          )}

          {activeTab === 'agents' && (
            <AgentsView
              agents={agents}
              onToggleStatus={handleToggleAgentStatus}
              onUpdateLimit={handleUpdateAgentLimit}
              onOpenNewAgentModal={() => setIsNewAgentOpen(true)}
            />
          )}

          {activeTab === 'policies' && (
            <PoliciesView
              rules={rules}
              onToggleRule={handleToggleRule}
              onUpdateRuleValue={handleUpdateRuleValue}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalQueueView
              pendingTransactions={pendingTransactions}
              onApprove={handleApprovePendingTx}
              onReject={handleRejectPendingTx}
            />
          )}

          {activeTab === 'ledger' && (
            <AuditLedgerView
              transactions={transactions}
              onSelectTransaction={(tx) => setSelectedTxForModal(tx)}
            />
          )}

          {activeTab === 'node' && <NodeView />}
        </main>
      </div>

      {/* Modals */}
      <NewAgentModal
        isOpen={isNewAgentOpen}
        onClose={() => setIsNewAgentOpen(false)}
        onAgentCreated={handleAgentCreated}
      />

      <AlgorandExplorerModal
        transaction={selectedTxForModal}
        onClose={() => setSelectedTxForModal(null)}
      />
    </div>
  );
}

export default App;
