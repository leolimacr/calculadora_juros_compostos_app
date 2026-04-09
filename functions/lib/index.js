"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMistral = exports.getMarketData = exports.getAssetQuote = exports.askAiAdvisor = exports.generateDebtPlan = void 0;
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const jsonrepair_1 = require("jsonrepair");
const identity_1 = require("./nexus-core/identity");
const discretion_engine_1 = require("./nexus-core/discretion-engine");
const data_integrator_1 = require("./nexus-core/data-integrator");
const MultiModelRouter_1 = require("./nexus-core/MultiModelRouter");
const debtPlan_types_1 = require("./src/debtPlan.types");
(0, app_1.initializeApp)();
async function getUserPlan(userId) {
    try {
        const db = (0, firestore_1.getFirestore)();
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            const plan = data?.subscription?.plan;
            if (plan) {
                logger.info(`[Subscription] Plano do usu�rio ${userId}: ${plan}`);
                return plan;
            }
        }
        logger.info(`[Subscription] Usu�rio ${userId} sem plano definido (usando padr�o)`);
        return undefined;
    }
    catch (error) {
        logger.error(`[Subscription] Erro ao buscar plano: ${error.message}`);
        return undefined;
    }
}
async function getUserDebts(userId) {
    try {
        const db = (0, firestore_1.getFirestore)();
        const snapshot = await db.collection('users').doc(userId).collection('dividas').get();
        if (snapshot.empty)
            return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    catch (error) {
        logger.error(`[Debts] Erro ao buscar d�vidas: ${error.message}`);
        return [];
    }
}
function describeHistoryWindow(plan) {
    switch (plan) {
        case 'free': return 'Voc� est� no plano Free, ent�o posso analisar apenas os �ltimos 3 dias do seu hist�rico';
        case 'pro': return 'Voc� est� no plano Pro, ent�o posso analisar os �ltimos 30 dias do seu hist�rico';
        case 'premium': return 'Voc� est� no plano Premium, ent�o posso analisar os �ltimos 90 dias do seu hist�rico';
        case 'premium_anual': return 'Voc� est� no plano Premium Anual, ent�o posso analisar todo o seu hist�rico de lan�amentos (ilimitado)';
        default: return 'analiso um recorte recente do seu hist�rico, definido pelo seu plano';
    }
}
let tavilyUsageCount = 0;
const TAVILY_MONTHLY_LIMIT = 1000;
async function searchWebTavily(query, apiKey) {
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
        const data = await response.json();
        if (data.answer) {
            logger.info('[Tavily] ? Resposta obtida');
            return data.answer;
        }
        if (data.results && data.results.length > 0) {
            const summary = data.results
                .slice(0, 3)
                .map((r) => r.content || r.snippet || '')
                .filter((s) => s.length > 0)
                .join('\n\n');
            if (summary.length > 0) {
                logger.info('[Tavily] ? Resultados concatenados');
                return summary;
            }
        }
        return null;
    }
    catch (error) {
        logger.error('[Tavily] Erro:', error.message);
        return null;
    }
}
async function searchWebScraping(query) {
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
            logger.info(`[Scraping] ? ${matches.length} resultados extra�dos`);
            return matches.join('\n\n');
        }
        logger.warn('[Scraping] Nenhum resultado extra�do');
        return null;
    }
    catch (error) {
        logger.error('[Scraping] Erro:', error.message);
        return null;
    }
}
async function searchWebCascade(query, tavilyKey) {
    logger.info(`[WebSearch] Iniciando cascata para: "${query}"`);
    const tavilyResult = await searchWebTavily(query, tavilyKey);
    if (tavilyResult)
        return tavilyResult;
    logger.info('[WebSearch] Tavily falhou, tentando scraping...');
    const scrapingResult = await searchWebScraping(query);
    if (scrapingResult)
        return scrapingResult;
    logger.warn('[WebSearch] Todas tentativas falharam');
    return "N�o consegui obter informa��es atualizadas no momento. Tente novamente em alguns instantes.";
}
async function fetchSafe(url, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response.ok ? await response.json() : null;
    }
    catch (e) {
        logger.warn(`fetchSafe timeout/falha para ${url}`);
        return null;
    }
}
async function fetchCryptoPrices(cryptos) {
    const results = {};
    if (!cryptos.length)
        return results;
    try {
        const coinIds = cryptos.map(c => {
            const mapping = {
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
            Object.entries(data).forEach(([id, info]) => {
                const symbol = cryptos.find(c => id.includes(c.toLowerCase()))?.toUpperCase() || id.toUpperCase();
                results[symbol] = { price: info.brl, lastUpdated: nowBR };
            });
            logger.info(`CoinGecko BRL: ${Object.keys(results).join(', ')}`);
        }
    }
    catch (error) {
        logger.error("Erro fetchCryptoPrices", error);
    }
    return results;
}
async function fetchCryptoPricesDual(cryptos) {
    const results = {};
    if (!cryptos.length)
        return results;
    try {
        const coinIds = cryptos.map(c => {
            const mapping = {
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
            Object.entries(data).forEach(([id, info]) => {
                const symbol = cryptos.find(c => id.includes(c.toLowerCase()))?.toUpperCase() || id.toUpperCase();
                results[symbol] = { priceUSD: info.usd, priceBRL: info.brl, lastUpdated: nowBR };
            });
            logger.info(`CoinGecko USD+BRL: ${Object.keys(results).join(', ')}`);
        }
    }
    catch (error) {
        logger.error("Erro fetchCryptoPricesDual", error);
    }
    return results;
}
async function fetchAllMarketData(tickers, cryptos, token, prompt, history) {
    const results = [];
    let hasAnyData = false;
    const needsUSDExplicit = /d�lar|dolar|usd|dollar|us\$/i.test(prompt);
    let needsUSDContext = false;
    if (history.length > 0) {
        const lastTwoMsgs = history.slice(-2);
        needsUSDContext = lastTwoMsgs.some((h) => /d�lar|dolar|usd|dollar|US\$/i.test(h.text || ''));
    }
    const needsUSD = needsUSDExplicit || needsUSDContext;
    if (cryptos.length > 0) {
        if (needsUSD) {
            const cpDual = await fetchCryptoPricesDual(cryptos);
            if (Object.keys(cpDual).length > 0) {
                Object.entries(cpDual).forEach(([symbol, data]) => {
                    results.push(`${symbol}: US$ ${data.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / R$ ${data.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (cota��o de ${data.lastUpdated})`);
                });
                hasAnyData = true;
            }
        }
        else {
            const cp = await fetchCryptoPrices(cryptos);
            if (Object.keys(cp).length > 0) {
                Object.entries(cp).forEach(([symbol, data]) => {
                    results.push(`${symbol}: R$ ${data.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (cota��o de ${data.lastUpdated})`);
                });
                hasAnyData = true;
            }
        }
    }
    if (tickers.length > 0) {
        const stocks = Array.from(new Set(['^BVSP', ...tickers.filter(t => t.length >= 4)]));
        try {
            const stockRes = await Promise.allSettled(stocks.map(async (ticker) => {
                try {
                    const url = `https://brapi.dev/api/quote/${ticker.toUpperCase()}?token=${token}`;
                    const d = await fetchSafe(url, 6000);
                    if (d?.results?.[0]?.regularMarketPrice) {
                        const time = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                        const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
                        return `${ticker}: R$ ${d.results[0].regularMarketPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (cota��o de ${date} �s ${time})`;
                    }
                    return null;
                }
                catch (err) {
                    return null;
                }
            }));
            stockRes.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value);
                    hasAnyData = true;
                }
            });
        }
        catch (error) {
            logger.error("Erro busca a��es", error);
        }
    }
    return hasAnyData ? results.join('\n') : "";
}
function extractTickersFallback(prompt) {
    const result = { b3: [], crypto: [] };
    const upperPrompt = prompt.toUpperCase();
    const lowerPrompt = prompt.toLowerCase();
    const b3Regex = /\b([A-Z]{4}\d{1,2})\b/g;
    let match;
    while ((match = b3Regex.exec(upperPrompt)) !== null) {
        result.b3.push(match[1]);
    }
    const companyMap = {
        'ita�': { type: 'b3', ticker: 'ITUB4' },
        'itau': { type: 'b3', ticker: 'ITUB4' },
        'itub': { type: 'b3', ticker: 'ITUB4' },
        'itub4': { type: 'b3', ticker: 'ITUB4' },
        'petrobras': { type: 'b3', ticker: 'PETR4' },
        'vale': { type: 'b3', ticker: 'VALE3' },
        'banco do brasil': { type: 'b3', ticker: 'BBAS3' },
        'bb': { type: 'b3', ticker: 'BBAS3' },
        'ivvb11': { type: 'b3', ticker: 'IVVB11' },
        'wege': { type: 'b3', ticker: 'WEGE3' },
        'wege3': { type: 'b3', ticker: 'WEGE3' },
        'bitcoin': { type: 'crypto', ticker: 'BTC' },
        'btc': { type: 'crypto', ticker: 'BTC' },
        'ethereum': { type: 'crypto', ticker: 'ETH' },
        'eth': { type: 'crypto', ticker: 'ETH' },
        'solana': { type: 'crypto', ticker: 'SOL' },
        'sol': { type: 'crypto', ticker: 'SOL' }
    };
    Object.keys(companyMap).forEach(key => {
        if (lowerPrompt.includes(key)) {
            const item = companyMap[key];
            if (item.type === 'b3')
                result.b3.push(item.ticker);
            if (item.type === 'crypto')
                result.crypto.push(item.ticker);
        }
    });
    result.b3 = [...new Set(result.b3)];
    result.crypto = [...new Set(result.crypto)];
    return result;
}
exports.generateDebtPlan = (0, https_1.onCall)({
    memory: "512MiB",
    timeoutSeconds: 300,
    region: "us-central1",
}, async (request) => {
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
            throw new https_1.HttpsError("unauthenticated", "Login necess�rio.");
        }
        const parseResult = debtPlan_types_1.NexusDebtPlanRequestSchema.safeParse(request.data);
        if (!parseResult.success) {
            logger.error("[generateDebtPlan] Payload inv�lido:", parseResult.error.flatten());
            throw new https_1.HttpsError("invalid-argument", "Dados inv�lidos: " + JSON.stringify(parseResult.error.flatten()));
        }
        const userId = request.auth.uid;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        const groqApiKey = process.env.GROQ_API_KEY;
        const mistralApiKey = process.env.MISTRAL_API_KEY;
        const router = MultiModelRouter_1.MultiModelRouter.getInstance();
        router.updateApiKeys({
            gemini: geminiApiKey,
            openrouter: openrouterApiKey,
            groq: groqApiKey,
            mistral: mistralApiKey,
        });
        const dados = parseResult.data;
        const ctx = dados.perfilContexto;
        const patrimonio = dados.patrimonioContexto;
        const oportunidade = dados.custoOportunidadeContexto;
        const estabilidadeLabel = ctx?.estabilidade === 'estavel' ? 'Est�vel (renda fixa e previs�vel)' :
            ctx?.estabilidade === 'volatil' ? 'Vol�til (renda imprevis�vel, risco alto)' :
                ctx?.estabilidade === 'regular' ? 'Regular (renda com alguma varia��o)' :
                    'N�o informada';
        const reservaStatus = ctx
            ? `R$ ${ctx.reservaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de reserva atual (meta: ${ctx.metaReservaEmMeses} meses de renda)`
            : 'N�o informada';
        const patrimonioStatus = patrimonio
            ? `Total de investimentos financeiros: R$ ${patrimonio.valorTotalInvestimentosFinanceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${patrimonio.valorDisponivelAcimaReserva != null ? ` | Dispon�vel acima da reserva: R$ ${patrimonio.valorDisponivelAcimaReserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${patrimonio.valorPatrimonioLiquido != null ? ` | Patrim�nio l�quido: R$ ${patrimonio.valorPatrimonioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`
            : 'N�o informado';
        const oportunidadeStatus = oportunidade
            ? `Selic: ${oportunidade.selicAno ?? 'n/d'}% a.a. | CDI: ${oportunidade.cdiAno ?? 'n/d'}% a.a. | Retorno l�quido estimado: ${oportunidade.retornoLiquidoEstimadoAno ?? 'n/d'}% a.a. | Estrat�gia sugerida: ${oportunidade.estrategiaSugerida ?? 'n/d'}`
            : 'N�o informado';
        const systemPrompt = `
Voc� � o Nexus, um planejador financeiro especializado em quita��o de d�vidas, falando em portugu�s do Brasil.

Seu objetivo � montar um plano de quita��o de d�vidas realista, humano e emp�tico, usando os dados reais do usu�rio e o resultado da simula��o de quita��o registrada no sistema Finan�as Pro Invest.

Siga estas diretrizes:

1) Diagn�stico das d�vidas
- Liste as d�vidas relevantes, usando exatamente os nomes fornecidos.
- Explique quais s�o mais urgentes, considerando taxa de juros, saldo e contexto.
- Se existirem d�vidas com taxas muito altas, destaque isso claramente.

2) Estrat�gia de quita��o
- Indique qual ordem de prioriza��o das d�vidas faz mais sentido (por exemplo, juros mais altos primeiro, bola de neve, etc.), considerando o perfil do usu�rio.
- Explique em linguagem simples o porqu� dessa ordem.

3) Recomenda��es pr�ticas
- Traga recomenda��es espec�ficas para os pr�ximos 7 dias e 30 dias, focando em a��es simples e concretas.
- Inclua sugest�es de organiza��o, negocia��o, revis�o de or�amento e uso (ou n�o) de cr�dito adicional.

4) Tom da comunica��o
- Sempre mantenha um tom respeitoso, calmo e realista.
- Evite julgamentos; foque em caminhos pr�ticos.
- Quando a situa��o estiver muito pesada, seja emp�tico, mas sem dar garantias irreais.

FORMATO DE RESPOSTA (JSON ESTRITO):

Retorne APENAS um objeto JSON com a seguinte estrutura (exemplo ilustrativo):

{
  "diagnosticoGeral": {
    "resumo": "texto curto sobre a situa��o geral das d�vidas",
    "nivelAlerta": "baixo" | "moderado" | "alto",
    "pontosFortes": ["ponto forte 1", "ponto forte 2"],
    "pontosAtencao": ["ponto de aten��o 1", "ponto de aten��o 2"]
  },
  "estrategiaQuitacao": {
    "metodoPrincipal": "ex: bola_de_neve / avalanche / combinada",
    "justificativaMetodo": "explica��o simples do porqu� dessa escolha",
    "ordemPrioridadeDividas": [
      {
        "nomeDivida": "nome exato da d�vida",
        "prioridade": 1,
        "motivo": "por que essa vem primeiro"
      }
    ]
  },
  "recomendacoes": {
    "proximos7Dias": [
      { "ordem": 1, "descricao": "a��o concreta para os pr�ximos 7 dias", "categoria": "organiza��o_orcamento | negocia��o | comportamento | outro" }
    ],
    "proximos30Dias": [
      { "ordem": 1, "descricao": "a��o concreta para os pr�ximos 30 dias", "categoria": "organiza��o_orcamento | negocia��o | comportamento | outro" }
    ],
    "recomendacaoPrincipal": "a��o concreta e espec�fica"
  },
  "planoHorizonte": {
    "prazoEstimadoQuitacaoMeses": 0,
    "economiaEstimadaJuros": 0
  },
  "passos7Dias": [
    { "ordem": 1, "horizonte": "7_dias", "descricao": "...", "observacoes": "..." }
  ],
  "passos30Dias": [
    { "ordem": 1, "horizonte": "30_dias", "descricao": "...", "observacoes": "..." }
  ],
  "alertasImportantes": ["alerta personalizado 1", "alerta personalizado 2"],
  "tomGeral": "calmo"
}

Regras adicionais de FORMATO (OBRIGAT�RIO):
- A resposta DEVE ser APENAS um �nico objeto JSON v�lido, sem texto antes ou depois.
- N�O inclua coment�rios, explica��es, mensagens de erro, desculpas ou avisos fora do JSON.
- N�O use campos extras fora da estrutura especificada. Se precisar sinalizar alguma limita��o, use um campo "observacoes" ou "alertasImportantes".
- Se algum campo num�rico n�o vier preenchido, use null ou 0, nunca invente n�meros.
- "tomGeral" deve ser: "calmo" para Est�vel, "direto" para Regular, "motivador" para Vol�til.
- Mesmo em caso de d�vida, poucos dados ou instabilidade, SEMPRE devolva um JSON v�lido seguindo o formato acima, com campos coerentes (por exemplo, listas vazias, textos explicativos nos campos de observa��o), e NUNCA uma frase solta fora do JSON.
`;
        const userMessage = `
A seguir est�o os dados reais de um usu�rio do Finan�as Pro Invest.

PERFIL DO USU�RIO:
- Estabilidade de renda: ${estabilidadeLabel}
- Reserva de emerg�ncia: ${reservaStatus}
- Renda mensal declarada: ${dados.simulacao.rendaMensalEstimada
            ? `R$ ${dados.simulacao.rendaMensalEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informada'}

PATRIM�NIO E INVESTIMENTOS:
- Contexto patrimonial: ${patrimonioStatus}

CONTEXTO DE CUSTO DE OPORTUNIDADE:
- Contexto econ�mico e estrat�gico: ${oportunidadeStatus}

D�VIDAS CADASTRADAS (espelhe todas no diagn�stico):
${dados.dividas.map((d, i) => `${i + 1}. ${d.nome} � Saldo: R$ ${d.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Taxa: ${d.taxaJurosMes}% a.m.${d.parcelaMensal ? ` | Parcela: R$ ${d.parcelaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`).join('\n')}

SIMULA��O (para refer�ncia):
${JSON.stringify(dados.simulacao, null, 2)}

Monte o plano de quita��o considerando TODOS esses dados. Cite as d�vidas pelo nome no diagn�stico.
Responda apenas com o JSON no formato combinado, sem qualquer texto fora do JSON.
`;
        const messages = [
            { role: "user", content: userMessage },
        ];
        logger.info(`[generateDebtPlan] Chamando modelo para userId=${userId}`);
        const llmResponse = await router.routeRequest(messages, systemPrompt, {
            temperature: 0.4,
            maxTokens: 6000,
            fallbackContext: {
                primaryIntent: "debt_plan",
                userName: userId,
            },
        });
        const raw = (llmResponse.content || "").trim();
        let jsonText = raw;
        if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
        }
        const extractFirstJsonObject = (text) => {
            const start = text.indexOf("{");
            if (start === -1)
                return null;
            let depth = 0;
            let inString = false;
            let escaped = false;
            for (let i = start; i < text.length; i++) {
                const char = text[i];
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (char === "\\") {
                    escaped = true;
                    continue;
                }
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                if (inString)
                    continue;
                if (char === "{")
                    depth++;
                if (char === "}")
                    depth--;
                if (depth === 0) {
                    return text.slice(start, i + 1);
                }
            }
            return null;
        };
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        }
        catch (e) {
            try {
                const repairedJson = (0, jsonrepair_1.jsonrepair)(jsonText);
                parsed = JSON.parse(repairedJson);
                logger.warn("[generateDebtPlan] JSON reparado com jsonrepair a partir da resposta bruta.", {
                    provider: llmResponse.provider,
                    model: llmResponse.model,
                });
            }
            catch (repairError) {
                const extractedJson = extractFirstJsonObject(jsonText);
                if (!extractedJson) {
                    logger.error("[generateDebtPlan] Falha ao localizar JSON v�lido na resposta do modelo.", {
                        rawPreview: raw.substring(0, 1500),
                        cleanedPreview: jsonText.substring(0, 1500),
                        provider: llmResponse.provider,
                        model: llmResponse.model,
                    });
                    throw new https_1.HttpsError("unavailable", "N�o foi poss�vel gerar o plano neste momento. Tente novamente em instantes.");
                }
                try {
                    const repairedExtractedJson = (0, jsonrepair_1.jsonrepair)(extractedJson);
                    parsed = JSON.parse(repairedExtractedJson);
                    logger.warn("[generateDebtPlan] JSON extra�do e reparado com jsonrepair.", {
                        provider: llmResponse.provider,
                        model: llmResponse.model,
                    });
                }
                catch (secondError) {
                    logger.error("[generateDebtPlan] Falha ao interpretar JSON extra�do da resposta do modelo.", {
                        rawPreview: raw.substring(0, 1500),
                        cleanedPreview: jsonText.substring(0, 1500),
                        extractedPreview: extractedJson.substring(0, 1500),
                        provider: llmResponse.provider,
                        model: llmResponse.model,
                    });
                    throw new https_1.HttpsError("unavailable", "N�o foi poss�vel gerar o plano neste momento. Tente novamente em instantes.");
                }
            }
        }
        const safeParsed = debtPlan_types_1.DebtPlanResponseSchema.safeParse(parsed);
        if (!safeParsed.success) {
            const zodErrors = JSON.stringify(safeParsed.error.flatten());
            logger.error("[generateDebtPlan] Resposta do modelo fora do schema:", zodErrors);
            logger.error("[generateDebtPlan] JSON recebido do modelo:", JSON.stringify(parsed));
            const raw = parsed;
            const planFallback = {
                resumo3Linhas: raw.resumo3Linhas ?? [
                    raw.diagnosticoGeral?.resumo ?? "N�o foi poss�vel gerar um resumo detalhado.",
                ],
                prioridade: raw.prioridade ?? {
                    idDividaPrioritaria: "",
                    nomeDividaPrioritaria: raw.estrategiaQuitacao?.ordemPrioridadeDividas?.[0]?.nomeDivida ??
                        "D�vida priorit�ria n�o identificada",
                    motivo: raw.estrategiaQuitacao?.ordemPrioridadeDividas?.[0]?.motivo ??
                        "N�o foi poss�vel explicar a prioridade.",
                    recomendacaoPrincipal: raw.recomendacoes?.recomendacaoPrincipal ??
                        "Revise suas d�vidas e priorize as com maior taxa de juros.",
                },
                planoHorizonte: raw.planoHorizonte ?? {
                    prazoEstimadoQuitacaoMeses: null,
                    economiaEstimadaJuros: null,
                },
                passos7Dias: raw.passos7Dias ?? raw.recomendacoes?.proximos7Dias ?? [],
                passos30Dias: raw.passos30Dias ?? raw.recomendacoes?.proximos30Dias ?? [],
                alertasImportantes: raw.alertasImportantes ??
                    [
                        ...(raw.diagnosticoGeral?.pontosAtencao ?? []),
                    ],
            };
            logger.warn("[generateDebtPlan] Retornando plano com normaliza��o de campos ausentes (fallback).", {
                provider: llmResponse.provider,
                model: llmResponse.model,
            });
            const plan = planFallback;
            return {
                success: true,
                plan,
                model: llmResponse.model,
                provider: llmResponse.provider,
            };
        }
        const plan = safeParsed.data;
        return {
            success: true,
            plan,
            model: llmResponse.model,
            provider: llmResponse.provider,
        };
    }
    catch (error) {
        logger.error("[generateDebtPlan] Erro:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Erro interno ao gerar o plano de quita��o.");
    }
});
exports.askAiAdvisor = (0, https_1.onCall)({
    memory: "1GiB",
    timeoutSeconds: 120,
    region: "us-central1"
}, async (request) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const brapiToken = process.env.BRAPI_TOKEN;
    const router = MultiModelRouter_1.MultiModelRouter.getInstance();
    router.updateApiKeys({
        gemini: geminiApiKey,
        openrouter: openrouterApiKey,
        groq: groqApiKey,
        mistral: mistralApiKey
    });
    try {
        if (!request.auth)
            throw new https_1.HttpsError("unauthenticated", "Login necess�rio.");
        const { prompt, userName, history = [], isFirstInteraction, context: frontendContext = {} } = request.data;
        const { assets = [], passives = [], goals = [] } = frontendContext;
        console.log("?? assets recebidos:", JSON.stringify(assets));
        console.log("?? passives recebidos:", JSON.stringify(passives));
        console.log("?? goals recebidos do frontend:", JSON.stringify(goals));
        const safeUserName = (userName || "Investidor").split(' ')[0];
        const userId = request.auth.uid;
        let isFirst;
        if (typeof isFirstInteraction === 'boolean') {
            isFirst = isFirstInteraction;
            logger.info(`[FirstMsg] Flag expl�cito do Flutter: ${isFirst}`);
        }
        else {
            const validHistory = Array.isArray(history) ? history.filter((h) => h && h.text && h.text.trim() && h.role !== 'system') : [];
            isFirst = validHistory.length === 0;
            logger.info(`[FirstMsg] Auto-detectado: ${isFirst} (validHistLen=${validHistory.length})`);
        }
        logger.info(`[History] Total: ${history.length}`);
        logger.info(`[${safeUserName}] isFirst=${isFirst}: "${prompt.substring(0, 80)}..."`);
        if (isFirst) {
            const cleanPrompt = prompt.trim().toLowerCase()
                .replace(/[.,!?;:\(\)\[\]]/g, '')
                .replace(/\s+/g, ' ');
            const simpleGreetings = [
                'oi', 'ol�', 'ola', 'oie', 'opa', 'eai', 'e ai', 'e a�',
                'bom dia', 'boa tarde', 'boa noite', 'ei', 'hey', 'hi', 'hello',
                'al�', 'alo', 'fala', 'fala a�', 'fala ai', 'beleza'
            ];
            if (simpleGreetings.includes(cleanPrompt)) {
                const greeting = identity_1.NexusIdentity.getInitialGreeting(safeUserName);
                logger.info("? Sauda��o simples detectada");
                return {
                    success: true,
                    answer: greeting,
                    context: { intent: 'greeting', model: 'system' }
                };
            }
        }
        const investmentRequestPatterns = [
            /recomen[dt]/i,
            /onde (devo |posso )?investir/i,
            /qual (o melhor|a melhor) investimento/i,
            /aplicar.*dinheiro/i,
            /investir.*reais/i,
            /o que fa[�z]o com.*reais/i,
            /sugere.*investimento/i,
            /indica.*investimento/i
        ];
        if (investmentRequestPatterns.some(p => p.test(prompt))) {
            logger.warn(`?? BLOQUEIO CVM`);
            return {
                success: true,
                answer: `${safeUserName}, n�o posso fazer recomenda��es espec�ficas de investimento, pois isso exige an�lise de perfil completo e est� regulamentado pela CVM.\n\nO que posso fazer:\n� Explicar conceitos gerais (ex: o que � renda fixa, a��es, etc)\n� Mostrar dados de mercado atuais\n� Tirar d�vidas sobre produtos financeiros\n\nPara recomenda��es personalizadas, voc� deve consultar um assessor de investimentos registrado na CVM.\n\nPosso explicar algum conceito ou produto espec�fico?`,
                context: { intent: 'investment_request_blocked', model: 'system' }
            };
        }
        let userData;
        let historyDescription = 'analiso um recorte recente do seu hist�rico, definido pelo seu plano';
        let serverDebts = [];
        try {
            const userPlan = await getUserPlan(userId);
            serverDebts = await getUserDebts(userId);
            logger.info(`?? [DEBUG] userId: ${userId}`);
            logger.info(`?? [DEBUG] Plano retornado: "${userPlan}"`);
            logger.info(`?? [DEBUG] Tipo: ${typeof userPlan}`);
            historyDescription = describeHistoryWindow(userPlan);
            logger.info(`?? [DEBUG] historyDescription: "${historyDescription}"`);
            userData = await data_integrator_1.DataIntegrator.gatherUserData(userId, userPlan);
        }
        catch (dataError) {
            logger.error("Falha dados usu�rio:", dataError);
            userData = { goals: [], recentTransactions: [], simulations: [], summary: '', hasData: false, dataStatus: 'error' };
        }
        console.log("?? DEBUG - IN�CIO DO PROCESSAMENTO DE METAS");
        console.log("?? userData existe?", !!userData);
        console.log("?? userData.goals � array?", Array.isArray(userData?.goals));
        console.log("?? Quantidade de goals em userData:", userData?.goals?.length || 0);
        if (userData?.goals?.length > 0) {
            console.log("?? Primeira goal:", JSON.stringify(userData.goals[0]));
        }
        console.log("?? userData.hasData:", userData?.hasData);
        const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
        const totalPassives = passives.reduce((sum, p) => sum + (p.currentValue || 0), 0);
        const patrimonioTotalMonitorado = totalAssets + totalPassives;
        const assetsSummary = assets && assets.length > 0
            ? `\n?? ATIVOS PATRIMONIAIS / PRODUTIVOS (${assets.length} itens):\n` +
                assets.map((a) => {
                    const nome = a.name || a.description || 'Item sem nome';
                    const categoria = a.category || 'Outros';
                    const valor = Number(a.currentValue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    return `  � ${nome} (${categoria}): R$ ${valor}`;
                }).join('\n')
            : '\n?? Ativos patrimoniais / produtivos: Nenhum ativo registrado.';
        const passivesSummary = passives && passives.length > 0
            ? `\n?? PASSIVOS PATRIMONIAIS / IMOBILIZADOS (${passives.length} itens):\n` +
                passives.map((p) => {
                    const nome = p.description || p.name || 'Item sem nome';
                    const categoria = p.category || 'Outros';
                    const valor = Number(p.currentValue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    return `  � ${nome} (${categoria}): R$ ${valor}`;
                }).join('\n')
            : '\n?? Passivos patrimoniais / imobilizados: Nenhum passivo registrado.';
        const debtsSummary = serverDebts && serverDebts.length > 0
            ? `\n?? D�VIDAS CADASTRADAS (${serverDebts.length} itens):\n` +
                serverDebts.map((d) => {
                    const nome = d.nome || 'D�vida sem nome';
                    const tipo = d.tipo || 'Outros';
                    const saldo = Number(d.saldoDevedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const taxa = Number(d.taxaMensal || 0).toFixed(2);
                    const parcelas = d.parcelasRestantes ?? 'N/A';
                    const parcela = d.valorParcela ? `R$ ${Number(d.valorParcela).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m�s` : 'N/A';
                    return `  � ${nome} (${tipo}): Saldo R$ ${saldo} | Taxa ${taxa}%/m�s | ${parcelas} parcelas restantes | Parcela: ${parcela}`;
                }).join('\n')
            : '\n?? D�vidas: Nenhuma d�vida cadastrada no app.';
        const patrimonioVisaoGerencialStr = `?? VIS�O PATRIMONIAL DO APP:\n` +
            `� Total em ativos patrimoniais / produtivos: R$ ${totalAssets.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}\n` +
            `� Total em passivos patrimoniais / imobilizados: R$ ${totalPassives.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}\n` +
            `� Patrim�nio total monitorado no app: R$ ${patrimonioTotalMonitorado.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}\n` +
            `?? No Finan�as Pro Invest, "passivos" s�o bens patrimoniais que exigem manuten��o/aportes e n�o devem ser tratados automaticamente como d�vidas.`;
        console.log("?? assets recebidos:", JSON.stringify(assets));
        console.log("?? passives recebidos:", JSON.stringify(passives));
        console.log("?? assetsSummary:", assetsSummary);
        console.log("?? passivesSummary:", passivesSummary);
        console.log("?? patrimonioVisaoGerencialStr:", patrimonioVisaoGerencialStr);
        const validHistory = Array.isArray(history) ? history.filter((h) => h && h.text && h.text.trim()) : [];
        let marketData = "";
        const extracted = extractTickersFallback(prompt);
        if (extracted.b3.length > 0 || extracted.crypto.length > 0) {
            marketData = await fetchAllMarketData(extracted.b3, extracted.crypto, brapiToken, prompt, validHistory);
        }
        if (validHistory.length > 0 && marketData && /quando|hor�rio|horario|data|dia|atualiza��o|atualizacao|cota��o|cotacao|qual.*hora|que.*hora|qual.*dia|que.*dia/i.test(prompt) && marketData.includes('cota��o de')) {
            logger.info("? Follow-up timestamp");
            return {
                success: true,
                answer: `Os dados que forneci j� incluem data e hor�rio:\n\n${marketData}`,
                context: { intent: 'timestamp_clarification', model: 'system' }
            };
        }
        const userCorrectionPatterns = [
            /n�o �|nao �/i,
            /est� errado|esta errado/i,
            /na verdade|na realidade/i,
            /sinto te dizer/i,
            /voc� est� enganado|voce esta enganado/i,
            /isso n�o est� certo|isso nao esta certo/i,
            /correto �|o certo �/i,
            /� na verdade|e na verdade/i
        ];
        const isUserCorrection = userCorrectionPatterns.some(p => p.test(prompt));
        if (isUserCorrection && validHistory.length > 0) {
            logger.info("?? Usu�rio corrigindo informa��o - for�ando busca web");
        }
        const context = discretion_engine_1.DiscretionEngine.analyzeContext(prompt, validHistory, {
            hasGoals: userData.goals.length > 0,
            hasRecentTransactions: userData.recentTransactions.length > 0,
            hasSimulations: userData.simulations.length > 0
        });
        const promptLower = String(prompt || '').toLowerCase();
        const isCashflowRequest = /(lan�amento|lan�amentos|transa�|receita|receitas|despesa|despesas|gasto|gastos|entrada|entradas|sa�da|sa�das|saldo|or�amento|fluxo de caixa|movimenta��o|movimentacoes|movimenta��es)/i.test(promptLower);
        const isPatrimonyRequest = /(ativo|ativos|passivo|passivos|patrim�nio|patrimonio|bens|im�veis|imoveis|ve�culos|veiculos|terrenos|carteira patrimonial)/i.test(promptLower);
        const isDebtPlanRequest = /(plano|quitar|sair das d�vidas|estrat�gia de quita��o|prioridade de d�vida)/i.test(promptLower);
        let transactionsForPrompt = "Nenhuma transa��o registrada.";
        if (userData.recentTransactions && userData.recentTransactions.length > 0) {
            transactionsForPrompt = data_integrator_1.DataIntegrator.formatTransactionsForPrompt(userData.recentTransactions, {
                ...context,
                requestedFocus: isCashflowRequest ? 'cashflow' : isPatrimonyRequest ? 'patrimony' : 'general'
            });
        }
        console.log("?? transactionsForPrompt:", transactionsForPrompt);
        let goalsForPrompt = "Nenhuma meta definida.";
        if (goals && goals.length > 0) {
            const mappedGoals = goals.map((g) => {
                const nome = g.nome || g.name || 'Meta sem nome';
                const valorBruto = g.valor ?? g.targetAmount ?? 0;
                const valorNumerico = typeof valorBruto === 'number' ? valorBruto : parseFloat(valorBruto || '0');
                const frequencia = g.frequencia || g.frequency || 'N/A';
                return `� ${nome}: R$ ${valorNumerico.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })} (${frequencia})`;
            }).join('\n');
            goalsForPrompt = `**METAS DO USU�RIO (${goals.length}):**\n${mappedGoals}`;
            console.log("?? goalsForPrompt GERADO (frontend):", goalsForPrompt);
        }
        else if (userData.goals && userData.goals.length > 0) {
            goalsForPrompt = data_integrator_1.DataIntegrator.formatGoalsForPrompt(userData.goals, context);
            console.log("?? goalsForPrompt GERADO (DataIntegrator):", goalsForPrompt);
        }
        else {
            console.log("?? goalsForPrompt permaneceu como padr�o: 'Nenhuma meta definida.'");
        }
        console.log("?? goalsForPrompt:", goalsForPrompt);
        const focusInstructions = isCashflowRequest && !isPatrimonyRequest
            ? `\n# FOCO OBRIGAT�RIO DESTA RESPOSTA
O usu�rio est� pedindo an�lise de lan�amentos, receitas, despesas, saldo, or�amento ou fluxo de caixa.
Priorize TRANSA��ES e METAS.
N�O troque esta an�lise por an�lise patrimonial.
S� mencione ativos ou passivos se o usu�rio pedir explicitamente ou se isso for indispens�vel para esclarecer algo.`
            : isPatrimonyRequest && !isCashflowRequest
                ? `\n# FOCO OBRIGAT�RIO DESTA RESPOSTA
O usu�rio est� pedindo an�lise patrimonial.
Priorize ATIVOS e PASSIVOS patrimoniais do app.
N�O trate passivos patrimoniais como d�vidas, salvo se o usu�rio mencionar explicitamente d�vida, saldo devedor, financiamento, parcelas, juros ou obriga��o em aberto.`
                : '';
        console.log("?? Chamando getSystemPrompt com assetsSummary:", assetsSummary);
        console.log("?? passivesSummary:", passivesSummary);
        console.log("?? patrimonioVisaoGerencialStr:", patrimonioVisaoGerencialStr);
        const systemPrompt = `${identity_1.NexusIdentity.getSystemPrompt(safeUserName, context, marketData, transactionsForPrompt, goalsForPrompt, "", assetsSummary, passivesSummary, patrimonioVisaoGerencialStr, isFirst, userData, historyDescription)}${debtsSummary}${focusInstructions}
      
      ${isDebtPlanRequest ? `
      # PROTOCOLO OBRIGAT�RIO: PLANO DE QUITA��O
      1. USE A RENDA DECLARADA: O usu�rio informou que ganha R$ ${userData.financialProfile?.monthlyIncome || 'n�o informado'}. Use este valor como base de f�lego, ignorando m�dias hist�ricas.
      2. USE AS PARCELAS: O valor de cada parcela j� est� no resumo de d�vidas acima. NUNCA pe�a esse dado.
      3. RESERVA DE EMERG�NCIA: A meta do usu�rio � de ${userData.financialProfile?.emergencyReserveTarget || 6} meses. Considere o saldo atual de R$ ${userData.financialProfile?.emergencyReserveCurrent || 0}.
      4. FORMATO DE SA�DA: Use obrigatoriamente blocos visuais (Cards) com �cones para:
         - Diagn�stico (Resumo da situa��o)
         - Plano de A��o (Passos pr�ticos)
         - Pr�ximos Passos (A��es imediatas)
      5. N�O FA�A PERGUNTAS INICIAIS: Se voc� j� tem a renda, as parcelas e a reserva, gere o plano imediatamente.
      ` : ''}`;
        const messages = [
            ...validHistory.slice(-6).map((h) => ({
                role: h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user',
                content: h.text
            })),
            { role: "user", content: prompt }
        ];
        let avoidRepetition = "";
        if (validHistory.length >= 2) {
            const lastTwoUserMessages = validHistory
                .filter((h) => h.role === 'user')
                .slice(-2);
            if (lastTwoUserMessages.length === 2) {
                const areSimilar = lastTwoUserMessages[0].text.toLowerCase().trim() ===
                    lastTwoUserMessages[1].text.toLowerCase().trim();
                if (areSimilar) {
                    logger.warn("?? Pergunta repetida detectada");
                    avoidRepetition = "\n\n**IMPORTANTE:** O usu�rio fez a mesma pergunta novamente. N�O repita a resposta anterior id�ntica. Se j� respondeu, reconhe�a isso brevemente e ofere�a expandir algum ponto espec�fico.";
                }
            }
        }
        logger.info('[Router] Primeira chamada para an�lise...');
        const enhancedSystemPrompt = `${systemPrompt}${avoidRepetition}

# ?? IMPORTANTE: BUSCA NA WEB

Se voc� N�O SOUBER a resposta ou precisar de dados atualizados externos, RESPONDA EXATAMENTE assim:

[BUSCAR_WEB: sua query de busca aqui]

## SEMPRE use [BUSCAR_WEB] para:
- Taxa Selic, IPCA, CDI, infla��o (atual/recente)
- Not�cias econ�micas ou do mercado financeiro
- **M�xima hist�rica** de qualquer ativo (BTC, ETH, a��es, etc)
- **Recorde, all-time high, ATH** de qualquer ativo
- Compara��es hist�ricas ("BTC em 2020", "pre�o do BTC em X data")
- Decis�es do Copom, Banco Central
- PIB, desemprego, indicadores econ�micos
- Eventos econ�micos recentes
- **SEMPRE que o usu�rio CORRIGIR algum dado seu** (ex: "n�o � X, � Y")

## NUNCA use [BUSCAR_WEB] para:
- Cota��es BTC/ETH/a��es B3 (voc� j� tem esses dados)
- Conceitos gerais ("O que � CDB?", "Como funciona a��o?")
- An�lise dos dados do usu�rio

Exemplos:
- "Qual a taxa Selic atual?" ? [BUSCAR_WEB: taxa selic atual Brasil]
- "Not�cias sobre infla��o" ? [BUSCAR_WEB: not�cias infla��o IPCA Brasil hoje]
- "M�xima hist�rica do BTC" ? [BUSCAR_WEB: bitcoin m�xima hist�rica all-time high]
- "Quanto o BTC valia em 2020?" ? [BUSCAR_WEB: pre�o bitcoin 2020]
- Usu�rio corrige: "A m�xima n�o � 68k, � 126k" ? [BUSCAR_WEB: bitcoin m�xima hist�rica recorde]

${isUserCorrection ? "\n**ATEN��O:** O usu�rio est� CORRIGINDO uma informa��o que voc� deu. Voc� DEVE buscar na web para validar e admitir o erro se estiver errado." : ""}
 
      ${isDebtPlanRequest ? `
      # ?? REGRA DE OURO (PROTOCOLO DE QUITA��O) - PRIORIDADE M�XIMA
      1. RENDA: Use R$ ${userData.financialProfile?.monthlyIncome || 'n�o informado'} como a renda mensal do usu�rio. 
      2. PARCELAS: O valor de cada parcela est� no sum�rio de d�vidas acima. Use-os para o c�lculo de fluxo de caixa.
      3. RESERVA: Meta de ${userData.financialProfile?.emergencyReserveTarget || 6} meses. Saldo atual: R$ ${userData.financialProfile?.emergencyReserveCurrent || 0}.
      4. N�O PERGUNTE: Se os dados acima existem, N�O pe�a renda ou parcelas. Gere o plano agora.
      5. FORMATO: Responda obrigatoriamente usando os Cards Visuais do sistema (Diagn�stico, Plano de A��o, Pr�ximos Passos).
      ` : ''}`;
        const firstResponse = await router.routeRequest(messages, enhancedSystemPrompt, {
            temperature: 0.6,
            maxTokens: 1200,
            fallbackContext: {
                primaryIntent: context.intent,
                userName: safeUserName
            }
        });
        let finalAnswer = firstResponse.content || "Desculpe, estou com instabilidade moment�nea.";
        const webSearchMatch = finalAnswer.match(/\[BUSCAR_WEB:\s*(.+?)\]/i);
        if (webSearchMatch) {
            const searchQuery = webSearchMatch[1].trim();
            logger.info(`[WebSearch] ?? Nexus solicitou busca: "${searchQuery}"`);
            const tavilyApiKey = process.env.TAVILY_API_KEY;
            const searchResult = await searchWebCascade(searchQuery, tavilyApiKey);
            logger.info('[Router] Segunda chamada com resultado da busca...');
            const messagesWithSearch = [
                ...messages,
                {
                    role: "assistant",
                    content: `[Realizei uma busca e encontrei: ${searchResult}]`
                },
                {
                    role: "user",
                    content: `Com base nos resultados da busca, responda a pergunta original: "${prompt}"`
                }
            ];
            let finalSystemPrompt = systemPrompt;
            if (isUserCorrection) {
                finalSystemPrompt += `\n\n**CORRE��O DO USU�RIO:** O usu�rio corrigiu uma informa��o sua. Com base nos resultados da busca, reconhe�a o erro educadamente e forne�a a informa��o correta. Exemplo: "Voc� est� correto, ${safeUserName}. Cometi um erro ao citar dados desatualizados. A informa��o correta �..."`;
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
        }
        else {
            logger.info(`[Router] ? Resposta direta de: ${firstResponse.provider} (${firstResponse.model})`);
        }
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
    }
    catch (error) {
        logger.error("Erro Nexus:", error);
        return {
            success: false,
            answer: "Desculpe, ocorreu um erro tempor�rio. Por favor, tente novamente.",
            error: error.message
        };
    }
});
var getAssetQuote_1 = require("./getAssetQuote");
Object.defineProperty(exports, "getAssetQuote", { enumerable: true, get: function () { return getAssetQuote_1.getAssetQuote; } });
var marketData_1 = require("./marketData");
Object.defineProperty(exports, "getMarketData", { enumerable: true, get: function () { return marketData_1.getMarketData; } });
exports.testMistral = (0, https_1.onCall)({
    timeoutSeconds: 30,
    region: "us-central1"
}, async (request) => {
    logger.info("?? TESTE MISTRAL - Iniciando...");
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const apiKey = mistralApiKey;
    if (!apiKey) {
        logger.error("? MISTRAL_API_KEY n�o configurada!");
        return {
            success: false,
            error: "API Key n�o encontrada",
            details: "Configure MISTRAL_API_KEY no Firebase"
        };
    }
    logger.info("? API Key encontrada");
    const testMessages = [
        {
            role: "system",
            content: "Voc� � um assistente �til. Responda em portugu�s."
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
    logger.info("?? Enviando requisi��o para Mistral...");
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
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            logger.error("? Resposta sem conte�do");
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
    }
    catch (error) {
        logger.error(`? Erro na requisi��o: ${error.message}`);
        return {
            success: false,
            error: error.name,
            message: error.message,
            details: "Verifique se a API key � v�lida e se o modelo existe"
        };
    }
});
//# sourceMappingURL=index.js.map