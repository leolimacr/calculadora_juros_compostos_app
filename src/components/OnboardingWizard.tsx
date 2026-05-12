import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { X, ArrowRight, ArrowLeft, CheckCircle, Target, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

type OnboardingPersona = 'dividas' | 'patrimonio' | 'geral';

const PERSONA_OPTIONS: { value: OnboardingPersona; label: string; sublabel: string }[] = [
  { value: 'dividas',    label: 'Tenho dívidas que me preocupam',       sublabel: 'Cartão, crédito, parcelamentos ou contas em atraso' },
  { value: 'patrimonio', label: 'Quero organizar meu patrimônio',        sublabel: 'Investimentos, bens, metas de longo prazo' },
  { value: 'geral',      label: 'Quero ter mais controle no geral',      sublabel: 'Rotina financeira, gastos e planejamento do mês' },
];

const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Vamos deixar sua vida financeira mais clara',
    description: 'Em poucos passos eu entendo seu momento e te mostro por onde começar. Leva menos de 2 minutos.',
    color: 'emerald',
  },
  {
    id: 'diagnose',
    icon: AlertCircle,
    title: 'O que mais te incomoda hoje?',
    description: 'Escolha uma opção. Isso ajuda o sistema a mostrar as ferramentas mais úteis para o seu momento.',
    color: 'sky',
  },
  {
    id: 'organize',
    icon: Target,
    title: 'Primeiro: enxergar o quadro geral',
    description: 'Aqui você junta dívidas, rotina e patrimônio num só lugar, para parar de decidir no escuro e ver a sua realidade como um todo.',
    color: 'sky',
  },
  {
    id: 'nexus',
    icon: BookOpen,
    title: 'Depois: ter um próximo passo sempre claro',
    description: 'Com seus dados vivos, o Nexus acompanha sua vida financeira, avisa quando algo merece atenção e sugere o que fazer a seguir.',
    color: 'indigo',
  },
  {
    id: 'ready',
    icon: CheckCircle,
    title: 'Agora é com você (e comigo aqui do lado)',
    description: 'Sua conta está ativa. Comece pelas dívidas ou pelo patrimônio — o que dói mais hoje. O Finanças Pro Invest te acompanha a partir daí.',
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
  const [persona, setPersona] = useState<OnboardingPersona | null>(null);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isDiagnose = step.id === 'diagnose';
  const colors = colorMap[step.color] || colorMap.emerald;
  const Icon = step.icon;

  const markComplete = async () => {
    setCompleting(true);
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        onboardingCompleted: true,
        ...(persona ? { onboardingPersona: persona } : {}),
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

          {isDiagnose && (
            <div className="mt-4 flex flex-col gap-2">
              {PERSONA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPersona(opt.value)}
                  className={`text-left rounded-xl border px-4 py-3 transition-all duration-200 ${
                    persona === opt.value
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40'
                  }`}
                >
                  <p className={`text-sm font-black leading-snug ${persona === opt.value ? 'text-sky-800' : 'text-slate-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.sublabel}</p>
                </button>
              ))}
            </div>
          )}
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
            disabled={completing || (isDiagnose && !persona)}
            className={`flex-1 ${colors.button} text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed`}
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