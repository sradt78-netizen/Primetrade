import React, { useState } from 'react';
import { Headphones, Mail, Phone, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SupportView: React.FC = () => {
  const { user, showToast, setIsLiveChatOpen } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Support ticket #BEM-9941 created. A licensed broker will respond within 15 minutes.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Client Broker Desk & Support</h1>
        <p className="text-xs text-slate-400 mt-1">
          24/7 dedicated institutional coverage for trading execution, deposits, withdrawals, and account verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <Mail size={22} className="text-blue-400 mb-2" />
          <div className="text-xs font-bold text-white">Email Desk</div>
          <div className="text-xs text-slate-400 mt-1">support@primetrade.bbroot.com</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-2">Avg. response &lt; 15 mins</div>
        </div>

        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <Phone size={22} className="text-indigo-400 mb-2" />
          <div className="text-xs font-bold text-white">Direct Broker Hotline</div>
          <div className="text-xs text-slate-400 mt-1">+1 (800) 582-0194</div>
          <div className="text-[10px] text-slate-400 mt-2">Trading Desk (Mon-Fri 24h)</div>
        </div>

        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <MessageSquare size={22} className="text-emerald-400 mb-2" />
            <div className="text-xs font-bold text-white">Live Broker Chat</div>
            <div className="text-xs text-slate-400 mt-1">Real-time instant assistant</div>
          </div>
          <button
            onClick={() => setIsLiveChatOpen(true)}
            className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Start Chat
          </button>
        </div>
      </div>

      {/* Ticket Submission Form */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-5">
          Submit Priority Ticket
        </h2>

        {submitted ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">Ticket Created Successfully (#BEM-9941)</div>
            <div className="text-xs text-slate-400 max-w-sm mx-auto">
              Our licensed broker operations team has received your inquiry and is reviewing it now.
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setSubject('');
                setMessage('');
              }}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Inquiry Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Wire Deposit Confirmation or CFD Leverage Inquiry"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Message Details</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your request in detail..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={15} />
              <span>Send Ticket to Compliance Desk</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
