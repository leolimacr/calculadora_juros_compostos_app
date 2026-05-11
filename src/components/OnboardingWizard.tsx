import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { X, ArrowRight, ArrowLeft, CheckCircle, Target, BookOpen, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Bem-vindo ao Finanças Pro Invest',
    description: 'Em poucos passos vamos te mostrar o que você pode fazer aqui. Leva menos de 2 minutos.',
    color: 'emerald',
  },
  {
    id: 'organize',
    icon: Target,
    title: 'Organize sua vida financeira',
    description: 'Cadastre dívidas, patrimônio e investimentos para ter uma visão completa da sua realidade financeira.',
    color: 'sky',
  },
  {
    id: 'nexus',
    icon: BookOpen,
    title: 'Conte com o Nexus IA',
    description: 'O Nexus analisa seus dados e te ajuda a tomar decisões melhores — com contexto real, não conselhos genéricos.',
    color: 'indigo',
  },
  {
    id: 'ready',
    icon: CheckCircle,
    title: 'Tudo pronto para começar',
    description: 'Sua conta está ativa. Comece cadastrando suas dívidas ou seu patrimônio — o que fizer mais sentido pra você agora.',
    color: 'emerald',
  },
];

const colorMap: Record<string, { bg: string; icon: string; button: string; ring: string }> = {
  emerald: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    button: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30',
    ring: 'bg-emerald-500',
  },
  sky: {
    bg: 'bg-sky-50 border-sky-200',
    icon: 'bg-sky-100 text-sky-600 border-sky-200',
    button: 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30',
    ring: 'bg-sky-500',
  },
  indigo: {
    bg: 'bg-indigo-50 border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    button: 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/30',
    ring: 'bg-indigo-500',
  },
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const colors = colorMap[step.color] || colorMap.emerald;
  const Icon = step.icon;

  const markComplete = async () => {
    setCompleting(true);
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        onboardingCompleted: true,
      });
    } catch (e) {
      console.error('Erro ao gravar onboardingCompleted:', e);
    } finally {
      onComplete();
    }
  };

  const handleNext = () => {
    if (isLast) {
      markComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => markComplete();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* Barra de progresso */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? colors.ring : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className={`m-4 rounded-xl border p-6 ${colors.bg} transition-all duration-300`}>
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${colors.icon}`}>
            <Icon size={28} />
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-2 leading-tight">
            {step.title}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Ações */}
        <div className="px-4 pb-5 flex items-center gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={completing}
            className={`flex-1 ${colors.button} text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50`}
          >
            {completing ? 'Salvando...' : isLast ? 'Começar agora' : 'Próximo'}
            {!completing && <ArrowRight size={16} />}
          </button>

          {!isLast && (
            <button
              onClick={handleSkip}
              className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
              aria-label="Pular tutorial"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {!isLast && (
          <p className="text-center text-[11px] text-slate-400 pb-4">
            Passo {currentStep + 1} de {STEPS.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;