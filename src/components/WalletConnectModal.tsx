import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WalletConnectModal: React.FC = () => {
  const {
    isWalletModalOpen,
    setIsWalletModalOpen,
    connectWallet,
    user,
    disconnectWallet
  } = useApp();

  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  if (!isWalletModalOpen) return null;

  const wallets = [
    { name: 'MetaMask', icon: '🦊', desc: 'Popular Ethereum & EVM Web3 Browser Extension' },
    { name: 'Coinbase Wallet', icon: '🔵', desc: 'Direct custodial & self-custody connection' },
    { name: 'WalletConnect', icon: '🔗', desc: 'Scan with 300+ mobile cryptocurrency wallets' },
    { name: 'Phantom', icon: '👻', desc: 'Solana & Multi-Chain High Speed Wallet' }
  ];

  const handleConnect = async (name: string) => {
    setConnectingWallet(name);
    await connectWallet(name);
    setConnectingWallet(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0a1020] border border-indigo-500/40 rounded-2xl p-6 text-white shadow-2xl my-8">
        <button
          onClick={() => setIsWalletModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow">
            <Wallet size={18} />
          </div>
          <h2 className="text-base font-extrabold text-white">Connect Web3 Wallet</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Link your non-custodial cryptocurrency wallet for instant on-chain deposits and yield payouts.
        </p>

        {user.connectedWalletAddress ? (
          <div className="bg-[#080d1a] border border-emerald-500/30 rounded-xl p-4 text-center space-y-3">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <div className="text-xs font-bold text-white">Wallet Successfully Connected</div>
            <div className="text-xs font-mono text-emerald-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
              {user.connectedWalletAddress}
            </div>
            <button
              onClick={disconnectWallet}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition cursor-pointer"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {wallets.map(w => (
              <button
                key={w.name}
                disabled={connectingWallet !== null}
                onClick={() => handleConnect(w.name)}
                className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{w.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition">
                      {w.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{w.desc}</div>
                  </div>
                </div>

                <div className="text-slate-500 group-hover:text-white transition">
                  {connectingWallet === w.name ? (
                    <span className="text-xs text-indigo-400 font-semibold">Connecting...</span>
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span>Encrypted read-only connection. We will never ask for your seed phrase.</span>
        </div>
      </div>
    </div>
  );
};
