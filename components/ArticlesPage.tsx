
import React, { useState } from 'react';
import { subscribeToNewsletter } from '../services/newsletterService';

interface ArticlesPageProps {
  onReadArticle?: (slug: string) => void;
}

const ArticlesPage: React.FC<ArticlesPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'ia' | 'carreira' | 'fundamentos'>('ia');
  
  // Newsletter Logic
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async () => {
    // Validação simples
    if (!email || !email.includes('@') || !email.includes('.')) {
        // Poderíamos setar um erro específico, mas vamos manter simples no 'idle' visualmente ou tratar se quiser
        return;
    }

    setStatus('loading');
    try {
        await subscribeToNewsletter(email, 'hub_conhecimento');
        setStatus('success');
        setEmail('');
    } catch (error) {
        setStatus('error');
    }
  };

  const articles = {
    ia: [
      { 
        id: 101, 
        title: "A Ilusão do Controle Algorítmico", 
        desc: "A IA pode categorizar seu passado com precisão cirúrgica, mas o futuro permanece opaco. Use a tecnologia para limpar a neblina dos dados, não para criar uma falsa sensação de segurança sobre o amanhã.", 
        tag: "Incerteza",
        date: "Dez 2025"
      },
      { 
        id: 102, 
        title: "O Limite da Previsão", 
        desc: "Modelos preditivos falham justamente nos eventos extremos que mais importam. O objetivo do Finanças Pro não é adivinhar o futuro, mas preparar sua robustez financeira para sobreviver ao que a IA não consegue prever.", 
        tag: "Risco",
        date: "Nov 2025"
      },
      { 
        id: 103, 
        title: "Terceirizando o Julgamento", 
        desc: "A IA é um excelente copiloto, mas um péssimo capitão. Ela não tem 'pele em jogo' (skin in the game). Se ela errar a recomendação, quem perde o patrimônio é você. Mantenha a decisão final.", 
        tag: "Skin in the Game",
        date: "Out 2025"
      },
    ],
    carreira: [
      { 
        id: 201, 
        title: "Finanças como Opcionalidade", 
        desc: "Uma reserva financeira robusta não serve apenas para emergências; ela compra sua liberdade para fazer apostas assimétricas na carreira. O dinheiro organizado é o que permite você dizer 'não' ao medíocre e 'sim' ao risco calculado.", 
        tag: "Antifragilidade",
        date: "Dez 2025"
      },
      { 
        id: 202, 
        title: "Assimetria da Informação", 
        desc: "Em um mercado ruidoso, quem domina seus próprios dados tem vantagem. Usar ferramentas digitais para ver o que os outros ignoram não é apenas 'organização', é alfa na gestão da sua própria vida profissional.", 
        tag: "Estratégia",
        date: "Nov 2025"
      },
      { 
        id: 203, 
        title: "A Vantagem do Longo Prazo", 
        desc: "A maioria otimiza para o curto prazo e quebra na primeira crise. A disciplina financeira é a arte chata de sobreviver tempo suficiente para que a sorte (e os juros compostos) encontre você.", 
        tag: "Tempo",
        date: "Out 2025"
      },
    ],
    fundamentos: [
      { id: 301, title: "Evitando a Ruína", desc: "A regra número um não é 'ficar rico', é 'não quebrar'. Antes de buscar multiplicadores de retorno, garanta que seu sistema financeiro aguenta choques. Sobrevivência é pré-requisito para o sucesso.", tag: "Sobrevivência", date: "Jan 2025" },
      { id: 302, title: "Via Negativa nos Gastos", desc: "Muitas vezes, a riqueza vem do que você *não* faz. Cortar o supérfluo que drena sua energia e capital é mais eficiente do que buscar retornos mirabolantes em investimentos complexos.", tag: "Via Negativa", date: "Fev 2025" },
      { id: 303, title: "Dívida é Fragilidade", desc: "Toda dívida é uma aposta de que o futuro será melhor que o presente. Quando o futuro surpreende negativamente, a dívida transforma volatilidade em ruína. Mantenha-se leve.", tag: "Fragilidade", date: "Mar 2025" },
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
        <div>
            <h2 className="text-3xl font-bold text-white mb-1">Hub de Conhecimento</h2>
            <p className="text-slate-400 text-sm">Reflexões sobre dinheiro, risco e realidade.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
          {[
            { id: 'ia', label: '🤖 IA & Risco' },
            { id: 'carreira', label: '💼 Carreira & Apostas' },
            { id: 'fundamentos', label: '🏛️ Fundamentos' }
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
          <div key={article.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group hover:-translate-y-1 flex flex-col h-full shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded inline-block border border-emerald-500/20 uppercase tracking-wider">
                {article.tag}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{article.date}</span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors leading-snug">
              {article.title}
            </h3>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow border-l-2 border-slate-700 pl-3 italic">
              "{article.desc}"
            </p>
            
            <div className="pt-4 border-t border-slate-700/50 mt-auto">
                <span className="text-xs text-slate-500 font-bold group-hover:text-white transition-colors flex items-center gap-2">
                    Ler ensaio completo <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 p-8 rounded-2xl border border-indigo-500/20 text-center mt-12 transition-all">
        <h3 className="text-xl font-bold text-white mb-2">Insights fora do consenso</h3>
        <p className="text-slate-400 text-sm mb-6">Receba análises semanais que desafiam o senso comum financeiro.</p>
        
        {status === 'success' ? (
            <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl animate-in zoom-in">
                <p className="font-bold">Pronto! Você está inscrito.</p>
                <p className="text-xs mt-1">Quando houver novidades relevantes em IA e finanças, você será o primeiro a saber.</p>
                <button onClick={() => setStatus('idle')} className="text-xs underline mt-2 hover:text-white">Cadastrar outro e-mail</button>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                <div className="flex max-w-md w-full gap-2 relative">
                    <input 
                        type="email" 
                        placeholder="Seu melhor e-mail" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={status === 'loading'}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors disabled:opacity-50" 
                    />
                    <button 
                        onClick={handleSubscribe}
                        disabled={status === 'loading'}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {status === 'loading' ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Assinar'
                        )}
                    </button>
                </div>
                {status === 'error' && (
                    <p className="text-red-400 text-xs mt-3 animate-in fade-in">
                        Não conseguimos salvar seu e-mail agora. Tente novamente em alguns minutos.
                    </p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
