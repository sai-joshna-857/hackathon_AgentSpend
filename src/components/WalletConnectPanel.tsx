import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Zap,
  RefreshCw,
  ShieldCheck,
  Copy,
  Link,
  Unlink,
} from 'lucide-react';
import type { AIAgent } from '../types';
import { getAlgorandAccountExplorerUrl, getASAExplorerUrl } from '../services/algorand';
import { USDC_ASSET_ID } from '../services/x402Protocol';

interface WalletConnectPanelProps {
  agents: AIAgent[];
}

type WalletType = 'pera' | 'defly' | 'myalgo' | null;

const WALLET_OPTIONS: { id: WalletType; name: string; icon: string; color: string }[] = [
  { id: 'pera', name: 'Pera Wallet', icon: '🟡', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
  { id: 'defly', name: 'Defly Wallet', icon: '🟢', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
  { id: 'myalgo', name: 'MyAlgo Wallet', icon: '🔵', color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' },
];

export const WalletConnectPanel: React.FC<WalletConnectPanelProps> = ({ agents }) => {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');
  const [connectingWallet, setConnectingWallet] = useState<WalletType>(null);
  const [connectedWallet, setConnectedWallet] = useState<WalletType>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleConnect = async (walletId: WalletType) => {
    setConnectingWallet(walletId);
    setIsConnecting(true);
    // Simulate wallet handshake
    await new Promise(r => setTimeout(r, 1800));
    setConnectedWallet(walletId);
    setIsConnecting(false);
    setConnectingWallet(null);
  };

  const handleDisconnect = () => {
    setConnectedWallet(null);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedAgent?.algorandAccount.address || '');
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const connectedWalletInfo = WALLET_OPTIONS.find(w => w.id === connectedWallet);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span>x402 Wallet Connect</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Connect Pera, Defly, or MyAlgo wallet to sign x402 Algorand payment transactions directly.
          </p>
        </div>
        {connectedWallet && (
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connected</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Agent + Wallet Selection */}
        <div className="space-y-5">
          {/* Agent Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Agent Wallet Identity
            </label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.avatar} {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet Options */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Select Wallet Provider
            </label>
            <div className="space-y-2">
              {WALLET_OPTIONS.map(wallet => (
                <div
                  key={wallet.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    connectedWallet === wallet.id
                      ? 'bg-emerald-950/40 border-emerald-500/60'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{wallet.name}</div>
                      <div className="text-[10px] text-gray-500">Algorand {wallet.id === 'pera' ? 'Mobile' : wallet.id === 'defly' ? 'Mobile + DeFi' : 'Web'} Wallet</div>
                    </div>
                  </div>
                  {connectedWallet === wallet.id ? (
                    <button
                      onClick={handleDisconnect}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(wallet.id)}
                      disabled={isConnecting || connectedWallet !== null}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isConnecting && connectingWallet === wallet.id
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isConnecting && connectingWallet === wallet.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Connected Wallet Details */}
        <div className="space-y-4">
          {connectedWallet && selectedAgent ? (
            <>
              {/* Wallet Status Card */}
              <div className={`p-4 rounded-2xl border ${connectedWalletInfo?.color || 'border-gray-700'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{connectedWalletInfo?.icon}</span>
                  <div>
                    <div className="font-extrabold text-white">{connectedWalletInfo?.name}</div>
                    <div className="text-xs text-gray-400 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Verified — Algorand Testnet</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase mb-1">Wallet Address</div>
                    <div className="flex items-center justify-between bg-gray-950 rounded-lg p-2.5 border border-gray-800">
                      <span className="text-emerald-300 truncate">{selectedAgent.algorandAccount.address.slice(0, 26)}...</span>
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        <button onClick={copyAddress} className="p-1 hover:text-white text-gray-400">
                          {copiedAddr ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={getAlgorandAccountExplorerUrl(selectedAgent.algorandAccount.address)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:text-cyan-400 text-gray-400"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Balances */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-950 rounded-lg p-2.5 border border-gray-800">
                      <div className="text-gray-500 text-[10px] mb-1">ALGO Balance</div>
                      <div className="text-white font-bold text-sm">{selectedAgent.algorandAccount.balanceAlgo.toFixed(2)}</div>
                      <div className="text-gray-500 text-[10px]">≈ ${(selectedAgent.algorandAccount.balanceAlgo * 0.30).toFixed(2)} USD</div>
                    </div>
                    <div className="bg-gray-950 rounded-lg p-2.5 border border-gray-800">
                      <div className="text-gray-500 text-[10px] mb-1 flex items-center space-x-1">
                        <span>USDCa Balance</span>
                        <a href={getASAExplorerUrl(USDC_ASSET_ID)} target="_blank" rel="noreferrer" className="text-blue-400">
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="text-blue-300 font-bold text-sm">{selectedAgent.algorandAccount.balanceUSDCa.toFixed(2)}</div>
                      <div className="text-gray-500 text-[10px]">ASA #{USDC_ASSET_ID}</div>
                    </div>
                  </div>

                  {/* x402 Ready Banner */}
                  <div className="flex items-center space-x-2 p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-500/30">
                    <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-300 text-[11px] font-semibold">
                      Ready to sign x402 payment transactions via Ed25519 keypair
                    </span>
                  </div>
                </div>
              </div>

              {/* Refresh Balance */}
              <button className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 text-xs font-semibold transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Balances from Algorand Node</span>
              </button>
            </>
          ) : (
            <div className="h-full min-h-48 rounded-2xl border border-dashed border-gray-800 flex flex-col items-center justify-center space-y-3 text-gray-500 text-xs text-center p-6">
              <Wallet className="w-10 h-10 opacity-30" />
              <p>Connect a wallet to view your Algorand address,<br />ALGO balance, and USDCa ASA balance.</p>
              <p className="text-[11px] text-gray-600">Supports Pera, Defly, and MyAlgo wallets</p>
            </div>
          )}
        </div>
      </div>

      {/* x402 Protocol Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-800">
        {[
          { label: 'Protocol', value: 'x402 Algorand v1.0.4', color: 'text-cyan-300' },
          { label: 'Network', value: 'Algorand Testnet', color: 'text-emerald-300' },
          { label: 'Signature Scheme', value: 'Ed25519', color: 'text-purple-300' },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
            <div className={`font-bold text-xs ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
