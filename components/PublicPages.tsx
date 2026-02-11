import React, { useEffect, useState } from 'react';

// --- DADOS ESTÁTICOS (FALLBACK) ---
const INITIAL_MARKET = {
    indices: [
        { symbol: 'IBOV', price: '128.450', change: '+0.85%', up: true },
        { symbol: 'S&P 500', price: '5.120', change: '+1.10%', up: true },
    ],
    indicators: [
        { symbol: 'CDI', price: '10,65%', change: 'a.a.', up: true },
        { symbol: 'IPCA', price: '4,50%', change: 'acum. 12m', up: false },
    ],
    stocks: [
        { symbol: 'VALE3', price: '62,50', change: '+0.50%', up: true },
        { symbol: 'PETR4', price: '38,20', change: '-1.20%', up: false },
        { symbol: 'ITUB4', price: '34,10', change: '+0.80%', up: true },
        { symbol: 'BBDC4', price: '13,90', change: '-0.50%', up: false },
        { symbol: 'ABEV3', price: '12,40', change: '+0.10%', up: true },
        { symbol: 'BBAS3', price: '27,80', change: '+0.30%', up: true },
        { symbol: 'ELET3', price: '38,50', change: '+1.15%', up: true },
        { symbol: 'WEGE3', price: '38,90', change: '-0.15%', up: false },
        { symbol: 'BPAC11', price: '36,80', change: '+1.10%', up: true },
        { symbol: 'SUZB3', price: '52,30', change: '-0.70%', up: false },
    ]
};

