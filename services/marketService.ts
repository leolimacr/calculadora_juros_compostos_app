
import { MarketQuote } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) não precisa de chave.
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL';

// Brapi.dev (Índices) requer token.
const BRAPI_TOKEN = process.env.VITE_BRAPI_TOKEN || 'jKCiHhurRb4ZrePxXJh8Y3'; 
const BRAPI_URL = `https://brapi.dev/api/quote/^BVSP,^GSPC?token=${BRAPI_TOKEN}`;

// Cache Geral (Evita chamadas em loop do componente)
const CACHE_KEY = 'finpro_market_cache';
const CACHE_DURATION = 30 * 1000; // 30 segundos para Moedas/Geral

// Controle Específico para Brapi (Rate Limit Strict)
const INDICES_FETCH_KEY = 'finpro_indices_last_fetch';
const INDICES_COOLDOWN = 60 * 1000; // 60 segundos estritos para índices

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
  // 1. Verificar Cache GERAL (Pula se forceRefresh for true)
  // Isso protege chamadas automáticas excessivas (intervalo do componente)
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

  // --- 2. BUSCA DADOS REAIS (AwesomeAPI - Moedas/Cripto) ---
  // Sempre tenta buscar se passou do cache geral ou se é forceRefresh
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

  // --- 3. BUSCA ÍNDICES (Lógica Condicional Estrita) ---
  const lastIndexFetch = parseInt(localStorage.getItem(INDICES_FETCH_KEY) || '0');
  const now = Date.now();
  const timeSinceLastIndex = now - lastIndexFetch;
  
  // Só busca na Brapi se passou 60s, MESMO com forceRefresh
  // Isso protege contra cliques repetidos no botão "Atualizar" que estourariam a cota
  const shouldFetchIndices = BRAPI_TOKEN && (timeSinceLastIndex >= INDICES_COOLDOWN);

  let ibovFound = false;
  let sp500Found = false;

  if (shouldFetchIndices) {
    try {
      const url = `${BRAPI_URL}&t=${now}`;
      const brapiRes = await fetch(url);
      
      // Detecção de Rate Limit (429)
      if (brapiRes.status === 429) {
        console.warn("Brapi API Rate Limit Exceeded (429). Usando dados simulados.");
        isRateLimited = true;
        // Não atualiza o timestamp INDICES_FETCH_KEY para tentar novamente no próximo ciclo se o erro for temporário
      } else if (brapiRes.ok) {
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
                timestamp: now
              });
              ibovFound = true;
            } else if (item.symbol === '^GSPC') {
              quotes.push({
                symbol: 'S&P 500',
                name: 'S&P 500',
                price: item.regularMarketPrice,
                changePercent: item.regularMarketChangePercent,
                category: 'index',
                timestamp: now
              });
              sp500Found = true;
            }
          });
          // Sucesso: Atualiza o timestamp da última busca de índices
          localStorage.setItem(INDICES_FETCH_KEY, now.toString());
        }
      }
    } catch (error) {
      console.error("Erro ao buscar Brapi:", error);
    }
  } else {
    // --- MODO REUTILIZAÇÃO (Cache Específico) ---
    // Estamos no intervalo de 60s. Tentar pegar os índices do CACHE GERAL anterior.
    const cachedGlobal = localStorage.getItem(CACHE_KEY);
    if (cachedGlobal) {
      const { data } = JSON.parse(cachedGlobal) as CachedData;
      const cachedIndices = data.quotes.filter(q => q.category === 'index');
      
      cachedIndices.forEach(q => {
        quotes.push(q);
        if (q.symbol === 'IBOV') ibovFound = true;
        if (q.symbol === 'S&P 500') sp500Found = true;
      });
    }
  }

  // --- 4. FALLBACK PARA ÍNDICES (Se API falhar, for 429 ou Cache vazio) ---
  if (!ibovFound) {
    quotes.push(createMockIndex('IBOV', 'Ibovespa (Simulado)', 128500, 0.45));
  }
  if (!sp500Found) {
    quotes.push(createMockIndex('S&P 500', 'S&P 500 (Simulado)', 5200, 0.12));
  }

  const result: MarketResponse = { quotes, isRateLimited };

  // 5. Salvar no Cache Geral
  // Atualizamos o cache geral com: Novas Moedas + (Novos Índices OU Índices Antigos)
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
