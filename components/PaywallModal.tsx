
import React from 'react';
import ContentModal from './ContentModal';
import { UserMeta } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMeta: UserMeta | null;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, userMeta }) => {
  const handleUpgradeClick = () => {
    alert("🚀 Funcionalidade de pagamento em breve!\n\nPor enquanto, obrigado por testar o Finanças Pro.");
  };

  return (
    <ContentModal isOpen={isOpen} onClose={onClose} title="Limite Atingido 🔒">
      <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Visual */}
        <div className="relative inline-block mt-4">
           <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border-4 border-slate-600 shadow-xl">
              <span className="text-4xl">✋</span>
           </div>
           <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-slate-900">
              30/30
           </div>
        </div>

        <div>
           <h3 className="text-2xl font-bold text-white mb-2">Wow! Você é um Power User.</h3>
           <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
             Você atingiu o limite de <strong>{userMeta?.launchLimit || 30} lançamentos</strong> do plano Gratuito. 
             Para continuar organizando sua vida financeira sem limites, faça o upgrade.
           </p>
        </div>

        {/* Comparison Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-1 overflow-hidden max-w-sm mx-auto">
           <div className="grid grid-cols-2 text-sm">
              <div className="p-4 bg-slate-800/50 text-slate-400">
                 <p className="font-bold mb-2 text-xs uppercase tracking-widest">Grátis</p>
                 <ul className="space-y-2 text-left text-xs">
                    <li className="flex gap-2">✅ 30 Lançamentos</li>
                    <li className="flex gap-2">✅ Gráficos Básicos</li>
                    <li className="flex gap-2 opacity-50">❌ Backup em Nuvem</li>
                 </ul>
              </div>
              <div className="p-4 bg-gradient-to-b from-emerald-900/40 to-slate-800 relative">
                 <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">RECOMENDADO</div>
                 <p className="font-bold mb-2 text-xs uppercase tracking-widest text-emerald-400">Premium</p>
                 <ul className="space-y-2 text-left text-xs text-white">
                    <li className="flex gap-2">🚀 <strong>Ilimitado</strong></li>
                    <li className="flex gap-2">✨ Backup Seguro</li>
                    <li className="flex gap-2">🤖 IA Avançada</li>
                 </ul>
              </div>
           </div>
        </div>

        {/* Pricing & CTA */}
        <div className="space-y-3 pt-2">
           <p className="text-sm font-medium text-slate-300">
              Apenas <span className="text-xl font-bold text-white">R$ 9,90</span> / mês
           </p>
           
           <button 
             onClick={handleUpgradeClick}
             className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
           >
             <span>Desbloquear Tudo</span>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
           </button>
           
           <button onClick={onClose} className="text-xs text-slate-500 hover:text-white transition-colors pt-2">
              Voltar e gerenciar lançamentos existentes
           </button>
        </div>

      </div>
    </ContentModal>
  );
};

export default PaywallModal;
