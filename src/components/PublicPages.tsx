import { courses } from './Public/Courses';
import React, { useEffect, useState, useMemo } from 'react';
import MobileBottomNav from "./MobileBottomNav";
import { 
  LogOut, Settings, Sparkles, Wallet, Eye, EyeOff, LayoutGrid, Globe, Menu, Search, 
  ArrowRight, Instagram, Linkedin, Mail, TrendingUp, Zap, Building2, PieChart, 
  ChevronLeft, Users, LockKeyhole, HelpCircle, MessageSquare, Newspaper, BarChart3
} from 'lucide-react';

import { articles } from './Public/Articles';
import { ALL_B3_TICKERS } from '../data/tickers'; 
import { ContentModal, AssetModal } from './Public/HomeModals'; 
import { InfiniteTicker, MarketGroup, MarketItemRow } from './Public/MarketComponents';

// --- CONFIGURAÇÃO DAS APIS (MANTIDAS INTACTAS) ---
const CLOUD_API_URL = 'https://getmarketdata-5auxvdzm3q-uc.a.run.app';
const TICKER_API_URL = 'https://gettickerprice-5auxvdzm3q-uc.a.run.app';
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BNB-BRL,SOL-BRL,BTC-USD,ETH-USD,SOL-USD';
const BCB_SELIC_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
const BCB_IPCA_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json';

