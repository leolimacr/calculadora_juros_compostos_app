// Capturar exceções não tratadas para debug
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { NexusIdentity } from "./nexus-core/identity";
import { DiscretionEngine } from "./nexus-core/discretion-engine";
import { DataIntegrator, UserDataResult } from "./nexus-core/data-integrator";
import { MultiModelRouter } from "./nexus-core/MultiModelRouter";
import {
  NexusDebtPlanRequestSchema,  
} from "./src/debtPlan.types";
initializeApp();

// Interfaces
interface CryptoPriceData { price: number; lastUpdated: string; }
interface CryptoPriceDataDual { priceUSD: number; priceBRL: number; lastUpdated: string; }


async function getUserPlan(userId: string): Promise<string | undefined> {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      const plan = data?.subscription?.plan;
      
      if (plan) {
        logger.info(`[Subscription] Plano do usuário ${userId}: ${plan}`);
        return plan;
      }
    }
    
    logger.info(`[Subscription] Usuário ${userId} sem plano definido (usando padrão)`);
    return undefined;
  } catch (error: any) {
    logger.error(`[Subscription] Erro ao buscar plano: ${error.message}`);
    return undefined;
  }
}

async function getUserDebts(userId: string): Promise<any[]> {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('users').doc(userId).collection('dividas').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    logger.error(`[Debts] Erro ao buscar dívidas: ${error.message}`);
    return [];
  }
}

// NOVA FUNÇÃO: descreve o período de histórico com base no plano
function describeHistoryWindow(plan?: string): string {
  switch (plan) {
    case 'free': return 'Você está no plano Free, então posso analisar apenas os últimos 3 dias do seu histórico';
    case 'pro': return 'Você está no plano Pro, então posso analisar os últimos 30 dias do seu histórico';
    case 'premium': return 'Você está no plano Premium, então posso analisar os últimos 90 dias do seu histórico';
    case 'premium_anual': return 'Você está no plano Premium Anual, então posso analisar todo o seu histórico de lançamentos (ilimitado)';
    default: return 'analiso um recorte recente do seu histórico, definido pelo seu plano';
  }
}

// Contador de uso Tavily
let tavilyUsageCount = 0;
const TAVILY_MONTHLY_LIMIT = 1000;

// --- FUNÇÕES DE BUSCA WEB ---
async function searchWebTavily(query: string, apiKey: string): Promise<string | null> {
  try {
    tavilyUsageCount++;
    logger.info(`[Tavily] Busca #${tavilyUsageCount}/1000: "${query}"`);
    if (tavilyUsageCount > TAVILY_MONTHLY_LIMIT) {
      logger.warn(`[Tavily] Limite mensal atingido (${TAVILY_MONTHLY_LIMIT})`);
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error(`[Tavily] HTTP ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    if (data.answer) {
      logger.info('[Tavily] ? Resposta obtida');
      return data.answer;
    }

    if (data.results && data.results.length > 0) {
      const summary = data.results
        .slice(0, 3)
        .map((r: any) => r.content || r.snippet || '')
        .filter((s: string) => s.length > 0)
        .join('\n\n');
      if (summary.length > 0) {
        logger.info('[Tavily] ? Resultados concatenados');
        return summary;
      }
    }
    return null;
  } catch (error: any) {
    logger.error('[Tavily] Erro:', error.message);
    return null;
  }
}

async function searchWebScraping(query: string): Promise<string | null> {
  try {
    logger.info(`[Scraping] Tentando: "${query}"`);
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn(`[Scraping] HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const snippetRegex = /<div class="BNeawe">([^<]+)<\/div>/gi;
    const matches = [];
    let match;
    while ((match = snippetRegex.exec(html)) !== null && matches.length < 3) {
      const text = match[1]
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
      if (text.length > 20 && !text.includes('...')) {
        matches.push(text);
      }
    }

    if (matches.length > 0) {
      logger.info(`[Scraping] ? ${matches.length} resultados extraídos`);
      return matches.join('\n\n');
    }

    logger.warn('[Scraping] Nenhum resultado extraído');
    return null;
  } catch (error: any) {
    logger.error('[Scraping] Erro:', error.message);
    return null;
  }
}

async function searchWebCascade(query: string, tavilyKey: string): Promise<string> {
  logger.info(`[WebSearch] Iniciando cascata para: "${query}"`);
  
  const tavilyResult = await searchWebTavily(query, tavilyKey);
  if (tavilyResult) return tavilyResult;

  logger.info('[WebSearch] Tavily falhou, tentando scraping...');
  const scrapingResult = await searchWebScraping(query);
  if (scrapingResult) return scrapingResult;

  logger.warn('[WebSearch] Todas tentativas falharam');
  return "Não consegui obter informações atualizadas no momento. Tente novamente em alguns instantes.";
}

// --- FUNÇÕES AUXILIARES ---
async function fetchSafe(url: string, timeout = 8000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response.ok ? await response.json() : null;
  } catch (e) {
    logger.warn(`fetchSafe timeout/falha para ${url}`);
    return null;
  }
}

async function fetchCryptoPrices(cryptos: string[]): Promise<Record<string, CryptoPriceData>> {
  const results: Record<string, CryptoPriceData> = {};
  if (!cryptos.length) return results;

  try {
    const coinIds = cryptos.map(c => {
      const mapping: Record<string, string> = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
        'BNB': 'binancecoin', 'ADA': 'cardano', 'XRP': 'ripple',
        'DOGE': 'dogecoin', 'DOT': 'polkadot', 'AVAX': 'avalanche-2'
      };
      return mapping[c.toUpperCase()] || c.toLowerCase();
    }).join(',');

    const data = await fetchSafe(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=brl`, 5000);
    if (data) {
      const nowBR = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      Object.entries(data).forEach(([id, info]: [string, any]) => {
        const symbol = cryptos.find(c => id.includes(c.toLowerCase()))?.toUpperCase() || id.toUpperCase();
        results[symbol] = { price: info.brl, lastUpdated: nowBR };
      });
      logger.info(`CoinGecko BRL: ${Object.keys(results).join(', ')}`);
    }
  } catch (error) {
    logger.error("Erro fetchCryptoPrices", error);
  }
  return results;
}

async function fetchCryptoPricesDual(cryptos: string[]): Promise<Record<string, CryptoPriceDataDual>> {
  const results: Record<string, CryptoPriceDataDual> = {};
  if (!cryptos.length) return results;

  try {
    const coinIds = cryptos.map(c => {
      const mapping: Record<string, string> = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
        'BNB': 'binancecoin', 'ADA': 'cardano', 'XRP': 'ripple',
        'DOGE': 'dogecoin', 'DOT': 'polkadot', 'AVAX': 'avalanche-2'
      };
      return mapping[c.toUpperCase()] || c.toLowerCase();
    }).join(',');

    const data = await fetchSafe(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd,brl`, 5000);
    if (data) {
      const nowBR = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      Object.entries(data).forEach(([id, info]: [string, any]) => {
        const symbol = cryptos.find(c => id.includes(c.toLowerCase()))?.toUpperCase() || id.toUpperCase();
        results[symbol] = { priceUSD: info.usd, priceBRL: info.brl, lastUpdated: nowBR };
      });
      logger.info(`CoinGecko USD+BRL: ${Object.keys(results).join(', ')}`);
    }
  } catch (error) {
    logger.error("Erro fetchCryptoPricesDual", error);
  }
  return results;
}
async function fetchAllMarketData(
  tickers: string[],
  cryptos: string[],
  token: string,
  prompt: string,
  history: any[]
): Promise<string> {
  const results: string[] = [];
  let hasAnyData = false;

  const needsUSDExplicit = /dólar|dolar|usd|dollar|us\$/i.test(prompt);
  let needsUSDContext = false;
  if (history.length > 0) {
    const lastTwoMsgs = history.slice(-2);
    needsUSDContext = lastTwoMsgs.some((h: any) => 
      /dólar|dolar|usd|dollar|US\$/i.test(h.text || '')
    );
  }
  const needsUSD = needsUSDExplicit || needsUSDContext;

  if (cryptos.length > 0) {
    if (needsUSD) {
      const cpDual = await fetchCryptoPricesDual(cryptos);
      if (Object.keys(cpDual).length > 0) {
        Object.entries(cpDual).forEach(([symbol, data]) => {
          results.push(`${symbol}: US$ ${data.priceUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / R$ ${data.priceBRL.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (cotação de ${data.lastUpdated})`);
        });
        hasAnyData = true;
      }
    } else {
      const cp = await fetchCryptoPrices(cryptos);
      if (Object.keys(cp).length > 0) {
        Object.entries(cp).forEach(([symbol, data]) => {
          results.push(`${symbol}: R$ ${data.price.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (cotação de ${data.lastUpdated})`);
        });
        hasAnyData = true;
      }
    }
  }

  if (tickers.length > 0) {
    const stocks = Array.from(new Set(['^BVSP', ...tickers.filter(t => t.length >= 4)]));
    try {
      const stockRes = await Promise.allSettled(
        stocks.map(async ticker => {
          try {
            const url = `https://brapi.dev/api/quote/${ticker.toUpperCase()}?token=${token}`;
            const d: any = await fetchSafe(url, 6000);
            if (d?.results?.[0]?.regularMarketPrice) {
              const time = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
              const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
              return `${ticker}: R$ ${d.results[0].regularMarketPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (cotação de ${date} às ${time})`;
            }
            return null;
          } catch (err) { return null; }
        })
      );
      stockRes.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
          hasAnyData = true;
        }
      });
    } catch (error) { logger.error("Erro busca ações", error); }
  }

  return hasAnyData ? results.join('\n') : "";
}

