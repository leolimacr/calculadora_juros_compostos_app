import React, { useEffect, useRef } from 'react';
import { Download, Smartphone } from 'lucide-react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.financasproinvest.mobile';
const APP_INTENT = 'intent://open#Intent;scheme=financaspro;package=com.financasproinvest.mobile;end';

interface AppOnlyBlockProps {
  onBack: () => void;
}

const AppOnlyBlock: React.FC<AppOnlyBlockProps> = ({ onBack }) => {
  const hasFiredRef = useRef(false);

  const handleOpenApp = () => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const start = Date.now();

    // Tenta abrir o app via intent
    window.location.href = APP_INTENT;

    // Se o app abriu, a pagina perde o foco. Se nao abriu (app nao instalado),
    // o navegador volta rapido e redirecionamos para a Play Store.
    const timer = setTimeout(() => {
      const elapsed = Date.now() - start;
      // Se passou pouco tempo, o app NAO abriu -> vai pra Play Store
      if (elapsed < 2500 && !document.hidden) {
        window.location.href = PLAY_STORE_URL;
      }
      hasFiredRef.current = false;
    }, 1500);

    const handleVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        hasFiredRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility, { once: true });
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-8 animate-in fade-in zoom-in-95">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20 shadow-2xl relative">
        <Smartphone size={32} />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">
          Gerenciador <br/> <span className="text-emerald-400">Financeiro</span>
        </h2>
        <div className="bg-sky-500/10 text-sky-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-sky-500/20 inline-block">
          Exclusivo no App
        </div>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto font-medium">
        O <strong>Gerenciador Financeiro</strong> está disponível exclusivamente no nosso app nativo.
        Baixe agora para ter a melhor experiência e segurança.
      </p>
      <div className="pt-6 flex flex-col gap-4">
        <button
          onClick={handleOpenApp}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Download size={18} />
          ABRIR NO APP
        </button>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-700 transition-all block text-center"
        >
          BAIXAR NA GOOGLE PLAY
        </a>
        <button
          onClick={onBack}
          className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    </div>
  );
};

export default AppOnlyBlock;
