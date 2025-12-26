
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
      icon: '💰',
      title: 'Controle suas Despesas',
      desc: 'Registre receitas e despesas em um único lugar. Categorize, organize e acompanhe seu fluxo financeiro em tempo real.',
      tool: 'Gerenciador Financeiro'
    },
    {
      icon: '🔥',
      title: 'Descubra seu FIRE',
      desc: 'Calcule exatamente quanto você precisa para alcançar a independência financeira. Descubra quando pode parar de trabalhar.',
      tool: 'Calculadora FIRE'
    },
    {
      icon: '📈',
      title: 'Poder do Investimento',
      desc: 'Simule o crescimento do seu dinheiro ao longo do tempo com juros compostos. Veja o poder do investimento consistente.',
      tool: 'Juros Compostos'
    },
    {
      icon: '💳',
      title: 'Livre-se das Dívidas',
      desc: 'Otimize suas dívidas usando métodos comprovados como Avalanche. Calcule a melhor estratégia para quitar suas obrigações.',
      tool: 'Otimizador de Dívidas'
    },
    {
      icon: '🏠',
      title: 'Aluguel ou Financiamento?',
      desc: 'Compare números reais e descubra qual opção é melhor para sua situação. Simule diferentes cenários financeiros.',
      tool: 'Imóveis'
    },
    {
      icon: '💹',
      title: 'Calcule Rentabilidade',
      desc: 'Analise ROI (retorno sobre investimento) de qualquer projeto ou negócio. Veja se seu investimento compensa.',
      tool: 'Calculadora ROI'
    },
    {
      icon: '💸',
      title: 'Renda Passiva',
      desc: 'Simule quanto você pode ganhar em dividendos e renda passiva. Visualize seu futuro financeiro com cotas de FIIs e ações.',
      tool: 'Dividendos'
    },
    {
      icon: '📚',
      title: 'Educação Contínua',
      desc: 'Acesse artigos, guias e conteúdo educativo sobre finanças pessoais, carreira e tecnologia. Aprenda enquanto usa.',
      tool: 'Academia'
    },
    {
      icon: '🎯',
      title: 'Tudo Pronto!',
      desc: 'Você viu todas as 8 ferramentas principais. Agora é hora de começar sua jornada para a liberdade financeira!',
      isLast: true,
      tool: 'Conclusão'
    }
  ];

  const nextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const restartSlides = () => {
    setSlideIndex(0);
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
            Fazer um Tour Completo
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
      <div className="flex justify-between items-center mb-6">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{slideIndex + 1}/{slides.length}</span>
         <button onClick={finishOnboarding} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Pular</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="text-8xl mb-8 animate-in zoom-in duration-500 key={slideIndex}">
          {slides[slideIndex].icon}
        </div>
        <span className="text-emerald-500 font-bold text-sm uppercase tracking-wider mb-2 block">{slides[slideIndex].tool}</span>
        <h2 className="text-3xl font-bold text-white mb-4 animate-in slide-in-from-bottom-2 duration-500 key={`h-${slideIndex}`}>
          {slides[slideIndex].title}
        </h2>
        <p className="text-slate-400 text-lg leading-relaxed animate-in slide-in-from-bottom-4 duration-500 key={`p-${slideIndex}`}>
          {slides[slideIndex].desc}
        </p>
      </div>

      <div className="mt-auto max-w-md mx-auto w-full">
        <div className="flex justify-center gap-1 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === slideIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>

        {slides[slideIndex].isLast ? (
          <div className="space-y-3">
            <button 
                onClick={finishOnboarding}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
                Ir para o Gerenciador Financeiro
            </button>
            <button 
                onClick={restartSlides}
                className="w-full py-3 text-slate-400 font-bold text-sm hover:text-white transition-colors"
            >
                Revisar o Tour
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
             <button 
               onClick={nextSlide}
               className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 group"
             >
               Próximo <span className="group-hover:translate-x-1 transition-transform">→</span>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