function extractTickersFallback(prompt: string): { b3: string[], crypto: string[] } {
  const result = { b3: [] as string[], crypto: [] as string[] };
  const upperPrompt = prompt.toUpperCase();
  const lowerPrompt = prompt.toLowerCase();

  const b3Regex = /\b([A-Z]{4}\d{1,2})\b/g;
  let match;
  while ((match = b3Regex.exec(upperPrompt)) !== null) {
    result.b3.push(match[1]);
  }

  const companyMap: Record<string, {type: 'b3'|'crypto', ticker: string}> = {
    'itaú': {type:'b3', ticker:'ITUB4'},
    'itau': {type:'b3', ticker:'ITUB4'},
    'itub': {type:'b3', ticker:'ITUB4'},
    'itub4': {type:'b3', ticker:'ITUB4'},
    'petrobras': {type:'b3', ticker:'PETR4'},
    'vale': {type:'b3', ticker:'VALE3'},
    'banco do brasil': {type:'b3', ticker:'BBAS3'},
    'bb': {type:'b3', ticker:'BBAS3'},
    'ivvb11': {type:'b3', ticker:'IVVB11'},
    'wege': {type:'b3', ticker:'WEGE3'},
    'wege3': {type:'b3', ticker:'WEGE3'},
    'bitcoin': {type:'crypto', ticker:'BTC'},
    'btc': {type:'crypto', ticker:'BTC'},
    'ethereum': {type:'crypto', ticker:'ETH'},
    'eth': {type:'crypto', ticker:'ETH'},
    'solana': {type:'crypto', ticker:'SOL'},
    'sol': {type:'crypto', ticker:'SOL'}
  };

  Object.keys(companyMap).forEach(key => {
    if (lowerPrompt.includes(key)) {
      const item = companyMap[key];
      if (item.type === 'b3') result.b3.push(item.ticker);
      if (item.type === 'crypto') result.crypto.push(item.ticker);
    }
  });

  result.b3 = [...new Set(result.b3)];
  result.crypto = [...new Set(result.crypto)];
  return result;
}

// ============================================
// FUNÇÃO: generateDebtPlan (Simulador ? Nexus)
// ============================================

