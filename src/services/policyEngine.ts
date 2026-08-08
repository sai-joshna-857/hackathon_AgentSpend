import type { AIAgent, APIServiceOption, SpendPolicyRule } from '../types';

export interface PolicyEvaluationResult {
  passedRules: string[];
  triggeredRules: string[];
  riskScore: number; // 0 - 100
  recommendation: 'APPROVE' | 'FLAG_FOR_HITL' | 'BLOCK';
  reason: string;
}

export const evaluateAgentSpendPolicy = (
  agent: AIAgent,
  service: APIServiceOption,
  amountAlgo: number,
  rules: SpendPolicyRule[],
  recentTxCount: number = 0
): PolicyEvaluationResult => {
  const passedRules: string[] = [];
  const triggeredRules: string[] = [];
  let riskScore = 0;
  let hardBlock = false;
  let requireApproval = false;
  const reasons: string[] = [];

  // 1. Evaluate Daily Budget Rule
  const newDailyTotal = agent.spentTodayAlgo + amountAlgo;
  if (newDailyTotal > agent.dailySpendLimitAlgo) {
    hardBlock = true;
    triggeredRules.push('RULE_DAILY_BUDGET_EXCEEDED');
    reasons.push(`Exceeds daily budget limit of ${agent.dailySpendLimitAlgo} ALGO (Attempted: ${newDailyTotal.toFixed(2)} ALGO)`);
  } else {
    passedRules.push('RULE_DAILY_BUDGET_OK');
  }

  // 2. Evaluate Single Transaction Limit Rule
  if (amountAlgo > agent.singleTxLimitAlgo) {
    const singleTxRule = rules.find((r) => r.type === 'max_single_tx');
    if (singleTxRule?.severity === 'block') {
      hardBlock = true;
    } else {
      requireApproval = true;
    }
    triggeredRules.push('RULE_SINGLE_TX_LIMIT_EXCEEDED');
    reasons.push(`Single tx amount (${amountAlgo} ALGO) exceeds limit of ${agent.singleTxLimitAlgo} ALGO`);
    riskScore += 35;
  } else {
    passedRules.push('RULE_SINGLE_TX_OK');
  }

  // 3. Service Whitelist Rule
  const isWhitelisted = agent.whitelistedServices.includes('all') || agent.whitelistedServices.includes(service.id);
  if (!isWhitelisted) {
    const whitelistRule = rules.find((r) => r.type === 'service_whitelist');
    if (whitelistRule?.severity === 'block') {
      hardBlock = true;
    } else {
      requireApproval = true;
    }
    triggeredRules.push('RULE_UNAPPROVED_SERVICE');
    reasons.push(`Target service '${service.name}' (${service.endpoint}) is not in approved whitelist`);
    riskScore += 40;
  } else {
    passedRules.push('RULE_SERVICE_WHITELISTED');
  }

  // 4. Velocity Capping Rule
  const velocityRule = rules.find((r) => r.type === 'velocity_limit' && r.enabled);
  if (velocityRule && typeof velocityRule.value === 'number') {
    if (recentTxCount >= velocityRule.value) {
      requireApproval = true;
      triggeredRules.push('RULE_VELOCITY_LIMIT_EXCEEDED');
      reasons.push(`Transaction frequency (${recentTxCount} tx/min) exceeds velocity cap of ${velocityRule.value}`);
      riskScore += 25;
    } else {
      passedRules.push('RULE_VELOCITY_OK');
    }
  }

  // 5. Service Risk Rating adjustment
  if (service.riskLevel === 'high') {
    riskScore += 35;
    triggeredRules.push('RULE_HIGH_RISK_SERVICE_ALERT');
    reasons.push(`Service '${service.name}' carries HIGH financial risk rating`);
  } else if (service.riskLevel === 'medium') {
    riskScore += 15;
  }

  // 6. HITL Approval Threshold Rule
  const hitlRule = rules.find((r) => r.type === 'hitl_approval_threshold' && r.enabled);
  if (hitlRule && typeof hitlRule.value === 'number') {
    if (amountAlgo >= hitlRule.value) {
      requireApproval = true;
      triggeredRules.push('RULE_HITL_THRESHOLD_TRIGGERED');
      reasons.push(`Amount (${amountAlgo} ALGO) meets Human-in-the-Loop review threshold (>= ${hitlRule.value} ALGO)`);
    }
  }

  // Agent Status Check
  if (agent.status === 'paused' || agent.status === 'flagged') {
    hardBlock = true;
    triggeredRules.push('RULE_AGENT_SUSPENDED');
    reasons.push(`Agent '${agent.name}' is currently in ${agent.status.toUpperCase()} state`);
  }

  // Clamp Risk Score
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine final outcome
  let recommendation: 'APPROVE' | 'FLAG_FOR_HITL' | 'BLOCK';
  let finalReason: string;

  if (hardBlock) {
    recommendation = 'BLOCK';
    finalReason = reasons.join(' | ') || 'Blocked by Policy Engine security constraint';
  } else if (requireApproval || riskScore >= 50) {
    recommendation = 'FLAG_FOR_HITL';
    finalReason = `Requires Human Approval: ${reasons.join(' | ') || 'Risk score elevated'}`;
  } else {
    recommendation = 'APPROVE';
    finalReason = 'Passed all spend policy checks cleanly. Risk score low.';
  }

  return {
    passedRules,
    triggeredRules,
    riskScore,
    recommendation,
    reason: finalReason,
  };
};
