import React, { useState, useEffect } from 'react';
import { Smartphone, Download, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileAppGateProps {
  isMobileBrowser: boolean;
  isAuthenticated: boolean;
}

const SESSION_KEY = 'fpi-mobile-web-dismissed';

export const MobileAppGate: React.FC<MobileAppGateProps> = ({
  isMobileBrowser,
  isAuthenticated,
}) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!isMobileBrowser || !isAuthenticated) {
      setDismissed(true);
      return;
    }
    const isDismissed = sessionStorage.getItem(SESSION_KEY);
    setDismissed(!!isDismissed);
  }, [isMobileBrowser, isAuthenticated]);

  if (dismissed || !isMobileBrowser || !isAuthenticated) {
    return null;
  }

  const handleContinueOnWeb = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 text-white flex flex-col justify-between p-6 overflow-y-auto font-sans animate-in fade-in duration-300">
      {/* Glow de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Topo / Marca */}
      <div className="relative z-10 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <img src="/assets/images/brand/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-slate-200 font-mono">
            Finanças Pro Invest
          </span>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          App Mobile
        </span>
      </div>

      {/* Conteúdo Central */}
      <div className="relative z-10 my-auto py-8 space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 border border-emerald-400/30">
          <Smartphone size={40} />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Experiência Completa no Celular
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Para sua segurança, organização e melhor navegação diária, acesse pelo nosso aplicativo nativo.
          </p>
        </div>

        {/* Benefícios */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 max-w-sm mx-auto text-left space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-300">Biometria e PIN de acesso rápido</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-300">Lançamento instantâneo offline</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-300">Agenda fluida e alertas antecipados</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="relative z-10 space-y-3 max-w-sm mx-auto w-full pb-4">
        <button
          onClick={() => navigate('/download')}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Download size={18} />
          <span>Baixar Aplicativo Android (APK)</span>
        </button>

        <button
          onClick={handleContinueOnWeb}
          className="w-full py-3 px-6 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
        >
          Continuar no navegador web
        </button>

        <p className="text-[10px] text-slate-500 text-center">
          Usuários iPhone/iOS: utilize a versão web móvel acima.
        </p>
      </div>
    </div>
  );
};

export default MobileAppGate;
