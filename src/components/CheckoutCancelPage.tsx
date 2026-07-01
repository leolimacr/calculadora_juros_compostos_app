import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Ticket } from 'lucide-react';

const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <XCircle size={40} className="text-slate-500" />
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Checkout Cancelado
          </span>
          <h1 className="text-2xl font-black tracking-tight">Tudo bem!</h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            Sua jornada no plano Free continua. Quando estiver pronto para evoluir, estaremos aqui para te ajudar.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/app/home')}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-slate-200"
          >
            <ArrowLeft size={16} />
            Voltar ao Painel
          </button>
          
          <button
            onClick={() => navigate('/app/mais/pricing')}
            className="flex items-center justify-center gap-2 bg-transparent hover:bg-slate-100 text-emerald-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            <Ticket size={16} />
            Ver Planos Disponíveis
          </button>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
            Se houve algum problema técnico,<br />contate nosso suporte.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
