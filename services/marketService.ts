
import { MarketQuote } from '../types';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
// AwesomeAPI (Moedas/Cripto) não precisa de chave.
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL';

// Brapi.dev (Índices) requer token.
// TODO: Adicione sua chave aqui ou no .env como VITE_BRAPI_TOKEN
// Se estiver vazia, usará dados mockados para índices como fallback.
const BRAPI_TOKEN = process.env.VITE_BRAPI_TOKEN || ''; 
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
        // console.log('Serving market data from cache');
        return data;
      }
    }
  }

  const quotes: MarketQuote[] = [];

  // --- BUSCA DADOS REAIS (AwesomeAPI) ---
  try {
    // Adiciona timestamp na URL para evitar cache do navegador e garantir atualização real
    const awesomeRes = await fetch(`${AWESOME_API_URL}?t=${Date.now()}`);
    if (awesomeRes.ok) {
      const json = await awesomeRes.json();
      
      // Normalização USD
      if (json.USDBRL) {
        quotes.push({
          symbol: 'USD',
          name: 'Dólar Comercial',
          price: parseFloat(json.USDBRL.bid),
          changePercent: parseFloat(json.USDBRL.pctChange),
          category: 'currency',
          timestamp: Date.now()
        });
      }
      
      // Normalização EUR
      if (json.EURBRL) {
        quotes.push({
          symbol: 'EUR',
          name: 'Euro Comercial',
          price: parseFloat(json.EURBRL.bid),
          changePercent: parseFloat(json.EURBRL.pctChange),
          category: 'currency',
          timestamp: Date.now()
        });
      }

      // Normalização BTC
      if (json.BTCBRL) {
        quotes.push({
          symbol: 'BTC',
          name: 'Bitcoin',
          price: parseFloat(json.BTCBRL.bid),
          changePercent: parseFloat(json.BTCBRL.pctChange),
          category: 'crypto',
          timestamp: Date.now()
        });
      }

      // Normalização ETH
      if (json.ETHBRL) {
        quotes.push({
          symbol: 'ETH',
          name: 'Ethereum',
          price: parseFloat(json.ETHBRL.bid),
          changePercent: parseFloat(json.ETHBRL.pctChange),
          category: 'crypto',
          timestamp: Date.now()
        });
      }
    }
  } catch (error) {
    console.error("Erro ao buscar AwesomeAPI:", error);
  }

  // --- BUSCA ÍNDICES (Brapi ou Mock) ---
  try {
    // 3. Fetch Brapi (Indices) - Somente se tiver token, senão usa mock com variação
    if (BRAPI_TOKEN) {
      // Adiciona t=timestamp se forceRefresh para furar cache do browser/cdn
      const url = forceRefresh ? `${BRAPI_URL}&t=${Date.now()}` : BRAPI_URL;
      const brapiRes = await fetch(url);
      
      if (brapiRes.ok) {
        const json = await brapiRes.json();
        // Brapi retorna { results: [ ... ] }
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
            } else if (item.symbol === '^GSPC') {
              quotes.push({
                symbol: 'S&P 500',
                name: 'S&P 500',
                price: item.regularMarketPrice,
                changePercent: item.regularMarketChangePercent,
                category: 'index',
                timestamp: Date.now()
              });
            }
          });
        }
      }
    } else {
      // MODO SIMULAÇÃO (Sem Token)
      // Adiciona um delay artificial de 600ms para o usuário ver o "Carregando..." no botão
      if (forceRefresh) await new Promise(r => setTimeout(r, 600));

      // Fallback Mockado com "Jitter" (Variação) para parecer vivo se não houver Token
      const jitter = () => (Math.random() * 0.5) - 0.25; // Variação pequena
      
      quotes.push(
        { 
            symbol: 'IBOV', 
            name: 'Ibovespa (Simulado)', 
            price: 128500 + (Math.random() * 200 - 100), // Variação de preço
            changePercent: 0.45 + jitter(), 
            category: 'index', 
            timestamp: Date.now() 
        },
        { 
            symbol: 'S&P 500', 
            name: 'S&P 500 (Simulado)', 
            price: 5200 + (Math.random() * 20 - 10), 
            changePercent: 0.12 + jitter(), 
            category: 'index', 
            timestamp: Date.now() 
        }
      );
    }
  } catch (error) {
    console.error("Erro ao buscar Brapi:", error);
    // Fallback em caso de erro de rede
    quotes.push(
        { symbol: 'IBOV', name: 'Ibovespa', price: 128500, changePercent: 0, category: 'index', timestamp: Date.now() },
        { symbol: 'S&P 500', name: 'S&P 500', price: 5200, changePercent: 0, category: 'index', timestamp: Date.now() }
    );
  }

  // 4. Salvar no Cache
  if (quotes.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: quotes
    }));
  }

  return quotes;
};
