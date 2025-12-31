
import { MarketQuote, HistoricalDataPoint } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) - Adicionado BNB e SOL
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BNB-BRL,SOL-BRL';

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

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: string;
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

// --- Busca de Histórico (Novo) ---
export const fetchHistoricalData = async (symbol: string, range: '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y' = '1mo'): Promise<HistoricalDataPoint[]> => {
  console.log(`[MarketService] Buscando histórico para: ${symbol} (${range})`);
  
  try {
    let interval = '1d';
    switch(range) {
        case '1d': interval = '5m'; break; // Yahoo pode falhar com 5m para alguns ativos, fallback seria 15m
        case '5d': interval = '15m'; break;
        case '1mo': interval = '1d'; break;
        case '6mo': interval = '1d'; break;
        case '1y': interval = '1wk'; break;
        case '5y': interval = '1mo'; break;
    }

    // Mapeamento de Símbolos para Yahoo Finance
    let apiSymbol = symbol;
    
    // Lista de Criptos conhecidas para garantir formato correto
    const knownCryptos = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT', 'XRP', 'ADA', 'DOGE'];

    // Mapeamento Explícito
    const symbolMap: Record<string, string> = {
        'USD': 'BRL=X', 
        'EUR': 'EURBRL=X',
        'IBOV': '^BVSP',
        'BVSP': '^BVSP'
    };

    if (symbolMap[symbol]) {
        apiSymbol = symbolMap[symbol];
    } else if (knownCryptos.includes(symbol) || knownCryptos.some(c => symbol.startsWith(c))) {
        // Se for cripto, força o par BRL se não tiver sufixo
        if (!symbol.includes('-') && !symbol.includes('=')) {
            apiSymbol = `${symbol}-BRL`;
        }
    } else if (!symbol.includes('.') && !symbol.includes('-') && !symbol.startsWith('^') && !symbol.includes('=')) {
        // Se for ação brasileira padrão (sem ponto, traço ou chapéu), adiciona .SA
        apiSymbol = `${symbol}.SA`;
    }

    console.log(`[MarketService] URL Symbol gerado: ${apiSymbol}`);

    // Usar Proxy para evitar CORS
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${apiSymbol}?range=${range}&interval=${interval}`)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) {
        console.error(`[MarketService] Erro HTTP: ${res.status}`);
        return [];
    }
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
        console.warn('[MarketService] Resultado vazio da API Yahoo.');
        return [];
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0]?.close || [];

    const history: HistoricalDataPoint[] = [];
    
    timestamps.forEach((ts: number, i: number) => {
        // Filtra nulls (comuns em feriados ou pré-market)
        if (quotes[i] !== null && quotes[i] !== undefined) {
            history.push({
                date: new Date(ts * 1000).toISOString(),
                price: quotes[i]
            });
        }
    });

    console.log(`[MarketService] Histórico carregado: ${history.length} pontos.`);
    return history;

  } catch (error) {
    console.error('[MarketService] Exceção ao buscar histórico:', error);
    return [];
  }
};

// --- Busca de Sugestões (Autocomplete) ---
export const searchAssets = async (query: string): Promise<AssetSearchResult[]> => {
  if (!query || query.length < 2) return [];

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${query}&lang=pt-BR&region=BR&quotesCount=8&newsCount=0`)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return (data.quotes || [])
      .filter((q: any) => q.isYahooFinance && (
          q.quoteType === 'EQUITY' || 
          q.quoteType === 'ETF' || 
          q.quoteType === 'MUTUALFUND' ||
          q.quoteType === 'CRYPTOCURRENCY'
      ))
      .map((q: any) => ({
        symbol: q.symbol.replace('.SA', ''), 
        name: q.shortname || q.longname,
        type: mapQuoteType(q.quoteType)
      }));
  } catch (error) {
    console.warn("Erro no autocomplete:", error);
    return [];
  }
};

// --- Busca Cotação Específica ---
export const fetchAssetQuote = async (symbol: string): Promise<MarketQuote | null> => {
  try {
    let apiSymbol = symbol;
    let category: any = 'stock';
    const knownCryptos = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT', 'XRP', 'ADA', 'DOGE'];

    if (knownCryptos.includes(symbol)) {
        apiSymbol = `${symbol}-BRL`;
        category = 'crypto';
    } else if (!symbol.includes('.') && !symbol.includes('-') && !symbol.startsWith('^')) {
        apiSymbol = `${symbol}.SA`; 
    }

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${apiSymbol}?interval=1d&range=1d`)}`;
    const res = await fetch(proxyUrl);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0]?.meta;
    
    if (!result) return null;

    const price = result.regularMarketPrice;
    const prevClose = result.chartPreviousClose;
    const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
    
    if (result.instrumentType === 'CRYPTOCURRENCY') category = 'crypto';
    
    return {
      symbol: symbol.replace('.SA', ''),
      name:  data.chart?.result?.[0]?.meta?.shortName || symbol,
      price,
      changePercent,
      category,
      timestamp: Date.now(),
      simulated: false
    };
  } catch (error) {
    console.error("Erro ao buscar cotação específica:", error);
    return null;
  }
};

// --- Carga Geral do Painel ---
export const fetchMarketQuotes = async (forceRefresh = false): Promise<MarketResponse> => {
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

  // --- 2. BUSCA MOEDAS E CRIPTO (AwesomeAPI) ---
  try {
    const awesomeRes = await fetch(`${AWESOME_API_URL}?t=${Date.now()}`);
    if (awesomeRes.ok) {
      const json = await awesomeRes.json();
      
      if (json.USDBRL) quotes.push(mapAwesomeItem('USD', 'Dólar', json.USDBRL, 'currency'));
      if (json.EURBRL) quotes.push(mapAwesomeItem('EUR', 'Euro', json.EURBRL, 'currency'));
      
      if (json.BTCBRL) quotes.push(mapAwesomeItem('BTC', 'Bitcoin', json.BTCBRL, 'crypto'));
      if (json.ETHBRL) quotes.push(mapAwesomeItem('ETH', 'Ethereum', json.ETHBRL, 'crypto'));
      if (json.BNBBRL) quotes.push(mapAwesomeItem('BNB', 'Binance Coin', json.BNBBRL, 'crypto'));
      if (json.SOLBRL) quotes.push(mapAwesomeItem('SOL', 'Solana', json.SOLBRL, 'crypto'));
    }
  } catch (error) {
    console.error("Erro ao buscar AwesomeAPI:", error);
  }

  // --- 3. BUSCA ÍNDICES E AÇÕES ---
  let backendSuccess = false;
  
  try {
    const apiRes = await fetch(INDICES_API_URL);
    if (apiRes.ok) {
        const data = await apiRes.json();
        
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

  if (!backendSuccess) {
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

const mapQuoteType = (yahooType: string): string => {
    switch (yahooType) {
        case 'EQUITY': return 'Ação';
        case 'ETF': return 'ETF';
        case 'MUTUALFUND': return 'Fundo';
        case 'CRYPTOCURRENCY': return 'Cripto';
        case 'INDEX': return 'Índice';
        default: return 'Ativo';
    }
};
