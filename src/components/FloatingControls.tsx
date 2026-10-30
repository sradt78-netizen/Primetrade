import React, { useState } from 'react';
import { Send, MessageSquare, ChevronUp, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FloatingControls: React.FC = () => {
  const { selectedLanguage, setSelectedLanguage, setIsLiveChatOpen, showToast } = useApp();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'JA', name: '日本語', flag: '🇯🇵' },
    { code: 'AR', name: 'العربية', flag: '🇦🇪' },
  ];

  const currentFlag = languages.find(l => l.code === selectedLanguage)?.flag || '🇺🇸';

  return (
    <>
      {/* Floating Language Selector (Bottom Left, matching screenshots 1, 2, 3, 4, 7) */}
      <div className="fixed bottom-18 md:bottom-6 left-4 z-30">
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700/80 shadow-xl backdrop-blur-md text-xs font-bold transition cursor-pointer"
          >
            <span className="text-base">{currentFlag}</span>
            <span>{selectedLanguage}</span>
            <ChevronUp size={14} className={`text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {langMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
              <div className="absolute bottom-full left-0 mb-2 w-44 glass-dropdown rounded-xl py-1 z-20 border border-slate-700 shadow-2xl">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                  Select Language
                </div>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setLangMenuOpen(false);
                      showToast(`Language set to ${lang.name}`, 'info');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition cursor-pointer ${
                      selectedLanguage === lang.code
                        ? 'bg-blue-600/30 text-blue-400 font-bold'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Telegram & Live Chat Assistant (Bottom Right, matching screenshots 1 & 2) */}
      <div className="fixed bottom-18 md:bottom-6 right-4 z-30 flex items-center gap-3">
        {/* Telegram Community Button */}
        <button
          onClick={() => {
            showToast('Opening verified VIP Trader Telegram Channel...', 'info');
          }}
          title="Join VIP Broker Telegram Channel"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(14,165,233,0.5)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Send size={20} className="-ml-0.5 mt-0.5 fill-white" />
        </button>

        {/* Live Chat Support Floating Button with Green Online Dot */}
        <div className="relative">
          <button
            onClick={() => setIsLiveChatOpen(true)}
            title="Chat with Licensed Broker Desk"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <MessageSquare size={22} className="fill-white" />
          </button>
          {/* Green Online status dot (exact match to screenshot) */}
          <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
        </div>
      </div>
    </>
  );
};
