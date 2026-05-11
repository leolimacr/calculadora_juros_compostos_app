import { fetchAssetQuote } from '../services/marketService';
import { storage, firestore } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../hooks/useGoals';
import { useAssets } from '../hooks/useAssets';
import { useDebts } from '../hooks/useDebts';
import { usePresenceTriggers } from '../hooks/usePresenceTriggers';
import { useWealthPresenceTriggers } from '../hooks/useWealthPresenceTriggers';
import { calcularProximoAporte, diasAteProximoAporte } from '../utils/dateHelpers';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MarkdownViewer } from './Public/MarkdownViewer';
import { courses } from './Public/Courses';
import React, { useEffect, useState, useMemo } from 'react';
import { ALL_B3_TICKERS } from '../data/tickers';
import { ContentModal, AssetModal } from './Public/HomeModals';
import { InfiniteTicker } from './Public/MarketComponents';
import { getLatestNews } from '../services/newsService';
import { HomeHero } from './Home/HomeHero';
import { HomeResumoFinanceiro } from './Home/HomeResumoFinanceiro';
import { HomePresenceFeed } from './Home/HomePresenceFeed';
import { HomeJornada } from './Home/HomeJornada';
import { HomeEcossistema } from './Home/HomeEcossistema';
import { HomeSecoesSuporte } from './Home/HomeSecoesSuporte';
import { HomeCursos } from './Home/HomeCursos';
import { HomeConteudo } from './Home/HomeConteudo';
import { HomeTerminalMercado } from './Home/HomeTerminalMercado';
import { HomeFooter } from './Home/HomeFooter';
import {
  LogOut, Sparkles, Wallet, Search, ArrowRight, Instagram, Linkedin, Mail,
  TrendingUp, PieChart, AlertTriangle, CreditCard, Target, Newspaper, BarChart3
} from 'lucide-react';

const CLOUD_API_URL = '/api/market';
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BNB-BRL,SOL-BRL,BTC-USD,ETH-USD,SOL-USD';
const BCB_SELIC_URL = '/api-bcb/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
const BCB_IPCA_URL = '/api-bcb/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json';

