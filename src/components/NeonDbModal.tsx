import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  Zap,
  RefreshCw,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NeonDbModal: React.FC = () => {
  const {
    isNeonDbModalOpen,
    setIsNeonDbModalOpen,
    neonDbStatus,
    refreshNeonDbStatus,
    testAndConnectNeonDb,
    copyTraders
  } = useApp();

  const [inputUrl, setInputUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);

  if (!isNeonDbModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsSubmitting(true);
    setTestResult(null);

    const res = await testAndConnectNeonDb(inputUrl.trim());
    setIsSubmitting(false);
    setTestResult(res);
  };

  const handleCopySample = () => {
    const sample = 'postgresql://neondb_owner:npg_sample123@ep-bold-glade-a2y9z123.us-east-2.aws.neon.tech/neondb?sslmode=require';
    navigator.clipboard.writeText(sample);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsNeonDbModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Database size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Activate Neon PostgreSQL</h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                Serverless Postgres
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Connect external Neon Cloud PostgreSQL to store users, {copyTraders.length} expert traders, and live copy subscriptions.
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-xl border mb-5 ${
          neonDbStatus.connected
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                neonDbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className="font-semibold text-sm">
                Status: {neonDbStatus.connected ? 'Connected to Neon PostgreSQL' : 'Local Fallback Storage Active'}
              </span>
            </div>
            <button
              onClick={() => refreshNeonDbStatus()}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition"
            >
              <RefreshCw size={12} /> Check Status
            </button>
          </div>

          {neonDbStatus.connected ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-500/20 text-xs">
              <div>
                <span className="text-slate-400 block">Host:</span>
                <span className="font-mono text-white truncate block">{neonDbStatus.host}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Database:</span>
                <span className="font-semibold text-white">{neonDbStatus.database}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Latency:</span>
                <span className="font-semibold text-emerald-400">{neonDbStatus.latencyMs}ms</span>
              </div>
              <div>
                <span className="text-slate-400 block">Traders Synced:</span>
                <span className="font-semibold text-white">{neonDbStatus.counts?.traders ?? 12}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tables:</span>
                <span className="font-semibold text-emerald-400">Initialized ✓</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Your site is currently running on lightning-fast local memory. Connect your Neon PostgreSQL connection string below to persist all data to the cloud.
            </p>
          )}
        </div>

        {/* Step-by-Step Guide */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 mb-5 space-y-2.5 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 flex items-center justify-between">
            <span>How to get your Neon PostgreSQL URL:</span>
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              Open Neon.tech <ExternalLink size={12} />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>Log in or create a free project at <span className="text-slate-200 font-mono">console.neon.tech</span>.</li>
            <li>In your Dashboard, copy the connection string under <span className="text-slate-200 font-semibold">"Connection Details"</span>.</li>
            <li>Ensure <span className="text-slate-200 font-mono">?sslmode=require</span> is at the end.</li>
            <li>Paste it below and click <span className="text-emerald-400 font-semibold">"Connect & Activate Neon"</span>.</li>
          </ol>
        </div>

        {/* Connect Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Neon PostgreSQL Connection String (DATABASE_URL)</span>
              <button
                type="button"
                onClick={handleCopySample}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedSample ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copiedSample ? 'Copied' : 'Copy Sample Format'}
              </button>
            </label>
            <input
              type="password"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="postgresql://neondb_owner:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports <code className="text-slate-400">postgresql://...</code> and <code className="text-slate-400">postgres://...</code> formats with SSL.
            </p>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsNeonDbModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inputUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/40 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Connecting & Initializing...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Connect & Activate Neon
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
