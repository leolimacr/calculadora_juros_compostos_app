
import React, { useState } from 'react';

interface ArticlesPageProps {
  onReadArticle?: (slug: string) => void;
}

const ArticlesPage: React.FC<ArticlesPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'carreira' | 'ia'>('geral');

  const articles = {
    geral: [
      { id: 1, title: "A Regra 50/30/20", desc: "Como dividir seu orçamento de forma equilibrada.", tag: "Básico" },
      { id: 2, title: "Reserva de Emergência", desc: "Onde investir e quanto guardar para dormir tranquilo.", tag: "Investimentos" },
      { id: 3, title: "Cartão de Crédito: Aliado ou Vilão?", desc: "Estratégias para acumular milhas sem se endividar.", tag: "Dívidas" },
    ],
    carreira: [
      { id: 4, title: "Negociação Salarial", desc: "Scripts prontos para pedir aumento.", tag: "Carreira" },
      { id: 5, title: "Transição de Carreira", desc: "Como planejar financeiramente uma mudança de área.", tag: "Planejamento" },
      { id: 6, title: "Freelance vs CLT", desc: "Calculando o valor da sua hora de trabalho.", tag: "Renda Extra" },
    ],
    ia: [
      { id: 7, title: "IA nas Finanças", desc: "Como usar o ChatGPT para analisar seus gastos.", tag: "Tech" },
      { id: 8, title: "Automação de Planilhas", desc: "Ferramentas de IA que substituem o Excel.", tag: "Produtividade" },
      { id: 9, title: "O Futuro do Trabalho", desc: "Como a IA impacta o mercado financeiro.", tag: "Tendências" },
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Artigos & Insights</h2>
        
        {/* Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          {(['geral', 'carreira', 'ia'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'ia' ? 'Inteligência Artificial' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles[activeTab].map(article => (
          <div key={article.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group hover:-translate-y-1">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded mb-3 inline-block">
              {article.tag}
            </span>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              {article.desc}
            </p>
            <span className="text-xs text-slate-500 font-bold group-hover:text-white transition-colors">Ler artigo →</span>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 text-center mt-12">
        <h3 className="text-xl font-bold text-white mb-2">Quer conteúdo exclusivo?</h3>
        <p className="text-slate-400 text-sm mb-6">Assine nossa newsletter e receba resumos semanais de Carreira e Finanças.</p>
        <div className="flex max-w-md mx-auto gap-2">
          <input type="email" placeholder="Seu melhor e-mail" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors" />
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg text-sm">Assinar</button>
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;
