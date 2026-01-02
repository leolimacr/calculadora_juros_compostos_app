
import React, { useEffect } from 'react';
import { trackPaywallView } from '../services/analyticsService';

interface PaywallProps {
  title?: string;
  description?: string;
  highlights?: string[];
  source: string;
  onUpgrade: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ 
  title = "Desbloqueie as ferramentas avançadas", 
  description = "Esta funcionalidade é exclusiva para membros Pro. Invista no seu futuro.",
  highlights = ["Simulações ilimitadas", "Sem anúncios", "Acesso total"],
  source,
  onUpgrade
}) => {
  
  useEffect(() => {
    trackPaywallView(source);
  }, [source]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl animate-in zoom-in duration-300">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 p-3 bg-slate-800 rounded-full border border-slate-700 shadow-inner">
          <span className="text-4xl">🔒</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 max-w-md mx-auto mb-6">{description}</p>
        
        <ul className="mb-8 space-y-2 text-sm text-slate-300 text-left bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 inline-block min-w-[250px]">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> {item}
            </li>
          ))}
        </ul>

        <button 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
        >
          Ver Planos Premium
        </button>
        
        <p className="mt-4 text-xs text-slate-500">
          Garantia de 7 dias ou seu dinheiro de volta.
        </p>
      </div>
    </div>
  );
};

export default Paywall;
