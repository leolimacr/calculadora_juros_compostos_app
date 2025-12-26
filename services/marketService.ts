
import { MarketQuote } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) não precisa de chave.
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL';

// Brapi.dev (Índices) requer token.
const BRAPI_TOKEN = process.env.VITE_BRAPI_TOKEN || 'jKCiHhurRb4ZrePxXJh8Y3'; 
const BRAPI_URL = `https://brapi.dev/api/quote/^BVSP,^GSPC?token=${BRAPI_TOKEN}`;

// Cache para evitar muitas requisições (30 segundos)
const CACHE_KEY = 'finpro_market_cache';
const CACHE_DURATION = 30 * 1000;

interface CachedData {
  timestamp: number;
  data: MarketQuote[];
}

// ============================================================================
// SERVIÇO
// ============================================================================

export const fetchMarketQuotes = async (forceRefresh = false): Promise<MarketQuote[]> => {
  // 1. Verificar Cache (Pula se forceRefresh for true)
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

  // --- 2. BUSCA DADOS REAIS (AwesomeAPI - Moedas/Cripto) ---
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

  // --- 3. BUSCA ÍNDICES (Brapi ou Fallback) ---
  let ibovFound = false;
  let sp500Found = false;

  if (BRAPI_TOKEN) {
    try {
      const url = forceRefresh ? `${BRAPI_URL}&t=${Date.now()}` : BRAPI_URL;
      const brapiRes = await fetch(url);
      
      if (brapiRes.ok) {
        const json = await brapiRes.json();
        if (json.results && Array.isArray(json.results)) {
          json.results.forEach((item: any) => {
            if (item.symbol === '^BVSP') {
              quotes.push({
                symbol: 'IBOV',
                name: 'Ibovespa',
                price: item.regularMarketPrice,
                changePercent: item.regularMarketChangePercent,
                category: 'index',
                timestamp: Date.now()
              });
              ibovFound = true;
            } else if (item.symbol === '^GSPC') {
              quotes.push({
                symbol: 'S&P 500',
                name: 'S&P 500',
                price: item.regularMarketPrice,
                changePercent: item.regularMarketChangePercent,
                category: 'index',
                timestamp: Date.now()
              });
              sp500Found = true;
            }
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar Brapi:", error);
    }
  }

  // --- 4. FALLBACK PARA ÍNDICES (Se API falhar ou não retornar) ---
  // Isso garante que os cards nunca sumam da tela
  if (!ibovFound) {
    quotes.push(createMockIndex('IBOV', 'Ibovespa (Simulado)', 128500, 0.45));
  }
  if (!sp500Found) {
    quotes.push(createMockIndex('S&P 500', 'S&P 500 (Simulado)', 5200, 0.12));
  }

  // 5. Salvar no Cache
  if (quotes.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: quotes
    }));
  }

  return quotes;
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
  const jitter = (Math.random() * 0.5) - 0.25; 
  const priceJitter = (Math.random() * (basePrice * 0.002)) - (basePrice * 0.001);
  
  return {
    symbol,
    name,
    price: basePrice + priceJitter,
    changePercent: baseChange + jitter,
    category: 'index',
    timestamp: Date.now()
  };
};
