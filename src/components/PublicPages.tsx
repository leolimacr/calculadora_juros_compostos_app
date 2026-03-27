import { fetchAssetQuote } from '../services/marketService';
import { storage, firestore } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link, useNavigate } from 'react-router-dom';
import { useGoals } from '../hooks/useGoals';
import { calcularProximoAporte, diasAteProximoAporte } from '../utils/dateHelpers';
import { collection, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { MarkdownViewer } from './Public/MarkdownViewer';
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
import { getLatestNews } from '../services/newsService';

// --- CONFIGURAÇÃO DAS APIS ---
const CLOUD_API_URL = '/api/market';
const TICKER_API_URL = 'https://gettickerprice-5auxvdzm3q-uc.a.run.app';
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BNB-BRL,SOL-BRL,BTC-USD,ETH-USD,SOL-USD';
const BCB_SELIC_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
const BCB_IPCA_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json';

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

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow, isAuthenticated, userMeta, isPrivacyMode }) => {
  const navigate = useNavigate();
  const [radarNews, setRadarNews] = useState<any[]>(RADAR_NEWS);
  
  const [patrimonioAtivo, setPatrimonioAtivo] = useState<number>(userMeta?.resumoFinanceiro?.patrimonioAtivo || 0);
  const [patrimonioPassivo, setPatrimonioPassivo] = useState<number>(userMeta?.resumoFinanceiro?.patrimonioPassivo || 0);
  const [patrimonioTotal, setPatrimonioTotal] = useState<number>((userMeta?.resumoFinanceiro?.patrimonioAtivo || 0) + (userMeta?.resumoFinanceiro?.patrimonioPassivo || 0));

  const formatValue = (value: number) => {
    if (isPrivacyMode) return 'R$ •••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const { goals: metas } = useGoals(userMeta?.uid);
  const metasAtivas = metas.filter(m => m.ativa);
  const proximaMeta = metasAtivas.length > 0 ? metasAtivas[0] : null;

  let proximoAporteData: Date | null = null;
  let diasRestantes: number | null = null;
  let valorProximoAporte: number = 1200; 

  if (userMeta && proximaMeta) {
    proximoAporteData = calcularProximoAporte({
      dataInicio: proximaMeta.dataInicio,
      frequencia: proximaMeta.frequencia,
      diasPersonalizado: proximaMeta.diasPersonalizado,
    });
    diasRestantes = diasAteProximoAporte(proximoAporteData);
    valorProximoAporte = proximaMeta.valor;
  }

  const fetchNews = async () => {
    const fetchedNews = await getLatestNews(9);
    if (fetchedNews && fetchedNews.length > 0) {
      setRadarNews(fetchedNews);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `news/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNewsForm((prev) => ({ ...prev, coverImage: url }));
    } catch (error) {
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingImage(false);
    }
  };	  
	  
  const handleSaveNews = async () => {
    try {
      if (newsForm.id) {
        const newsDocRef = doc(firestore, 'noticias', newsForm.id);
        await updateDoc(newsDocRef, {
          title: newsForm.title,
          summary: newsForm.summary,
          content: newsForm.content,
          coverImage: newsForm.coverImage
        });
        alert('Notícia atualizada com sucesso!');
      } else {
        const newsRef = collection(firestore, 'noticias');
        await addDoc(newsRef, {
          title: newsForm.title,
          summary: newsForm.summary,
          content: newsForm.content,
          coverImage: newsForm.coverImage,
          date: new Date().toISOString().split('T')[0], 
          category: 'Geral',
          tag: 'Notícia',
          badge: 'Novo',
          readTime: '3 min'
        });
        alert('Notícia salva com sucesso!');
      }

      setNewsForm({ id: '', title: '', summary: '', content: '', coverImage: '' });
      setShowNewsAdmin(false);
      fetchNews(); 
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar a notícia.');
    }
  };

  const handleDeleteNews = async (id) => {
    try {
      const newsDocRef = doc(firestore, 'noticias', id);
      await deleteDoc(newsDocRef);
      setRadarNews(prev => prev.filter(news => news.id !== id));
      alert('Notícia excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      alert('Erro ao excluir a notícia. Tente novamente.');
    }
  };

  const [marketData, setMarketData] = useState<any>({ indices: [], stocks: [], currencies: [], cryptos: [], indicators: [] });
  const [heroPersona, setHeroPersona] = useState<'dividas' | 'patrimonio'>('dividas'); 

  const indicesComIndicadores = useMemo(() => {
    return [...(marketData.indices || []), ...(marketData.indicators || [])];
  }, [marketData.indices, marketData.indicators]);

  const toolsByPersona = useMemo(() => {
    if (heroPersona === 'dividas') {
      return [
        { icon: Zap, title: 'Sair das dívidas', desc: 'Comece por aqui', route: 'tool-dividas', color: 'text-amber-400', highlight: true, bgColor: 'amber' },
        { icon: Building2, title: 'À vista ou parcelado?', desc: 'Compare antes de comprar', route: 'tool-buy-cash-or-installments', color: 'text-sky-400', highlight: false, bgColor: 'sky' },
        { icon: TrendingUp, title: 'Entender os juros', desc: 'Por que a dívida cresce', route: 'tool-juros', color: 'text-emerald-400', highlight: false, bgColor: 'emerald' },
        { icon: Building2, title: 'Organizar moradia', desc: 'Aluguel ou compra', route: 'tool-alugar', color: 'text-sky-400', highlight: false, bgColor: 'sky' },
        { icon: PieChart, title: 'Próximo passo', desc: 'Depois da organização', route: 'tool-dividendos', color: 'text-purple-400', highlight: false, bgColor: 'purple' },
      ];
    } else {
      return [
        { icon: Zap, title: 'Calculadora FIRE', desc: 'Independência', route: 'tool-fire', color: 'text-amber-400', highlight: true, bgColor: 'amber' },
        { icon: TrendingUp, title: 'Juros Compostos', desc: 'Simulador de Riqueza', route: 'tool-juros', color: 'text-emerald-400', highlight: false, bgColor: 'emerald' },
        { icon: Building2, title: 'Imóveis', desc: 'Compra vs Aluguel', route: 'tool-alugar', color: 'text-sky-400', highlight: false, bgColor: 'sky' },
        { icon: PieChart, title: 'Dividendos', desc: 'Renda Passiva', route: 'tool-dividendos', color: 'text-purple-400', highlight: false, bgColor: 'purple' },
      ];
    }
  }, [heroPersona]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; category: string } | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [searchPreview, setSearchPreview] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [showNewsAdmin, setShowNewsAdmin] = useState(false);
  const [newsForm, setNewsForm] = useState({ id: '', title: '', summary: '', content: '', coverImage: '' });
  const [cryptoPreview, setCryptoPreview] = useState<any>(null);
  const [cryptoSymbol, setCryptoSymbol] = useState('');

  useEffect(() => {
    const fetchResumoFinanceiro = async () => {
      if (!isAuthenticated || !userMeta?.uid) return;
      try {
        const docRef = doc(firestore, 'users', userMeta.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const ativo = data.resumoFinanceiro?.patrimonioAtivo || 0;
          const passivo = data.resumoFinanceiro?.patrimonioPassivo || 0;
          
          setPatrimonioAtivo(ativo);
          setPatrimonioPassivo(passivo);
          setPatrimonioTotal(ativo + passivo);
        }
      } catch (error) {
        console.error("Erro ao buscar resumo financeiro:", error);
      }
    };
    fetchResumoFinanceiro();
  }, [isAuthenticated, userMeta]);

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
        price: item.price,
        change: item.change,
        up: (item.change || 0) >= 0, 
        type 
      });
      const formatC = (symbol: string, raw: any, type: string) => ({ symbol, price: parseFloat(raw?.bid || 0), change: parseFloat(raw?.pctChange || 0), up: parseFloat(raw?.pctChange || 0) >= 0, type });
      
      setMarketData({
        indices: (cloudRes.indices || []).map((i: any) => formatB(i, 'index')),
        stocks: (cloudRes.stocks || []).map((i: any) => formatB(i, 'stock')),
        currencies: [formatC('USD', awesomeRes.USDBRL, 'currency'), formatC('EUR', awesomeRes.EURBRL, 'currency')],               
        cryptos: [
            formatC('BTC/BRL', awesomeRes.BTCBRL, 'crypto'),
            formatC('BTC/USD', awesomeRes.BTCUSD, 'crypto'),
            formatC('ETH/BRL', awesomeRes.ETHBRL, 'crypto'),
            formatC('ETH/USD', awesomeRes.ETHUSD, 'crypto'),
            formatC('SOL/BRL', awesomeRes.SOLBRL, 'crypto'),
            formatC('SOL/USD', awesomeRes.SOLUSD, 'crypto')
        ],
        
        indicators: [{ symbol: 'SELIC', price: selic[0].valor + '%', type: 'indicator' }, { symbol: 'IPCA 12m', price: ipca[0].valor + '%', type: 'indicator' }]
      });
    } catch (e) {}
  };

  useEffect(() => { fetchMarketData(); const id = setInterval(fetchMarketData, 60000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (selectedArticle) {
      window.scrollTo(0, 0);
    }
  }, [selectedArticle]);

  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toUpperCase();
    return ALL_B3_TICKERS.filter(t => t.includes(term)).slice(0, 6);
  }, [searchTerm]); 
  
  const handleSelectSuggestion = async (ticker: string) => {
    setSearchTerm('');
    setSearchPreview({ symbol: ticker, price: null, type: 'stock', change: null, up: true });
    try {
      const quote = await fetchAssetQuote(ticker);
      if (quote) {
        setSearchPreview({
          symbol: quote.symbol,
          price: quote.price,
          change: quote.changePercent,
          up: quote.changePercent >= 0,
          type: quote.category
        });
      } else {
        setSearchPreview(null);
      }
    } catch (e) {
      console.error("Erro ao buscar ticker:", e);
      setSearchPreview(null);
    }
  };

  const handleCryptoSearch = async () => {
    if (!cryptoSymbol.trim()) return;
    const ticker = cryptoSymbol.trim().toUpperCase();
    
    setSearchPreview(null);
    setCryptoPreview({ symbol: ticker, price: null, change: null, up: true });

    try {
      const quote = await fetchAssetQuote(ticker);
      if (quote) {
        setCryptoPreview({
          symbol: quote.symbol,
          price: quote.price,
          change: quote.changePercent,
          up: quote.changePercent >= 0,
          type: quote.category
        });
      } else {
        setCryptoPreview(null);
        alert('Criptomoeda não encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar cripto:', error);
      setCryptoPreview(null);
    } finally {
      setCryptoSymbol('');
    }
  };

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

  if (selectedArticle) {
    const ArticleComponent = selectedArticle.component;
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans px-6 py-12 animate-in slide-in-from-bottom-4 pb-32 pt-24">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setSelectedArticle(null)} 
            className="mb-10 text-sky-600 font-bold flex items-center gap-2 hover:underline text-xs uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Voltar para o Hub
          </button>
          <ArticleComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden pt-16 selection:bg-emerald-200">
      {selectedAsset && <AssetModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
      
      {activeInfoModal === 'quem-somos' && (
        <ContentModal title="Quem Somos" icon={Users} onClose={() => setActiveInfoModal(null)}>
          <p className="text-emerald-700 font-bold text-lg mb-4">Finanças Pro Invest: Transformando Organização em Liberdade Real.</p>
          <p>O <strong>Finanças Pro Invest</strong> nasceu da inconformidade com as planilhas estáticas e complexas. Somos um ecossistema completo que une gestão de fluxo de caixa, ferramentas de simulação e inteligência artificial.</p>
        </ContentModal>
      )}	  
      
      {showNewsAdmin && (
        <ContentModal
          title={newsForm.id ? "Editar Notícia" : "Nova Notícia"}
          icon={Newspaper}
          onClose={() => setShowNewsAdmin(false)}
        >
          <div className="space-y-4 text-sm">	
            <input
              type="text"
              placeholder="Título"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
              value={newsForm.title}
              onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <div className="space-y-2">
              <label className="text-slate-500 text-xs">Imagem da notícia</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
              />
              {uploadingImage && <p className="text-emerald-400 text-xs">Enviando imagem...</p>}
              {newsForm.coverImage && !uploadingImage && (
                <img src={newsForm.coverImage} className="w-full h-32 object-cover rounded-lg mt-1" />
              )}
            </div>
            <textarea
              placeholder="Resumo (summary)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-24"
              value={newsForm.summary}
              onChange={(e) => setNewsForm((prev) => ({ ...prev, summary: e.target.value }))}
            />
            <textarea
              placeholder="Conteúdo completo (Markdown)"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 h-40"
              value={newsForm.content}
              onChange={(e) => setNewsForm((prev) => ({ ...prev, content: e.target.value }))}
            />
            <button
              onClick={handleSaveNews}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg"
            >
              {newsForm.id ? "Salvar alterações" : "Salvar notícia"}
            </button>	
          </div>
        </ContentModal>
      )}	    
      
      {activeInfoModal === 'seguranca' && (
        <ContentModal title="Segurança de Dados" icon={LockKeyhole} onClose={() => setActiveInfoModal(null)}>
          <p className="font-bold text-slate-900 mb-4">Privacidade e Proteção Nível Bancário</p>
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
          <p>Dúvidas técnicas? Entre em contato pelo e-mail <strong>contato@financasproinvest.com.br</strong></p>
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
             <a href="mailto:contato@financasproinvest.com.br" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 transition-all">contato@financasproinvest.com.br</a>
          </div>
        </ContentModal>
      )}
	  
      <InfiniteTicker data={marketData} />
      {/* --- 1. HERO SECTION: SOBRIEDADE E MÉTODO --- */}
      <section className="relative px-6 py-12 lg:py-20 max-w-[1600px] mx-auto w-full z-10">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] bg-emerald-100/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-10 xl:gap-12 items-center">
          
          {/* Coluna Esquerda: Textos e CTAs */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
            
            {/* SOLUÇÃO 3: Eyebrow Text (Ponte mental) */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Diagnóstico rápido para entender, priorizar e quitar suas dívidas
            </div>

            {/* SOLUÇÃO 2: Seletor de Persona Elevado (Abas) */}
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto lg:mx-0 border border-slate-200/60 shadow-inner animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
              <button
                onClick={() => setHeroPersona('dividas')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  heroPersona === 'dividas'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Tenho dívidas
              </button>
              <button
                onClick={() => setHeroPersona('patrimonio')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  heroPersona === 'patrimonio'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Quero investir melhor
              </button>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[5.2rem] font-black text-slate-950 leading-[0.98] tracking-[-0.04em] mb-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              {heroPersona === 'dividas' ? (
                <>
                  Descubra a melhor forma de sair das{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-500 to-sky-600">
                    dívidas
                  </span>{' '}
                  sem adivinhação. <br />
                  Veja o que fazer primeiro.
                </>

              ) : (
                <>
                  Liberdade Financeira não é sorte. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-400 to-sky-500">
                    É Método.
                  </span>
                </>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-lg mb-8 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {heroPersona === 'dividas'
                ? 'Em poucos minutos, você identifica o peso real dos juros, descobre qual dívida priorizar e monta um plano simples para começar a quitar.'
                : 'Assuma o controle absoluto do seu patrimônio. Utilize nossa tecnologia para organizar contas, projetar o futuro e tomar decisões baseadas em dados, não em achismos.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <button
                onClick={() => onNavigate(heroPersona === 'dividas' ? 'tool-dividas' : 'tool-fire')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>
                  {heroPersona === 'dividas'
                    ? 'Acessar o Simulador de Quitação agora'
                    : 'Descobrir minha data FIRE'}
                </span>
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('como-funciona');
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 90; // ajuste fino
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Ver como funciona</span>
                <ArrowRight size={20} />
              </button>
            </div>

            {heroPersona === 'dividas' && (
              <div className="mt-4 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                Ainda está em dúvida?{' '}
                <button
                  onClick={() => onNavigate('chat')}
                  className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Falar com o Nexus AI
                </button>
              </div>
            )}
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-6 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                Descubra qual dívida vem primeiro
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                Entenda o peso real dos juros
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                Monte um plano inicial em minutos
              </span>
            </div>
            
          </div> {/* FIM DA COLUNA ESQUERDA */}

          {/* Coluna Direita: Elemento Visual Abstrato (O "Anti-Vazio") */}
          <div className="hidden lg:block relative max-w-[620px] w-full ml-auto animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 group/card cursor-default">
            
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 to-sky-500/15 blur-3xl rounded-[3rem] opacity-30 transition-opacity duration-700 group-hover/card:opacity-60" />
            
            <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-5 xl:p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.22)] overflow-hidden transition-all duration-700 group-hover/card:-translate-y-1 group-hover/card:shadow-[0_28px_65px_-28px_rgba(15,23,42,0.24)] group-hover/card:border-slate-300">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Visão geral
                  </span>
                  <span className="h-4 w-16 bg-slate-200 rounded-full" />
                </div>
              </div>
				
              <div className="grid gap-4 mb-4">
                <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-emerald-200 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl" />

                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <p className="text-[10px] md:text-xs text-emerald-800 font-black uppercase tracking-widest">
                      {heroPersona === 'dividas' ? 'Seu Plano de Quitação' : 'Patrimônio Ativo'}
                    </p>
                  </div>

                  {heroPersona === 'dividas' ? (
                    <div className="relative z-10 space-y-3">
                      <div className="flex flex-col gap-2">
                        {[
                          { step: '1', label: 'Mapeie todas as dívidas', done: true },
                          { step: '2', label: 'Veja qual custa mais caro', done: true },
                          { step: '3', label: 'Monte o plano de quitação', done: false },
                        ].map(({ step, label, done }) => (
                          <div key={step} className={`flex items-center gap-3 p-2.5 rounded-xl border ${done ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {done ? '✓' : step}
                            </div>
                            <p className={`text-xs font-semibold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
                          </div>
                        ))}
                      </div>
                      <span className="inline-block bg-white/80 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded">
                        100% Confidencial · Gratuito
                      </span>
                    </div>
                  ) : isAuthenticated && typeof patrimonioAtivo !== 'undefined' && patrimonioAtivo !== null ? (
                    <>
                      <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-2 relative z-10">
                        {formatValue(patrimonioAtivo)}
                      </p>
                      <p className="text-xs md:text-sm text-emerald-800 font-medium relative z-10">
                        Gerando sua renda passiva do futuro.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-2 relative z-10">
                        R$ 142.500,00
                      </p>
                      <p className="text-xs md:text-sm text-emerald-800 font-medium relative z-10">
                        Rendimento médio de +2.4% ao mês.
                      </p>
                    </>
                  )}
                </div>

                <div className={`grid gap-4 ${heroPersona === 'dividas' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  
                  <div className="h-full bg-gradient-to-b from-blue-50 to-white backdrop-blur-md rounded-xl p-4 md:p-5 border border-blue-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] md:text-xs text-blue-800 font-bold uppercase mb-2 tracking-wider">
                      {heroPersona === 'dividas' ? 'Impacto estimado' : 'Próximo Aporte'}
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 truncate mb-1">
                      {heroPersona === 'dividas' ? 'Até –40% em juros' : userMeta ? formatValue(valorProximoAporte) : 'R$ 1.200,00'}
                    </p>
                    <div className="mt-auto pt-3">
                      {heroPersona === 'dividas' ? (
                        <span className="inline-block bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-md">
                          Com a ordem certa de quitação
                        </span>
                      ) : userMeta ? (
                        metasAtivas.length === 0 ? (
                          <span className="inline-block bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md">
                            Definir meta
                          </span>
                        ) : (
                          <span className={`inline-block border text-[10px] font-bold px-2 py-1 rounded-md ${
                              diasRestantes !== null && diasRestantes <= 0 ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : diasRestantes !== null && diasRestantes <= 5 ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-blue-100 border-blue-300 text-blue-800'
                            }`}>
                            {diasRestantes !== null ? diasRestantes <= 0 ? 'Hoje é o dia!' : `Faltam ${diasRestantes} dias` : 'Em breve'}
                          </span>
                        )
                      ) : (
                        <span className="inline-block bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-md">
                          Faça login para definir metas
                        </span>
                      )}
                    </div>
                  </div>

                  {heroPersona === 'patrimonio' && (
                    <div className="flex flex-col gap-3">
                      <div
                        onClick={() => isAuthenticated ? onNavigate('passivos') : onStartNow()}
                        className="flex-1 bg-white backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-200 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 cursor-pointer flex flex-col justify-center shadow-sm"
                      >
                        <p className="text-[10px] text-slate-700 font-bold uppercase mb-1 tracking-wider">Patrimônio Passivo</p>
                        <p className="text-base md:text-lg font-bold text-slate-500 truncate">
                          {isAuthenticated && typeof patrimonioPassivo !== 'undefined' && patrimonioPassivo !== null ? formatValue(patrimonioPassivo) : 'R$ 350.000,00'}
                        </p>
                      </div>
                      <div className="flex-1 bg-slate-50 backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-300 border-dashed transition-all duration-300 flex flex-col justify-center">
                        <p className="text-[9px] md:text-[10px] text-slate-600 font-bold uppercase mb-1 tracking-wider">Patrimônio Total</p>
                        <p className="text-sm md:text-base font-bold text-slate-700 truncate">
                          {isAuthenticated && typeof patrimonioAtivo !== 'undefined' && typeof patrimonioPassivo !== 'undefined' ? formatValue(patrimonioTotal) : 'R$ 492.500,00'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
             
              {heroPersona === 'patrimonio' && (
                <div className="bg-white backdrop-blur-md rounded-xl p-4 border border-slate-200 mt-4 group shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Evolução Patrimonial</p>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-24 gap-2">
                    {[40, 55, 45, 70, 60, 85, 100].map((height, index) => (
                      <div key={index} className="w-full bg-slate-200 rounded-t-sm transition-all duration-300 group-hover:bg-slate-300 hover:!bg-emerald-500/60" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- RESUMO FINANCEIRO PARA MOBILE --- */}
      <section className="block lg:hidden px-4 py-6 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() =>
              heroPersona === 'dividas'
                ? onNavigate('tool-dividas')
                : isAuthenticated
                  ? onNavigate('investimentos')
                  : onStartNow()
            }
            className="col-span-2 bg-gradient-to-br from-emerald-50 to-white backdrop-blur-md rounded-2xl p-5 border border-emerald-200 cursor-pointer relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">
                {heroPersona === 'dividas' ? 'Plano de Quitação' : 'Patrimônio Ativo'}
              </p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {heroPersona === 'dividas'
                ? 'Plano em 3 etapas'
                : isAuthenticated && typeof patrimonioAtivo !== 'undefined' && patrimonioAtivo !== null
                  ? formatValue(patrimonioAtivo)
                  : 'R$ 142.500,00'}
            </p>
            <p className="text-xs text-emerald-700 font-medium">
              {heroPersona === 'dividas'
                ? 'Entenda o que fazer primeiro para sair das dívidas'
                : isAuthenticated
                  ? 'Gerando sua renda passiva'
                  : 'Rendimento médio +2,4%'}
            </p>
          </div>

          <div
            onClick={() => onNavigate(heroPersona === 'dividas' ? 'tool-dividas' : 'metas')}
            className="bg-gradient-to-b from-blue-50 to-white backdrop-blur-md rounded-xl p-4 border border-blue-200 cursor-pointer shadow-sm"
          >
            <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">
              {heroPersona === 'dividas' ? 'Primeiro passo' : 'Próximo Aporte'}
            </p>
            <p className="text-xl font-black text-slate-900 truncate">
              {heroPersona === 'dividas'
                ? 'Diagnosticar dívidas'
                : userMeta
                  ? formatValue(valorProximoAporte)
                  : 'R$ 1.200,00'}
            </p>
            <div className="mt-2">
              {heroPersona === 'dividas' ? (
                <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded border border-blue-200">
                  Abrir Simulador de Quitação
                </span>
              ) : userMeta ? (
                metasAtivas.length === 0 ? (
                  <span className="inline-block bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-1 rounded border border-amber-200">
                    Definir meta
                  </span>
                ) : (
                  <span className={`inline-block text-[9px] font-bold px-2 py-1 rounded ${
                    diasRestantes !== null && diasRestantes <= 0
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : diasRestantes !== null && diasRestantes <= 5
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {diasRestantes !== null ? (diasRestantes <= 0 ? 'Hoje!' : `Faltam ${diasRestantes} dias`) : 'Em breve'}
                  </span>
                )
              ) : (
                <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded border border-blue-200">
                  Faça login
                </span>
              )}
            </div>
          </div>

          {heroPersona === 'dividas' ? (
            <div className="col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200 border-dashed">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Próximo passo</p>
              <p className="text-sm font-semibold text-slate-700">
                Depois do diagnóstico, você avança para metas e patrimônio no mesmo lugar.
              </p>
            </div>
          ) : (
            <>
              <div
                onClick={() => isAuthenticated ? onNavigate('passivos') : onStartNow()}
                className="bg-white backdrop-blur-md rounded-xl p-4 border border-slate-200 cursor-pointer shadow-sm"
              >
                <p className="text-[9px] text-slate-300 font-bold uppercase mb-1">Passivo</p>
                <p className="text-base font-bold text-slate-900 truncate">
                  {isAuthenticated && typeof patrimonioPassivo !== 'undefined' && patrimonioPassivo !== null
                    ? formatValue(patrimonioPassivo)
                    : 'R$ 350.000,00'}
                </p>
              </div>
              <div className="bg-slate-50 backdrop-blur-md rounded-xl p-4 border border-slate-300 border-dashed">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Total</p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {isAuthenticated && typeof patrimonioAtivo !== 'undefined' && typeof patrimonioPassivo !== 'undefined'
                    ? formatValue(patrimonioTotal)
                    : 'R$ 492.500,00'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* removido: botão "Ver cursos" não pertence à jornada de dívidas */}
      </section>
      {/* --- JORNADA: COMO COMEÇAR --- */}
      <section
        id="como-funciona"
        className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full"
      >
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="mb-8 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Seu caminho começa aqui
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
              {heroPersona === 'dividas'
                ? 'Entenda sua situação, organize suas prioridades e avance com clareza.'
                : 'Mapeie seu patrimônio, projete seu futuro e acelere seus resultados.'}
            </h3>
            <p className="text-slate-600 text-sm md:text-base max-w-3xl">
              {heroPersona === 'dividas'
                ? 'Você não precisa dominar finanças para começar. O processo foi pensado para quem quer sair das dívidas sem complicação.'
                : 'Uma jornada estruturada para quem quer sair da estagnação e construir riqueza através de um método previsível e organizado.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm mb-4">
                1
              </div>
              <h4 className="text-slate-900 font-black text-lg mb-2">
                {heroPersona === 'dividas' ? 'Cadastre suas dívidas' : 'Mapeie'}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {heroPersona === 'dividas'
                  ? 'Informe nome, valor, taxa de juros e parcelas. Leva menos de 3 minutos e não exige conta bancária.'
                  : 'Consolide seus ativos e passivos para ter uma visão exata e centralizada do seu patrimônio atual.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm mb-4">
                2
              </div>
              <h4 className="text-slate-900 font-black text-lg mb-2">
                {heroPersona === 'dividas' ? 'Veja o ranking de prioridade' : 'Projete'}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {heroPersona === 'dividas'
                  ? 'A ferramenta calcula o custo real de cada dívida e mostra qual atacar primeiro para economizar mais.'
                  : 'Utilize calculadoras e inteligência artificial para descobrir sua data FIRE e traçar metas claras.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm mb-4">
                3
              </div>
              <h4 className="text-slate-900 font-black text-lg mb-2">
                {heroPersona === 'dividas' ? 'Siga o plano gerado' : 'Acelere'}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {heroPersona === 'dividas'
                  ? 'Você recebe uma sequência clara de quitação com estimativa de economia em juros e prazo de conclusão.'
                  : 'Acompanhe a evolução, entenda a magia dos juros compostos e alcance a liberdade financeira.'}
              </p>
            </div>
          </div>
        </div>
      </section>     
      
      {/* --- PONTE DE AÇÃO: O QUE FAZER AGORA --- */}
      {heroPersona === 'dividas' && (
        <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Vamos começar agora
              </span>

              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
                O próximo passo é abrir o Simulador de Quitação.
              </h3>

              <p className="text-slate-600 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
                Você já viu como funciona. Agora, entre na ferramenta para informar suas dívidas, descobrir qual deve ser priorizada e receber uma sequência clara de quitação.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onNavigate('tool-dividas')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span>Acessar o Simulador de Quitação</span>
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={() => onNavigate('chat')}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span>Tirar dúvidas com o Nexus AI</span>
                  <Sparkles size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Se você tiver só parte das informações, pode começar assim mesmo e completar depois.
              </p>
            </div>
          </div>
        </section>
      )}
      
      {/* --- POR QUE FAZ SENTIDO --- */}
      <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="mb-8 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-4">
              {heroPersona === 'dividas' ? 'Clareza antes de tudo' : 'Decisões Inteligentes'}
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
              {heroPersona === 'dividas'
                ? 'Você não precisa entender tudo de finanças para começar.'
                : 'Chega de planilhas complexas, dispersas e achismos.'}
            </h3>
            <p className="text-slate-600 text-sm md:text-base max-w-3xl">
              {heroPersona === 'dividas'
                ? 'O Finanças Pro Invest foi desenhado para transformar confusão em próximos passos claros.'
                : 'Nossa tecnologia cruza seus dados, cria relatórios simples e mostra exatamente onde alocar seus recursos.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-slate-900 font-black text-lg mb-2">
                {heroPersona === 'dividas' ? 'Diagnóstico simples' : 'Visão Centralizada'}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {heroPersona === 'dividas'
                  ? 'Entenda sua situação sem precisar dominar termos técnicos.'
                  : 'Acompanhe mercado, renda e investimentos em um único painel ágil e bonito.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-slate-900 font-black text-lg mb-2">
                {heroPersona === 'dividas' ? 'Prioridade prática' : 'Apoio da I.A.'}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {heroPersona === 'dividas'
                  ? 'Veja o que atacar primeiro para reduzir juros e recuperar fôlego.'
                  : 'Um assistente financeiro disponível 24h para orientar suas estratégias de alocação.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-slate-900 font-black text-lg mb-2">
                {heroPersona === 'dividas' ? 'Evolução no mesmo lugar' : 'Foco no Longo Prazo'}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {heroPersona === 'dividas'
                  ? 'Depois da organização, avance para metas, patrimônio e decisões melhores.'
                  : 'Simule impacto de inflação, defina seu ritmo e descubra o dia exato da sua independência.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PARA QUEM É --- */}
      <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-slate-900 font-black text-lg mb-2">Para quem está perdido</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Se você sente que o dinheiro some, não sabe por onde começar e quer clareza, este é o ponto de partida ideal.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-slate-900 font-black text-lg mb-2">Para quem já tem dívidas</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Veja o peso real dos juros, entenda prioridades e monte um plano mais racional e executável para sair dessa.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-slate-900 font-black text-lg mb-2">Para quem quer evoluir</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Depois da organização, ou se você já começou a poupar, use o mesmo ecossistema para acelerar o patrimônio.
            </p>
          </div>
        </div>
      </section>

      {/* --- CREDIBILIDADE --- */}
      <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_35%)]" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-4">
              Feito para a realidade brasileira
            </span>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              {heroPersona === 'dividas'
                ? 'Menos teoria solta. Mais clareza para decidir o próximo passo.'
                : 'Tecnologia que transforma dados em decisões de investimentos mais seguras.'}
            </h3>
            <p className="text-slate-200 text-sm md:text-base leading-relaxed">
              {heroPersona === 'dividas'
                ? 'O Finanças Pro Invest foi pensado para ajudar quem quer sair da confusão financeira e voltar a enxergar um caminho possível.'
                : 'Acompanhe seus rendimentos e estude cenários complexos de juros com uma interface simplificada e direta.'}
            </p>
          </div>
        </div>
      </section>

      {/* --- 2. BENTO GRID: FERRAMENTAS --- */}
      <section className="px-4 lg:px-12 pb-20 max-w-[1600px] mx-auto w-full relative">
        <div className="text-center mb-10">
          <h3 className="text-slate-600 text-xs font-black uppercase tracking-widest inline-block border-b border-slate-300 pb-2">           
            Ferramentas para agir
          </h3>
        </div>
        <p className="text-center text-sm text-slate-500 max-w-2xl mx-auto mb-8">
          Se você está perdido e não sabe por onde começar, use primeiro a opção destacada abaixo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
          
          <div onClick={() => isAuthenticated ? onNavigate('manager') : onNavigate('tool-dividas')} className="md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-white to-slate-100 border border-slate-200 rounded-3xl p-8 relative overflow-hidden group cursor-pointer hover:border-slate-300 transition-all shadow-sm">
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={180} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                   <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                     {heroPersona === 'dividas' ? 'Primeiro passo' : 'Controle Central'}
                   </span>
                </div>
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                  {heroPersona === 'dividas' ? 'Veja sua vida financeira com clareza' : 'Painel de Controle Patrimonial'}
                </h4>
                <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
                  {heroPersona === 'dividas'
                    ? 'Junte contas, gastos e dívidas em um só lugar para enxergar sua situação real e decidir o que fazer primeiro.'
                    : 'Acompanhe ativos, rendimentos e projeções. Transforme números dispersos em um mapa completo.'}
                </p>              
              </div>
              <div className="mt-8">
                  <button className="text-xs font-black text-slate-900 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-slate-300 group-hover:bg-emerald-50 group-hover:border-emerald-300 transition-colors">
                    {heroPersona === 'dividas' ? 'Começar pelo diagnóstico' : 'Acessar meu Dashboard'}
                  </button>
              </div>
            </div>
          </div>

          {/* Card: Nexus IA */}
          <div onClick={() => isAuthenticated ? onNavigate('chat') : onStartNow()} className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-3xl p-6 flex flex-col justify-between group hover:border-indigo-300 hover:bg-indigo-50/50 transition-all relative overflow-hidden cursor-pointer shadow-sm">
            <div className="absolute -right-10 -top-10 bg-indigo-200/60 w-40 h-40 blur-[50px] rounded-full"></div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={20} className="text-indigo-600" />
              <h4 className="text-lg font-black text-slate-900">Nexus AI para te orientar</h4>
            </div>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              {heroPersona === 'dividas'
                ? 'Use a IA como apoio para entender prioridades, juros e próximos passos sem se perder em termos técnicos.'
                : 'Consultoria inteligente baseada nos seus dados. Pergunte e obtenha respostas sobre as melhores alocações e rendimentos.'}
            </p>
            <div className="bg-white/80 border border-indigo-200 p-3 rounded-xl">
               <p className="text-[10px] text-indigo-700 font-mono">
                 {heroPersona === 'dividas'
                   ? '"Com os dados que você trouxe, esta dívida parece ser a prioridade número 1."'
                   : '"Baseado na sua meta, você precisa aportar R$ 500 a mais este mês para atingir o alvo."'}
               </p>
            </div>
          </div>
          
          {/* Cards Menores */}
          {toolsByPersona.map((tool) => {
            return (
              <ToolCard
                key={tool.route}
                icon={tool.icon}
                title={tool.title}
                desc={tool.desc}
                route={tool.route}
                onNavigate={onNavigate}
                bgColor={tool.bgColor}
                highlight={tool.highlight}
              />
            );
          })}
        </div>
      </section>

      {/* --- SEÇÃO DE CURSOS --- */}
      <section id="secao-cursos" className="px-4 lg:px-12 py-16 max-w-[1600px] mx-auto w-full">
        <div className="mb-12 text-center md:text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4 ${
            heroPersona === 'dividas' 
              ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
              : 'bg-indigo-100 border-indigo-200 text-indigo-700'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              heroPersona === 'dividas' ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}></span>
            Aprenda no seu ritmo
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            {heroPersona === 'dividas' ? (
              <>
                Primeiro a clareza. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-600">Depois a ação.</span>
              </>
            ) : (
              <>
                Primeiro a clareza. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-700">Depois a evolução.</span>
              </>
            )}
          </h2>
          
          <p className="text-slate-600 max-w-2xl text-sm md:text-base mx-auto md:mx-0 mb-4">
            {heroPersona === 'dividas'
              ? 'Aprenda a sair do vermelho, organizar a vida financeira e retomar o controle sem linguagem difícil.'
              : 'Conteúdos diretos para entender o mercado, organizar a vida financeira e multiplicar seu capital com segurança.'}
          </p>
          
          {/* Link Discreto de Cross-sell (Troca a Persona ao clicar) */}
          <button 
            onClick={() => setHeroPersona(heroPersona === 'dividas' ? 'patrimonio' : 'dividas')}
            className="text-xs font-bold underline decoration-slate-300 underline-offset-4 text-slate-500 hover:text-slate-900 transition-colors"
          >
            {heroPersona === 'dividas'
              ? 'Já tem as contas em dia? Temos também conteúdos sobre investimentos. Clique aqui.'
              : 'Precisa organizar dívidas primeiro? Clique aqui e veja por onde começar.'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isDebtCourse = course.id === 'dividas' || course.slug === 'dividas';
            const isFeaturedDebtCourse = heroPersona === 'dividas' && isDebtCourse;

            console.log('CLICAR-CARD-CURSO', course.id, course.slug);

            return (
              <div
                key={course.id}
                className={`relative backdrop-blur-md rounded-2xl p-6 transition-all duration-500 cursor-pointer group overflow-hidden shadow-sm ${
                  isFeaturedDebtCourse
                    ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-emerald-50 via-white to-sky-50 border-2 border-emerald-300 hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]'
                    : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.05)]'
                }`}
                
                
                
                
                
                onClick={() => {
                  // mapeia o slug do card para o slug interno usado no coursesRegistry
                  let internalSlug: string | null = null;

                  if (course.slug === 'plano-realista-para-sair-das-dividas') {
                    internalSlug = 'dividas';
                  } else if (course.slug === 'investidor-iniciante-seus-primeiros-passos') {
                    internalSlug = 'investidor-iniciante'; // ajuste esse nome para o slug REAL do curso iniciante na registry
                  }

                  if (internalSlug) {
                    navigate(`/curso/${internalSlug}`);
                  } else {
                    // fallback: mantém o comportamento antigo se aparecer algum outro curso
                    setSelectedCourse(course);
                  }
                }}
                
                
                
                
                
                
              >
                <div className={`absolute top-0 left-0 w-full ${isFeaturedDebtCourse ? 'h-1 opacity-100' : 'h-[2px] opacity-0 group-hover:opacity-100'} transition-opacity duration-500 ${
                  heroPersona === 'dividas'
                    ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent'
                }`} />

                {isFeaturedDebtCourse && (
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      Curso em destaque
                    </span>

                    <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Comece por aqui
                    </span>
                  </div>
                )}
                
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-all duration-300 ${
                  heroPersona === 'dividas'
                    ? 'bg-emerald-50 border border-emerald-200 group-hover:bg-emerald-100'
                    : 'bg-indigo-50 border border-indigo-200 group-hover:bg-indigo-100'
                }`}>
                  {course.icon}
                </div>

                <h4 className={`text-xl font-bold text-slate-900 mb-3 transition-colors duration-300 ${
                  heroPersona === 'dividas' ? 'group-hover:text-emerald-700' : 'group-hover:text-indigo-700'
                }`}>
                  {course.title}
                </h4>
                
                <p className={`text-sm text-slate-600 leading-relaxed ${isFeaturedDebtCourse ? 'mb-4 max-w-2xl' : 'mb-6 line-clamp-2'}`}>
                  {course.excerpt}
                </p>

                {isFeaturedDebtCourse && (
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white border border-emerald-200 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">
                        Resultado
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        Clareza para agir
                      </p>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Formato
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        Trilha guiada
                      </p>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Ideal para
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        Quem quer sair do vermelho
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-auto">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium group-hover:border-slate-300 transition-colors">
                      <svg className={`w-3.5 h-3.5 ${heroPersona === 'dividas' ? 'text-emerald-500' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {course.modules}
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium group-hover:border-slate-300 transition-colors">
                      <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.duration}
                    </div>
                  </div>
                  
                  <div className={`flex items-center justify-center ${isFeaturedDebtCourse ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-slate-100 text-slate-500 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1 ${
                    heroPersona === 'dividas'
                      ? 'group-hover:bg-emerald-500 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'group-hover:bg-indigo-500 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                  }`}>
                    <svg className={isFeaturedDebtCourse ? 'w-5 h-5' : 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- 3. Conteúdo (NOTÍCIAS) --- */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Newspaper size={20} className="text-emerald-500" />
              {heroPersona === 'dividas' ? 'Conteúdo para organizar' : 'Conteúdo para evoluir'}
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-xs md:text-sm font-bold text-slate-600 uppercase">
                {heroPersona === 'dividas' ? 'Leitura simples' : 'Leitura prática'}
              </span>
              {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
                <button
                  onClick={() => setShowNewsAdmin(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg hover:bg-emerald-50"
                >
                  + Nova notícia
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {radarNews.map((news: any, index) => {
              const categoryColors: Record<string, { bg: string; text: string; border: string; hoverBorder: string; shadow: string; icon: any }> = {
                'Mercado': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', hoverBorder: 'hover:border-blue-300', shadow: 'hover:shadow-blue-100/30', icon: '📈' },
                'Economia': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-300', shadow: 'hover:shadow-emerald-100/30', icon: '💰' },
                'Política': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', hoverBorder: 'hover:border-purple-300', shadow: 'hover:shadow-purple-100/30', icon: '🏛️' },
                'Empresas': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', hoverBorder: 'hover:border-amber-300', shadow: 'hover:shadow-amber-100/30', icon: '🏢' },
                'Internacional': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', hoverBorder: 'hover:border-indigo-300', shadow: 'hover:shadow-indigo-100/30', icon: '🌍' },
              };
              const category = news.tag || news.category || 'Mercado';
              const colors = categoryColors[category] || categoryColors['Mercado'];

              return (
                <div
                  key={news.id || index}
                  onClick={() => {
                    setSelectedArticle({
                      component: () => (
                        <div className="artigo-visualizacao">
                          <style>{`
                            .artigo-visualizacao h1, .artigo-visualizacao h2, .artigo-visualizacao h3, .artigo-visualizacao p, .artigo-visualizacao li, .artigo-visualizacao blockquote, .artigo-visualizacao strong { color: #0f172a !important; }
                            .artigo-visualizacao a { color: #0284c7 !important; text-decoration: underline; }
                            .artigo-visualizacao blockquote { color: #334155 !important; border-left-color: #10b981; background-color: #f8fafc; padding: 1rem; border-radius: 0.5rem; }
                          `}</style>
                          <header className="mb-8 border-b border-slate-200 pb-8">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-200">{news.category || news.tag}</span>
                              <span className="text-slate-800 text-sm font-bold">{news.date || news.badge}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">{news.title}</h1>
                            {(news.summary || news.excerpt) && (
                              <p className="text-lg md:text-xl lg:text-2xl text-slate-800 font-medium mb-6 leading-relaxed border-l-4 border-emerald-400 pl-4">{news.summary || news.excerpt}</p>
                            )}
                            {news.coverImage && <img src={news.coverImage} className="w-full h-[500px] object-contain rounded-3xl border border-slate-200 shadow-xl bg-slate-100" />}
                          </header>
                          <div className="text-slate-900 max-w-[800px] mx-auto">
                            <div className="prose prose-slate prose-lg max-w-none"><MarkdownViewer content={news.content} /></div>
                          </div>
                        </div>
                      )
                    });
                  }}
                  className={`bg-white border-2 ${colors.border} rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col h-full hover:shadow-xl ${colors.shadow}`}
                >
                  <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                    {news.coverImage ? (
                      <img src={news.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"><Newspaper size={32} className="text-slate-700" /></div>
                    )}
                    <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
                    <div className={`absolute bottom-0 left-0 w-full h-0.5 ${colors.bg.replace('bg-', 'bg-')}`} />
                  </div>
                  <div className="p-4 md:p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`${colors.bg} ${colors.text} text-[9px] font-black uppercase px-2 py-1 rounded-full border ${colors.border} flex items-center gap-1`}>
                        <span>{colors.icon}</span>{news.tag || news.category}
                      </span>
                      <div className="flex items-center gap-3">
                        {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); }} className="text-[9px] font-black uppercase text-sky-700 border border-sky-200 px-2 py-1 rounded hover:bg-sky-50">Editar</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id); }} className="text-[9px] font-black uppercase text-rose-700 border border-rose-200 px-2 py-1 rounded hover:bg-rose-50">Excluir</button>
                          </>
                        )}
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{news.badge || news.date}</span>
                      </div>
                    </div>
                    <h4 className={`text-lg font-bold text-slate-900 mb-3 leading-tight group-hover:${colors.text} transition-colors line-clamp-2`}>{news.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mt-auto md:text-base">{news.summary || news.excerpt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>  

      {/* --- 4. TERMINAL DE MERCADO --- */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-2">
                <BarChart3 className="text-slate-400" />
                Mercado para aprofundar
              </h2>
              <p className="text-slate-500 text-xs uppercase tracking-wide font-bold">
                B3, cripto, câmbio e indicadores para consultar depois de organizar sua base financeira
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Pesquisar Ativo B3 (ex: PETR4)"
                  className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 transition-all uppercase outline-none shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTerm && handleSelectSuggestion(searchTerm.toUpperCase())}
                />
                <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                {suggestions.length > 0 && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden absolute w-full z-50 shadow-xl">
                    {suggestions.map((t, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 cursor-pointer border-t border-slate-200 font-bold text-xs text-slate-900" onClick={() => handleSelectSuggestion(t)}>{t}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar Cripto (ex: BTC, LTC)"
                  className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-purple-500 transition-all uppercase outline-none shadow-sm"
                  value={cryptoSymbol}
                  onChange={(e) => setCryptoSymbol(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCryptoSearch()}
                />
                <Search className="absolute left-3 top-3 text-slate-500" size={16} />
              </div>
            </div>
          </div>

          {(searchPreview || cryptoPreview) && (
            <div
              onClick={() => {
                const preview = searchPreview || cryptoPreview;
                if (preview) setSelectedAsset({ symbol: preview.symbol, category: preview.type });
              }}
              className="bg-white border border-slate-200 p-4 rounded-xl mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm cursor-pointer hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs border border-emerald-200">
                  {(searchPreview?.symbol || cryptoPreview?.symbol)?.substring(0, 3)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{searchPreview?.symbol || cryptoPreview?.symbol}</h3>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">{searchPreview ? 'Ativo B3 Encontrado' : 'Criptomoeda Encontrada'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">
                  {searchPreview?.price !== null && searchPreview?.price !== undefined
                    ? `R$ ${Number(searchPreview.price).toFixed(2).replace('.', ',')}`
                    : cryptoPreview?.price !== null && cryptoPreview?.price !== undefined
                    ? `R$ ${Number(cryptoPreview.price).toFixed(2).replace('.', ',')}`
                    : 'Buscando...'}
                </div>
                <div className={`text-xs font-black ${(searchPreview?.up ?? cryptoPreview?.up) ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {searchPreview?.change !== null && searchPreview?.change !== undefined
                    ? `${searchPreview.change > 0 ? '+' : ''}${Number(searchPreview.change).toFixed(2).replace('.', ',')}%`
                    : cryptoPreview?.change !== null && cryptoPreview?.change !== undefined
                    ? `${cryptoPreview.change > 0 ? '+' : ''}${Number(cryptoPreview.change).toFixed(2).replace('.', ',')}%`
                    : '0,00%'}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setSearchPreview(null); setCryptoPreview(null); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MarketPanel title="Índices Globais e Indicadores" items={indicesComIndicadores} onItemClick={(symbol, category) => setSelectedAsset({ symbol, category })} />
            <MarketPanel title="Câmbio & Moedas" items={marketData.currencies} onItemClick={(symbol, category) => setSelectedAsset({ symbol, category })} />
            <MarketPanel title="Criptoativos" items={marketData.cryptos} onItemClick={(symbol, category) => setSelectedAsset({ symbol, category })} />
            <MarketPanel title="Destaques B3" items={marketData.stocks.slice(0, 5)} onItemClick={(symbol, category) => setSelectedAsset({ symbol, category })} />
          </div>
        </div>
      </section>

      {/* --- CTA FINAL E FOOTER --- */}
      <section className="px-4 lg:px-12 py-16 max-w-[1600px] mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 text-center shadow-sm">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
            {heroPersona === 'dividas' ? 'Comece sem complicação' : 'O Futuro Começa Aqui'}
          </span>
          <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {heroPersona === 'dividas' ? (
              <>
                Pare de adiar o diagnóstico. <br className="hidden md:block" />
                Descubra hoje o que fazer primeiro.
              </>
            ) : (
              <>
                Sua liberdade financeira é possível. <br className="hidden md:block" />E nós temos o método.
              </>
            )}
          </h3>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto mb-6">
            {heroPersona === 'dividas' ? (
              'Você não precisa resolver tudo agora. Basta dar o primeiro passo, organizar suas dívidas e enxergar com clareza qual prioridade atacar antes.'
            ) : (
              'Otimize seus aportes mensais, descubra quando poderá parar de trabalhar e tome decisões lógicas com seu dinheiro.'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">
              {heroPersona === 'dividas' ? 'Entenda sua situação' : 'Projete seu futuro'}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">
              {heroPersona === 'dividas' ? 'Veja suas prioridades' : 'Metas e Aportes'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate(heroPersona === 'dividas' ? 'tool-dividas' : 'tool-fire')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>{heroPersona === 'dividas' ? 'Montar meu plano para sair das dívidas' : 'Descobrir minha data FIRE'}</span>
              <ArrowRight size={20} />
            </button>
            {heroPersona !== 'dividas' && (
              <button
                onClick={() =>
                  document.getElementById('secao-cursos')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Ver cursos</span>
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-16 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-4">
                <div className="flex items-center gap-3">
                   <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
                   <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Finanças Pro Invest</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed max-w-xs font-medium">
                  {heroPersona === 'dividas'
                    ? 'Ferramentas para entender dívidas, organizar prioridades e retomar o controle com mais clareza.'
                    : 'A plataforma definitiva para organizar seu patrimônio e alcançar a liberdade financeira com método.'}
                </p>
                <div className="flex gap-4 text-slate-500 pt-2">
                   <Instagram size={18} className="hover:text-emerald-500 cursor-pointer transition-colors"/>
                   <Linkedin size={18} className="hover:text-emerald-500 cursor-pointer transition-colors"/>
                   <Mail size={18} className="hover:text-emerald-500 cursor-pointer transition-colors"/>
                </div>
            </div>
            
            <div className="md:col-span-2 md:col-start-7">
                <h4 className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-4">Navegação</h4>                
                <ul className="space-y-2 text-slate-600 text-xs font-bold">
                    <li><button onClick={() => onNavigate('tool-dividas')} className="hover:text-emerald-600 transition-colors">Começar diagnóstico</button></li>
                    <li>
                      <button
                        onClick={() => {
                          document.getElementById('secao-cursos')?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        Ver cursos
                      </button>
                    </li>
                    <li><button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="hover:text-emerald-600 transition-colors">Entrar na minha área</button></li>
                    <li><button onClick={() => onNavigate('tool-juros')} className="hover:text-emerald-600 transition-colors">Entender os juros</button></li>
                </ul>
            </div>

            <div className="md:col-span-2">
                <h4 className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-4">Legal</h4>
                <ul className="space-y-2 text-slate-600 text-xs font-bold">
                    <li><button onClick={() => setActiveInfoModal('termos')} className="hover:text-slate-900 transition-colors">Termos de Uso</button></li>
                    <li><button onClick={() => setActiveInfoModal('seguranca')} className="hover:text-slate-900 transition-colors">Privacidade</button></li>
                    <li><button onClick={() => setActiveInfoModal('quem-somos')} className="hover:text-slate-900 transition-colors">Sobre Nós</button></li>
                </ul>
            </div>
            
             <div className="md:col-span-2">
                <h4 className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-4">Suporte</h4>
                <ul className="space-y-2 text-slate-600 text-xs font-bold">
                    <li><button onClick={() => setActiveInfoModal('ajuda')} className="hover:text-slate-900 transition-colors">Central de Ajuda</button></li>
                    <li><button onClick={() => setActiveInfoModal('especialista')} className="hover:text-emerald-600 transition-colors">Fale Conosco</button></li>
                </ul>
            </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-slate-200 text-center">
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">© 2026 Finanças Pro Invest. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTES PARA ORGANIZAÇÃO VISUAL ---
const ToolCard = ({ icon: Icon, title, desc, route, onNavigate, bgColor = 'blue', highlight = false }) => {
  const colorMap = {
    amber: { card: 'bg-amber-100', cardHover: 'hover:bg-amber-200', border: 'border-amber-300', borderHover: 'hover:border-amber-400', iconBg: 'bg-amber-300', iconHoverBg: 'group-hover:bg-amber-400', iconColor: 'text-amber-800', titleColor: 'text-gray-800', descColor: 'text-gray-600' },
    emerald: { card: 'bg-emerald-100', cardHover: 'hover:bg-emerald-200', border: 'border-emerald-300', borderHover: 'hover:border-emerald-400', iconBg: 'bg-emerald-300', iconHoverBg: 'group-hover:bg-emerald-400', iconColor: 'text-emerald-800', titleColor: 'text-gray-800', descColor: 'text-gray-600' },
    sky: { card: 'bg-sky-100', cardHover: 'hover:bg-sky-200', border: 'border-sky-300', borderHover: 'hover:border-sky-400', iconBg: 'bg-sky-300', iconHoverBg: 'group-hover:bg-sky-400', iconColor: 'text-sky-800', titleColor: 'text-gray-800', descColor: 'text-gray-600' },
    purple: { card: 'bg-purple-100', cardHover: 'hover:bg-purple-200', border: 'border-purple-300', borderHover: 'hover:border-purple-400', iconBg: 'bg-purple-300', iconHoverBg: 'group-hover:bg-purple-400', iconColor: 'text-purple-800', titleColor: 'text-gray-800', descColor: 'text-gray-600' },
    default: { card: 'bg-slate-100', cardHover: 'hover:bg-slate-200', border: 'border-slate-300', borderHover: 'hover:border-slate-400', iconBg: 'bg-slate-300', iconHoverBg: 'group-hover:bg-slate-400', iconColor: 'text-slate-800', titleColor: 'text-gray-800', descColor: 'text-gray-600' },
  };
  const styles = colorMap[bgColor] || colorMap.default;

  return (
    <div
      onClick={() => onNavigate(route)}
      className={`relative ${styles.card} ${styles.cardHover} border ${styles.border} ${styles.borderHover} rounded-2xl p-6 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-40 shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden ${highlight ? 'ring-2 ring-amber-300 shadow-[0_10px_30px_-12px_rgba(251,191,36,0.45)]' : ''}`}
    >
    {highlight && (
        <div className="absolute top-3 right-3 z-20">
          <span className="inline-flex items-center rounded-full bg-white/90 border border-amber-300 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">Recomendado</span>
        </div>
      )}
      <div className="relative z-10">
        <div className={`p-2 ${styles.iconBg} ${styles.iconHoverBg} rounded-lg w-fit border ${styles.border} transition-colors`}>
          <Icon size={20} className={`${styles.iconColor} group-hover:scale-110 transition-transform`} />
        </div>
      </div>
      <div className="relative z-10 mt-auto">
        <h4 className={`${styles.titleColor} font-bold text-base truncate drop-shadow-sm`}>{title}</h4>
        <p className={`${styles.descColor} text-xs font-medium uppercase tracking-wide truncate drop-shadow-sm`}>{desc}</p>
      </div>
    </div>
  );
};

const MarketPanel = ({ title, items, onItemClick }: any) => {
  let accentColor = "bg-sky-500"; 
  if (title.includes("Câmbio")) accentColor = "bg-emerald-500"; 
  if (title.includes("Cripto")) accentColor = "bg-purple-500";  
  if (title.includes("B3")) accentColor = "bg-amber-500";       

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[300px] relative overflow-hidden group hover:border-slate-300 transition-colors shadow-sm">
        <div className={`absolute top-0 left-0 w-full h-1 ${accentColor} opacity-70 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
        
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${accentColor} animate-pulse`} />
          {title}
        </h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 pb-2">
            {items.map((item: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => onItemClick(item.symbol, item.type)}
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white hover:border-slate-300 hover:-translate-y-px hover:shadow-sm group/item"
                >
                    <div>
                        <span className="font-black text-slate-900 text-xs block group-hover/item:text-slate-700 transition-colors">{item.symbol}</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">{item.type}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className="block text-xs font-bold text-slate-900 tracking-wide">
                          {item.type === 'currency' || item.type === 'crypto' ? 'R$ ' : ''}
                          {typeof item.price === 'number' ? item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : item.price}
                        </span>
                        {item.change !== undefined && (
                             <span className={`mt-1 text-xs font-black px-2 py-1 rounded flex items-center gap-1 shadow-sm ${
                                item.up 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {item.up ? '▲' : '▼'} {item.up ? '+' : ''}{item.change?.toFixed(2)}%
                              </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
export default PublicHome;
