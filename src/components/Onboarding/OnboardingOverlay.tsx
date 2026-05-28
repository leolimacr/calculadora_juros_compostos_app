import React from 'react';
import { X, ArrowRight, CheckCircle, Wallet, LayoutGrid } from 'lucide-react';

interface OnboardingOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onLaunch: () => void;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  step,
  onNext,
  onSkip,
  onFinish,
  onLaunch,
}) => {
  if (step === 0) return null;

  const content = [
    {
      icon: <Wallet className="text-emerald-500" size={32} />,
      title: 'Seu ponto de partida ❤️',
      body: 'Aqui é sua base. O resumo do seu dia aparece aqui. Que tal começar lançando sua primeira receita?',
      cta: 'Lançar agora',
      action: onLaunch,
    },
    {
      icon: <CheckCircle className="text-sky-500" size={32} />,
      title: 'Seu parceiro diário 📋',
      body: 'Pronto! Seu primeiro lançamento foi registrado. O Controla vai te mostrar para onde seu dinheiro está indo. Lance mais alguns para eu te conhecer melhor.',
      cta: 'Entendi',
      action: onNext,
    },
    {
      icon: <LayoutGrid className="text-indigo-500" size={32} />,
      title: 'Sua evolução 🚀',
      body: 'Aqui é a Central. Conforme você usa o app, ela mostra sua evolução e te ajuda a tomar decisões maiores. Volte aqui em alguns dias para ver seu progresso.',
      cta: 'Concluir',
      action: onFinish,
    },
  ];

  const currentContent = content[step - 1];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 shadow-sm">
          {currentContent.icon}
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-3 tracking-tight">
          {currentContent.title}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          {currentContent.body}
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={currentContent.action}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:bg-slate-800 active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
          >
            {currentContent.cta}
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onSkip}
            className="text-slate-400 hover:text-slate-600 font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto py-2"
          >
            <X size={14} /> Pular introdução
          </button>
        </div>

        <div className="flex gap-1.5 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s === step ? 'w-6 bg-slate-900' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingOverlay;
