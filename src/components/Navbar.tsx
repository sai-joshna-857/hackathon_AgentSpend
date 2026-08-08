import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Key } from 'lucide-react';

interface NavbarProps {
  pendingApprovalsCount: number;
  onOpenExplorer: () => void;
  onOpenNewAgent: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenExplorer,
  onOpenNewAgent,
}) => {
  const [blockHeight, setBlockHeight] = useState(38492048);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight((prev) => prev + 1);
    }, 4500); // Algorand ~4.5s block time
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setBlockHeight((prev) => prev + 2);
      setIsSyncing(false);
    }, 800);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md px-4 lg:px-6 py-3 flex items-center justify-between">
      {/* Brand Logo & Tag */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-0.5 shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg text-white tracking-wide">
              AGENT<span className="gradient-text-algo">SPEND</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              x402 Protocol
            </span>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">
            Algorand Blockchain Governance & Spend Policy Engine
          </p>
        </div>
      </div>

      {/* Algorand Node & Status Header Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Live Algorand Node Badge */}
        <button
          onClick={onOpenExplorer}
          className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-emerald-500/50 transition-all text-xs"
          title="Click to view Algorand Ledger details"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-gray-300 font-medium">Algorand Testnet:</span>
          <span className="text-emerald-400 font-mono font-bold">#{blockHeight.toLocaleString()}</span>
        </button>

        {/* Sync Button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-emerald-400 transition-all"
          title="Force Algorand Chain Sync"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* Register Agent Quick Action */}
        <button
          onClick={onOpenNewAgent}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-emerald-900/30 transition-all"
        >
          <Key className="w-3.5 h-3.5" />
          <span>New Agent</span>
        </button>
      </div>
    </header>
  );
};
