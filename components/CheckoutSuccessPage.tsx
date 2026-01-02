
import React, { useEffect } from 'react';
import { trackCheckoutSuccess } from '../services/analyticsService';

interface CheckoutSuccessPageProps {
  onNavigate: (path: string) => void;
}

const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ onNavigate }) => {
  
  useEffect(() => {
    // Tenta pegar o session_id da URL (opcional para rastreamento mais preciso no futuro)
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    trackCheckoutSuccess(sessionId || undefined);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in zoom-in duration-500">
      <div className="bg-slate-800 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        {/* Confetti decor (CSS) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500"></div>
        
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-emerald-900/50">
          🎉
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Assinatura Confirmada!</h1>
        <p className="text-slate-300 text-sm mb-8 leading-relaxed">
          Obrigado por apoiar o Finanças Pro Invest. Seu acesso Premium já está sendo liberado e seus recursos exclusivos estão prontos para uso.
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => onNavigate('fire')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors border border-slate-600"
          >
            Testar Calculadora FIRE
          </button>
          
          <button 
            onClick={() => onNavigate('panel')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Ir para o Painel Principal
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Um recibo foi enviado para seu e-mail.
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