const InfiniteTicker = ({ data }: any) => {
    const all = [...data.indices, ...data.indicators, ...data.stocks];
    return (
        <div className="w-full bg-[#0f172a] border-b border-slate-800 h-10 flex items-center overflow-hidden z-40">
            <div className="animate-marquee flex whitespace-nowrap items-center">
                {[...all, ...all].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mx-6 text-[11px] font-mono font-bold">
                        <span className="text-slate-400">{item.symbol}</span>
                        <span className={item.up ? 'text-emerald-400' : 'text-red-400'}>
                            {item.price} ({item.change})
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-700 ml-4"></span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 50s linear infinite; }
            `}</style>
        </div>
    );
};

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow }) => {
  // 👇 Estados para os dados, carregamento e erro
  const [marketData, setMarketData] = useState<any>(INITIAL_MARKET);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 👇 Efeito para buscar os dados ao carregar o componente
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        // URL CORRETA da sua função Cloud Run
	// const functionUrl = 'https://us-central1-financas-pro-invest.cloudfunctions.net/getMarketData';
        const response = await fetch('https://getmarketdata-5auxvdzm3q-uc.a.run.app');
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        setMarketData(data);
        setError(null); // Limpa qualquer erro anterior
      } catch (err: any) {
        console.error('Erro ao buscar dados:', err);
        setError('Dados em tempo real temporariamente indisponíveis. Exibindo dados ilustrativos.');
        // Mantém os dados estáticos (já são o padrão)
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // 👇 Opcional: Configurar atualização automática a cada 60 segundos
    const intervalId = setInterval(fetchMarketData, 60000);
    
    // Limpeza do intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, []); // Array de dependências vazio = executa apenas ao montar

  return (
    <div className="flex flex-col bg-[#020617]">
      {/* Barra de Cotações */}
      <div className="pt-16">
        <InfiniteTicker data={marketData} />
        {/* Mensagens de status */}
        {loading && (
          <div className="text-center text-slate-400 text-sm py-2">
            Atualizando cotações...
          </div>
        )}
        {error && (
          <div className="text-center text-amber-500 text-sm py-2">
            {error}
          </div>
        )}
      </div>

      <section className="px-4 lg:px-12 py-12 lg:py-20 max-w-[1600px] mx-auto w-full grid lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: MERCADO */}
        <div className="hidden lg:flex lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex-col gap-6 shadow-2xl h-[600px] overflow-y-auto custom-scrollbar">
            <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-3">Mercado ao Vivo</h3>
            <MarketGroup title="Índices" items={marketData.indices} />
            <MarketGroup title="Indicadores" items={marketData.indicators} />
            <MarketGroup title="Top 10 Ibovespa" items={marketData.stocks} />
        </div>

        {/* COLUNA CENTRAL: CONTEÚDO */}
        <div className="lg:col-span-6 text-center space-y-8 py-10">
            <h1 className="text-5xl lg:text-8xl font-black text-white leading-none tracking-tight">
                Domine o Jogo <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">do Dinheiro</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl max-w-xl mx-auto">Tudo o que você precisa para gerenciar, simular e investir melhor.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button onClick={onStartNow} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">COMEÇAR AGORA</button>
                <button onClick={() => onNavigate('compound')} className="bg-slate-800 text-white px-8 py-5 rounded-2xl font-bold text-xl border border-slate-700 hover:bg-slate-700 transition-all">DEMONSTRAÇÃO</button>
            </div>
            <div className="grid grid-cols-4 gap-2 opacity-50 grayscale pt-10 max-w-md mx-auto">
                <div className="text-center"><span className="text-2xl block">💰</span><span className="text-[10px] font-bold">GESTÃO</span></div>
                <div className="text-center"><span className="text-2xl block">📈</span><span className="text-[10px] font-bold">JUROS</span></div>
                <div className="text-center"><span className="text-2xl block">🔥</span><span className="text-[10px] font-bold">FIRE</span></div>
                <div className="text-center"><span className="text-2xl block">🤖</span><span className="text-[10px] font-bold">IA</span></div>
            </div>
        </div>

        {/* COLUNA DIREITA: INSIGHTS */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            <InsightCard title="Calculadora FIRE" desc="Nova ferramenta de independência financeira liberada." tag="NOVO" onClick={() => onNavigate('fire')} />
            <InsightCard title="Como investir em 2026" desc="O guia completo sobre a nova economia." tag="CURSO" onClick={() => onNavigate('blog')} />
            <InsightCard title="Inflação no Brasil" desc="O IPCA acumulado exige cautela na renda fixa." tag="NOTÍCIA" onClick={() => onNavigate('blog')} />
        </div>
      </section>

      {/* FERRAMENTAS - GRID ATUALIZADO COM CONSULTOR IA WEB */}
      <section className="bg-slate-900/30 py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-slate-500 font-bold uppercase tracking-widest mb-12">9 Ferramentas Poderosas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
                <ToolItem icon="💰" name="Gerenciador" desc="Fluxo de Caixa" onClick={onStartNow} />
                <ToolItem icon="📈" name="Juros Compostos" desc="Simulador" onClick={() => onNavigate('compound')} />
                <ToolItem icon="🔥" name="Calculadora FIRE" desc="Independência" onClick={() => onNavigate('fire')} />
                <ToolItem icon="🤖" name="Consultor IA" desc="Versão App" onClick={() => onNavigate('ai_chat')} />
                <ToolItem icon="⭐" name="Consultor IA" desc="Versão Web" onClick={() => onNavigate('chat')} />
                <ToolItem icon="📉" name="Inflação" desc="Poder de Compra" onClick={() => onNavigate('inflation')} />
                <ToolItem icon="🏠" name="Imóveis" desc="Alugar vs Comprar" onClick={() => onNavigate('rent_vs_buy')} />
                <ToolItem icon="💳" name="Dívidas" desc="Otimizador" onClick={() => onNavigate('debt')} />
                <ToolItem icon="📊" name="Dividendos" desc="Renda Passiva" onClick={() => onNavigate('dividends')} />
            </div>
            <p className="text-center text-slate-600 text-xs mt-8 max-w-2xl mx-auto">
                <span className="text-sky-400 font-bold">Novo:</span> Acesse o <strong>Consultor IA</strong> tanto pelo aplicativo (🤖) quanto pela versão web (⭐) com histórico sincronizado na nuvem.
            </p>
        </div>
      </section>
    </div>
  );
};

const MarketGroup = ({ title, items }: any) => (
    <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{title}</p>
        {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300">{item.symbol}</span>
                <span className={item.up ? 'text-emerald-400' : 'text-red-400'}>{item.price}</span>
            </div>
        ))}
    </div>
);

const InsightCard = ({ title, desc, tag, onClick }: any) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-sky-500/30 transition-all cursor-pointer group">
        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-1 rounded font-black uppercase mb-3 inline-block">{tag}</span>
        <h4 className="text-white font-bold mb-2 group-hover:text-sky-300 transition-colors">{title}</h4>
        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
);

const ToolItem = ({ icon, name, desc, onClick }: any) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-95 min-h-[120px] justify-center">
        <span className="text-3xl">{icon}</span>
        <div>
            <h5 className="text-white font-bold text-sm">{name}</h5>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">{desc}</p>
        </div>
    </div>
);