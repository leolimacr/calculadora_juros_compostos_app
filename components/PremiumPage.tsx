
import React from 'react';

interface PremiumPageProps {
  onNavigate: (path: string) => void;
}

const PremiumPage: React.FC<PremiumPageProps> = ({ onNavigate }) => {
  const handleSubscribe = () => {
    // TODO: INTEGRAR SISTEMA DE PAGAMENTOS AQUI (Stripe/RevenueCat/PlayBilling)
    // Por enquanto, mostra modal de espera ou redireciona
    alert("🚀 A assinatura automática estará disponível na próxima atualização! Fique ligado.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 pb-24">
      
      {/* Hero Section */}
      <div className="text-center pt-8 px-4">
        <span className="inline-block py-1 px-3 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-widest mb-6 shadow-lg shadow-yellow-500/20">
          ✨ Seja Pro
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
          Pare de adivinhar para onde<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">vai o seu dinheiro.</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Desbloqueie o controle completo das suas finanças. Saiba exatamente quanto sobra para investir, proteja seus dados na nuvem e tome decisões com clareza.
        </p>
      </div>

      {/* Pricing Card Principal */}
      <div className="relative mx-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-3xl blur opacity-30 animate-pulse"></div>
        <div className="relative bg-slate-800 rounded-3xl border border-emerald-500/50 p-8 md:p-12 text-center shadow-2xl">
           <h3 className="text-2xl font-bold text-white mb-2">Plano Premium</h3>
           <div className="flex justify-center items-baseline gap-1 mb-4">
             <span className="text-sm text-slate-400 font-bold">R$</span>
             <span className="text-6xl font-black text-white tracking-tighter">9,90</span>
             <span className="text-slate-400 font-bold">/mês</span>
           </div>
           <p className="text-sm text-emerald-400 font-bold bg-emerald-900/30 inline-block px-4 py-1 rounded-full mb-8">
             Menos que um delivery. Economia real.
           </p>

           <button 
             onClick={handleSubscribe}
             className="w-full md:w-auto md:min-w-[300px] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 transform"
           >
             Quero Experimentar o Premium
           </button>
           <p className="text-xs text-slate-500 mt-4">Cancelamento fácil a qualquer momento.</p>
        </div>
      </div>

      {/* Benefícios em Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
           <span className="text-3xl mb-4 block">🚀</span>
           <h4 className="text-lg font-bold text-white mb-2">Lançamentos Ilimitados</h4>
           <p className="text-slate-400 text-sm">O plano grátis limita a 30 lançamentos. No Premium, você registra cada cafézinho sem se preocupar.</p>
        </div>
        
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
           <span className="text-3xl mb-4 block">☁️</span>
           <h4 className="text-lg font-bold text-white mb-2">Backup na Nuvem</h4>
           <p className="text-slate-400 text-sm">Trocou de celular? Sem problemas. Seus dados são sincronizados e protegidos automaticamente.</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
           <span className="text-3xl mb-4 block">📊</span>
           <h4 className="text-lg font-bold text-white mb-2">Relatórios Avançados</h4>
           <p className="text-slate-400 text-sm">Visualize tendências de gastos por categoria e mês. Entenda seus padrões de consumo.</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
           <span className="text-3xl mb-4 block">🎯</span>
           <h4 className="text-lg font-bold text-white mb-2">Metas Inteligentes</h4>
           <p className="text-slate-400 text-sm">Defina objetivos de poupança e gastos. O app avisa se você estiver saindo do trilho.</p>
        </div>
      </div>

      {/* Comparison Table (Simple) */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden mx-4">
         <div className="p-6 border-b border-slate-800 bg-slate-950">
            <h3 className="font-bold text-center text-white">Comparativo</h3>
         </div>
         <div className="divide-y divide-slate-800">
            <div className="grid grid-cols-3 p-4 text-sm items-center">
               <span className="text-slate-400">Recurso</span>
               <span className="text-center text-slate-500 font-bold">Grátis</span>
               <span className="text-center text-emerald-400 font-bold">Premium</span>
            </div>
            <div className="grid grid-cols-3 p-4 text-sm items-center hover:bg-slate-800/50">
               <span className="text-white">Lançamentos</span>
               <span className="text-center text-slate-400">30 / total</span>
               <span className="text-center text-white font-bold">Ilimitado</span>
            </div>
            <div className="grid grid-cols-3 p-4 text-sm items-center hover:bg-slate-800/50">
               <span className="text-white">Sincronização</span>
               <span className="text-center text-slate-400">Local</span>
               <span className="text-center text-white font-bold">Nuvem Segura</span>
            </div>
            <div className="grid grid-cols-3 p-4 text-sm items-center hover:bg-slate-800/50">
               <span className="text-white">IA Advisor</span>
               <span className="text-center text-slate-400">Limitado</span>
               <span className="text-center text-white font-bold">Completo</span>
            </div>
         </div>
      </div>

      <div className="text-center pt-8">
         <button onClick={() => onNavigate('home')} className="text-slate-500 hover:text-white transition-colors text-sm font-bold">
            Voltar para o Início
         </button>
      </div>

    </div>
  );
};

export default PremiumPage;
