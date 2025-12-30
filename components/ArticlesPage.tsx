
import React, { useState } from 'react';

interface ArticlesPageProps {
  onReadArticle?: (slug: string) => void;
}

const ArticlesPage: React.FC<ArticlesPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'ia' | 'carreira' | 'basico'>('ia');

  const articles = {
    ia: [
      { 
        id: 101, 
        title: "Como a IA organiza seu bolso", 
        desc: "Chega de planilhas manuais. Descubra como algoritmos podem categorizar seus gastos automaticamente e prever quando você vai ficar no vermelho.", 
        tag: "Tecnologia",
        date: "Nov 2025"
      },
      { 
        id: 102, 
        title: "Previsão de Gastos: O Futuro", 
        desc: "Ferramentas preditivas analisam seu histórico para dizer quanto você gastará no próximo mês com 90% de precisão.", 
        tag: "Tendência",
        date: "Out 2025"
      },
      { 
        id: 103, 
        title: "ChatGPT como Consultor Financeiro", 
        desc: "Dicas de prompts para pedir conselhos de investimento e análise de carteira para IAs generativas.", 
        tag: "Prático",
        date: "Set 2025"
      },
    ],
    carreira: [
      { 
        id: 201, 
        title: "Finanças + Tech: O Profissional de Ouro", 
        desc: "O mercado não quer mais apenas quem sabe fazer contas. Entenda por que profissionais financeiros que dominam dados e IA ganham 40% a mais.", 
        tag: "Carreira",
        date: "Dez 2025"
      },
      { 
        id: 202, 
        title: "Ferramentas Digitais para se Destacar", 
        desc: "Não basta saber Excel. Conheça as ferramentas de BI e automação que estão dominando os departamentos financeiros.", 
        tag: "Skills",
        date: "Nov 2025"
      },
      { 
        id: 203, 
        title: "Organização Pessoal = Sucesso Profissional", 
        desc: "Como a disciplina com seu próprio dinheiro reflete na sua imagem corporativa e capacidade de liderança.", 
        tag: "Soft Skills",
        date: "Out 2025"
      },
    ],
    basico: [
      { id: 301, title: "A Regra 50/30/20", desc: "O método clássico para dividir seu orçamento de forma equilibrada sem sofrimento.", tag: "Básico", date: "Jan 2025" },
      { id: 302, title: "Reserva de Emergência", desc: "Onde investir e quanto guardar para dormir tranquilo quando o imprevisto acontecer.", tag: "Segurança", date: "Fev 2025" },
      { id: 303, title: "Cartão de Crédito: Aliado?", desc: "Estratégias para acumular milhas e benefícios sem se endividar com os juros.", tag: "Crédito", date: "Mar 2025" },
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
        <div>
            <h2 className="text-3xl font-bold text-white mb-1">Hub de Conhecimento</h2>
            <p className="text-slate-400 text-sm">Educação financeira turbinada por tecnologia.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
          {[
            { id: 'ia', label: '🤖 IA & Finanças' },
            { id: 'carreira', label: '💼 Mercado & Carreira' },
            { id: 'basico', label: '📚 Fundamentos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles[activeTab].map(article => (
          <div key={article.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group hover:-translate-y-1 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded inline-block border border-emerald-500/20">
                {article.tag}
                </span>
                <span className="text-[10px] text-slate-500">{article.date}</span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors leading-snug">
              {article.title}
            </h3>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow">
              {article.desc}
            </p>
            
            <div className="pt-4 border-t border-slate-700/50 mt-auto">
                <span className="text-xs text-slate-500 font-bold group-hover:text-white transition-colors flex items-center gap-2">
                    Ler artigo completo <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 p-8 rounded-2xl border border-indigo-500/20 text-center mt-12">
        <h3 className="text-xl font-bold text-white mb-2">Quer receber esses insights?</h3>
        <p className="text-slate-400 text-sm mb-6">Nossa newsletter traz o resumo do que há de novo em IA aplicada ao seu dinheiro.</p>
        <div className="flex max-w-md mx-auto gap-2">
          <input type="email" placeholder="Seu melhor e-mail" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg">
            Assinar Grátis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;
