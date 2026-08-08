import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon, Sliders, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import type { SpendPolicyRule } from '../types';

interface PoliciesViewProps {
  rules: SpendPolicyRule[];
  onToggleRule: (ruleId: string) => void;
  onUpdateRuleValue: (ruleId: string, newValue: number) => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  rules,
  onToggleRule,
  onUpdateRuleValue,
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);

  const handleStartEdit = (rule: SpendPolicyRule) => {
    if (typeof rule.value === 'number') {
      setEditingRuleId(rule.id);
      setTempValue(rule.value);
    }
  };

  const handleSaveEdit = (ruleId: string) => {
    onUpdateRuleValue(ruleId, tempValue);
    setEditingRuleId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            <span>Agent Governance & Spend Policy Engine Rules</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Rules evaluated dynamically before signing and broadcasting any x402 payment challenge on Algorand
          </p>
        </div>

        <button
          onClick={() => alert('New policy template wizard initialized')}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold text-xs transition-all"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Custom Policy Rule</span>
        </button>
      </div>

      {/* Policy Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => {
          const isNumeric = typeof rule.value === 'number';
          const isEditing = editingRuleId === rule.id;

          return (
            <div
              key={rule.id}
              className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all ${
                rule.enabled ? 'border-gray-800' : 'border-gray-900 opacity-60 bg-gray-950/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        rule.severity === 'block'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : rule.severity === 'require_approval'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {rule.severity === 'block' ? (
                        <AlertOctagon className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base">{rule.name}</h3>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                        Type: {rule.type}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className={`p-1 transition-colors ${rule.enabled ? 'text-emerald-400' : 'text-gray-600'}`}
                    title={rule.enabled ? 'Disable Policy' : 'Enable Policy'}
                  >
                    {rule.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-3 leading-relaxed">{rule.description}</p>

                {/* Rule Value Display & Adjuster */}
                <div className="mt-4 p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  {isEditing ? (
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(Number(e.target.value))}
                        className="w-24 bg-gray-950 border border-emerald-500/50 rounded p-1 text-white font-mono text-xs"
                      />
                      <button
                        onClick={() => handleSaveEdit(rule.id)}
                        className="px-3 py-1 rounded bg-emerald-500 text-gray-950 font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRuleId(null)}
                        className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 font-medium">Configured Parameter: </span>
                        <span className="text-sm font-mono font-bold text-emerald-400 ml-1">
                          {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value.toString()}
                        </span>
                      </div>

                      {isNumeric && rule.enabled && (
                        <button
                          onClick={() => handleStartEdit(rule)}
                          className="text-xs text-gray-400 hover:text-emerald-400 flex items-center space-x-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Severity Footer */}
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-500">Enforcement Severity:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    rule.severity === 'block'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {rule.severity.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