export const generateDebtPlan = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 300,
    region: "us-central1",
  },
  
  async (request) => {
    // TRATAMENTO MANUAL DE PREFLIGHT (OPTIONS)
    if (request.rawRequest && request.rawRequest.method === 'OPTIONS') {
      const res = request.rawRequest.res;
      if (res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send();
        return;
      }
    }

    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Login necessário.");
      }

      // 1) Validar payload de entrada
      const parseResult = NexusDebtPlanRequestSchema.safeParse(request.data);
      if (!parseResult.success) {
        logger.error("[generateDebtPlan] Payload inválido:", parseResult.error.flatten());
        // Agora o erro inclui os detalhes do Zod
        throw new HttpsError(
          "invalid-argument",
          "Dados inválidos: " + JSON.stringify(parseResult.error.flatten())
        );
      }

      const userId = request.auth.uid;

      // 2) Preparar router e chaves
      const geminiApiKey = process.env.GEMINI_API_KEY as string;
      const openrouterApiKey = process.env.OPENROUTER_API_KEY as string;
      const groqApiKey = process.env.GROQ_API_KEY as string;
      const mistralApiKey = process.env.MISTRAL_API_KEY as string;

      const router = MultiModelRouter.getInstance();
      router.updateApiKeys({
        gemini: geminiApiKey,
        openrouter: openrouterApiKey,
        groq: groqApiKey,
        mistral: mistralApiKey,
      });

      // 3) Montar system prompt específico para plano de dívidas
      const dados = parseResult.data;
      const ctx = dados.perfilContexto;
      const patrimonio = dados.patrimonioContexto;
      const oportunidade = dados.custoOportunidadeContexto;

      const estabilidadeLabel =
        ctx?.estabilidade === 'estavel' ? 'Estável (renda fixa e previsível)' :
        ctx?.estabilidade === 'volatil' ? 'Volátil (renda imprevisível, risco alto)' :
        ctx?.estabilidade === 'regular' ? 'Regular (renda com alguma variação)' :
        'Não informada';

      const reservaStatus = ctx
        ? `R$ ${ctx.reservaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de reserva atual (meta: ${ctx.metaReservaEmMeses} meses de renda)`
        : 'Não informada';

      const patrimonioStatus = patrimonio
        ? `Total de investimentos financeiros: R$ ${patrimonio.valorTotalInvestimentosFinanceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${patrimonio.valorDisponivelAcimaReserva != null ? ` | Disponível acima da reserva: R$ ${patrimonio.valorDisponivelAcimaReserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${patrimonio.valorPatrimonioLiquido != null ? ` | Patrimônio líquido: R$ ${patrimonio.valorPatrimonioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`
        : 'Não informado';

      const oportunidadeStatus = oportunidade
        ? `Selic: ${oportunidade.selicAno ?? 'n/d'}% a.a. | CDI: ${oportunidade.cdiAno ?? 'n/d'}% a.a. | Retorno líquido estimado: ${oportunidade.retornoLiquidoEstimadoAno ?? 'n/d'}% a.a. | Estratégia sugerida: ${oportunidade.estrategiaSugerida ?? 'n/d'}`
        : 'Não informado';

        const nomeUsuario = ((request.auth.token?.name || request.auth.token?.email || "Investidor") as string).split(' ')[0];

        // Buscar dados consolidados do usuário (inclui transações recentes do Gerenciador)
        let userData: UserDataResult = {
          goals: [],
          recentTransactions: [],
          simulations: [],
          summary: '',
          hasData: false,
          dataStatus: 'empty',
        };

        try {
          // Para plano de dívidas, use uma janela padrão de 6 meses (aprox. 180 dias)
          const userPlan = '6m';
          userData = await DataIntegrator.gatherUserData(userId, userPlan);
          logger.info(`[generateDebtPlan] DataIntegrator retornou ${userData.recentTransactions.length} transações recentes para plano de dívidas.`);
        } catch (dataError: any) {
          logger.error("[generateDebtPlan] Falha ao buscar dados do usuário via DataIntegrator:", dataError);
        }

        const userDataSintetico = {
          hasData: userData.hasData,
          summary: userData.summary || "",
        };

        const systemPromptEtapa1 = `${NexusIdentity.getSystemPrompt(
          nomeUsuario,
          {},
          "",
          "",
          "",
          "",
          dados.patrimonioContexto ? JSON.stringify(dados.patrimonioContexto) : "",
          "",
          "",
          true,
          userDataSintetico,
          ""
        )}

# MISSÃO ESPECIAL: PLANO DE QUITAÇÃO DE DÍVIDAS

Você está sendo acionado para montar um plano de quitação de dívidas personalizado para ${nomeUsuario}.
Responda exclusivamente em português do Brasil. Nenhuma palavra em inglês.
Escreva como um consultor financeiro humano escreveria para um cliente real.
Use linguagem natural, clara, prática e consultiva.
Não retorne JSON.

Não use nomes de campos, marcadores técnicos nem estrutura de banco.
## FORMATAÇÃO DE SAÍDA — OBRIGATÓRIA

A resposta será exibida na tela e impressa em PDF pelo navegador.

Por isso:
- NÃO use markdown
- NÃO use tabelas com barras verticais (pipe)
- NÃO use negrito, #, ##, ###, bullets com asterisco (*) ou qualquer sintaxe markdown
- NÃO use blocos visuais dependentes de renderização markdown
- Escreva em texto limpo, com frases curtas e subtítulos simples

Formato desejado:
TÍTULO EM TEXTO NORMAL
Linha em branco
Subtítulo simples
Texto corrido
Linha em branco
Outro subtítulo
Texto corrido

Se quiser listar itens, use hífen normal ou numeração simples, mas sem qualquer sintaxe especial de markdown.

## CALIBRAÇÃO EMOCIONAL — OBRIGATÓRIO

O plano começa com um parágrafo humano — antes de qualquer listagem de dívidas.

Regras:
- Identifique ao menos um ponto financeiro positivo REAL do usuário nos dados (reserva, patrimônio, renda estável, dívidas abaixo da renda). Cite o número.
- Se a situação for pesada (dívidas altas, pouca reserva), o tom é de acolhimento e encorajamento baseado nos pontos fortes reais.
- Se a situação for confortável, o tom é de oportunidade.
- Nunca abra com números negativos ou lista de dívidas.
- Este parágrafo deve soar como a primeira frase de um consultor humano numa reunião presencial — não como introdução de relatório.
- Máximo de 4 linhas. Depois disso, vá direto para a análise.

## USO OBRIGATÓRIO DO GERENCIADOR FINANCEIRO

Você tem acesso não só às dívidas e ao patrimônio, mas também ao GERENCIADOR FINANCEIRO do Finanças Pro Invest.

Isso significa que, além da renda declarada, você enxerga:

- entradas do período (salários, extras, etc.)
- saídas por categoria (moradia, alimentação, transporte, dízimo, etc.)
- saldo disponível e padrão de gastos recente

REGRAS OBRIGATÓRIAS:

1. SEMPRE considere o fluxo de caixa real recente antes de sugerir antecipação de dívidas.
2. Se o padrão de despesas estiver alto e o saldo final estiver apertado, seja mais conservador na sugestão de quanto da sobra mensal pode ir para antecipação.
3. Se o usuário mantiver saldo positivo consistente e despesas estáveis, você pode sugerir um valor de antecipação um pouco mais agressivo, deixando claro que é baseado no comportamento real observado.
4. Use exemplos concretos na análise:
   - “Nos últimos meses, suas entradas ficaram em torno de R$ X e as saídas em torno de R$ Y, deixando uma sobra média de aproximadamente R$ Z.”
5. Nunca assuma uma sobra teórica máxima (renda - parcelas) sem confrontar com o comportamento de gastos observado no Gerenciador Financeiro.
6. Se houver poucos lançamentos ou dados insuficientes, deixe isso claro no texto e adote uma postura mais conservadora na antecipação, SEM pedir para o usuário “montar o plano por conta própria”.

PROIBIDO — estas frases nunca devem aparecer no texto:
- "Agradeço a oportunidade"
- "Espero que essas recomendações sejam úteis"
- "não hesite em entrar em contato"
- "Se tiver alguma dúvida"
- "Lembre-se de que é fundamental"
- "nos próximos 7 dias"
- "nos próximos 30 dias"
- "nos próximos 90 dias"
- qualquer frase de encerramento genérica de e-mail corporativo
- "cada situação é única"
- "consultar um assessor"
- "assessor de investimentos certificado"
- "registrado na CVM"
- "recomendável consultar"
- "análise detalhada da situação financeira do usuário"
- qualquer frase que delegue ao usuário o que o Nexus deve fazer
- qualquer parágrafo final de resumo que repita o que já foi dito no plano
- "sua renda estável e a reserva adequada permitem"
- "abordagem agressiva, mas equilibrada"

FORMATO OBRIGATÓRIO — siga este exemplo de estrutura e tom (adapte os números ao usuário real):

[Nome], sua renda mensal é de R$ X. Suas parcelas somam R$ Y, o que deixa R$ Z disponíveis por mês. Sua reserva de R$ W cobre [N] meses de despesas — isso é [adequado / insuficiente / confortável]. Seu patrimônio líquido é de R$ P.

Cada dívida analisada:

[Nome da dívida 1] — saldo R$ X | taxa 2,03% a.m.
O retorno líquido de renda fixa hoje é 1,04% a.m. (Selic 14,75% com IR). Como 2,03% > 1,04%, vale quitar agressivamente — cada real nessa dívida rende mais do que investido. Com R$ Z de sobra, você pode liquidar essa dívida em [N] meses pagando R$ X a mais por mês. Se puder antecipar as últimas parcelas agora, elas custam muito menos do que a parcela atual — elimine de trás pra frente.

[Nome da dívida 2] — saldo R$ X | taxa 0,69% a.m.
O retorno líquido de renda fixa (1,04% a.m.) é maior do que o custo dessa dívida. Não vale antecipar — seu dinheiro rende mais investido do que quitando esse financiamento. Mantenha as parcelas normais.

O que fazer agora — esta semana:
[ação concreta e específica, com valor e dívida nomeados]

O que mudar — este mês:
[decisão financeira específica ao cenário deste usuário]

Revisão em 3 meses:
[o que verificar nos números reais deste usuário em 3 meses]

— Nexus, analista de cenários financeiros do Finanças Pro Invest

IMPORTANTE: o exemplo acima é apenas de estrutura e tom — use os dados reais do usuário, não os números do exemplo.

O texto deve cobrir obrigatoriamente:
- Leitura da situação atual: renda, sobra mensal (renda - soma das parcelas), reserva e patrimônio
- Dívida prioritária e motivo objetivo
- Decisão para cada dívida: quitar agressivamente, amortizar, manter parcelas, renegociar ou não antecipar
- Para cada dívida: comparar explicitamente a taxa mensal da dívida com o retorno líquido mensal de renda fixa e concluir se vale ou não antecipar
- Valores concretos: quanto sobra por mês, quanto destinar de extra, e OBRIGATORIAMENTE dois cenários de quitação para cada dívida cuja taxa supere o retorno líquido de renda fixa: (1) pagando só a parcela atual — quantos meses restam; (2) pagando a parcela + o valor extra calculado sobre a sobraMensalReal — quantos meses restam e quanto economiza em juros.
- Ações desta semana (imediatas)
- Mudança de comportamento este mês
- Revisão estratégica em 3 meses
- Alertas importantes e cuidados

Regras:
- Nunca entregue um plano genérico
- Use exatamente os nomes das dívidas fornecidas
- Não confunda patrimônio passivo com dívidas
- Se houver reserva adequada, não recomende aumentar reserva sem necessidade
- Se houver vantagem em preservar liquidez ou manter investimentos, diga isso claramente
- Se a taxa da dívida for menor que o retorno líquido de renda fixa, conclua explicitamente que não vale antecipar
- Se a taxa da dívida for maior que o retorno líquido de renda fixa, conclua explicitamente que vale quitar agressivamente
- Quando houver financiamento parcelado, oriente a antecipar as últimas parcelas todo mês — elas custam muito menos que a parcela atual e eliminam juro futuro
- Você é o plano — nunca devolva ao usuário a tarefa de elaborar um plano
- Seja direto, humano e útil
`;

        // 4) Mensagem "user" com os dados da simulação
        const userMessage = `
      A seguir estão os dados reais de um usuário do Finanças Pro Invest.

      INSTRUÇÕES DE ANÁLISE:
      - Considere renda, reserva, estabilidade, patrimônio, custo de oportunidade e todas as dívidas ao mesmo tempo.
      - Não trate automaticamente financiamento barato ou dívida garantida como prioridade de quitação antecipada.
      - Se houver contexto econômico favorável à liquidez ou ao investimento conservador, explique isso de forma explícita.
      - Não devolva JSON nesta etapa. Responda como texto de consultoria.
      - Em patrimonioPassivo, não trate bens patrimoniais como dívidas. Dívidas são apenas financiamentos, empréstimos e saldos devedores.
      - Se patrimônio ativo, reserva ou renda não forem suficientes para uma quitação acelerada sem perda de segurança, deixe isso claro.
      - Se fizer mais sentido manter parcelas de alguma dívida, diga isso explicitamente.

      PERFIL DO USUÁRIO:
      - Nome: ${nomeUsuario}
      - Estabilidade de renda: ${estabilidadeLabel}
      - Reserva de emergência: ${reservaStatus}
      - Renda mensal declarada: ${dados.simulacao.rendaMensalEstimada
        ? `R$ ${dados.simulacao.rendaMensalEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Não informada'}

      PATRIMÔNIO E INVESTIMENTOS:
      - Contexto patrimonial: ${patrimonioStatus}

      CONTEXTO DE CUSTO DE OPORTUNIDADE:
      - Contexto econômico e estratégico: ${oportunidadeStatus}

      DÍVIDAS CADASTRADAS:
      ${dados.dividas.map((d, i) =>
        `${i + 1}. ${d.nome} — Saldo: R$ ${d.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Taxa: ${d.taxaJurosMes}% a.m.${d.parcelaMensal ? ` | Parcela: R$ ${d.parcelaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${d.ehGarantida ? ' | Dívida garantida: sim' : ''}${d.atrasoEmDias ? ` | Atraso: ${d.atrasoEmDias} dias` : ''}${d.observacoes ? ` | Observações: ${d.observacoes}` : ''}`
      ).join('\n')}

      CAIXA REAL DO USUÁRIO — USE ESTES NÚMEROS COMO BASE PRINCIPAL:
      - Renda mensal declarada: ${typeof dados.simulacao.rendaMensalEstimada === 'number'
        ? `R$ ${dados.simulacao.rendaMensalEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Não informada'}
      - Despesas mensais médias já apuradas no Gerenciador: ${typeof dados.simulacao.despesasMensaisMedias === 'number'
        ? `R$ ${dados.simulacao.despesasMensaisMedias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Não informado'}
      - Parcelas mensais atuais das dívidas: ${typeof dados.simulacao.totalParcelasMensais === 'number'
        ? `R$ ${dados.simulacao.totalParcelasMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Não informado'}
      - Sobra mensal real já calculada: ${typeof dados.simulacao.sobraMensalReal === 'number'
        ? `R$ ${dados.simulacao.sobraMensalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Não informada'}
      - Janela usada para apurar despesas: ${typeof dados.simulacao.janelaAnaliseDias === 'number'
        ? `${dados.simulacao.janelaAnaliseDias} dias`
        : 'Não informada'}

      RESUMO REAL DE LANÇAMENTOS DO GERENCIADOR (últimos 6 meses aproximados):
      ${
        userData && userData.recentTransactions && userData.recentTransactions.length > 0
          ? (() => {
              const incomes = userData.recentTransactions.filter(t => t.type === 'income');
              const expenses = userData.recentTransactions.filter(t => t.type === 'expense');

              const totalIncomes = incomes.reduce((acc, t) => acc + (t.amount || 0), 0);
              const totalExpenses = expenses.reduce((acc, t) => acc + (t.amount || 0), 0);

              const byCategory: Record<string, number> = {};
              for (const t of expenses) {
                const cat = (t.category || 'Outros').trim();
                byCategory[cat] = (byCategory[cat] || 0) + (t.amount || 0);
              }

              const topCategories = Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, val]) => `${cat}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
                .join(' | ');

              return `
      - Entradas totais no período: R$ ${totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Saídas totais no período: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Principais categorias de despesa: ${topCategories || 'não foi possível identificar categorias principais'}
              `;
            })()
          : `
      - Não há lançamentos suficientes no Gerenciador para este período. Adote postura conservadora nas sugestões de pagamento extra e deixe isso claro no texto.
            `
      }

      INDICAÇÃO OBJETIVA PARA O PLANO:
      - Se despesasMensaisMedias existir, então as despesas do usuário JÁ FORAM IDENTIFICADAS.
      - Se sobraMensalReal existir, então a sobra mensal do usuário JÁ FOI CALCULADA.
      - NUNCA diga que é preciso identificar, levantar, descobrir, mapear ou calcular as despesas antes de recomendar o pagamento extra.
      - NUNCA diga que a sobra mensal real ainda precisa ser conhecida quando ela já estiver informada acima.
      - Você DEVE citar explicitamente os valores de despesasMensaisMedias, totalParcelasMensais e sobraMensalReal no diagnóstico e na recomendação prática.
      - O valor sugerido para pagamento extra deve partir da sobraMensalReal, com postura conservadora.

      DADOS COMPLEMENTARES DA SIMULAÇÃO:
      - Total de dívidas: R$ ${dados.simulacao.totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Prazo estimado atual: ${typeof dados.simulacao.prazoEstimadoQuitacaoAtual === 'number'
        ? `${dados.simulacao.prazoEstimadoQuitacaoAtual} meses`
        : 'Não informado'}
      - Prazo estimado otimizado: ${typeof dados.simulacao.prazoEstimadoQuitacaoOtimizado === 'number'
        ? `${dados.simulacao.prazoEstimadoQuitacaoOtimizado} meses`
        : 'Não informado'}
      - Economia estimada de juros: ${typeof dados.simulacao.economiaEstimadaJuros === 'number'
        ? `R$ ${dados.simulacao.economiaEstimadaJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Não informada'}

      REGRAS FINAIS:
      - Cite as dívidas pelo nome exato
      - Não devolva recomendações genéricas
      - Se houver despesasMensaisMedias, totalParcelasMensais e sobraMensalReal na simulação, trate esses números como a base principal do caixa real do usuário
      - Quando existir despesasMensaisMedias, NUNCA diga que não tem o valor exato das despesas
      - Quando existir despesasMensaisMedias, NUNCA assuma cenário típico, valor médio inventado, estimativa genérica ou número hipotético de despesas
      - Quando existir sobraMensalReal, NÃO trate renda mensal menos parcelas como sobra final disponível
      - Renda mensal menos parcelas pode aparecer apenas como referência intermediária, mas a recomendação principal deve ser construída sobre a sobraMensalReal
      - Quando houver diferença entre renda mensal declarada e sobra mensal real, explique isso com clareza, mostrando que as despesas recorrentes reduzem a capacidade real de amortização
      - O valor sugerido para pagamento extra deve sair prioritariamente da sobraMensalReal, com postura conservadora e sem comprometer a reserva mínima do perfil
      - Para cada dívida, compare a taxa mensal com o retorno líquido mensal de renda fixa e conclua explicitamente se vale ou não antecipar
      - Estime os meses para quitação da dívida prioritária: cenário normal (só parcela) vs. cenário com pagamento extra
      - Quando houver financiamento parcelado, inclua a orientação de antecipar as últimas parcelas mensalmente
      - Estruture as ações em três blocos: (1) esta semana, (2) este mês, (3) em 3 meses — cada um com ações específicas aos números do usuário
      - Ao final, assine como: Nexus, analista de cenários financeiros do Finanças Pro Invest
      - Responda em texto natural de consultoria, sem JSON
      `;
      
      const messages = [
        { role: "user" as const, content: userMessage },
      ];
      
      // 5) CHAMADA ÚNICA — Plano consultivo em markdown
      logger.info(`[generateDebtPlan] Chamada única — plano consultivo para userId=${userId}`);

      const llmResponse = await router.routeRequest(messages, systemPromptEtapa1);
      const planoMarkdownBruto =
        typeof llmResponse === "string"
          ? llmResponse
          : (llmResponse as any)?.content || "";

      const planoMarkdown = planoMarkdownBruto
        .replace(/\uFFFD/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      logger.info("[generateDebtPlan] PLANO_MARKDOWN_GERADO", {
        provider: (llmResponse as any)?.provider,
        model: (llmResponse as any)?.model,
        tamanho: planoMarkdown.length,
        preview: planoMarkdown.slice(0, 500),
      });

      if (!planoMarkdown || planoMarkdown.length < 120) {
        throw new HttpsError(
          "internal",
          "O Nexus não conseguiu gerar um plano completo neste momento."
        );
      }

      const now = new Date();
      const dataHoraTitulo = now.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const tituloPlano = `Plano de quitação - ${dataHoraTitulo}`;

      const db = getFirestore();
      await db
        .collection("users")
        .doc(userId)
        .collection("nexusDebtPlans")
        .add({
          title: tituloPlano,
          planMarkdown: planoMarkdown,
          createdAt: now,
          updatedAt: now,
        });

      return {
        success: true,
        format: "markdown",
        planoMarkdown,
        generatedAt: now.toISOString(),
        model: (llmResponse as any)?.model,
        provider: (llmResponse as any)?.provider,
      };
    } catch (error: any) {
      logger.error("[generateDebtPlan] Erro:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "Erro interno ao gerar o plano de quitação."
      );
    }
  }
);

// --- FUNÇÃO PRINCIPAL ---
export const askAiAdvisor = onCall(
  {
    memory: "1GiB",
    timeoutSeconds: 120,
    region: "us-central1"
  },
  async (request) => {
    // 1. LÊ AS CHAVES AQUI DENTRO (No momento exato da execução)
    const geminiApiKey = process.env.GEMINI_API_KEY as string;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY as string;
    const groqApiKey = process.env.GROQ_API_KEY as string;
    const mistralApiKey = process.env.MISTRAL_API_KEY as string;
    const brapiToken = process.env.BRAPI_TOKEN as string;
    // const tavilyApiKey = process.env.TAVILY_API_KEY as string; // (Declare onde for usar)

    // 2. ATUALIZA O SEU ROUTER (Que já gerencia o Singleton dos SDKs!)
    const router = MultiModelRouter.getInstance();
    router.updateApiKeys({
      gemini: geminiApiKey,
      openrouter: openrouterApiKey,
      groq: groqApiKey,
      mistral: mistralApiKey
    });
    try {
      if (!request.auth) throw new HttpsError("unauthenticated", "Login necessário.");
	  const { prompt, userName, history = [], isFirstInteraction, context: frontendContext = {} } = request.data;
	  const { assets = [], passives = [], goals = [] } = frontendContext;
	  console.log("?? assets recebidos:", JSON.stringify(assets));
	  console.log("?? passives recebidos:", JSON.stringify(passives));
	  console.log("?? goals recebidos do frontend:", JSON.stringify(goals));
      const safeUserName = (userName || "Investidor").split(' ')[0];
      const userId = request.auth.uid;

      // DETECÇÃO DE PRIMEIRA MENSAGEM
      let isFirst: boolean;
      if (typeof isFirstInteraction === 'boolean') {
        isFirst = isFirstInteraction;
        logger.info(`[FirstMsg] Flag explícito do Flutter: ${isFirst}`);
      } else {
        const validHistory = Array.isArray(history) ? history.filter((h: any) =>
          h && h.text && h.text.trim() && h.role !== 'system'
        ) : [];
        isFirst = validHistory.length === 0;
        logger.info(`[FirstMsg] Auto-detectado: ${isFirst} (validHistLen=${validHistory.length})`);
      }

      logger.info(`[History] Total: ${history.length}`);
      logger.info(`[${safeUserName}] isFirst=${isFirst}: "${prompt.substring(0, 80)}..."`);

      // 1. SAUDAÇÃO LITERAL
      if (isFirst) {
        const cleanPrompt = prompt.trim().toLowerCase()
          .replace(/[.,!?;:\(\)\[\]]/g, '')
          .replace(/\s+/g, ' ');

        const simpleGreetings = [
          'oi', 'olá', 'ola', 'oie', 'opa', 'eai', 'e ai', 'e aí',
          'bom dia', 'boa tarde', 'boa noite', 'ei', 'hey', 'hi', 'hello',
          'alô', 'alo', 'fala', 'fala aí', 'fala ai', 'beleza'
        ];

        if (simpleGreetings.includes(cleanPrompt)) {
          const greeting = NexusIdentity.getInitialGreeting(safeUserName);
          logger.info("? Saudação simples detectada");
          return {
            success: true,
            answer: greeting,
            context: { intent: 'greeting', model: 'system' }
          };
        }
      }

      // 2. BLOQUEIO CVM
      const investmentRequestPatterns = [
        /recomen[dt]/i,
        /onde (devo |posso )?investir/i,
        /qual (o melhor|a melhor) investimento/i,
        /aplicar.*dinheiro/i,
        /investir.*reais/i,
        /o que fa[çz]o com.*reais/i,
        /sugere.*investimento/i,
        /indica.*investimento/i
      ];

      if (investmentRequestPatterns.some(p => p.test(prompt))) {
        logger.warn(`?? BLOQUEIO CVM`);
        return {
          success: true,
          answer: `${safeUserName}, não posso fazer recomendações específicas de investimento, pois isso exige análise de perfil completo e está regulamentado pela CVM.\n\nO que posso fazer:\n• Explicar conceitos gerais (ex: o que é renda fixa, ações, etc)\n• Mostrar dados de mercado atuais\n• Tirar dúvidas sobre produtos financeiros\n\nPara recomendações personalizadas, você deve consultar um assessor de investimentos registrado na CVM.\n\nPosso explicar algum conceito ou produto específico?`,
          context: { intent: 'investment_request_blocked', model: 'system' }
        };
      }

      // 3. DADOS DO USUÁRIO
      let userData: UserDataResult;
      let historyDescription = 'analiso um recorte recente do seu histórico, definido pelo seu plano'; // padrão
      let serverDebts: any[] = [];
      try {
        // Buscar plano do usuário
        const userPlan = await getUserPlan(userId);
        serverDebts = await getUserDebts(userId);
        logger.info(`?? [DEBUG] userId: ${userId}`);
        logger.info(`?? [DEBUG] Plano retornado: "${userPlan}"`);
        logger.info(`?? [DEBUG] Tipo: ${typeof userPlan}`);
        
        // Gerar descrição do período de histórico
        historyDescription = describeHistoryWindow(userPlan);
        logger.info(`?? [DEBUG] historyDescription: "${historyDescription}"`);
        
        // Passar plano para DataIntegrator
        userData = await DataIntegrator.gatherUserData(userId, userPlan);
      } catch (dataError: any) {
        logger.error("Falha dados usuário:", dataError);
        userData = { goals: [], recentTransactions: [], simulations: [], summary: '', hasData: false, dataStatus: 'error' };
      }
	  // LOGS DETALHADOS PARA DIAGNÓSTICO DAS METAS
		console.log("?? DEBUG - INÍCIO DO PROCESSAMENTO DE METAS");
		console.log("?? userData existe?", !!userData);
		console.log("?? userData.goals é array?", Array.isArray(userData?.goals));
		console.log("?? Quantidade de goals em userData:", userData?.goals?.length || 0);
		if (userData?.goals?.length > 0) {
		  console.log("?? Primeira goal:", JSON.stringify(userData.goals[0]));
		}
		console.log("?? userData.hasData:", userData?.hasData);
	  // Formatar dados patrimoniais recebidos do frontend
      const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0);
      const totalPassives = passives.reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);
      const patrimonioTotalMonitorado = totalAssets + totalPassives;

      const assetsSummary = assets && assets.length > 0
        ? `\n?? ATIVOS PATRIMONIAIS / PRODUTIVOS (${assets.length} itens):\n` +
          assets.map((a: any) => {
            const nome = a.name || a.description || 'Item sem nome';
            const categoria = a.category || 'Outros';
            const valor = Number(a.currentValue || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            return `  • ${nome} (${categoria}): R$ ${valor}`;
          }).join('\n')
        : '\n?? Ativos patrimoniais / produtivos: Nenhum ativo registrado.';

      const passivesSummary = passives && passives.length > 0
        ? `\n?? PASSIVOS PATRIMONIAIS / IMOBILIZADOS (${passives.length} itens):\n` +
          passives.map((p: any) => {
            const nome = p.description || p.name || 'Item sem nome';
            const categoria = p.category || 'Outros';
            const valor = Number(p.currentValue || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            return `  • ${nome} (${categoria}): R$ ${valor}`;
          }).join('\n')
        : '\n?? Passivos patrimoniais / imobilizados: Nenhum passivo registrado.';
      const debtsSummary = serverDebts && serverDebts.length > 0
        ? `\n?? DÍVIDAS CADASTRADAS (${serverDebts.length} itens):\n` +
          serverDebts.map((d: any) => {
            const nome = d.nome || 'Dívida sem nome';
            const tipo = d.tipo || 'Outros';
            const saldo = Number(d.saldoDevedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const taxa = Number(d.taxaMensal || 0).toFixed(2);
            const parcelas = d.parcelasRestantes ?? 'N/A';
            const parcela = d.valorParcela ? `R$ ${Number(d.valorParcela).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês` : 'N/A';
            return `  • ${nome} (${tipo}): Saldo R$ ${saldo} | Taxa ${taxa}%/mês | ${parcelas} parcelas restantes | Parcela: ${parcela}`;
          }).join('\n')
        : '\n?? Dívidas: Nenhuma dívida cadastrada no app.';

      const patrimonioVisaoGerencialStr =
        `?? VISÃO PATRIMONIAL DO APP:\n` +
        `• Total em ativos patrimoniais / produtivos: R$ ${totalAssets.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n` +
        `• Total em passivos patrimoniais / imobilizados: R$ ${totalPassives.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n` +
        `• Patrimônio total monitorado no app: R$ ${patrimonioTotalMonitorado.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n` +
        `?? No Finanças Pro Invest, "passivos" são bens patrimoniais que exigem manutenção/aportes e não devem ser tratados automaticamente como dívidas.`;

	  console.log("?? assets recebidos:", JSON.stringify(assets));
	  console.log("?? passives recebidos:", JSON.stringify(passives));
	  console.log("?? assetsSummary:", assetsSummary);
  	  console.log("?? passivesSummary:", passivesSummary);
	  console.log("?? patrimonioVisaoGerencialStr:", patrimonioVisaoGerencialStr);
	  
      // 4. DADOS DE MERCADO
      const validHistory = Array.isArray(history) ? history.filter((h: any) =>
        h && h.text && h.text.trim()
      ) : [];
      
      let marketData = "";
      const extracted = extractTickersFallback(prompt);
      if (extracted.b3.length > 0 || extracted.crypto.length > 0) {
        marketData = await fetchAllMarketData(extracted.b3, extracted.crypto, brapiToken, prompt, validHistory);
      }
      // 5. DETECÇÃO DE FOLLOW-UP TIMESTAMPS
      if (validHistory.length > 0 && marketData && /quando|horário|horario|data|dia|atualização|atualizacao|cotação|cotacao|qual.*hora|que.*hora|qual.*dia|que.*dia/i.test(prompt) && marketData.includes('cotação de')) {
        logger.info("? Follow-up timestamp");
        return {
          success: true,
          answer: `Os dados que forneci já incluem data e horário:\n\n${marketData}`,
          context: { intent: 'timestamp_clarification', model: 'system' }
        };
      }

      // 6. DETECÇÃO DE CORREÇÃO DO USUÁRIO
      const userCorrectionPatterns = [
        /não é|nao é/i,
        /está errado|esta errado/i,
        /na verdade|na realidade/i,
        /sinto te dizer/i,
        /você está enganado|voce esta enganado/i,
        /isso não está certo|isso nao esta certo/i,
        /correto é|o certo é/i,
        /é na verdade|e na verdade/i
      ];

      const isUserCorrection = userCorrectionPatterns.some(p => p.test(prompt));
      
      if (isUserCorrection && validHistory.length > 0) {
        logger.info("?? Usuário corrigindo informação - forçando busca web");
      }

      // 7. CONTEXTO
      const context = DiscretionEngine.analyzeContext(prompt, validHistory, {
        hasGoals: userData.goals.length > 0,
        hasRecentTransactions: userData.recentTransactions.length > 0,
        hasSimulations: userData.simulations.length > 0
      });

      // 8. FORMATAÇÃO DADOS USUÁRIO
      const promptLower = String(prompt || '').toLowerCase();

      const isCashflowRequest = /(lançamento|lançamentos|transaç|receita|receitas|despesa|despesas|gasto|gastos|entrada|entradas|saída|saídas|saldo|orçamento|fluxo de caixa|movimentação|movimentacoes|movimentações)/i.test(promptLower);
      const isPatrimonyRequest = /(ativo|ativos|passivo|passivos|patrimônio|patrimonio|bens|imóveis|imoveis|veículos|veiculos|terrenos|carteira patrimonial)/i.test(promptLower);
      const isDebtPlanRequest = /(plano|quitar|sair das dívidas|estratégia de quitação|prioridade de dívida)/i.test(promptLower);
     
      let transactionsForPrompt = "Nenhuma transação registrada.";
      if (userData.recentTransactions && userData.recentTransactions.length > 0) {
        transactionsForPrompt = DataIntegrator.formatTransactionsForPrompt(
          userData.recentTransactions,
          {
            ...context,
            requestedFocus: isCashflowRequest ? 'cashflow' : isPatrimonyRequest ? 'patrimony' : 'general'
          }
        );
      }
      console.log("?? transactionsForPrompt:", transactionsForPrompt);

	  // Usar metas vindas do frontend (prioridade) ou fallback para userData
      let goalsForPrompt = "Nenhuma meta definida.";
      if (goals && goals.length > 0) {
        const mappedGoals = goals.map((g: any) => {
          const nome = g.nome || g.name || 'Meta sem nome';
          const valorBruto = g.valor ?? g.targetAmount ?? 0;
          const valorNumerico = typeof valorBruto === 'number' ? valorBruto : parseFloat(valorBruto || '0');
          const frequencia = g.frequencia || g.frequency || 'N/A';

          return `• ${nome}: R$ ${valorNumerico.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} (${frequencia})`;
        }).join('\n');

        goalsForPrompt = `**METAS DO USUÁRIO (${goals.length}):**\n${mappedGoals}`;
        console.log("?? goalsForPrompt GERADO (frontend):", goalsForPrompt);
      } else if (userData.goals && userData.goals.length > 0) {
        goalsForPrompt = DataIntegrator.formatGoalsForPrompt(userData.goals, context);
        console.log("?? goalsForPrompt GERADO (DataIntegrator):", goalsForPrompt);
      } else {
        console.log("?? goalsForPrompt permaneceu como padrão: 'Nenhuma meta definida.'");
      }

      console.log("?? goalsForPrompt:", goalsForPrompt);

      const focusInstructions =
        isCashflowRequest && !isPatrimonyRequest
          ? `\n# FOCO OBRIGATÓRIO DESTA RESPOSTA
O usuário está pedindo análise de lançamentos, receitas, despesas, saldo, orçamento ou fluxo de caixa.
Priorize TRANSAÇÕES e METAS.
NÃO troque esta análise por análise patrimonial.
Só mencione ativos ou passivos se o usuário pedir explicitamente ou se isso for indispensável para esclarecer algo.`
          : isPatrimonyRequest && !isCashflowRequest
          ? `\n# FOCO OBRIGATÓRIO DESTA RESPOSTA
O usuário está pedindo análise patrimonial.
Priorize ATIVOS e PASSIVOS patrimoniais do app.
NÃO trate passivos patrimoniais como dívidas, salvo se o usuário mencionar explicitamente dívida, saldo devedor, financiamento, parcelas, juros ou obrigação em aberto.`
          : '';
      

      // 9. SYSTEM PROMPT
	  console.log("?? Chamando getSystemPrompt com assetsSummary:", assetsSummary);
	  console.log("?? passivesSummary:", passivesSummary);
	  console.log("?? patrimonioVisaoGerencialStr:", patrimonioVisaoGerencialStr);
      const systemPrompt = `${NexusIdentity.getSystemPrompt(
        safeUserName,
        context,
        marketData,
        transactionsForPrompt,
        goalsForPrompt,
        "",
        assetsSummary,
        passivesSummary,
        patrimonioVisaoGerencialStr,
        isFirst,
        userData,
        historyDescription
      )}${debtsSummary}${focusInstructions}
      
      ${isDebtPlanRequest ? `
      # PROTOCOLO OBRIGATÓRIO: PLANO DE QUITAÇÃO
      1. USE A RENDA DECLARADA: O usuário informou que ganha R$ ${userData.financialProfile?.monthlyIncome || 'não informado'}. Use este valor como base de fôlego, ignorando médias históricas.
      2. USE AS PARCELAS: O valor de cada parcela já está no resumo de dívidas acima. NUNCA peça esse dado.
      3. RESERVA DE EMERGÊNCIA: A meta do usuário é de ${userData.financialProfile?.emergencyReserveTarget || 6} meses. Considere o saldo atual de R$ ${userData.financialProfile?.emergencyReserveCurrent || 0}.
      4. FORMATO DE SAÍDA: Use obrigatoriamente blocos visuais (Cards) com ícones para:
         - Diagnóstico (Resumo da situação)
         - Plano de Ação (Passos práticos)
         - Próximos Passos (Ações imediatas)
      5. NÃO FAÇA PERGUNTAS INICIAIS: Se você já tem a renda, as parcelas e a reserva, gere o plano imediatamente.
      ` : ''}`;

      // 10. PREPARAR MENSAGENS
      const messages = [
        ...validHistory.slice(-6).map((h: any) => ({
          role: h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user',
          content: h.text
        })),
        { role: "user", content: prompt }
      ];

      // 11. DETECÇÃO DE REPETIÇÃO (últimas 2 perguntas do usuário)
      let avoidRepetition = "";
      if (validHistory.length >= 2) {
        const lastTwoUserMessages = validHistory
          .filter((h: any) => h.role === 'user')
          .slice(-2);
        
        if (lastTwoUserMessages.length === 2) {
          const areSimilar = lastTwoUserMessages[0].text.toLowerCase().trim() === 
                            lastTwoUserMessages[1].text.toLowerCase().trim();
          if (areSimilar) {
            logger.warn("?? Pergunta repetida detectada");
            avoidRepetition = "\n\n**IMPORTANTE:** O usuário fez a mesma pergunta novamente. NÃO repita a resposta anterior idêntica. Se já respondeu, reconheça isso brevemente e ofereça expandir algum ponto específico.";
          }
        }
      }

      // 12. PRIMEIRA CHAMADA - DETECTAR SE PRECISA BUSCA WEB
      logger.info('[Router] Primeira chamada para análise...');
      
      const enhancedSystemPrompt = `${systemPrompt}${avoidRepetition}

# ?? IMPORTANTE: BUSCA NA WEB

Se você NÃO SOUBER a resposta ou precisar de dados atualizados externos, RESPONDA EXATAMENTE assim:

[BUSCAR_WEB: sua query de busca aqui]

## SEMPRE use [BUSCAR_WEB] para:
- Taxa Selic, IPCA, CDI, inflação (atual/recente)
- Notícias econômicas ou do mercado financeiro
- **Máxima histórica** de qualquer ativo (BTC, ETH, ações, etc)
- **Recorde, all-time high, ATH** de qualquer ativo
- Comparações históricas ("BTC em 2020", "preço do BTC em X data")
- Decisões do Copom, Banco Central
- PIB, desemprego, indicadores econômicos
- Eventos econômicos recentes
- **SEMPRE que o usuário CORRIGIR algum dado seu** (ex: "não é X, é Y")

## NUNCA use [BUSCAR_WEB] para:
- Cotações BTC/ETH/ações B3 (você já tem esses dados)
- Conceitos gerais ("O que é CDB?", "Como funciona ação?")
- Análise dos dados do usuário

Exemplos:
- "Qual a taxa Selic atual?" ? [BUSCAR_WEB: taxa selic atual Brasil]
- "Notícias sobre inflação" ? [BUSCAR_WEB: notícias inflação IPCA Brasil hoje]
- "Máxima histórica do BTC" ? [BUSCAR_WEB: bitcoin máxima histórica all-time high]
- "Quanto o BTC valia em 2020?" ? [BUSCAR_WEB: preço bitcoin 2020]
- Usuário corrige: "A máxima não é 68k, é 126k" ? [BUSCAR_WEB: bitcoin máxima histórica recorde]

${isUserCorrection ? "\n**ATENÇÃO:** O usuário está CORRIGINDO uma informação que você deu. Você DEVE buscar na web para validar e admitir o erro se estiver errado." : ""}
 
      ${isDebtPlanRequest ? `
      # ?? REGRA DE OURO (PROTOCOLO DE QUITAÇÃO) - PRIORIDADE MÁXIMA
      1. RENDA: Use R$ ${userData.financialProfile?.monthlyIncome || 'não informado'} como a renda mensal do usuário. 
      2. PARCELAS: O valor de cada parcela está no sumário de dívidas acima. Use-os para o cálculo de fluxo de caixa.
      3. RESERVA: Meta de ${userData.financialProfile?.emergencyReserveTarget || 6} meses. Saldo atual: R$ ${userData.financialProfile?.emergencyReserveCurrent || 0}.
      4. NÃO PERGUNTE: Se os dados acima existem, NÃO peça renda ou parcelas. Gere o plano agora.
      5. FORMATO: Responda obrigatoriamente usando os Cards Visuais do sistema (Diagnóstico, Plano de Ação, Próximos Passos).
      ` : ''}`;
      const firstResponse = await router.routeRequest(messages, enhancedSystemPrompt, {
        temperature: 0.6,
        maxTokens: 1200,
        fallbackContext: {
          primaryIntent: context.intent,
          userName: safeUserName
        }
      });

      let finalAnswer = firstResponse.content || "Desculpe, estou com instabilidade momentânea.";

      // 13. VERIFICAR SE SOLICITOU BUSCA WEB
      const webSearchMatch = finalAnswer.match(/\[BUSCAR_WEB:\s*(.+?)\]/i);
      
      if (webSearchMatch) {
        const searchQuery = webSearchMatch[1].trim();
        logger.info(`[WebSearch] ?? Nexus solicitou busca: "${searchQuery}"`);
        
        // Executar busca
		const tavilyApiKey = process.env.TAVILY_API_KEY as string;
        const searchResult = await searchWebCascade(searchQuery, tavilyApiKey);
        
        // Segunda chamada com resultado da busca
        logger.info('[Router] Segunda chamada com resultado da busca...');
        const messagesWithSearch = [
          ...messages,
          { 
            role: "assistant" as const, 
            content: `[Realizei uma busca e encontrei: ${searchResult}]` 
          },
          { 
            role: "user" as const, 
            content: `Com base nos resultados da busca, responda a pergunta original: "${prompt}"` 
          }
        ];

        // Incluir instruções especiais se for correção
        let finalSystemPrompt = systemPrompt;
        if (isUserCorrection) {
          finalSystemPrompt += `\n\n**CORREÇÃO DO USUÁRIO:** O usuário corrigiu uma informação sua. Com base nos resultados da busca, reconheça o erro educadamente e forneça a informação correta. Exemplo: "Você está correto, ${safeUserName}. Cometi um erro ao citar dados desatualizados. A informação correta é..."`;
        }

        const secondResponse = await router.routeRequest(messagesWithSearch, finalSystemPrompt, {
          temperature: 0.6,
          maxTokens: 1200,
          fallbackContext: {
            primaryIntent: context.intent,
            userName: safeUserName
          }
        });

        finalAnswer = secondResponse.content || finalAnswer;
        logger.info(`[Router] ? Resposta final com busca de: ${secondResponse.provider}`);
      } else {
        logger.info(`[Router] ? Resposta direta de: ${firstResponse.provider} (${firstResponse.model})`);
      }

      // 14. LIMPEZA
      finalAnswer = finalAnswer
        .replace(/\[BUSCAR_WEB:.*?\]/gi, '')
        .replace(/\[Realizei uma busca.*?\]/gi, '')
        .replace(/<function.*?>.*?<\/function>/g, '')
        .replace(/\[.*?"function".*?\]/g, '')
        .trim();

      return {
        success: true,
        answer: finalAnswer,
        context: {
          model: firstResponse.provider,
          intent: context.intent,
          hasTransactions: userData.recentTransactions.length > 0,
          hasGoals: userData.goals.length > 0
        }
      };

    } catch (error: any) {
      logger.error("Erro Nexus:", error);
      return {
        success: false,
        answer: "Desculpe, ocorreu um erro temporário. Por favor, tente novamente.",
        error: error.message
      };
    }
  }
);
// ============================================
// FUNÇÃO DE TESTE - MISTRAL
// ============================================
export { getAssetQuote } from './getAssetQuote';
export { getMarketData } from './marketData';
export const testMistral = onCall(
  {
    timeoutSeconds: 30,
    region: "us-central1"
  },
  async (request) => {
    logger.info("?? TESTE MISTRAL - Iniciando...");
    
	const mistralApiKey = process.env.MISTRAL_API_KEY as string;
    const apiKey = mistralApiKey;
    
    if (!apiKey) {
      logger.error("? MISTRAL_API_KEY não configurada!");
      return {
        success: false,
        error: "API Key não encontrada",
        details: "Configure MISTRAL_API_KEY no Firebase"
      };
    }
    
    logger.info("? API Key encontrada");
    
    // Requisição de teste simples
    const testMessages = [
      {
        role: "system",
        content: "Você é um assistente útil. Responda em português."
      },
      {
        role: "user",
        content: "Diga apenas: 'Mistral funcionando corretamente!'"
      }
    ];
    
    const requestBody = {
      model: "mistral-small-latest",
      messages: testMessages,
      temperature: 0.7,
      max_tokens: 100
    };
    
    logger.info("?? Enviando requisição para Mistral...");
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      logger.info(`?? Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`? Mistral HTTP ${response.status}: ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}`,
          details: errorText.substring(0, 500)
        };
      }
      
      const data: any = await response.json();  // ? TIPAGEM ADICIONADA
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        logger.error("? Resposta sem conteúdo");
        return {
          success: false,
          error: "Resposta vazia",
          details: JSON.stringify(data)
        };
      }
      
      logger.info("? MISTRAL FUNCIONANDO!");
      logger.info(`Resposta: ${content}`);
      
      return {
        success: true,
        message: "? Mistral funcionando corretamente!",
        response: content,
        model: data.model || "mistral-small-latest",
        tokensUsed: data.usage?.total_tokens || 0,
        details: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens
        }
      };
      // deploy forçado para atualizar env vars
    } catch (error: any) {
      logger.error(`? Erro na requisição: ${error.message}`);
      return {
        success: false,
        error: error.name,
        message: error.message,
        details: "Verifique se a API key é válida e se o modelo existe"
      };
    }
  }
);



