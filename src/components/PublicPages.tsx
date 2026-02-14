import MobileBottomNav from "./MobileBottomNav";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Search, X, Maximize2, CheckCircle2, Lock, ArrowRight, Globe, Clock, ChevronLeft, Share2, Flame, Scale, Home, Brain, ShieldCheck, Mail, Users, MessageSquare, LockKeyhole, HelpCircle, Instagram, Linkedin, ShieldAlert, FileText
} from 'lucide-react';

import { ARTICLES } from '../data/articles'; 
import { ALL_B3_TICKERS } from '../data/tickers'; 
import { getDisplayPrice } from '../utils/marketFormatters'; 
import { ContentModal, AssetModal } from './Public/HomeModals'; 
import { InfiniteTicker, MarketGroup, ToolHubItem, MarketItemRow } from './Public/MarketComponents';

export { InvestmentArticle2026 } from './Public/InvestmentArticle2026';

const CLOUD_API_URL = 'https://getmarketdata-5auxvdzm3q-uc.a.run.app';
const TICKER_API_URL = 'https://gettickerprice-5auxvdzm3q-uc.a.run.app';
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BNB-BRL,SOL-BRL,BTC-USD,ETH-USD,SOL-USD';
const BCB_SELIC_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
const BCB_IPCA_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json';

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow, isAuthenticated, userMeta }) => {
  const [marketData, setMarketData] = useState<any>({ indices: [], stocks: [], currencies: [], cryptos: [], indicators: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [searchPreview, setSearchPreview] = useState<any>(null);

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

  if (selectedArticle) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300 font-sans animate-in slide-in-from-bottom-4 pb-32">
            <button onClick={() => setSelectedArticle(null)} className="mb-10 text-sky-400 font-bold flex items-center gap-2 hover:underline text-xs uppercase tracking-widest"><ChevronLeft size={16}/> Voltar para o Hub</button>
            <div className="space-y-8">
                <div className="flex items-center gap-4 mb-4"><span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedArticle.category}</span><span className="text-slate-500 text-[10px] font-bold uppercase">{selectedArticle.readTime} LEITURA</span></div>
                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">{selectedArticle.title}</h1>
                <div className="article-body leading-relaxed text-lg">{selectedArticle.content}</div>
                <button onClick={onStartNow} className="w-full mt-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl">Criar Conta Grátis</button>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col bg-[#020617] min-h-screen text-white font-sans overflow-x-hidden pt-16">
      {selectedAsset && <AssetModal symbol={selectedAsset} onClose={() => setSelectedAsset(null)} />}
      
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
        <ContentModal title="Termos de Uso" icon={FileText} onClose={() => setActiveInfoModal(null)}>
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
             <a href="mailto:suporte@financasproinvest.com.br" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500">suporte@financasproinvest.com.br</a>
          </div>
        </ContentModal>
      )}

      <InfiniteTicker data={marketData} />

      <section className="px-4 lg:px-12 py-10 lg:py-16 max-w-[1600px] mx-auto w-full grid lg:grid-cols-12 gap-8 items-start">
        <div className="hidden lg:flex lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex-col gap-4 shadow-2xl h-[780px] overflow-y-auto custom-scrollbar">
            <div className="relative">
                <input type="text" placeholder="Pesquisar B3..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white focus:border-emerald-500 transition-all uppercase outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                {suggestions.length > 0 && (
                    <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden absolute w-full z-50 shadow-2xl">
                        {suggestions.map((t, i) => <div key={i} className="p-3 hover:bg-slate-700 cursor-pointer border-t border-slate-700/50 font-bold text-xs" onClick={() => handleSelectSuggestion(t)}>{t}</div>)}
                    </div>
                )}
            </div>
            {searchPreview && <div className="animate-in zoom-in-95 p-1 bg-sky-500/10 rounded-xl border border-sky-500/20"><p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 ml-2 mt-2">Preview da Busca</p><MarketItemRow item={searchPreview} onClick={() => setSelectedAsset(searchPreview.symbol)} /><button onClick={() => setSearchPreview(null)} className="p-2 text-[9px] text-slate-600 uppercase font-black hover:text-white">Limpar</button></div>}
            <MarketGroup title="Indicadores" items={marketData.indicators} onClickItem={() => {}} />
            <MarketGroup title="Índices" items={marketData.indices} onClickItem={setSelectedAsset} />
            <MarketGroup title="Câmbio" items={marketData.currencies} onClickItem={setSelectedAsset} />
            <MarketGroup title="Cripto" items={marketData.cryptos} onClickItem={setSelectedAsset} />
            <MarketGroup title="Ações B3" items={marketData.stocks} onClickItem={setSelectedAsset} />
        </div>

        <div className="lg:col-span-6 text-center space-y-12 py-6 px-4">
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight tracking-tighter">Domine o Jogo <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">do Dinheiro</span></h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto px-2">
                <ToolHubItem icon="💰" name="Gerenciador Financeiro" route="manager" onNavigate={onNavigate} onStartNow={onStartNow} isAuth={isAuthenticated} />
                <ToolHubItem icon="📈" name="Calculadora de Juros Compostos" route="tool-juros" onNavigate={onNavigate} />
                <ToolHubItem icon="🔥" name="Calculadora Fire" route="tool-fire" onNavigate={onNavigate} />
                <ToolHubItem icon="📉" name="Poder de Compra" route="tool-inflacao" onNavigate={onNavigate} />
                <ToolHubItem icon="🏠" name="Imóveis" route="tool-alugar" onNavigate={onNavigate} />
                <ToolHubItem icon="💳" name="Otimizador de Dívidas" route="tool-dividas" onNavigate={onNavigate} />
                <ToolHubItem icon="📊" name="Projetor de Dividendos" route="tool-dividendos" onNavigate={onNavigate} />
                <div className="bg-slate-800/20 border border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-4"><span className="text-slate-600 text-[10px] font-black uppercase">Novidades</span></div>
            </div>
            <div className="pt-6"><button onClick={onStartNow} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all uppercase">Começar Agora</button></div>
        </div>

        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            <h3 className="text-sky-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">Dossiê</h3>
            <div onClick={() => onNavigate('article-2026')} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] hover:border-sky-500/40 transition-all cursor-pointer group shadow-xl">
                <span className="text-[9px] bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full font-black uppercase mb-4 inline-block">Análise</span>
                <h4 className="text-white font-black text-lg mb-2 group-hover:text-sky-300 leading-tight">Investir em 2026</h4>
                <p className="text-slate-400 text-xs leading-relaxed">Por que a organização vence a sorte.</p>
            </div>
        </div>
      </section>
      {/* Widget de Mercado - MOBILE/TABLET */}
      <section className="lg:hidden w-full px-4 py-6">
		<div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Mercado Agora
          </h3>
		  
		  {/* BUSCA (mobile) */}
		  <div className="relative">
			<input type="text" placeholder="Pesquisar B3..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white focus:border-emerald-500 transition-all uppercase outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
			<Search className="absolute left-3 top-3 text-slate-500" size={16} />
			{suggestions.length > 0 && (
			  <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden absolute w-full z-50 shadow-2xl">
				{suggestions.map((t, i) => (
				  <div key={i} className="p-3 hover:bg-slate-700 cursor-pointer border-t border-slate-700/50 font-bold text-xs" onClick={() => handleSelectSuggestion(t)}>
					{t}
			 </div>
			))}
		  </div>
		)}
	</div>





          <MarketGroup
            title="Índices"
            items={marketData.indices.slice(0, 3)}
            onClickItem={setSelectedAsset}
          />

          <MarketGroup
            title="Câmbio"
            items={marketData.currencies}
            onClickItem={setSelectedAsset}
          />

          <MarketGroup
            title="Cripto"
            items={marketData.cryptos.slice(0, 4)}
            onClickItem={setSelectedAsset}
          />
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-4 lg:px-12 py-20 border-t border-slate-800">
         <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-12 text-center md:text-left uppercase">Educação Financeira</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ARTICLES.map((art) => (
               <div key={art.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 flex flex-col hover:bg-slate-900 transition-all shadow-lg group">
                  <div className="flex items-center justify-between mb-6"><span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{art.category}</span><div className="p-3 bg-slate-800 rounded-2xl text-slate-400 group-hover:text-sky-400 transition-colors"><art.icon size={20}/></div></div>
                  <h3 className="text-xl font-black text-white mb-4 leading-tight">{art.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">{art.excerpt}</p>
                  <button onClick={() => setSelectedArticle(art)} className="text-sky-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all mt-auto pt-6 border-t border-slate-800/50">Ler Artigo <ArrowRight size={14}/></button>
               </div>
            ))}
         </div>
      </section>

      <footer className="bg-[#020617] border-t border-slate-800 pt-20 pb-10 mt-20 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-sm text-slate-500">
            <div className="space-y-6">
                <div className="flex items-center gap-3"><img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl" /><span className="text-xl font-black tracking-tighter text-white uppercase">Finanças Pro Invest</span></div>
                <div className="flex gap-4"><Instagram size={20}/><Linkedin size={20}/><Mail size={20}/></div>
            </div>
            <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Institucional</h4>
                <ul className="space-y-3">
                    <li><button onClick={() => setActiveInfoModal('quem-somos')} className="hover:text-emerald-400">Quem Somos</button></li>
                    <li><button onClick={() => setActiveInfoModal('termos')} className="hover:text-emerald-400">Termos de Uso</button></li>
                    <li><button onClick={() => setActiveInfoModal('seguranca')} className="hover:text-emerald-400">Segurança de Dados</button></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Ajuda</h4>
                <ul className="space-y-3">
                    <li><button onClick={() => setActiveInfoModal('ajuda')} className="hover:text-emerald-400">Central de Ajuda</button></li>
                    <li><button onClick={() => setActiveInfoModal('faq')} className="hover:text-emerald-400">FAQ</button></li>
                    <li><button onClick={() => setActiveInfoModal('especialista')} className="hover:text-emerald-400">Fale com Especialista</button></li>
                </ul>
            </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-slate-800 text-center"><p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Finanças Pro Invest.</p></div>
      </footer>
    </div>
  );
};

export default PublicHome;