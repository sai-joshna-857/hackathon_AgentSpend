import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AIAgent, APIServiceOption, SpendPolicyRule, SpendingTransaction, X402Challenge, X402Proof } from '../types';
import { evaluateAgentSpendPolicy } from '../services/policyEngine';
import { createX402Challenge, formatX402ProofHeader } from '../services/x402Protocol';
import { processAlgorandX402Payment, getAlgorandExplorerUrl } from '../services/algorand';

interface SimulatorViewProps {
  agents: AIAgent[];
  services: APIServiceOption[];
  rules: SpendPolicyRule[];
  onTransactionCreated: (tx: SpendingTransaction) => void;
  onUpdateAgentSpent: (agentId: string, amountAlgo: number) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  agents,
  services,
  rules,
  onTransactionCreated,
  onUpdateAgentSpent,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Workflow step results state
  const [stepChallenge, setStepChallenge] = useState<X402Challenge | null>(null);
  const [stepPolicyResult, setStepPolicyResult] = useState<any | null>(null);
  const [stepProof, setStepProof] = useState<X402Proof | null>(null);
  const [stepFinalTx, setStepFinalTx] = useState<SpendingTransaction | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleRunSimulator = async () => {
    if (!selectedAgent || !selectedService) return;

    setIsRunning(true);
    setActiveStep(1);
    setStepChallenge(null);
    setStepPolicyResult(null);
    setStepProof(null);
    setStepFinalTx(null);

    // Step 1: Agent Dispatch
    await new Promise((res) => setTimeout(res, 600));
    setActiveStep(2);

    // Step 2: Service responds 402 Payment Required
    const challenge = createX402Challenge(selectedService);
    setStepChallenge(challenge);
    await new Promise((res) => setTimeout(res, 800));
    setActiveStep(3);

    // Step 3: Policy Engine Evaluation
    const policyResult = evaluateAgentSpendPolicy(
      selectedAgent,
      selectedService,
      selectedService.costAlgo,
      rules
    );
    setStepPolicyResult(policyResult);
    await new Promise((res) => setTimeout(res, 900));

    if (policyResult.recommendation === 'BLOCK') {
      const blockedTx: SpendingTransaction = {
        id: 'tx-sim-' + Date.now(),
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceEndpoint: selectedService.endpoint,
        amountAlgo: selectedService.costAlgo,
        amountUsd: selectedService.costUsd,
        assetSymbol: 'ALGO',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'blocked',
        policyEvaluation: policyResult,
        x402Challenge: challenge,
      };
      setStepFinalTx(blockedTx);
      onTransactionCreated(blockedTx);
      setIsRunning(false);
      return;
    }

    if (policyResult.recommendation === 'FLAG_FOR_HITL') {
      const hitlTx: SpendingTransaction = {
        id: 'tx-sim-' + Date.now(),
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceEndpoint: selectedService.endpoint,
        amountAlgo: selectedService.costAlgo,
        amountUsd: selectedService.costUsd,
        assetSymbol: 'ALGO',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'pending_approval',
        policyEvaluation: policyResult,
        x402Challenge: challenge,
      };
      setStepFinalTx(hitlTx);
      onTransactionCreated(hitlTx);
      setIsRunning(false);
      return;
    }

    // If APPROVED -> Proceed to Step 4 & 5: Algorand Blockchain Payment Settlement
    setActiveStep(4);
    await new Promise((res) => setTimeout(res, 900));

    const proof = processAlgorandX402Payment(
      selectedAgent.algorandAccount,
      selectedService.recipientAlgoAddress,
      selectedService.costAlgo,
      challenge.headers['X-402-Payment-Nonce'],
      selectedService.id
    );
    setStepProof(proof);

    setActiveStep(5);
    await new Promise((res) => setTimeout(res, 800));

    // Step 6: 200 OK Service Release
    setActiveStep(6);
    const approvedTx: SpendingTransaction = {
      id: 'tx-sim-' + Date.now(),
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceEndpoint: selectedService.endpoint,
      amountAlgo: selectedService.costAlgo,
      amountUsd: selectedService.costUsd,
      assetSymbol: 'ALGO',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'approved',
      policyEvaluation: policyResult,
      x402Challenge: challenge,
      algorandProof: proof,
    };

    setStepFinalTx(approvedTx);
    onTransactionCreated(approvedTx);
    onUpdateAgentSpent(selectedAgent.id, selectedService.costAlgo);
    setIsRunning(false);

    // Fire success celebration confetti
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          <span>Interactive x402 Algorand Spend Sandbox</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Simulate an AI Agent attempting to call a paid API service, triggering HTTP 402, Policy Authorization, and Algorand Blockchain Payment Settlement.
        </p>
      </div>

      {/* Configuration Control Card */}
      <div className="glass-panel p-6 rounded-2xl border-emerald-500/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select AI Agent */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center space-x-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>1. Select AI Agent</span>
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white font-medium text-sm focus:border-emerald-500 focus:outline-none"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.avatar} {agent.name} (Limit: {agent.dailySpendLimitAlgo} ALGO / Spent: {agent.spentTodayAlgo} ALGO)
                </option>
              ))}
            </select>

            {selectedAgent && (
              <div className="mt-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Algorand Wallet:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedAgent.algorandAccount.address.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Current Balance:</span>
                  <span className="font-mono text-white">{selectedAgent.algorandAccount.balanceAlgo} ALGO</span>
                </div>
              </div>
            )}
          </div>

          {/* Select API Service */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>2. Select Target API Service</span>
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white font-medium text-sm focus:border-blue-500 focus:outline-none"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} — {srv.costAlgo} ALGO (${srv.costUsd}) [{srv.riskLevel.toUpperCase()} RISK]
                </option>
              ))}
            </select>

            {selectedService && (
              <div className="mt-3 p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Endpoint URL:</span>
                  <span className="font-mono text-blue-300">{selectedService.endpoint}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>x402 Merchant Receiver:</span>
                  <span className="font-mono text-gray-300">{selectedService.recipientAlgoAddress.slice(0, 12)}...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Run Simulator Trigger Button */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleRunSimulator}
            disabled={isRunning}
            className={`flex items-center space-x-3 px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-xl transition-all ${
              isRunning
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-gray-950 hover:scale-[1.02] shadow-emerald-950/50'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Executing Algorand x402 Protocol Flow...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>Execute Agent Spend Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6-Step Visual Execution Pipeline */}
      {activeStep > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Code className="w-5 h-5 text-purple-400" />
            <span>Live x402 Execution Pipeline & Algorand Ledger Settlement</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: 1, label: '1. API Dispatch', desc: 'POST Request sent' },
              { step: 2, label: '2. HTTP 402', desc: 'Payment challenge' },
              { step: 3, label: '3. Policy Check', desc: 'Rules & Risk eval' },
              { step: 4, label: '4. Algorand Tx', desc: 'Ed25519 signing' },
              { step: 5, label: '5. Chain Proof', desc: 'Block confirmed' },
              { step: 6, label: '6. Service 200', desc: 'Payload released' },
            ].map((s) => {
              const isCurrent = activeStep === s.step;
              const isDone = activeStep > s.step;
              const isFailed =
                stepFinalTx && (stepFinalTx.status === 'blocked' || stepFinalTx.status === 'pending_approval') && activeStep === s.step;

              return (
                <div
                  key={s.step}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isDone
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400'
                      : isFailed
                      ? 'bg-red-950/30 border-red-500/50 text-red-400'
                      : isCurrent
                      ? 'bg-purple-950/40 border-purple-500 text-purple-300 animate-pulse'
                      : 'bg-gray-900/40 border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-gray-800 text-xs font-bold flex items-center justify-center">
                        {s.step}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs">{s.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Detailed Protocol Payloads Inspector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
            {/* Box A: HTTP 402 Header Response */}
            {stepChallenge && (
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-gray-800 pb-2">
                  <span>Server Response: HTTP 402 Payment Required</span>
                  <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    x402 Spec
                  </span>
                </div>
                <div className="text-gray-300 text-[11px] space-y-1">
                  <div><strong className="text-gray-500">X-402-PayTo:</strong> {stepChallenge.headers['X-402-PayTo']}</div>
                  <div><strong className="text-gray-500">X-402-Price:</strong> {stepChallenge.headers['X-402-Price']} ALGO</div>
                  <div><strong className="text-gray-500">X-402-Blockchain:</strong> {stepChallenge.headers['X-402-Blockchain']}</div>
                  <div><strong className="text-gray-500">X-402-Nonce:</strong> {stepChallenge.headers['X-402-Payment-Nonce']}</div>
                </div>
              </div>
            )}

            {/* Box B: Policy Engine Decision */}
            {stepPolicyResult && (
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between font-bold border-b border-gray-800 pb-2">
                  <span className="text-emerald-400">Policy Engine Evaluation</span>
                  <span className="text-[10px] text-gray-400">Risk Score: {stepPolicyResult.riskScore}/100</span>
                </div>
                <div className="text-gray-300 text-[11px] space-y-1">
                  <div>
                    <strong className="text-gray-500">Recommendation:</strong>{' '}
                    <span
                      className={`font-bold ${
                        stepPolicyResult.recommendation === 'APPROVE'
                          ? 'text-emerald-400'
                          : stepPolicyResult.recommendation === 'FLAG_FOR_HITL'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {stepPolicyResult.recommendation}
                    </span>
                  </div>
                  <div>
                    <strong className="text-gray-500">Passed Rules:</strong>{' '}
                    <span className="text-emerald-400">{stepPolicyResult.passedRules.join(', ')}</span>
                  </div>
                  {stepPolicyResult.triggeredRules.length > 0 && (
                    <div>
                      <strong className="text-gray-500">Triggered Rules:</strong>{' '}
                      <span className="text-amber-400">{stepPolicyResult.triggeredRules.join(', ')}</span>
                    </div>
                  )}
                  <div><strong className="text-gray-500">Reason:</strong> {stepPolicyResult.reason}</div>
                </div>
              </div>
            )}
          </div>

          {/* Box C: Algorand Blockchain Transaction Proof */}
          {stepProof && (
            <div className="p-4 rounded-xl bg-gray-950 border border-emerald-500/40 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-gray-800 pb-2">
                <span className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Algorand Blockchain x402 Proof Header</span>
                </span>
                <a
                  href={getAlgorandExplorerUrl(stepProof.txId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs hover:underline flex items-center space-x-1"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-gray-300 text-[11px] space-y-1">
                <div><strong className="text-gray-500">Algorand TxID:</strong> <span className="text-white font-bold">{stepProof.txId}</span></div>
                <div><strong className="text-gray-500">Block Round:</strong> <span className="text-emerald-400">#{stepProof.blockRound}</span></div>
                <div><strong className="text-gray-500">Ed25519 Sig:</strong> <span className="text-purple-300">{stepProof.signature.slice(0, 32)}...</span></div>
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Authorization Header Header:</span>
                  <div className="p-2 rounded bg-gray-900 border border-gray-800 text-emerald-300 text-[10px] break-all">
                    X-402-Proof: {formatX402ProofHeader(stepProof)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Outcome Banner */}
          {stepFinalTx && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                stepFinalTx.status === 'approved'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : stepFinalTx.status === 'pending_approval'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-red-950/40 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                {stepFinalTx.status === 'approved' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                {stepFinalTx.status === 'pending_approval' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
                {stepFinalTx.status === 'blocked' && <XCircle className="w-6 h-6 text-red-400" />}

                <div>
                  <h4 className="font-bold text-sm">
                    {stepFinalTx.status === 'approved' && 'API Request Authorized & Algorand Payment Settled!'}
                    {stepFinalTx.status === 'pending_approval' && 'Flagged for Human-in-the-Loop Admin Approval'}
                    {stepFinalTx.status === 'blocked' && 'Spending Request Blocked by Policy Engine'}
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">{stepFinalTx.policyEvaluation.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
