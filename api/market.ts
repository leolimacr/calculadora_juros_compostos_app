
/*
  Vercel Serverless Function: /api/market
  
  Uses Yahoo Finance API (No token required for basic data) to fetch indices.
*/

// Cache simples em memória (O escopo global persiste entre invocações "quentes")
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 segundos

export default async function handler(req: any, res: any) {
  // 1. Verificar Cache do Servidor
  const now = Date.now();
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(cachedData);
  }

  try {
    // 2. Buscar no Yahoo Finance (Public Endpoint)
    // ^BVSP = Ibovespa
    // ^GSPC = S&P 500
    // Header User-Agent é crucial para não ser bloqueado pelo Yahoo
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };
    
    const [ibovRes, spxRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/^BVSP?interval=1d&range=1d', { headers }),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?interval=1d&range=1d', { headers })
    ]);

    const indices = [];

    // Processar Ibovespa
    if (ibovRes.ok) {
        const data = await ibovRes.json();
        const result = data.chart?.result?.[0];
        if (result?.meta) {
            const { regularMarketPrice, chartPreviousClose } = result.meta;
            const change = regularMarketPrice - chartPreviousClose;
            const changePercent = (change / chartPreviousClose) * 100;
            
            indices.push({ 
                symbol: 'IBOV', 
                name: 'Ibovespa', 
                price: regularMarketPrice, 
                changePercent: changePercent 
            });
        }
    }

    // Processar S&P 500
    if (spxRes.ok) {
        const data = await spxRes.json();
        const result = data.chart?.result?.[0];
        if (result?.meta) {
            const { regularMarketPrice, chartPreviousClose } = result.meta;
            const change = regularMarketPrice - chartPreviousClose;
            const changePercent = (change / chartPreviousClose) * 100;
            
            indices.push({ 
                symbol: 'S&P 500', 
                name: 'S&P 500', 
                price: regularMarketPrice, 
                changePercent: changePercent 
            });
        }
    }

    if (indices.length === 0) {
        throw new Error("Nenhum dado real obtido.");
    }

    const responseData = { indices, simulated: false };

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
