
import React, { useState, useEffect } from 'react';

interface OnboardingProps {
  onComplete: () => void;
  userName?: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userName }) => {
  const [step, setStep] = useState<'splash' | 'welcome' | 'slides'>('splash');
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => {
      setStep('welcome');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const slides = [
    {
      icon: '📊',
      title: 'Controle suas despesas',
      desc: 'Registre todas as suas receitas e despesas em um único lugar. Categorize, organize e acompanhe seu fluxo financeiro em tempo real.'
    },
    {
      icon: '🔥',
      title: 'Descubra seu FIRE',
      desc: 'Calcule exatamente quanto você precisa para alcançar a independência financeira. Descubra quando pode parar de trabalhar.'
    },
    {
      icon: '💡',
      title: 'Educação Financeira',
      desc: 'Acesse artigos, guias e conteúdo educativo sobre finanças pessoais, carreira e tecnologia. Aprenda enquanto usa.'
    },
    {
      icon: '🚀',
      title: 'Tudo em um só lugar!',
      desc: 'Acesso a 8 ferramentas poderosas, 100% gratuito e offline. Seus dados são seus.',
      isLast: true
    }
  ];

  const nextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('finpro_onboarding_completed', 'true');
    onComplete();
  };

  // 1. Splash Screen
  if (step === 'splash') {
    return (
      <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-900/50 animate-bounce">
           <span className="text-5xl">FP</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Finanças Pro Invest</h1>
        <p className="text-emerald-500 text-sm font-bold animate-pulse">Carregando...</p>
      </div>
    );
  }

  // 2. Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-6 text-center animate-in slide-in-from-right duration-500">
        <h1 className="text-4xl font-bold text-white mb-4">
          Bem-vindo{userName ? `, ${userName}` : ''}! 👋
        </h1>
        <p className="text-slate-400 text-lg mb-12 max-w-xs mx-auto">
          Vamos começar a dominar suas finanças hoje?
        </p>
        
        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => setStep('slides')}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all"
          >
            Fazer um Tour Rápido
          </button>
          <button 
            onClick={finishOnboarding}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          >
            Começar Agora
          </button>
        </div>
      </div>
    );
  }

  // 3. Slideshow
  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="text-8xl mb-8 animate-in zoom-in duration-500 key={slideIndex}">
          {slides[slideIndex].icon}
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 animate-in slide-in-from-bottom-2 duration-500 key={`h-${slideIndex}`}">
          {slides[slideIndex].title}
        </h2>
        <p className="text-slate-400 text-lg leading-relaxed animate-in slide-in-from-bottom-4 duration-500 key={`p-${slideIndex}`}">
          {slides[slideIndex].desc}
        </p>
      </div>

      <div className="mt-auto max-w-md mx-auto w-full">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === slideIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>

        {slides[slideIndex].isLast ? (
          <button 
            onClick={finishOnboarding}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          >
            Ir para o Gerenciador Financeiro
          </button>
        ) : (
          <div className="flex gap-4">
             <button 
               onClick={finishOnboarding}
               className="flex-1 py-4 text-slate-500 font-bold text-sm hover:text-white transition-colors"
             >
               Pular
             </button>
             <button 
               onClick={nextSlide}
               className="flex-[2] py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all"
             >
               Próximo
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
