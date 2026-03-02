import { storage, firestore } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';
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
  const [radarNews, setRadarNews] = useState<any[]>(RADAR_NEWS); // Inicia com os dados fixos enquanto carrega  
  // --- INÍCIO: CONTROLE DE PATRIMÔNIO E PRIVACIDADE ---
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const patrimonioAtivo = userMeta?.resumoFinanceiro?.patrimonioAtivo || 0;
  
  
  const patrimonioPassivo = userMeta?.resumoFinanceiro?.patrimonioPassivo || 0;
  const patrimonioTotal = patrimonioAtivo + patrimonioPassivo;

  const formatValue = (value: number) => {
    if (isPrivacyMode) return 'R$ •••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  // --- NOVO: LÓGICA DAS METAS DE APORTE ---
  const { goals: metas } = useGoals(userMeta?.uid);
  const metasAtivas = metas.filter(m => m.ativa);
  // Pega a meta mais recente (ou a primeira) - você pode definir critérios melhores depois
  const proximaMeta = metasAtivas.length > 0 ? metasAtivas[0] : null;

  let proximoAporteData: Date | null = null;
  let diasRestantes: number | null = null;
  let valorProximoAporte: number = 1200; // valor padrão para não logado

  if (userMeta && proximaMeta) {
    proximoAporteData = calcularProximoAporte({
      dataInicio: proximaMeta.dataInicio,
      frequencia: proximaMeta.frequencia,
      diasPersonalizado: proximaMeta.diasPersonalizado,
    });
    diasRestantes = diasAteProximoAporte(proximoAporteData);
    valorProximoAporte = proximaMeta.valor;
  }
  // --- FIM: LÓGICA DAS METAS DE APORTE ---
  // --- FIM: CONTROLE DE PATRIMÔNIO E PRIVACIDADE ---
  const fetchNews = async () => {
	const fetchedNews = await getLatestNews(9);
	if (fetchedNews && fetchedNews.length > 0) {
	  setRadarNews(fetchedNews);
	}
  };

	  // Adiciona a chamada no useEffect existente ou cria um novo
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
        // MODO EDIÇÃO: Atualiza o documento existente
        const newsDocRef = doc(firestore, 'noticias', newsForm.id);
        await updateDoc(newsDocRef, {
          title: newsForm.title,
          summary: newsForm.summary,
          content: newsForm.content,
          coverImage: newsForm.coverImage
        });
        alert('Notícia atualizada com sucesso!');
      } else {
        // MODO CRIAÇÃO: Adiciona um novo documento
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

      // Limpa o form (incluindo o ID) e fecha o modal
      setNewsForm({ id: '', title: '', summary: '', content: '', coverImage: '' });
      setShowNewsAdmin(false);
      
      // Atualiza a lista na tela
      fetchNews(); 
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar a notícia.');
    }
  };

  const handleDeleteNews = async (id) => {
    try {
      // Referência ao documento na coleção 'noticias'
      const newsDocRef = doc(firestore, 'noticias', id);
      await deleteDoc(newsDocRef);
  
      // Atualiza o estado local removendo a notícia
      setRadarNews(prev => prev.filter(news => news.id !== id));
  
      // Opcional: feedback visual (use um toast se tiver)
      alert('Notícia excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
    alert('Erro ao excluir a notícia. Tente novamente.');
    }
  };
  const [marketData, setMarketData] = useState<any>({ indices: [], stocks: [], currencies: [], cryptos: [], indicators: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [searchPreview, setSearchPreview] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [showNewsAdmin, setShowNewsAdmin] = useState(false);
  const [newsForm, setNewsForm] = useState({
  id: '', // Adicionamos esta linha
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  });

// Busca o resumoFinanceiro apenas se o usuário estiver logado
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
    // Inicializa com null para mostrar um estado de "carregando"
    setSearchPreview({ symbol: ticker, price: null, type: 'stock', change: null, up: true });
    
    try {
        const res = await fetch(`${TICKER_API_URL}?tickers=${ticker}`).then(r => r.json());
		const data = Array.isArray(res) ? res[0] : res;
        const item = (data?.results && data.results[0]) ? data.results[0] : data;

        if (item) {
            const currentPrice = item.regularMarketPrice || item.price || item.close || null;
            const currentChange = item.regularMarketChangePercent || item.change || 0;

            setSearchPreview({ 
                symbol: item.symbol || ticker, 
                price: currentPrice, 
                change: currentChange, 
                up: currentChange >= 0, 
                type: 'stock' 
            });
        }
		
    } catch (e) { 
        console.error("Erro ao buscar ticker:", e);
        setSearchPreview({ symbol: ticker, price: null, type: 'stock', change: null, up: true }); 
    }
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
			  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
			  value={newsForm.title}
			  onChange={(e) =>
				setNewsForm((prev) => ({ ...prev, title: e.target.value }))
			  }
			/>
			
			 <div className="space-y-2">
			  <label className="text-slate-400 text-xs">Imagem da notícia</label>
			  <input
				type="file"
				accept="image/*"
				onChange={handleImageUpload}
				className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
			  />
			  {uploadingImage && (
				<p className="text-emerald-400 text-xs">Enviando imagem...</p>
			  )}
			  {newsForm.coverImage && !uploadingImage && (
				<img src={newsForm.coverImage} className="w-full h-32 object-cover rounded-lg mt-1" />
			  )}
			 </div>
			
   			  <textarea
			    placeholder="Resumo (summary)"
			    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-24"
			    value={newsForm.summary}
			    onChange={(e) =>
				  setNewsForm((prev) => ({ ...prev, summary: e.target.value }))
			  }
			/>
			
			  <textarea
			    placeholder="Conteúdo completo (Markdown)"
			    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-40"
			    value={newsForm.content}
			    onChange={(e) =>
				  setNewsForm((prev) => ({ ...prev, content: e.target.value }))
			    }
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
	  
      {/* TICKER DE MERCADO (TOPO - Mantido para sensação de Financeiro) */}
      <InfiniteTicker data={marketData} />

	  {/* --- 1. HERO SECTION: SOBRIEDADE E MÉTODO (ATUALIZADO) --- */}
      <section className="relative px-6 py-16 lg:py-24 max-w-[1600px] mx-auto w-full z-10">
        
        {/* Fundo sutil para destaque redimensionado para cobrir o novo layout */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
		  {/* Coluna Esquerda: Textos e CTAs (Alinhados à esquerda no desktop) */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Liberdade Financeira não é sorte. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-sky-400">É Método.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Assuma o controle absoluto do seu patrimônio. Utilize nossa tecnologia para organizar contas, projetar o futuro e tomar decisões baseadas em dados, não em achismos.
            </p>
			{/* Adição dos Botões de Ação (CTAs) para resolver a falta de direcionamento */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
              
              {!isAuthenticated ? (
                // Botão original para quem NÃO está logado
                <button 
                  onClick={onStartNow} 
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Criar Conta Gratuita <ArrowRight size={20} />
                </button>
              ) : (
                // Novo Botão do Nexus AI para quem JÁ ESTÁ logado (com Tooltip embutida apenas para Desktop)
                <div className="relative group flex items-center justify-center w-full sm:w-auto">
                  <button 
                    onClick={() => onNavigate('chat')} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 w-full border border-indigo-400/30"
                  >
                    <Sparkles size={20} className="text-indigo-200" /> Analisar com Nexus AI
                  </button>
                  
                  {/* Tooltip elegante que aparece no hover (Oculta no Mobile, visível no Desktop) */}
                  <div className="absolute bottom-full mb-3 hidden sm:group-hover:block w-64 bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50 text-center">
                    <p>Descubra onde otimizar seus aportes e receba análises instantâneas sobre sua jornada financeira.</p>
                    {/* Setinha apontando para o botão */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
                  </div>
                </div>
              )}

              {/* Botão Secundário Atualizado (FIRE) */}
              <button 
                onClick={() => onNavigate('tool-fire')} 
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 group w-full sm:w-auto"
              >
                <Zap size={20} className="text-amber-400 group-hover:scale-110 transition-transform" /> 
                Simular Liberdade (FIRE)
              </button>
            </div>
          </div> {/* FIM DA COLUNA ESQUERDA */}

		  {/* Coluna Direita: Elemento Visual Abstrato (O "Anti-Vazio") */}
          <div className="hidden lg:block relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 group/card cursor-default">
            
            {/* Glow effect atrás do card - Intensifica no hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 blur-3xl rounded-[3rem] opacity-50 transition-opacity duration-700 group-hover/card:opacity-100" />
            
            {/* Mockup do Dashboard (Painel de Vidro) - Flutuação e brilho no hover */}
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-700 group-hover/card:-translate-y-2 group-hover/card:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] group-hover/card:border-slate-600/80">
              
              {/* Top bar do Mockup */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
                    <Wallet size={16} className="text-emerald-400" />
                  </div>
                  <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
				
				{/* Top bar do Mockup */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
                    <Wallet size={16} className="text-emerald-400" />
                  </div>
                  <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
				
              {/* Corpo do Mockup: Gráficos e Cards abstratos */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                
                {/* 1. Patrimônio Ativo (A ESTRELA - Foco em Liberdade Financeira) */}
                <div 
                  onClick={() => isAuthenticated ? onNavigate('investimentos') : onStartNow()}
                  className="col-span-2 bg-gradient-to-br from-emerald-900/40 via-slate-800/40 to-slate-800/40 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-emerald-500/40 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-400/60 cursor-pointer relative overflow-hidden group/ativo"
                >  
                  {/* Efeito de brilho de fundo - intensifica no hover */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover/ativo:bg-emerald-500/20 transition-all duration-500" />
                  
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <p className="text-[10px] md:text-xs text-emerald-400 font-black uppercase tracking-widest">
                      Patrimônio Ativo <span className="text-emerald-500/70 hidden sm:inline ml-1 font-semibold">- O motor da sua Liberdade</span>
                    </p>
                  </div>
                  
                  {isAuthenticated && typeof patrimonioAtivo !== 'undefined' && patrimonioAtivo !== null ? (
                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight my-2 relative z-10">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patrimonioAtivo)}
                    </p>
                  ) : (
                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight my-2 relative z-10">
                      R$ 142.500,00
                    </p>
                  )}
                  
                  <p className="text-xs md:text-sm text-emerald-400/80 font-medium relative z-10">
                    {isAuthenticated ? "Gerando sua renda passiva do futuro" : "Rendimento médio de +2.4% ao mês"}
                  </p>
                </div>

				{/* 2. Próximo Aporte (O COMBUSTÍVEL) */}
				<div 
				  onClick={() => onNavigate('metas')} 
				  className="col-span-1 h-full bg-gradient-to-b from-blue-500/10 to-slate-800/20 backdrop-blur-md rounded-xl p-4 md:p-5 border border-blue-500/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 flex flex-col justify-center cursor-pointer"
				>
				  <p className="text-[10px] md:text-xs text-blue-300 font-bold uppercase mb-2 tracking-wider">
					Próximo Aporte
				  </p>
				  <p className="text-xl md:text-2xl lg:text-3xl font-black text-white truncate mb-1">
					{userMeta ? `R$ ${valorProximoAporte.toFixed(2).replace('.', ',')}` : 'R$ 1.200,00'}
				  </p>
				  <div className="mt-auto pt-3">
					{userMeta ? (
					  metasAtivas.length === 0 ? (
						<span className="inline-block bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-md">
						  Definir meta
						</span>
					  ) : (
						<span className={`inline-block border text-[10px] font-bold px-2 py-1 rounded-md ${
						  diasRestantes !== null && diasRestantes <= 0 ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-300' :
						  diasRestantes !== null && diasRestantes <= 5 ? 'bg-amber-500/20 border-amber-500/20 text-amber-300' :
						  'bg-blue-500/20 border-blue-500/20 text-blue-300'
						}`}>
						  {diasRestantes !== null ? (diasRestantes <= 0 ? 'Hoje é o dia!' : `Faltam ${diasRestantes} dias`) : 'Em breve'}
						</span>
					  )
					) : (
					  <span className="inline-block bg-blue-500/20 border border-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-md">
						Faça login para definir metas
					  </span>
					)}
				  </div>
				</div>
                {/* 3 e 4. Passivo e Total (OS INFORMATIVOS - Compactos e Empilhados) */}
                <div className="col-span-1 flex flex-col gap-3">
                  
                  {/* Patrimônio Passivo */}
                  <div 
                    onClick={() => isAuthenticated ? onNavigate('passivos') : onStartNow()}
                    className="flex-1 bg-slate-800/30 backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-700/40 transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-600/50 cursor-pointer flex flex-col justify-center group/passivo"
                  >
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider group-hover/passivo:text-slate-300 transition-colors">
                      Patrimônio Passivo
                    </p>
                    {isAuthenticated && typeof patrimonioPassivo !== 'undefined' && patrimonioPassivo !== null ? (
                      <p className="text-base md:text-lg font-bold text-slate-200 truncate" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patrimonioPassivo)}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patrimonioPassivo)}
                      </p>
                    ) : (
                      <p className="text-base md:text-lg font-bold text-slate-200 truncate">R$ 350.000,00</p>
                    )}
                  </div>

                  {/* Patrimônio Total */}
                  <div className="flex-1 bg-slate-800/10 backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-700/30 border-dashed transition-all duration-300 flex flex-col justify-center opacity-70 hover:opacity-100">
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">
                      Patrimônio Total
                    </p>
                    {isAuthenticated && typeof patrimonioAtivo !== 'undefined' && typeof patrimonioPassivo !== 'undefined' ? (
                      <p className="text-sm md:text-base font-bold text-slate-400 truncate" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((patrimonioAtivo || 0) + (patrimonioPassivo || 0))}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((patrimonioAtivo || 0) + (patrimonioPassivo || 0))}
                      </p>
                    ) : (
                      <p className="text-sm md:text-base font-bold text-slate-400 truncate">R$ 492.500,00</p>
                    )}
                  </div>

                </div>

              </div>
             
              {/* Mockup de Gráfico de Evolução Patrimonial */}
              <div className="bg-slate-800/30 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 mt-4 group">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Evolução Patrimonial</p>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  </div>
                </div>
                
                <div className="flex items-end justify-between h-24 gap-2">
                  {[40, 55, 45, 70, 60, 85, 100].map((height, index) => (
                    <div 
                      key={index} 
                      className="w-full bg-slate-700/40 rounded-t-sm transition-all duration-300 group-hover:bg-slate-600/50 hover:!bg-emerald-500/60" 
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
	  {/* --- 2. BENTO GRID: FERRAMENTAS (ATUALIZADO) --- */}
      <section className="px-4 lg:px-12 pb-20 max-w-[1600px] mx-auto w-full relative">
        <div className="text-center mb-10">
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest inline-block border-b border-slate-800 pb-2">
            Ecossistema Pro Invest
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
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
		<div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Academia Pro
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Evolua seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Investimentos</span>
          </h2>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base mx-auto md:mx-0">
            Trilhas de conhecimento exclusivas. Do zero à maestria no mercado financeiro com a metodologia Finanças Pro Invest.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		  {courses.map((course) => (
            <div
              key={course.id}
              className="relative bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] transition-all duration-500 cursor-pointer group overflow-hidden"
              onClick={() => setSelectedCourse(course)}
            >
              {/* Efeito de brilho superior ao passar o mouse */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
			  {/* Ícone com brilho sutil */}
              <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-3xl mb-6 shadow-[0_0_20px_rgba(99,102,241,0.05)] group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                {course.icon}
              </div>

              {/* Título com transição */}
              <h4 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors duration-300">
                {course.title}
              </h4>
              {/* Descrição em duas linhas */}
              <p className="text-sm text-slate-400 mb-6 line-clamp-2 leading-relaxed">
                {course.excerpt}
              </p>
			  {/* Rodapé do Card: Badges e CTA */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-auto">
                {/* Badges agrupadas à esquerda */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium group-hover:border-slate-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {course.modules}
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium group-hover:border-slate-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.duration}
                  </div>
                </div>

                {/* Micro-interação: Botão de Ação à direita */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/50 text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1 shadow-none group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
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
				<Newspaper size={20} className="text-emerald-500" />
				Radar Pro Invest
			  </h3>
			  <div className="flex items-center gap-4">
				<span className="text-xs font-bold text-slate-500 uppercase">
				  Atualizado Semanalmente
				</span>
			  {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
				<button
				  onClick={() => setShowNewsAdmin(true)}
				  className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-lg hover:bg-emerald-500/10"
				>
				  + Nova notícia
				</button>
			  )}				
			  </div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			  {radarNews.map((news: any, index) => (
				<div
				  key={news.id || index}
				  onClick={() =>
					setSelectedArticle({
					  component: () => (
						<div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-500 pb-16">
						  <header className="mb-8 border-b border-slate-800 pb-8">
							<div className="flex items-center gap-3 mb-4">
							  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-500/20">
								{news.category || news.tag}
							  </span>
							  <span className="text-slate-500 text-sm font-bold">
								{news.date || news.badge}
							  </span>
							</div>
							<h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
							  {news.title}
							</h1>
							{news.coverImage && (
							  <img
								src={news.coverImage}
								alt={news.title}
								className="w-full h-[400px] object-cover rounded-3xl border border-slate-800 shadow-2xl"
							  />
							)}
						  </header>
						  <div className="text-slate-300 max-w-[800px] mx-auto">
							<MarkdownViewer content={news.content} />
						  </div>
						</div>
					  ),
					})
				  }
				  className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all cursor-pointer group flex flex-col h-full"
				>
				  {/* Nova Área de Imagem (Thumbnail) */}
				  <div className="relative w-full h-48 bg-slate-800 overflow-hidden">
					{news.coverImage ? (
					  <img 
						src={news.coverImage} 
						alt={news.title} 
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
					  />
					) : (
					  /* Fallback caso a notícia não tenha imagem no Firebase */
					  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
						<Newspaper size={32} className="text-slate-700" />
					  </div>
					)}
					{/* Overlay sutil na base da imagem para transição suave com o card */}
					<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-900/50 to-transparent" />
				  </div>

				  {/* Conteúdo do Card */}
				  <div className="p-6 flex flex-col flex-grow">
					<div className="flex items-center justify-between mb-4">
					  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase px-2 py-1 rounded border border-emerald-500/20">
						{news.tag || news.category}
					  </span>
					  
					  <div className="flex items-center gap-3">
						{/* Início: Botão Editar para o Admin */}
						{isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
						  <button
							onClick={(e) => {
							  e.stopPropagation(); // Evita que o card inteiro seja clicado
							  setNewsForm({
								id: news.id,
								title: news.title || '',
								summary: news.summary || news.excerpt || '',
								content: news.content || '',
								coverImage: news.coverImage || ''
							  });
							  setShowNewsAdmin(true);
							}}
							className="text-[9px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/30 px-2 py-1 rounded hover:bg-sky-500/10 transition-colors z-10 relative"
						  >
							Editar
						  </button>
						)}
						{/* Fim: Botão Editar */}
						{/* NOVO: Botão Excluir para o Admin */}
						  {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
							<button
							  onClick={(e) => {
								e.stopPropagation();
								if (window.confirm('Tem certeza que deseja excluir esta notícia?')) {
								  handleDeleteNews(news.id);
								}
							  }}
							  className="text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/30 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors z-10 relative"
							>
							  Excluir
							</button>
						  )}
						<span className="text-[10px] text-slate-500 font-bold uppercase">
						  {news.badge || news.date}
						</span>
					  </div>
                    </div>
										
					{/* Título com contraste melhorado */}
					<h4 className="text-lg font-bold text-white mb-3 leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
					  {news.title}
					</h4>
					
					{/* Resumo limitado a 3 linhas para manter o grid alinhado */}
					<p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mt-auto">
					  {news.summary || news.excerpt}
					</p>
				  </div>
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
             <div onClick={() => setSelectedAsset(searchPreview.symbol)} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-xl cursor-pointer hover:border-slate-600 transition-all">	
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs border border-emerald-500/20">{searchPreview.symbol.substring(0,3)}</div>
                  <div>
                    <h3 className="font-black text-white text-lg">{searchPreview.symbol}</h3>
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Ativo B3 Encontrado</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-xl font-bold text-white">
                     R$ {searchPreview.price !== null && searchPreview.price !== undefined ? Number(searchPreview.price).toFixed(2).replace('.', ',') : 'Buscando...'}
                   </div>
                   <div className={`text-xs font-black ${searchPreview.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {searchPreview.change !== null && searchPreview.change !== undefined ? `${searchPreview.change > 0 ? '+' : ''}${Number(searchPreview.change).toFixed(2).replace('.', ',')}%` : '0,00%'}
                   </div>
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
const ToolCard = ({ icon: Icon, title, desc, route, onNavigate, color }: any) => {
  // Extrai a cor base (ex: 'emerald' de 'text-emerald-400') para usar no glow do hover
  const baseColor = color.replace('text-', '').replace('-400', '');
  
  return (
    <div 
      onClick={() => onNavigate(route)} 
      className={`relative bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-40 shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden`}
    >
      {/* Glow de fundo que aparece apenas no hover, usando a cor do ícone */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-${baseColor}-500`} />
      
      <div className="relative z-10">
        <div className={`p-2 bg-slate-950 rounded-lg w-fit border border-slate-800 group-hover:border-${baseColor}-500/50 transition-colors duration-300`}>
          <Icon size={20} className={`${color} group-hover:scale-110 transition-transform duration-300`} />
        </div>
      </div>
      
      <div className="relative z-10 mt-auto">
        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-slate-200 transition-colors">{title}</h4>
        <p className={`text-slate-500 text-[10px] font-bold uppercase tracking-wide group-hover:text-${baseColor}-400/80 transition-colors`}>
          {desc}
        </p>
      </div>
    </div>
  );
};
const MarketPanel = ({ title, items, onItemClick }: any) => {
  // Lógica para injetar cores vivas e dinâmicas baseadas no título do painel
  let accentColor = "bg-sky-500"; // Padrão: Azul (Índices)
  if (title.includes("Câmbio")) accentColor = "bg-emerald-500"; // Verde
  if (title.includes("Cripto")) accentColor = "bg-purple-500";  // Roxo
  if (title.includes("B3")) accentColor = "bg-amber-500";       // Laranja

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col h-[300px] relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
        {/* Linha Neon no topo do painel */}
        <div className={`absolute top-0 left-0 w-full h-1 ${accentColor} opacity-70 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
        
        {/* Título mais vivo com indicador "Ao vivo" */}
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 pb-2 border-b border-slate-800/80 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${accentColor} animate-pulse`} />
          {title}
        </h3>        		<div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 pb-2">
            {items.map((item: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => onItemClick(item.symbol)} 
                  className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl cursor-pointer transition-all duration-300 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-px hover:shadow-md group/item"
                >
                    <div>
                        <span className="font-black text-slate-200 text-xs block group-hover/item:text-white transition-colors">{item.symbol}</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">{item.type}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className="block text-xs font-bold text-white tracking-wide">
                          {item.type === 'currency' || item.type === 'crypto' ? 'R$ ' : ''}
                          {typeof item.price === 'number' ? item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : item.price}
                        </span>
						{item.change !== undefined && (
                             /* Badges de cor viva MAIORES para leitura rápida */
                             <span className={`mt-1 text-xs font-black px-2 py-1 rounded flex items-center gap-1 shadow-sm ${item.up ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
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