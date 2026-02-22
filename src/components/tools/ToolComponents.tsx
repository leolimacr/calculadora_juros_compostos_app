import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Lock, Globe, Smartphone, UserPlus, LogIn, HelpCircle, Zap } from 'lucide-react';

// === COMPONENTE DE BLOQUEIO WEB-ONLY (MOBILE APP) ===
export const WebOnlyBlock = ({ title, onBack }: any) => {
  const handleOpenBrowser = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br' });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-8 animate-in fade-in zoom-in-95">
      <div className="w-24 h-24 bg-sky-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-sky-400 border border-sky-500/20 shadow-2xl">
        <Smartphone size={48} className="opacity-50 absolute" />
        <Lock size={32} className="relative z-10" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{title}</h2>
        <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 inline-block">
            Disponível na Versão Web
        </div>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
        Para garantir a melhor precisão nos gráficos e uma experiência analítica completa, esta ferramenta é exclusiva para acesso via desktop ou navegador.
      </p>

      <div className="pt-6 flex flex-col gap-4">
        <button 
            onClick={handleOpenBrowser}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
            <Globe size={18}/> Acessar Versão Completa no Site
        </button>
        <button onClick={() => onBack('home')} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
            Voltar ao Gerenciador
        </button>
      </div>
    </div>
  );
};

// === COMPONENTE DE BLOQUEIO DE LOGIN (GATE) ===
export const ToolGate = ({ title, description, onNavigate }: any) => (
  <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-in fade-in slide-in-from-bottom-8">
    <button onClick={() => onNavigate('home')} className="mb-12 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">← Voltar</button>
    
    <div className="bg-slate-900/80 border border-slate-800 p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-400 shadow-xl border border-slate-700">
            <Lock size={32} />
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">{title}</h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-10">{description}</p>

        <div className="flex flex-col md:flex-row justify-center gap-4 max-w-md mx-auto">
            <button 
                onClick={() => onNavigate('register')}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <UserPlus size={18}/> Criar Conta Grátis
            </button>
            <button 
                onClick={() => onNavigate('login')}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <LogIn size={18}/> Já tenho conta
            </button>
        </div>
        
        <p className="mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-widest">Acesso liberado em menos de 1 minuto</p>
    </div>
  </div>
);

// === LAYOUT PADRÃO PARA FERRAMENTAS ===
export const ToolLayout = ({ title, icon, onBack, children, description, badge }: any) => {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) return <WebOnlyBlock title={title} onBack={onBack} />;

  return (
    <div className="max-w-6xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <button onClick={() => onBack('home')} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-sky-400 transition-all font-black uppercase text-[10px] tracking-[0.2em]">
        ← Voltar para o Hub
      </button>
      
      <div className="bg-slate-900/80 border border-slate-800 p-6 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[120px] -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-800/50 pb-8">
          <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-slate-700">{icon}</div>
              <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{title}</h1>
                    {badge && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">{badge}</span>}
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">{description}</p>
              </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// === COMPONENTE DE INPUT REUTILIZÁVEL ===
export const Input = ({ label, value, onChange, prefix, placeholder, help }: any) => (
  <div className="space-y-3 flex-1">
    <div className="flex items-center gap-2 ml-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
      {help && <div className="group relative text-slate-600"><HelpCircle size={12}/><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700 shadow-xl">{help}</div></div>}
    </div>
    <div className="relative group">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-sky-400 transition-colors">{prefix}</span>}
      <input type="number" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full bg-black/20 border border-slate-700 rounded-2xl p-5 text-white font-black text-lg focus:border-sky-500 outline-none transition-all placeholder:text-slate-700 ${prefix ? 'pl-12' : ''}`} />
    </div>
  </div>
);

// === COMPONENTE DE FERRAMENTA EM CONSTRUÇÃO (PLACEHOLDER) ===
export const PlaceholderTool = ({ title, icon, onBack, description, badge }: any) => (
  <ToolLayout title={title} icon={icon} onBack={onBack} description={description} badge={badge || "Em Breve"}>
    <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
       <div className="p-6 bg-slate-800/50 rounded-full animate-pulse"><Zap size={48} className="text-slate-600" /></div>
       <div className="space-y-2">
         <h3 className="text-xl font-black text-white uppercase tracking-tighter">Engenharia em progresso</h3>
         <p className="text-slate-500 text-sm max-w-xs mx-auto">Estamos calibrando os algoritmos para esta ferramenta.</p>
       </div>
    </div>
  </ToolLayout>
);