
/*
  Vercel Serverless Function: /api/market
  
  Configuração na Vercel (Environment Variables):
  BRAPI_TOKEN = seu_token_aqui

  Comportamento:
  - Cacheia a resposta da Brapi por 60 segundos em memória (Server-side).
  - Normaliza os dados para o frontend.
  - Retorna dados simulados automaticamente se a API falhar ou der erro 429.
*/

// Cache simples em memória (O escopo global persiste entre invocações "quentes")
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 segundos

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

// Dados de Fallback (Simulação) para quando a API falhar
const getFallbackData = (simulated = true) => ({
  indices: [
    { 
      symbol: 'IBOV', 
      name: 'Ibovespa', 
      price: 128500 + (Math.random() * 500 - 250), 
      changePercent: 0.45 
    },
    { 
      symbol: 'S&P 500', 
      name: 'S&P 500', 
      price: 5200 + (Math.random() * 20 - 10), 
      changePercent: 0.12 
    }
  ],
  simulated
});

export default async function handler(req: any, res: any) {
  // 1. Verificar Cache do Servidor
  const now = Date.now();
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    // Adiciona headers de cache para CDN da Vercel também
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(cachedData);
  }

  // 2. Validar Token
  if (!BRAPI_TOKEN) {
    console.error('SERVER: BRAPI_TOKEN não configurado nas variáveis de ambiente.');
    return res.status(200).json(getFallbackData(true));
  }

  try {
    // 3. Buscar na Brapi
    const brapiRes = await fetch(`https://brapi.dev/api/quote/^BVSP,^GSPC?token=${BRAPI_TOKEN}`);

    // Tratamento específico para Rate Limit (429)
    if (brapiRes.status === 429) {
      console.warn('SERVER: Brapi Rate Limit (429) atingido. Retornando fallback.');
      return res.status(200).json(getFallbackData(true));
    }

    if (!brapiRes.ok) {
        throw new Error(`Brapi Error: ${brapiRes.status}`);
    }

    const json = await brapiRes.json();
    
    // 4. Normalizar Dados
    const indices: any[] = [];
    
    if (json.results && Array.isArray(json.results)) {
        json.results.forEach((item: any) => {
            if (item.symbol === '^BVSP') {
                indices.push({ 
                    symbol: 'IBOV', 
                    name: 'Ibovespa', 
                    price: item.regularMarketPrice, 
                    changePercent: item.regularMarketChangePercent 
                });
            } else if (item.symbol === '^GSPC') {
                indices.push({ 
                    symbol: 'S&P 500', 
                    name: 'S&P 500', 
                    price: item.regularMarketPrice, 
                    changePercent: item.regularMarketChangePercent 
                });
            }
        });
    }

    const responseData = { indices, simulated: false };

    // 5. Atualizar Cache
    cachedData = responseData;
    lastFetchTime = now;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('SERVER: Erro ao buscar dados de mercado:', error);
    
    // Se tivermos cache antigo, melhor retornar ele (mesmo vencido) do que dados randomicos?
    // Por enquanto, vamos retornar o simulado para garantir consistência.
    if (cachedData) {
        // Opcional: Adicionar flag error: true
        return res.status(200).json({ ...cachedData, simulated: true });
    }
    
    return res.status(200).json(getFallbackData(true));
  }
}
