import React, { useState } from 'react';
import { FileText, Download, Filter, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvestorAuthGate } from './InvestorAuthGate';

export const StatementsView: React.FC = () => {
  const { transactions, user, isLoggedIn, showToast } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isLoggedIn) {
    return (
      <InvestorAuthGate
        title="Official Account Statements"
        description="Transaction logs, executed orders, and capital activity are restricted to authenticated client sessions."
      />
    );
  }

  const filtered = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const exportCsv = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export yet', 'info');
      return;
    }
    const headers = 'ID,Type,Amount,Asset,Status,Date,Reference,Note\n';
    const rows = transactions.map(t =>
      `"${t.id}","${t.type}","${t.amount}","${t.asset}","${t.status}","${t.date}","${t.hashOrReference}","${t.note || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BlueEdgeMarket_Statement_${Date.now()}.csv`;
    a.click();
    showToast('Account statement CSV downloaded', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Account Statements</h1>
          <p className="text-xs text-slate-400 mt-1">
            Official immutable ledger of all deposits, withdrawals, executed orders, and capital transfers.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download size={15} />
          <span>Export Statement (.CSV)</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRADE', 'TRANSFER'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterType === tab ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl">
            <FileText size={32} className="text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">No transactions recorded</div>
            <p className="text-xs text-slate-400 mt-1">
              Your transaction history will automatically populate when you deposit, trade, or transfer funds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Details / Note</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-300 font-bold">
                      {t.hashOrReference}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          t.type === 'DEPOSIT'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : t.type === 'WITHDRAWAL'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      {t.note || t.asset}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-white">
                      ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {t.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
