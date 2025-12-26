
import { MarketQuote } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) continua sendo chamada diretamente (sem chave).
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL';

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
      if (json.BTCBRL) quotes.push(mapAwesomeItem('BTC', 'Bitcoin', json.BTCBRL, 'crypto'));
      if (json.ETHBRL) quotes.push(mapAwesomeItem('ETH', 'Ethereum', json.ETHBRL, 'crypto'));
    }
  } catch (error) {
    console.error("Erro ao buscar AwesomeAPI:", error);
  }

  // --- 3. BUSCA ÍNDICES (Via /api/market) ---
  try {
    const apiRes = await fetch(INDICES_API_URL);
    
    if (apiRes.ok) {
        const data = await apiRes.json();
        
        // Verifica se o backend reportou dados simulados (por erro ou rate limit lá)
        if (data.simulated) {
            isRateLimited = true;
        }

        if (data.indices && Array.isArray(data.indices)) {
            data.indices.forEach((idx: any) => {
                quotes.push({
                    symbol: idx.symbol,
                    name: idx.name,
                    price: idx.price,
                    changePercent: idx.changePercent,
                    category: 'index',
                    timestamp: Date.now()
                });
            });
        }
    } else {
        console.warn(`Erro na rota ${INDICES_API_URL}: ${apiRes.status}`);
        // Se a rota falhar, adiciona mocks locais para não quebrar a UI
        quotes.push(createMockIndex('IBOV', 'Ibovespa (Off)', 128000, 0));
        quotes.push(createMockIndex('S&P 500', 'S&P 500 (Off)', 5200, 0));
    }
  } catch (error) {
    console.error("Falha de conexão com /api/market:", error);
    // Fallback de rede
    quotes.push(createMockIndex('IBOV', 'Ibovespa (Off)', 128000, 0));
    quotes.push(createMockIndex('S&P 500', 'S&P 500 (Off)', 5200, 0));
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
  timestamp: Date.now()
});

const createMockIndex = (symbol: string, name: string, basePrice: number, baseChange: number): MarketQuote => {
  return {
    symbol,
    name,
    price: basePrice,
    changePercent: baseChange,
    category: 'index',
    timestamp: Date.now()
  };
};
