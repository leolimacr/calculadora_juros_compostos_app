
import { MarketQuote } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) continua sendo chamada diretamente (sem chave).
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BTC-USD,ETH-USD';

// Rota Serverless para Índices e Ações (Protege a chave da Brapi e faz cache server-side)
const INDICES_API_URL = '/api/market';

// Cache Cliente (Navegador)
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

// Mock de Fallback para ações se a API falhar
const STOCK_FALLBACK = [
    { symbol: 'VALE3', name: 'Vale', price: 62.50, changePercent: 0.5, category: 'stock' as const },
    { symbol: 'PETR4', name: 'Petrobras', price: 38.20, changePercent: -1.2, category: 'stock' as const },
    { symbol: 'ITUB4', name: 'Itaú', price: 34.10, changePercent: 0.8, category: 'stock' as const },
    { symbol: 'BBDC4', name: 'Bradesco', price: 13.90, changePercent: -0.5, category: 'stock' as const },
    { symbol: 'ABEV3', name: 'Ambev', price: 12.40, changePercent: 0.1, category: 'stock' as const }
];

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

  // --- 3. BUSCA ÍNDICES E AÇÕES (API Backend ou Mock Fallback) ---
  let backendSuccess = false;
  
  try {
    const apiRes = await fetch(INDICES_API_URL);
    if (apiRes.ok) {
        const data = await apiRes.json();
        
        // Processar Índices
        if (data.indices && Array.isArray(data.indices)) {
            data.indices.forEach((idx: any) => {
                quotes.push({
                    symbol: idx.symbol,
                    name: idx.name, 
                    price: idx.price,
                    changePercent: idx.changePercent,
                    category: 'index',
                    timestamp: Date.now(),
                    simulated: data.simulated
                });
            });
        }

        // Processar Ações
        if (data.stocks && Array.isArray(data.stocks)) {
            data.stocks.forEach((stock: any) => {
                quotes.push({
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.price,
                    changePercent: stock.changePercent,
                    category: 'stock',
                    timestamp: Date.now(),
                    simulated: data.simulated
                });
            });
            backendSuccess = true;
        }
    }
  } catch (error) {
    console.warn('API Backend indisponível, tentando fallback...', error);
  }

  // Fallback para Ações e Índices se o backend falhar
  if (!backendSuccess) {
      // Tenta IBOV via Proxy Yahoo (Client-Side)
      if (!quotes.some(q => q.symbol === 'IBOV')) {
          try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/^BVSP?interval=1d&range=1d')}`;
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
          } catch (e) {}
      }

      // Adiciona Ações Mockadas se não vieram do backend
      if (!quotes.some(q => q.category === 'stock')) {
          STOCK_FALLBACK.forEach(s => {
              quotes.push({
                  ...s,
                  timestamp: Date.now(),
                  simulated: true
              });
          });
      }
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
