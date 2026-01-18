/*
  Vercel Serverless Function: /api/market
  
  Uses Yahoo Finance API (No token required for basic data) to fetch indices and stocks.
*/

// Cache simples em memória (O escopo global persiste entre invocações "quentes")
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 segundos

const SYMBOLS = [
  '^BVSP', // Ibovespa
  '^GSPC', // S&P 500
  'VALE3.SA',
  'PETR4.SA',
  'ITUB4.SA',
  'BBDC4.SA',
  'ABEV3.SA'
];

export default async function handler(_req: any, res: any) {
  // 1. Verificar Cache do Servidor
  const now = Date.now();
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(cachedData);
  }

  try {
    // 2. Buscar no Yahoo Finance (Quote Endpoint suporta múltiplos símbolos)
    // Header User-Agent é crucial para não ser bloqueado pelo Yahoo
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };
    
    const symbolsQuery = SYMBOLS.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsQuery}`;
    
    const response = await fetch(url, { headers });
    
    const indices: any[] = [];
    const stocks: any[] = [];

    if (response.ok) {
        const json = await response.json();
        const results = json.quoteResponse?.result || [];

        results.forEach((item: any) => {
            const symbolMap: Record<string, {name: string, type: 'index' | 'stock', symbol: string}> = {
                '^BVSP': { name: 'Ibovespa', type: 'index', symbol: 'IBOV' },
                '^GSPC': { name: 'S&P 500', type: 'index', symbol: 'S&P 500' },
                'VALE3.SA': { name: 'Vale', type: 'stock', symbol: 'VALE3' },
                'PETR4.SA': { name: 'Petrobras', type: 'stock', symbol: 'PETR4' },
                'ITUB4.SA': { name: 'Itaú Unibanco', type: 'stock', symbol: 'ITUB4' },
                'BBDC4.SA': { name: 'Bradesco', type: 'stock', symbol: 'BBDC4' },
                'ABEV3.SA': { name: 'Ambev', type: 'stock', symbol: 'ABEV3' },
            };

            const info = symbolMap[item.symbol];
            if (info) {
                const quote = {
                    symbol: info.symbol,
                    name: info.name,
                    price: item.regularMarketPrice,
                    changePercent: item.regularMarketChangePercent,
                    category: info.type
                };

                if (info.type === 'index') {
                    indices.push(quote);
                } else {
                    stocks.push(quote);
                }
            }
        });
    }

    if (indices.length === 0 && stocks.length === 0) {
        throw new Error("Nenhum dado real obtido.");
    }

    const responseData = { indices, stocks, simulated: false };

    // 3. Atualizar Cache
    cachedData = responseData;
    lastFetchTime = now;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('SERVER: Erro ao buscar dados de mercado (Yahoo):', error);
    
    // Se houver cache (mesmo antigo), retorna ele para não quebrar a UI
    if (cachedData) {
        return res.status(200).json({ ...cachedData, simulated: false });
    }
    
    // Se falhar totalmente, retorna 500 para o frontend tratar
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
}