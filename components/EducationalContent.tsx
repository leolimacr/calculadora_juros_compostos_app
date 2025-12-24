
import React, { useState } from 'react';

interface EducationalContentProps {
  onOpenPlans?: () => void;
}

const EducationalContent: React.FC<EducationalContentProps> = ({ onOpenPlans }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const articles = [
    {
      id: 'psy',
      title: "Psicologia do Dinheiro",
      icon: "🧠",
      subtitle: "Como dominar o cérebro impulsivo",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-lg leading-relaxed">
            Você já comprou algo que não precisava só porque estava "barato" ou porque teve um dia ruim? 
            Isso é o seu <strong className="text-white">Sistema Límbico</strong> agindo – a parte primitiva do cérebro que busca recompensa imediata.
          </p>
          
          <div className="bg-indigo-900/20 border-l-4 border-indigo-500 p-6 rounded-r-xl my-6">
             <h4 className="text-indigo-400 font-bold text-lg mb-2">A Regra dos 3 Dias (72 Horas)</h4>
             <p className="text-sm">Para combater o impulso, implemente esta barreira mental: Sempre que quiser comprar algo não essencial, espere 72 horas.</p>
          </div>

          <ul className="space-y-4">
            <li className="flex gap-4 items-start">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">1</div>
               <div>
                 <strong className="block text-white">O Pico de Dopamina</strong>
                 <span className="text-sm">No momento que você vê o produto, seu cérebro inunda de dopamina. É químico.</span>
               </div>
            </li>
            <li className="flex gap-4 items-start">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">2</div>
               <div>
                 <strong className="block text-white">A Queda da Emoção</strong>
                 <span className="text-sm">Após 24h a 48h, a emoção diminui e o córtex pré-frontal (racional) começa a retomar o controle.</span>
               </div>
            </li>
            <li className="flex gap-4 items-start">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">3</div>
               <div>
                 <strong className="block text-white">Decisão Real</strong>
                 <span className="text-sm">Se no 3º dia você ainda quiser, tiver o dinheiro à vista e for útil, compre. Na maioria das vezes, o desejo terá sumido.</span>
               </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'reserva',
      title: "Reserva de Emergência",
      icon: "🛡️",
      subtitle: "O alicerce da tranquilidade",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-lg leading-relaxed">
            Investir sem reserva de emergência é como pular de paraquedas sem o equipamento reserva. 
            Se algo der errado (desemprego, doença, carro quebra), você será obrigado a vender seus investimentos com prejuízo ou fazer dívidas caras.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
              <h5 className="text-emerald-400 font-bold mb-2 uppercase tracking-wide text-xs">Quanto guardar?</h5>
              <p className="font-bold text-white text-lg">6 a 12 meses</p>
              <p className="text-xs mt-2 text-slate-500">Do seu custo de vida mensal. Se você é CLT, 6 meses. Autônomo? 12 meses no mínimo.</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
              <h5 className="text-emerald-400 font-bold mb-2 uppercase tracking-wide text-xs">Onde investir?</h5>
              <p className="font-bold text-white text-lg">Liquidez Diária</p>
              <p className="text-xs mt-2 text-slate-500">Tesouro Selic ou CDBs de grandes bancos com liquidez diária (100% do CDI). Segurança &gt; Rentabilidade.</p>
            </div>
          </div>
          
          <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl flex gap-3 items-center">
             <span className="text-2xl">🚫</span>
             <p className="text-sm text-red-300">Nunca coloque sua reserva em ações, fundos imobiliários ou criptomoedas. Ela precisa estar lá intacta quando você precisar.</p>
          </div>
        </div>
      )
    },
    {
      id: 'juros',
      title: "Efeito Bola de Neve",
      icon: "❄️",
      subtitle: "A máquina de renda passiva",
      content: (
        <div className="space-y-6 text-slate-300">
          <p className="text-lg leading-relaxed">
            O segredo dos grandes investidores não é apenas escolher boas ações, mas o <strong>tempo</strong> e o <strong>reinvestimento</strong>. 
            Albert Einstein supostamente chamou os juros compostos de "a oitava maravilha do mundo".
          </p>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 rounded-full blur-2xl"></div>
             <h4 className="font-bold text-white mb-4 relative z-10">O Ciclo da Riqueza</h4>
             <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl shadow border border-slate-700">🔨</div>
                   <div>
                      <strong className="text-slate-200">Fase 1: Acumulação</strong>
                      <p className="text-xs text-slate-500">Você trabalha pelo dinheiro. Aportes constantes são mais importantes que a taxa de juros.</p>
                   </div>
                </div>
                <div className="w-0.5 h-6 bg-slate-700 ml-6"></div>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl shadow border border-slate-700">🤝</div>
                   <div>
                      <strong className="text-slate-200">Fase 2: Multiplicação</strong>
                      <p className="text-xs text-slate-500">Você e seu dinheiro trabalham. Os juros começam a pagar algumas contas pequenas.</p>
                   </div>
                </div>
                <div className="w-0.5 h-6 bg-slate-700 ml-6"></div>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-xl shadow shadow-emerald-900/50 text-white">🏖️</div>
                   <div>
                      <strong className="text-emerald-400">Fase 3: Liberdade</strong>
                      <p className="text-xs text-slate-500">Seu dinheiro trabalha por você. Os rendimentos cobrem seu custo de vida.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
      {/* Sidebar Navigation */}
      <div className="lg:w-1/3 space-y-3">
        {articles.map((article, index) => (
          <button
            key={article.id}
            onClick={() => setActiveTab(index)}
            className={`w-full text-left p-5 rounded-xl border transition-all flex items-center gap-4 group ${
              activeTab === index 
                ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-500/50' 
                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
            }`}
          >
            <span className={`text-2xl filter ${activeTab === index ? 'grayscale-0' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all'}`}>{article.icon}</span>
            <div>
              <h3 className={`font-bold text-sm ${activeTab === index ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{article.title}</h3>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{article.subtitle}</p>
            </div>
            {activeTab === index && (
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        ))}
        
        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-900/50 to-slate-900 rounded-2xl border border-indigo-500/30">
           <h4 className="font-bold text-white text-sm mb-2">Quer ir além?</h4>
           <p className="text-xs text-indigo-200 mb-4">Assine o plano PRO e tenha acesso a masterclasses sobre Investimentos no Exterior e Contabilidade.</p>
           <button 
             onClick={onOpenPlans}
             className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-indigo-900/50 transition-all active:scale-95"
           >
             Ver Planos
           </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="lg:w-2/3">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl min-h-[600px] relative overflow-hidden animate-in fade-in duration-500 key={activeTab}">
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-slate-700">
             <div className="flex items-center gap-3 mb-2">
               <span className="text-4xl">{articles[activeTab].icon}</span>
               <h2 className="text-3xl font-bold text-white">{articles[activeTab].title}</h2>
             </div>
             <p className="text-emerald-400 font-medium text-lg">{articles[activeTab].subtitle}</p>
          </div>
          
          {/* Body */}
          <div className="leading-relaxed">
            {articles[activeTab].content}
          </div>
          
          <div className="mt-12 pt-6 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
             <span>Leitura: 3 min</span>
             <button className="hover:text-emerald-400 transition-colors">Compartilhar Artigo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalContent;
