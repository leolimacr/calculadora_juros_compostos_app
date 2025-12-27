
import { MarketQuote } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) continua sendo chamada diretamente (sem chave).
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BTC-USD,ETH-USD';

// Rota Serverless para Índices (Protege a chave da Brapi e faz cache server-side)
const INDICES_API_URL = '/api/market';

// Cache Cliente (Navegador)
// Mantemos este cache para evitar requests desnecessários à nossa própria API
const CACHE_KEY = 'finpro_market_cache';
const CACHE_DURATION = 30 * 1000; // 30 segundos

export interface MarketResponse {
  quotes: MarketQuote[];
  isRateLimited: boolean;
}

interface CachedData {
  timestamp: number;
  data: MarketResponse;
}

// ============================================================================
// SERVIÇO
// ============================================================================

export const fetchMarketQuotes = async (forceRefresh = false): Promise<MarketResponse> => {
  // 1. Verificar Cache Local (Pula se forceRefresh for true)
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached) as CachedData;
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  }

  const quotes: MarketQuote[] = [];
  let isRateLimited = false;

  // --- 2. BUSCA MOEDAS (AwesomeAPI) ---
  try {
    const awesomeRes = await fetch(`${AWESOME_API_URL}?t=${Date.now()}`);
    if (awesomeRes.ok) {
      const json = await awesomeRes.json();
      
      if (json.USDBRL) quotes.push(mapAwesomeItem('USD', 'Dólar Comercial', json.USDBRL, 'currency'));
      if (json.EURBRL) quotes.push(mapAwesomeItem('EUR', 'Euro Comercial', json.EURBRL, 'currency'));
      
      // Cripto em Reais e Dólar (Agrupados para melhor visualização)
      if (json.BTCBRL) quotes.push(mapAwesomeItem('BTC', 'Bitcoin (R$)', json.BTCBRL, 'crypto'));
      if (json.BTCUSD) quotes.push(mapAwesomeItem('BTC/USD', 'Bitcoin (USD)', json.BTCUSD, 'crypto'));
      
      if (json.ETHBRL) quotes.push(mapAwesomeItem('ETH', 'Ethereum (R$)', json.ETHBRL, 'crypto'));
      if (json.ETHUSD) quotes.push(mapAwesomeItem('ETH/USD', 'Ethereum (USD)', json.ETHUSD, 'crypto'));
    }
  } catch (error) {
    console.error("Erro ao buscar AwesomeAPI:", error);
  }

  // --- 3. BUSCA ÍNDICES (Estratégia Híbrida) ---
  
  // A) Tenta Backend Vercel primeiro (melhor performance se disponível)
  try {
    const apiRes = await fetch(INDICES_API_URL);
    if (apiRes.ok) {
        const { indices } = await apiRes.json();
        if (indices && Array.isArray(indices)) {
            indices.forEach((idx: any) => {
                quotes.push({
                    symbol: idx.symbol,
                    name: idx.name, 
                    price: idx.price,
                    changePercent: idx.changePercent,
                    category: 'index',
                    timestamp: Date.now(),
                    simulated: false
                });
            });
        }
    }
  } catch (error) {
    // Falha silenciosa no backend para ativar fallback abaixo
    console.warn('API Backend indisponível, tentando fallback...');
  }

  // B) Fallback Client-Side (Se faltar dados)
  // Garante que IBOV e S&P 500 apareçam mesmo se backend falhar (ex: localhost)
  // Usa Yahoo Finance via Proxy para contornar CORS.

  // Verifica se IBOV já foi carregado
  if (!quotes.some(q => q.symbol === 'IBOV')) {
      try {
        const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/^BVSP?interval=1d&range=1d';
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;
        
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const data = await res.json();
            const result = data.chart?.result?.[0]?.meta;
            if (result) {
                quotes.push({
                    symbol: 'IBOV',
                    name: 'Ibovespa',
                    price: result.regularMarketPrice,
                    changePercent: ((result.regularMarketPrice - result.chartPreviousClose) / result.chartPreviousClose) * 100,
                    category: 'index',
                    timestamp: Date.now(),
                    simulated: false
                });
            }
        }
      } catch (e) { console.error("Erro fallback IBOV", e); }
  }

  // Verifica se S&P 500 já foi carregado
  if (!quotes.some(q => q.symbol === 'S&P 500')) {
      try {
        const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?interval=1d&range=1d';
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;
        
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const data = await res.json();
            const result = data.chart?.result?.[0]?.meta;
            if (result) {
                quotes.push({
                    symbol: 'S&P 500',
                    name: 'S&P 500',
                    price: result.regularMarketPrice,
                    changePercent: ((result.regularMarketPrice - result.chartPreviousClose) / result.chartPreviousClose) * 100,
                    category: 'index',
                    timestamp: Date.now(),
                    simulated: false
                });
            }
        }
      } catch (e) { console.error("Erro fallback SPX", e); }
  }

  const result: MarketResponse = { quotes, isRateLimited };

  // 4. Salvar no Cache Local
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data: result
  }));

  return result;
};

// --- Helpers ---

const mapAwesomeItem = (symbol: string, name: string, data: any, category: 'currency' | 'crypto'): MarketQuote => ({
  symbol,
  name,
  price: parseFloat(data.bid),
  changePercent: parseFloat(data.pctChange),
  category,
  timestamp: Date.now(),
  simulated: false
});