const RADAR_NEWS = [
  { id: 1, tag: 'Macroeconomia', date: 'Semana 08/2026', title: 'Copom mantém a taxa Selic em 15.% a.a.', excerpt: 'Com a inflação dando sinais de persistência, o Banco Central optou pela cautela. Entenda como isso afeta seus investimentos em Renda Fixa.' },
  { id: 2, tag: 'Tecnologia & Carreira', date: 'Tendência', title: 'O avanço da IA e a nova produtividade', excerpt: 'Ferramentas de IA não estão substituindo investidores, mas investidores que usam IA estão superando os que não usam.' },
  { id: 3, tag: 'Mercado Imobiliário', date: 'Análise Setorial', title: 'Aluguel vs Financiamento: O cenário mudou', excerpt: 'Com as novas taxas de juros, a velha regra de "quem casa quer casa" precisa ser recalculada na ponta do lápis.' },
];

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow, isAuthenticated, userMeta, isPrivacyMode }) => {
  const navigate = useNavigate();

  // --- ESTADO: Notícias ---
  const [radarNews, setRadarNews] = useState<any[]>(RADAR_NEWS);
  const [showNewsAdmin, setShowNewsAdmin] = useState(false);
  const [newsForm, setNewsForm] = useState({ id: '', title: '', summary: '', content: '', coverImage: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- ESTADO: Patrimônio ---
  const [patrimonioAtivo] = useState<number>(userMeta?.resumoFinanceiro?.patrimonioAtivo || 0);
  const [patrimonioPassivo] = useState<number>(userMeta?.resumoFinanceiro?.patrimonioPassivo || 0);
  const patrimonioTotal = patrimonioAtivo + patrimonioPassivo;

  // --- ESTADO: Dívidas ---
  const { debts, loading: debtsLoading } = useDebts(userMeta?.uid);
  usePresenceTriggers({ userId: userMeta?.uid, debts, debtsLoading });

  // --- ESTADO: Metas ---
  const { goals: metas, loading: goalsLoading } = useGoals(userMeta?.uid);

  // --- PRESENÇA: Persona patrimônio ---
  const { assets, loading: assetsLoading } = useAssets(userMeta?.uid);
  useWealthPresenceTriggers({
    userId: userMeta?.uid,
    goals: metas,
    assets,
    goalsLoading,
    assetsLoading,
    lastWealthReviewAt: userMeta?.lastWealthReviewAt
      ? new Date(userMeta.lastWealthReviewAt)
      : null,
  });
  const metasAtivas = metas.filter((m: any) => m.ativa);
  const proximaMeta = metasAtivas.length > 0 ? metasAtivas[0] : null;
  let diasRestantes: number | null = null;
  let valorProximoAporte = 1200;
  if (userMeta && proximaMeta) {
    const proximoAporteData = calcularProximoAporte({
      dataInicio: proximaMeta.dataInicio,
      frequencia: proximaMeta.frequencia,
      diasPersonalizado: proximaMeta.diasPersonalizado,
    });
    diasRestantes = diasAteProximoAporte(proximoAporteData);
    valorProximoAporte = proximaMeta.valor;
  }

  // --- ESTADO: Mercado ---
  const [marketData, setMarketData] = useState<any>({ indices: [], stocks: [], currencies: [], cryptos: [], indicators: [] });
  const indicesComIndicadores = useMemo(() => [
    ...(marketData.indices || []),
    ...(marketData.indicators || []),
  ], [marketData.indices, marketData.indicators]);

  // --- ESTADO: UI ---
  const [heroPersona, setHeroPersona] = useState<'dividas' | 'patrimonio'>('dividas');
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; category: string } | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // --- EFEITO: Buscar notícias ---
  const fetchNews = async () => {
    const fetchedNews = await getLatestNews(9);
    if (fetchedNews && fetchedNews.length > 0) setRadarNews(fetchedNews);
  };
  useEffect(() => { fetchNews(); }, []);

  // --- EFEITO: Buscar dados de mercado ---
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const [cloudRes, awesomeRes, selic, ipca] = await Promise.all([
          fetch(CLOUD_API_URL).then(r => r.json()).catch(() => ({ indices: [], stocks: [] })),
          fetch(AWESOME_API_URL).then(r => r.json()).catch(() => ({})),
          fetch(BCB_SELIC_URL).then(r => r.json()).catch(() => [{ valor: '11.25' }]),
          fetch(BCB_IPCA_URL).then(r => r.json()).catch(() => [{ valor: '4.50' }]),
        ]);

        const formatB = (item: any, type: string) => ({
          symbol: item.symbol === '^BVSP' ? 'IBOV' : (item.symbol === '^GSPC' ? 'S&P 500' : item.symbol),
          price: item.price, change: item.change, up: (item.change || 0) >= 0, type
        });
        const formatC = (symbol: string, raw: any, type: string) => ({
          symbol, price: parseFloat(raw?.bid || 0), change: parseFloat(raw?.pctChange || 0),
          up: parseFloat(raw?.pctChange || 0) >= 0, type
        });

        setMarketData({
          indices: (cloudRes.indices || []).map((i: any) => formatB(i, 'index')),
          stocks:  (cloudRes.stocks  || []).map((i: any) => formatB(i, 'stock')),
          currencies: [
            formatC('USD', awesomeRes.USDBRL, 'currency'),
            formatC('EUR', awesomeRes.EURBRL, 'currency'),
            formatC('GBP', awesomeRes.GBPBRL, 'currency'),
          ].filter(item => item.price > 0),
          cryptos: [
            formatC('BTC/BRL', awesomeRes.BTCBRL, 'crypto'),
            formatC('BTC/USD', awesomeRes.BTCUSD, 'crypto'),
            formatC('ETH/BRL', awesomeRes.ETHBRL, 'crypto'),
            formatC('ETH/USD', awesomeRes.ETHUSD, 'crypto'),
            formatC('SOL/BRL', awesomeRes.SOLBRL, 'crypto'),
            formatC('SOL/USD', awesomeRes.SOLUSD, 'crypto'),
          ].filter(item => item.price > 0),
          indicators: [
            { symbol: 'SELIC', price: selic[0]?.valor + '%', type: 'indicator' },
            { symbol: 'IPCA 12m', price: ipca[0]?.valor + '%', type: 'indicator' },
          ],
        });
      } catch { /* silencioso */ }
    };
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS: Notícias ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `news/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNewsForm((prev) => ({ ...prev, coverImage: url }));
    } catch { alert('Erro ao fazer upload da imagem.'); }
    finally { setUploadingImage(false); }
  };

  const handleSaveNews = async () => {
    try {
      if (newsForm.id) {
        await updateDoc(doc(firestore, 'noticias', newsForm.id), {
          title: newsForm.title, summary: newsForm.summary,
          content: newsForm.content, coverImage: newsForm.coverImage,
        });
        alert('Notícia atualizada com sucesso!');
      } else {
        await addDoc(collection(firestore, 'noticias'), {
          title: newsForm.title, summary: newsForm.summary,
          content: newsForm.content, coverImage: newsForm.coverImage,
          date: new Date().toISOString().split('T')[0],
          category: 'Geral', tag: 'Notícia', badge: 'Novo', readTime: '3 min',
        });
        alert('Notícia salva com sucesso!');
      }
      setNewsForm({ id: '', title: '', summary: '', content: '', coverImage: '' });
      setShowNewsAdmin(false);
      fetchNews();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar a notícia.');
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'noticias', id));
      setRadarNews((prev) => prev.filter((news) => news.id !== id));
      alert('Notícia excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      alert('Erro ao excluir a notícia. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      <HomeHero
        heroPersona={heroPersona}
        setHeroPersona={setHeroPersona}
        isAuthenticated={isAuthenticated}
        onNavigate={onNavigate}
        onStartNow={onStartNow}
        isPrivacyMode={isPrivacyMode}
        userMeta={userMeta}
        patrimonioAtivo={patrimonioAtivo}
        patrimonioPassivo={patrimonioPassivo}
        patrimonioTotal={patrimonioTotal}
        metas={metas ?? []}
      />

      <InfiniteTicker
        data={{
          indicators: marketData.indicators ?? [],
          indices: marketData.indices ?? [],
          currencies: marketData.currencies ?? [],
          cryptos: marketData.cryptos ?? [],
          stocks: marketData.stocks ?? [],
        }}
      />

      <HomeResumoFinanceiro
        heroPersona={heroPersona}
        onNavigate={onNavigate}
        onStartNow={onStartNow}
        isAuthenticated={isAuthenticated}
        isPrivacyMode={isPrivacyMode}
        userMeta={userMeta}
        patrimonioAtivo={patrimonioAtivo}
        patrimonioPassivo={patrimonioPassivo}
        patrimonioTotal={patrimonioTotal}
        metasAtivas={metasAtivas}
        diasRestantes={diasRestantes}
        valorProximoAporte={valorProximoAporte}
      />

      <HomePresenceFeed
        userId={userMeta?.uid ?? null}
        isAuthenticated={isAuthenticated}
        onNavigate={onNavigate}
        heroPersona={heroPersona}
      />

      <HomeJornada heroPersona={heroPersona} />

      <HomeEcossistema
        heroPersona={heroPersona}
        onNavigate={onNavigate}
        onStartNow={onStartNow}
        isAuthenticated={isAuthenticated}
      />

      <HomeSecoesSuporte
        heroPersona={heroPersona}
        onNavigate={onNavigate}
        onStartNow={onStartNow}
        isAuthenticated={isAuthenticated}
      />

      <HomeCursos
        heroPersona={heroPersona}
        setHeroPersona={setHeroPersona}
        setSelectedCourse={setSelectedCourse}
      />

      <HomeConteudo
        heroPersona={heroPersona}
        radarNews={radarNews}
        isAuthenticated={isAuthenticated}
        userMeta={userMeta}
        setSelectedArticle={setSelectedArticle}
        setShowNewsAdmin={setShowNewsAdmin}
        setNewsForm={setNewsForm}
        handleDeleteNews={handleDeleteNews}
      />

      {heroPersona === 'patrimonio' && (
        <HomeTerminalMercado
          marketData={marketData}
          indicesComIndicadores={indicesComIndicadores}
          onSetSelectedAsset={setSelectedAsset}
        />
      )}

      <HomeFooter
        heroPersona={heroPersona}
        isAuthenticated={isAuthenticated}
        onNavigate={onNavigate}
        onStartNow={onStartNow}
        setActiveInfoModal={setActiveInfoModal}
      />

      {/* Modais globais */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
      {activeInfoModal && (
        <ContentModal
          type={activeInfoModal}
          onClose={() => setActiveInfoModal(null)}
        />
      )}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 relative mt-8 mb-8">
            <button onClick={() => setSelectedArticle(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <LogOut size={20} className="text-slate-500" />
            </button>
            <selectedArticle.component />
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicHome;