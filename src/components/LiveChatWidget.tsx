import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Shield, User, Headphones, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LiveChatWidget: React.FC = () => {
  const {
    isLiveChatOpen,
    setIsLiveChatOpen,
    user,
    supportMessages,
    sendInvestorChatMessage
  } = useApp();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isLiveChatOpen) {
      scrollToBottom();
    }
  }, [isLiveChatOpen, supportMessages]);

  if (!isLiveChatOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendInvestorChatMessage(input);
    setInput('');
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-[#090f1d] border border-blue-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shadow-inner">
              <Headphones size={18} className="text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-900 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Licensed Broker Support</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-medium">LIVE</span>
            </div>
            <div className="text-[10px] text-blue-200">Online • FINRA / SEC Compliance Desk</div>
          </div>
        </div>

        <button
          onClick={() => setIsLiveChatOpen(false)}
          className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer text-white"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-4 space-y-3 h-84 overflow-y-auto bg-[#080d1a] text-xs">
        {supportMessages.map(m => {
          const isUser = m.sender === 'user';
          const isAdmin = m.sender === 'admin';

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-400 font-mono">
                {isUser ? (
                  <span>You ({user.fullName || user.username || 'Investor'})</span>
                ) : isAdmin ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Shield size={11} /> Admin Representative
                  </span>
                ) : (
                  <span className="text-blue-400 flex items-center gap-1">
                    <Bot size={11} /> Support Desk
                  </span>
                )}
              </div>

              <div
                className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                    : isAdmin
                    ? 'bg-[#131c33] border border-amber-500/40 text-slate-100 rounded-tl-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">{m.time}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick shortcuts */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          'I want to request for the withdrawal code',
          'Crypto Deposit Address',
          'Broker Licensing',
          'KYC Verification'
        ].map(prompt => (
          <button
            key={prompt}
            onClick={() => {
              setInput(prompt);
            }}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold rounded-full border border-slate-800 whitespace-nowrap cursor-pointer transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask broker desk a question..."
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer shadow-md disabled:opacity-40"
          disabled={!input.trim()}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