// --- CONTEÚDO DO RADAR (NOTÍCIAS) ---
// Você pode editar estes textos manualmente aqui quando quiser atualizar o site
const RADAR_NEWS = [
  {
    id: 1,
    tag: 'Macroeconomia',
    date: 'Semana 08/2026',
    title: 'Copom mantém a taxa Selic em 15.% a.a.',
    excerpt: 'Com a inflação dando sinais de persistência, o Banco Central optou pela cautela. Entenda como isso afeta seus investimentos em Renda Fixa.'
  },
  {
    id: 2,
    tag: 'Tecnologia & Carreira',
    date: 'Tendência',
    title: 'O avanço da IA e a nova produtividade',
    excerpt: 'Ferramentas de IA não estão substituindo investidores, mas investidores que usam IA estão superando os que não usam.'
  },
  {
    id: 3,
    tag: 'Mercado Imobiliário',
    date: 'Análise Setorial',
    title: 'Aluguel vs Financiamento: O cenário mudou',
    excerpt: 'Com as novas taxas de juros, a velha regra de "quem casa quer casa" precisa ser recalculada na ponta do lápis.'
  }
];

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow, isAuthenticated, userMeta }) => {
  // --- ESTADOS E LÓGICA (MANTIDOS INTACTOS) ---
  const [marketData, setMarketData] = useState<any>({ indices: [], stocks: [], currencies: [], cryptos: [], indicators: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [searchPreview, setSearchPreview] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  const fetchMarketData = async () => {
    try {
      const [cloudRes, awesomeRes, selic, ipca] = await Promise.all([
          fetch(`${CLOUD_API_URL}/?t=${Date.now()}`).then(r => r.json()),
          fetch(AWESOME_API_URL).then(r => r.json()),
          fetch(BCB_SELIC_URL).then(r => r.json()).catch(() => [{valor: '11.25'}]),
          fetch(BCB_IPCA_URL).then(r => r.json()).catch(() => [{valor: '4.50'}])
      ]);
      
      const formatB = (item: any, type: string) => ({ 
          symbol: item.symbol === '^BVSP' ? 'IBOV' : (item.symbol === '^GSPC' ? 'S&P 500' : item.symbol), 
          price: item.regularMarketPrice, change: item.regularMarketChangePercent, 
          up: (item.regularMarketChangePercent || 0) >= 0, type 
      });
      const formatC = (symbol: string, raw: any, type: string) => ({ symbol, price: parseFloat(raw?.bid || 0), change: parseFloat(raw?.pctChange || 0), up: parseFloat(raw?.pctChange || 0) >= 0, type });
      
      setMarketData({
        indices: (cloudRes.indices || []).map((i: any) => formatB(i, 'index')),
        stocks: (cloudRes.stocks || []).map((i: any) => formatB(i, 'stock')),
        currencies: [formatC('USD', awesomeRes.USDBRL, 'currency'), formatC('EUR', awesomeRes.EURBRL, 'currency')],
        cryptos: [
            formatC('BTC', awesomeRes.BTCBRL, 'crypto'), formatC('BTC-USD', awesomeRes.BTCUSD, 'crypto'),
            formatC('ETH', awesomeRes.ETHBRL, 'crypto'), formatC('ETH-USD', awesomeRes.ETHUSD, 'crypto'),
            formatC('SOL', awesomeRes.SOLBRL, 'crypto'), formatC('SOL-USD', awesomeRes.SOLUSD, 'crypto')
        ],
        indicators: [{ symbol: 'SELIC', price: selic[0].valor + '%', type: 'indicator' }, { symbol: 'IPCA 12m', price: ipca[0].valor + '%', type: 'indicator' }]
      });
    } catch (e) {}
  };

  useEffect(() => { fetchMarketData(); const id = setInterval(fetchMarketData, 60000); return () => clearInterval(id); }, []);

  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toUpperCase();
    return ALL_B3_TICKERS.filter(t => t.includes(term)).slice(0, 6);
  }, [searchTerm]);

  const handleSelectSuggestion = async (ticker: string) => {
    setSearchTerm('');
    setSearchPreview({ symbol: ticker, price: null, type: 'stock', change: 0 });
    try {
        const res = await fetch(`${TICKER_API_URL}?tickers=${ticker}`).then(r => r.json());
        const data = Array.isArray(res) ? res[0] : res;
        if (data) setSearchPreview({ symbol: data.symbol || ticker, price: data.price || data.regularMarketPrice, change: data.change || data.regularMarketChangePercent || 0, up: (data.change || data.regularMarketChangePercent || 0) >= 0, type: 'stock' });
    } catch (e) { setSearchPreview({ symbol: ticker, price: null, type: 'stock' }); }
  };

  // --- RENDERIZAÇÃO DE CURSO COMPLETO ---
  if (selectedCourse) {
    const CourseComponent = selectedCourse.component;
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300 font-sans animate-in slide-in-from-bottom-4 pb-32 pt-24">
        <button onClick={() => setSelectedCourse(null)} className="mb-10 text-sky-400 font-bold flex items-center gap-2 hover:underline text-xs uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar para o Hub
        </button>
        <CourseComponent />
      </div>
    );
  }

  // --- RENDERIZAÇÃO DE ARTIGO COMPLETO (USANDO COMPONENTE DO ARTIGO) ---
  if (selectedArticle) {
    const ArticleComponent = selectedArticle.component;
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300 font-sans animate-in slide-in-from-bottom-4 pb-32 pt-24">
        <button onClick={() => setSelectedArticle(null)} className="mb-10 text-sky-400 font-bold flex items-center gap-2 hover:underline text-xs uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar para o Hub
        </button>
        <ArticleComponent />
      </div>
    );
  }

  // --- NOVA ESTRUTURA VISUAL (JXS) ---
  return (
    <div className="flex flex-col bg-[#020617] min-h-screen text-white font-sans overflow-x-hidden pt-16 selection:bg-emerald-500/30">
      {selectedAsset && <AssetModal symbol={selectedAsset} onClose={() => setSelectedAsset(null)} />}
      
      {/* --- MODAIS DE INFORMAÇÃO (MANTIDOS) --- */}
      {activeInfoModal === 'quem-somos' && (
        <ContentModal title="Quem Somos" icon={Users} onClose={() => setActiveInfoModal(null)}>
          <p className="text-emerald-400 font-bold text-lg mb-4">Finanças Pro Invest: Transformando Organização em Liberdade Real.</p>
          <p>O <strong>Finanças Pro Invest</strong> nasceu da inconformidade com as planilhas estáticas e complexas. Somos um ecossistema completo que une gestão de fluxo de caixa, ferramentas de simulação e inteligência artificial.</p>
        </ContentModal>
      )}
      {activeInfoModal === 'seguranca' && (
        <ContentModal title="Segurança de Dados" icon={LockKeyhole} onClose={() => setActiveInfoModal(null)}>
          <p className="font-bold text-white mb-4">Privacidade e Proteção Nível Bancário</p>
          <p>Seus dados financeiros são criptografados em trânsito e em repouso. Utilizamos infraestrutura Google Cloud (Firebase) para garantir máxima resiliência e proteção.</p>
        </ContentModal>
      )}
      {activeInfoModal === 'termos' && (
        <ContentModal title="Termos de Uso" icon={Zap} onClose={() => setActiveInfoModal(null)}>
          <p className="text-sm">As ferramentas são para fins educativos e não constituem recomendação direta de investimento. Você é responsável pelos dados inseridos.</p>
        </ContentModal>
      )}
      {activeInfoModal === 'ajuda' && (
        <ContentModal title="Central de Ajuda" icon={HelpCircle} onClose={() => setActiveInfoModal(null)}>
          <p>Dúvidas técnicas? Entre em contato pelo e-mail <strong>suporte@financasproinvest.com.br</strong></p>
        </ContentModal>
      )}
      {activeInfoModal === 'faq' && (
        <ContentModal title="Perguntas Frequentes" icon={MessageSquare} onClose={() => setActiveInfoModal(null)}>
          <div className="space-y-4 text-sm">
            <p><strong>Os dados são em tempo real?</strong> Sim, com o atraso padrão de 15 minutos das bolsas.</p>
            <p><strong>A assinatura pode ser cancelada?</strong> Sim, a qualquer momento pelo portal do cliente.</p>
          </div>
        </ContentModal>
      )}
      {activeInfoModal === 'especialista' && (
        <ContentModal title="Fale com um Especialista" icon={Mail} onClose={() => setActiveInfoModal(null)}>
          <div className="text-center py-8">
             <a href="mailto:suporte@financasproinvest.com.br" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 transition-all">suporte@financasproinvest.com.br</a>
          </div>
        </ContentModal>
      )}

      {/* TICKER DE MERCADO (TOPO - Mantido para sensação de Financeiro) */}
      <InfiniteTicker data={marketData} />

      {/* --- 1. HERO SECTION: SOBRIEDADE E MÉTODO --- */}
      <section className="relative px-6 py-16 lg:py-24 max-w-[1600px] mx-auto w-full flex flex-col items-center text-center z-10">
        
        {/* Fundo sutil para destaque */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-slate-800/20 rounded-full blur-[100px] pointer-events-none" />

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Liberdade Financeira não é sorte. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-sky-400">É Método.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          Assuma o controle absoluto do seu patrimônio. Utilize nossa tecnologia para organizar contas, projetar o futuro e tomar decisões baseadas em dados, não em achismos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          <button onClick={onStartNow} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-black text-base shadow-xl shadow-emerald-900/20 active:scale-95 transition-all uppercase tracking-wide">
            Começar Agora
          </button>
          <button onClick={() => onNavigate('tool-juros')} className="bg-transparent border border-slate-700 hover:bg-slate-800 text-white px-10 py-4 rounded-xl font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2 group">
            Simular Juros
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* --- 2. BENTO GRID: FERRAMENTAS --- */}
      <section className="px-4 lg:px-12 pb-20 max-w-[1600px] mx-auto w-full">
        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-6 text-center md:text-left border-b border-slate-800 pb-2 inline-block">Ecossistema Pro Invest</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* Card Principal: Gerenciador */}
          <div onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group cursor-pointer hover:border-slate-600 transition-all shadow-lg">
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={180} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                   <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Sistema Principal</span>
                </div>
                <h4 className="text-2xl md:text-3xl font-black text-white mb-2">Gerenciador Financeiro</h4>
                <p className="text-slate-400 text-sm max-w-sm leading-relaxed">Centralize suas contas, defina metas de aporte e acompanhe a evolução do seu patrimônio em tempo real.</p>
              </div>
              <div className="mt-8">
                 <button className="text-xs font-black text-white uppercase tracking-widest bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 group-hover:bg-slate-700 transition-colors">Acessar Painel</button>
              </div>
            </div>
          </div>

          {/* Card: Nexus IA */}
          <div onClick={() => isAuthenticated ? onNavigate('chat') : onStartNow()} className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-indigo-500/30 rounded-3xl p-6 flex flex-col justify-between group hover:border-indigo-400/50 transition-all relative overflow-hidden cursor-pointer shadow-lg shadow-indigo-900/10">
            <div className="absolute -right-10 -top-10 bg-indigo-500/20 w-40 h-40 blur-[50px] rounded-full"></div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={20} className="text-indigo-400" />
              <h4 className="text-lg font-black text-white">Nexus AI</h4>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">Consultoria inteligente baseada nos seus dados. Pergunte e obtenha respostas sobre seus gastos.</p>
            <div className="bg-black/30 border border-white/10 p-3 rounded-xl">
               <p className="text-[10px] text-indigo-200 font-mono">"Baseado na sua meta, você precisa aportar R$ 500 a mais este mês."</p>
            </div>
          </div>

          {/* Cards Menores: Ferramentas */}
          <ToolCard icon={TrendingUp} title="Juros Compostos" desc="Simulador de Riqueza" route="tool-juros" onNavigate={onNavigate} color="text-emerald-400" />
          <ToolCard icon={Zap} title="Calculadora FIRE" desc="Independência" route="tool-fire" onNavigate={onNavigate} color="text-amber-400" />
          <ToolCard icon={Building2} title="Imóveis" desc="Compra vs Aluguel" route="tool-alugar" onNavigate={onNavigate} color="text-sky-400" />
          <ToolCard icon={PieChart} title="Dividendos" desc="Renda Passiva" route="tool-dividendos" onNavigate={onNavigate} color="text-purple-400" />
          
        </div>
      </section>

      {/* --- SEÇÃO DE CURSOS --- */}
      <section className="px-4 lg:px-12 py-16 max-w-[1600px] mx-auto w-full">
        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-6 text-center md:text-left border-b border-slate-800 pb-2 inline-block">
          Cursos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-sky-400/50 transition-all cursor-pointer group"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{course.icon}</span>
                <span className="text-xs text-slate-500 font-bold uppercase">{course.duration}</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400">{course.title}</h4>
              <p className="text-sm text-slate-400 mb-4">{course.excerpt}</p>
              <div className="flex items-center text-xs text-slate-500">
                <span>{course.modules} módulos</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 3. RADAR PRO INVEST (NOTÍCIAS) - NOVIDADE --- */}
      <section className="bg-slate-900/30 border-y border-slate-800 py-16">
         <div className="max-w-[1600px] mx-auto px-4 lg:px-12">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  <Newspaper size={20} className="text-emerald-500"/>
                  Radar Pro Invest
               </h3>
               <span className="text-xs font-bold text-slate-500 uppercase">Atualizado Semanalmente</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {RADAR_NEWS.map((news) => (
                  <div key={news.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all cursor-default group">
                     <div className="flex items-center justify-between mb-4">
                        <span className="bg-slate-900 text-slate-400 text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-800">{news.tag}</span>
                        <span className="text-[10px] text-slate-600 font-bold uppercase">{news.date}</span>
                     </div>
                     <h4 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-sky-400 transition-colors">{news.title}</h4>
                     <p className="text-sm text-slate-500 leading-relaxed">{news.excerpt}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- 4. TERMINAL DE MERCADO (DADOS) --- */}
      <section className="py-16 bg-[#020617]">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div>
               <h2 className="text-2xl font-black text-white tracking-tighter mb-2 flex items-center gap-2">
                  <BarChart3 className="text-slate-500"/>
                  Terminal de Mercado
               </h2>
               <p className="text-slate-500 text-xs uppercase tracking-wide font-bold">Monitoramento B3, Cripto e Câmbio</p>
            </div>
            
            {/* BUSCA B3 */}
            <div className="relative w-full md:w-96">
                <input type="text" placeholder="Pesquisar Ativo (ex: PETR4)..." className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white focus:border-emerald-500 transition-all uppercase outline-none shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                {suggestions.length > 0 && (
                    <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden absolute w-full z-50 shadow-2xl">
                        {suggestions.map((t, i) => <div key={i} className="p-3 hover:bg-slate-800 cursor-pointer border-t border-slate-800 font-bold text-xs" onClick={() => handleSelectSuggestion(t)}>{t}</div>)}
                    </div>
                )}
            </div>
          </div>

          {searchPreview && (
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs border border-emerald-500/20">{searchPreview.symbol.substring(0,3)}</div>
                  <div>
                    <h3 className="font-black text-white text-lg">{searchPreview.symbol}</h3>
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Ativo B3 Encontrado</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-xl font-bold text-white">R$ {searchPreview.price?.toFixed(2) || '---'}</div>
                   <div className={`text-xs font-black ${searchPreview.up ? 'text-emerald-400' : 'text-rose-400'}`}>{searchPreview.change?.toFixed(2)}%</div>
                </div>
                <button onClick={() => setSearchPreview(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"><LogOut size={16}/></button>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {/* Painéis de Mercado Estilizados */}
             <MarketPanel title="Índices Globais" items={marketData.indices} onItemClick={setSelectedAsset} />
             <MarketPanel title="Câmbio & Moedas" items={marketData.currencies} onItemClick={setSelectedAsset} />
             <MarketPanel title="Criptoativos" items={marketData.cryptos} onItemClick={setSelectedAsset} />
             <MarketPanel title="Destaques B3" items={marketData.stocks.slice(0, 5)} onItemClick={setSelectedAsset} />
          </div>

        </div>
      </section>

      {/* --- FOOTER PROFISSIONAL --- */}
      <footer className="bg-[#020617] border-t border-slate-900 py-16 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-4">
                <div className="flex items-center gap-3">
                   <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
                   <span className="text-sm font-black tracking-tighter text-slate-300 uppercase">Finanças Pro Invest</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed max-w-xs font-medium">
                   Plataforma analítica e educacional. Construímos ferramentas para quem leva o dinheiro a sério.
                </p>
                <div className="flex gap-4 text-slate-600 pt-2">
                   <Instagram size={18} className="hover:text-emerald-500 cursor-pointer transition-colors"/>
                   <Linkedin size={18} className="hover:text-emerald-500 cursor-pointer transition-colors"/>
                   <Mail size={18} className="hover:text-emerald-500 cursor-pointer transition-colors"/>
                </div>
            </div>
            
            <div className="md:col-span-2 md:col-start-7">
                <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Navegação</h4>
                <ul className="space-y-2 text-slate-600 text-xs font-bold">
                    <li><button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="hover:text-white transition-colors">Login / Entrar</button></li>
                    <li><button onClick={onStartNow} className="hover:text-white transition-colors">Criar Conta</button></li>
                    <li><button onClick={() => onNavigate('tool-juros')} className="hover:text-white transition-colors">Calculadoras</button></li>
                </ul>
            </div>

            <div className="md:col-span-2">
                <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Legal</h4>
                <ul className="space-y-2 text-slate-600 text-xs font-bold">
                    <li><button onClick={() => setActiveInfoModal('termos')} className="hover:text-white transition-colors">Termos de Uso</button></li>
                    <li><button onClick={() => setActiveInfoModal('seguranca')} className="hover:text-white transition-colors">Privacidade</button></li>
                    <li><button onClick={() => setActiveInfoModal('quem-somos')} className="hover:text-white transition-colors">Sobre Nós</button></li>
                </ul>
            </div>
            
             <div className="md:col-span-2">
                <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Suporte</h4>
                <ul className="space-y-2 text-slate-600 text-xs font-bold">
                    <li><button onClick={() => setActiveInfoModal('ajuda')} className="hover:text-white transition-colors">Central de Ajuda</button></li>
                    <li><button onClick={() => setActiveInfoModal('especialista')} className="hover:text-white transition-colors">Fale Conosco</button></li>
                </ul>
            </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-slate-900 text-center">
           <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">© 2026 Finanças Pro Invest. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTES PARA ORGANIZAÇÃO VISUAL ---

const ToolCard = ({ icon: Icon, title, desc, route, onNavigate, color }: any) => (
  <div onClick={() => onNavigate(route)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between h-40 shadow-lg">
    <div className={`p-2 bg-slate-950 rounded-lg w-fit border border-slate-800 group-hover:border-${color.split('-')[1]}-500/30 transition-colors`}>
      <Icon size={20} className={color} />
    </div>
    <div>
      <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">{desc}</p>
    </div>
  </div>
);

const MarketPanel = ({ title, items, onItemClick }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[300px]">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-800">{title}</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {items.map((item: any, idx: number) => (
                <div key={idx} onClick={() => onItemClick(item.symbol)} className="flex justify-between items-center py-2 px-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                    <div>
                        <span className="font-bold text-slate-300 text-xs block group-hover:text-white">{item.symbol}</span>
                        <span className="text-[9px] text-slate-600 font-mono uppercase">{item.type}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs font-bold text-slate-200">
                          {item.type === 'currency' || item.type === 'crypto' ? 'R$ ' : ''}
                          {typeof item.price === 'number' ? item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : item.price}
                        </span>
                        {item.change !== undefined && (
                             <span className={`text-[9px] font-black ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.up ? '+' : ''}{item.change?.toFixed(2)}%
                             </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);
export { InvestmentArticle2026 } from './Public/Articles/InvestmentArticle2026';
export default PublicHome;