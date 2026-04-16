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
        const nomeUsuario = (request.auth.token?.name || request.auth.token?.email || "Investidor").split(' ')[0];
        let userData = {
            goals: [],
            recentTransactions: [],
            simulations: [],
            summary: '',
            hasData: false,
            dataStatus: 'empty',
        };
        try {
            const userPlan = '6m';
            userData = await data_integrator_1.DataIntegrator.gatherUserData(userId, userPlan);
            logger.info(`[generateDebtPlan] DataIntegrator retornou ${userData.recentTransactions.length} transa��es recentes para plano de d�vidas.`);
        }
        catch (dataError) {
            logger.error("[generateDebtPlan] Falha ao buscar dados do usu�rio via DataIntegrator:", dataError);
        }
        const userDataSintetico = {
            hasData: userData.hasData,
            summary: userData.summary || "",
        };
        const systemPromptEtapa1 = `${identity_1.NexusIdentity.getSystemPrompt(nomeUsuario, {}, "", "", "", "", dados.patrimonioContexto ? JSON.stringify(dados.patrimonioContexto) : "", "", "", true, userDataSintetico, "")}

# MISS�O ESPECIAL: PLANO DE QUITA��O DE D�VIDAS

Voc� est� sendo acionado para montar um plano de quita��o de d�vidas personalizado para ${nomeUsuario}.
Responda exclusivamente em portugu�s do Brasil. Nenhuma palavra em ingl�s.
Escreva como um consultor financeiro humano escreveria para um cliente real.
Use linguagem natural, clara, pr�tica e consultiva.
N�o retorne JSON.

N�o use nomes de campos, marcadores t�cnicos nem estrutura de banco.
## FORMATA��O DE SA�DA � OBRIGAT�RIA

A resposta ser� exibida na tela e impressa em PDF pelo navegador.

Por isso:
- N�O use markdown
- N�O use tabelas com barras verticais (pipe)
- N�O use negrito, #, ##, ###, bullets com asterisco (*) ou qualquer sintaxe markdown
- N�O use blocos visuais dependentes de renderiza��o markdown
- Escreva em texto limpo, com frases curtas e subt�tulos simples

Formato desejado:
T�TULO EM TEXTO NORMAL
Linha em branco
Subt�tulo simples
Texto corrido
Linha em branco
Outro subt�tulo
Texto corrido

Se quiser listar itens, use h�fen normal ou numera��o simples, mas sem qualquer sintaxe especial de markdown.

## CALIBRA��O EMOCIONAL � OBRIGAT�RIO

O plano come�a com um par�grafo humano � antes de qualquer listagem de d�vidas.

Regras:
- Identifique ao menos um ponto financeiro positivo REAL do usu�rio nos dados (reserva, patrim�nio, renda est�vel, d�vidas abaixo da renda). Cite o n�mero.
- Se a situa��o for pesada (d�vidas altas, pouca reserva), o tom � de acolhimento e encorajamento baseado nos pontos fortes reais.
- Se a situa��o for confort�vel, o tom � de oportunidade.
- Nunca abra com n�meros negativos ou lista de d�vidas.
- Este par�grafo deve soar como a primeira frase de um consultor humano numa reuni�o presencial � n�o como introdu��o de relat�rio.
- M�ximo de 4 linhas. Depois disso, v� direto para a an�lise.

## USO OBRIGAT�RIO DO GERENCIADOR FINANCEIRO

Voc� tem acesso n�o s� �s d�vidas e ao patrim�nio, mas tamb�m ao GERENCIADOR FINANCEIRO do Finan�as Pro Invest.

Isso significa que, al�m da renda declarada, voc� enxerga:

- entradas do per�odo (sal�rios, extras, etc.)
- sa�das por categoria (moradia, alimenta��o, transporte, d�zimo, etc.)
- saldo dispon�vel e padr�o de gastos recente

REGRAS OBRIGAT�RIAS:

1. SEMPRE considere o fluxo de caixa real recente antes de sugerir antecipa��o de d�vidas.
2. Se o padr�o de despesas estiver alto e o saldo final estiver apertado, seja mais conservador na sugest�o de quanto da sobra mensal pode ir para antecipa��o.
3. Se o usu�rio mantiver saldo positivo consistente e despesas est�veis, voc� pode sugerir um valor de antecipa��o um pouco mais agressivo, deixando claro que � baseado no comportamento real observado.
4. Use exemplos concretos na an�lise:
   - �Nos �ltimos meses, suas entradas ficaram em torno de R$ X e as sa�das em torno de R$ Y, deixando uma sobra m�dia de aproximadamente R$ Z.�
5. Nunca assuma uma sobra te�rica m�xima (renda - parcelas) sem confrontar com o comportamento de gastos observado no Gerenciador Financeiro.
6. Se houver poucos lan�amentos ou dados insuficientes, deixe isso claro no texto e adote uma postura mais conservadora na antecipa��o, SEM pedir para o usu�rio �montar o plano por conta pr�pria�.

PROIBIDO � estas frases nunca devem aparecer no texto:
- "Agrade�o a oportunidade"
- "Espero que essas recomenda��es sejam �teis"
- "n�o hesite em entrar em contato"
- "Se tiver alguma d�vida"
- "Lembre-se de que � fundamental"
- "nos pr�ximos 7 dias"
- "nos pr�ximos 30 dias"
- "nos pr�ximos 90 dias"
- qualquer frase de encerramento gen�rica de e-mail corporativo
- "cada situa��o � �nica"
- "consultar um assessor"
- "assessor de investimentos certificado"
- "registrado na CVM"
- "recomend�vel consultar"
- "an�lise detalhada da situa��o financeira do usu�rio"
- qualquer frase que delegue ao usu�rio o que o Nexus deve fazer
- qualquer par�grafo final de resumo que repita o que j� foi dito no plano
- "sua renda est�vel e a reserva adequada permitem"
- "abordagem agressiva, mas equilibrada"

FORMATO OBRIGAT�RIO � siga este exemplo de estrutura e tom (adapte os n�meros ao usu�rio real):

[Nome], sua renda mensal � de R$ X. Suas parcelas somam R$ Y, o que deixa R$ Z dispon�veis por m�s. Sua reserva de R$ W cobre [N] meses de despesas � isso � [adequado / insuficiente / confort�vel]. Seu patrim�nio l�quido � de R$ P.

Cada d�vida analisada:

[Nome da d�vida 1] � saldo R$ X | taxa 2,03% a.m.
O retorno l�quido de renda fixa hoje � 1,04% a.m. (Selic 14,75% com IR). Como 2,03% > 1,04%, vale quitar agressivamente � cada real nessa d�vida rende mais do que investido. Com R$ Z de sobra, voc� pode liquidar essa d�vida em [N] meses pagando R$ X a mais por m�s. Se puder antecipar as �ltimas parcelas agora, elas custam muito menos do que a parcela atual � elimine de tr�s pra frente.

[Nome da d�vida 2] � saldo R$ X | taxa 0,69% a.m.
O retorno l�quido de renda fixa (1,04% a.m.) � maior do que o custo dessa d�vida. N�o vale antecipar � seu dinheiro rende mais investido do que quitando esse financiamento. Mantenha as parcelas normais.

O que fazer agora � esta semana:
[a��o concreta e espec�fica, com valor e d�vida nomeados]

O que mudar � este m�s:
[decis�o financeira espec�fica ao cen�rio deste usu�rio]

Revis�o em 3 meses:
[o que verificar nos n�meros reais deste usu�rio em 3 meses]

� Nexus, analista de cen�rios financeiros do Finan�as Pro Invest

IMPORTANTE: o exemplo acima � apenas de estrutura e tom � use os dados reais do usu�rio, n�o os n�meros do exemplo.

O texto deve cobrir obrigatoriamente:
- Leitura da situa��o atual: renda, sobra mensal (renda - soma das parcelas), reserva e patrim�nio
- D�vida priorit�ria e motivo objetivo
- Decis�o para cada d�vida: quitar agressivamente, amortizar, manter parcelas, renegociar ou n�o antecipar
- Para cada d�vida: comparar explicitamente a taxa mensal da d�vida com o retorno l�quido mensal de renda fixa e concluir se vale ou n�o antecipar
- Valores concretos: quanto sobra por m�s, quanto destinar de extra, e OBRIGATORIAMENTE dois cen�rios de quita��o para cada d�vida cuja taxa supere o retorno l�quido de renda fixa: (1) pagando s� a parcela atual � quantos meses restam; (2) pagando a parcela + o valor extra calculado sobre a sobraMensalReal � quantos meses restam e quanto economiza em juros.
- A��es desta semana (imediatas)
- Mudan�a de comportamento este m�s
- Revis�o estrat�gica em 3 meses
- Alertas importantes e cuidados

Regras:
- Nunca entregue um plano gen�rico
- Use exatamente os nomes das d�vidas fornecidas
- N�o confunda patrim�nio passivo com d�vidas
- Se houver reserva adequada, n�o recomende aumentar reserva sem necessidade
- Se houver vantagem em preservar liquidez ou manter investimentos, diga isso claramente
- Se a taxa da d�vida for menor que o retorno l�quido de renda fixa, conclua explicitamente que n�o vale antecipar
- Se a taxa da d�vida for maior que o retorno l�quido de renda fixa, conclua explicitamente que vale quitar agressivamente
- Quando houver financiamento parcelado, oriente a antecipar as �ltimas parcelas todo m�s � elas custam muito menos que a parcela atual e eliminam juro futuro
- Voc� � o plano � nunca devolva ao usu�rio a tarefa de elaborar um plano
- Seja direto, humano e �til
`;
        const userMessage = `
      A seguir est�o os dados reais de um usu�rio do Finan�as Pro Invest.

      INSTRU��ES DE AN�LISE:
      - Considere renda, reserva, estabilidade, patrim�nio, custo de oportunidade e todas as d�vidas ao mesmo tempo.
      - N�o trate automaticamente financiamento barato ou d�vida garantida como prioridade de quita��o antecipada.
      - Se houver contexto econ�mico favor�vel � liquidez ou ao investimento conservador, explique isso de forma expl�cita.
      - N�o devolva JSON nesta etapa. Responda como texto de consultoria.
      - Em patrimonioPassivo, n�o trate bens patrimoniais como d�vidas. D�vidas s�o apenas financiamentos, empr�stimos e saldos devedores.
      - Se patrim�nio ativo, reserva ou renda n�o forem suficientes para uma quita��o acelerada sem perda de seguran�a, deixe isso claro.
      - Se fizer mais sentido manter parcelas de alguma d�vida, diga isso explicitamente.

      PERFIL DO USU�RIO:
      - Nome: ${nomeUsuario}
      - Estabilidade de renda: ${estabilidadeLabel}
      - Reserva de emerg�ncia: ${reservaStatus}
      - Renda mensal declarada: ${dados.simulacao.rendaMensalEstimada
            ? `R$ ${dados.simulacao.rendaMensalEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informada'}

      PATRIM�NIO E INVESTIMENTOS:
      - Contexto patrimonial: ${patrimonioStatus}

      CONTEXTO DE CUSTO DE OPORTUNIDADE:
      - Contexto econ�mico e estrat�gico: ${oportunidadeStatus}

      D�VIDAS CADASTRADAS:
      ${dados.dividas.map((d, i) => `${i + 1}. ${d.nome} � Saldo: R$ ${d.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Taxa: ${d.taxaJurosMes}% a.m.${d.parcelaMensal ? ` | Parcela: R$ ${d.parcelaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${d.ehGarantida ? ' | D�vida garantida: sim' : ''}${d.atrasoEmDias ? ` | Atraso: ${d.atrasoEmDias} dias` : ''}${d.observacoes ? ` | Observa��es: ${d.observacoes}` : ''}`).join('\n')}

      CAIXA REAL DO USU�RIO � USE ESTES N�MEROS COMO BASE PRINCIPAL:
      - Renda mensal declarada: ${typeof dados.simulacao.rendaMensalEstimada === 'number'
            ? `R$ ${dados.simulacao.rendaMensalEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informada'}
      - Despesas mensais m�dias j� apuradas no Gerenciador: ${typeof dados.simulacao.despesasMensaisMedias === 'number'
            ? `R$ ${dados.simulacao.despesasMensaisMedias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informado'}
      - Parcelas mensais atuais das d�vidas: ${typeof dados.simulacao.totalParcelasMensais === 'number'
            ? `R$ ${dados.simulacao.totalParcelasMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informado'}
      - Sobra mensal real j� calculada: ${typeof dados.simulacao.sobraMensalReal === 'number'
            ? `R$ ${dados.simulacao.sobraMensalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informada'}
      - Janela usada para apurar despesas: ${typeof dados.simulacao.janelaAnaliseDias === 'number'
            ? `${dados.simulacao.janelaAnaliseDias} dias`
            : 'N�o informada'}

      RESUMO REAL DE LAN�AMENTOS DO GERENCIADOR (�ltimos 6 meses aproximados):
      ${userData && userData.recentTransactions && userData.recentTransactions.length > 0
            ? (() => {
                const incomes = userData.recentTransactions.filter(t => t.type === 'income');
                const expenses = userData.recentTransactions.filter(t => t.type === 'expense');
                const totalIncomes = incomes.reduce((acc, t) => acc + (t.amount || 0), 0);
                const totalExpenses = expenses.reduce((acc, t) => acc + (t.amount || 0), 0);
                const byCategory = {};
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
      - Entradas totais no per�odo: R$ ${totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Sa�das totais no per�odo: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Principais categorias de despesa: ${topCategories || 'n�o foi poss�vel identificar categorias principais'}
              `;
            })()
            : `
      - N�o h� lan�amentos suficientes no Gerenciador para este per�odo. Adote postura conservadora nas sugest�es de pagamento extra e deixe isso claro no texto.
            `}

      INDICA��O OBJETIVA PARA O PLANO:
      - Se despesasMensaisMedias existir, ent�o as despesas do usu�rio J� FORAM IDENTIFICADAS.
      - Se sobraMensalReal existir, ent�o a sobra mensal do usu�rio J� FOI CALCULADA.
      - NUNCA diga que � preciso identificar, levantar, descobrir, mapear ou calcular as despesas antes de recomendar o pagamento extra.
      - NUNCA diga que a sobra mensal real ainda precisa ser conhecida quando ela j� estiver informada acima.
      - Voc� DEVE citar explicitamente os valores de despesasMensaisMedias, totalParcelasMensais e sobraMensalReal no diagn�stico e na recomenda��o pr�tica.
      - O valor sugerido para pagamento extra deve partir da sobraMensalReal, com postura conservadora.

      DADOS COMPLEMENTARES DA SIMULA��O:
      - Total de d�vidas: R$ ${dados.simulacao.totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Prazo estimado atual: ${typeof dados.simulacao.prazoEstimadoQuitacaoAtual === 'number'
            ? `${dados.simulacao.prazoEstimadoQuitacaoAtual} meses`
            : 'N�o informado'}
      - Prazo estimado otimizado: ${typeof dados.simulacao.prazoEstimadoQuitacaoOtimizado === 'number'
            ? `${dados.simulacao.prazoEstimadoQuitacaoOtimizado} meses`
            : 'N�o informado'}
      - Economia estimada de juros: ${typeof dados.simulacao.economiaEstimadaJuros === 'number'
            ? `R$ ${dados.simulacao.economiaEstimadaJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'N�o informada'}

      REGRAS FINAIS:
      - Cite as d�vidas pelo nome exato
      - N�o devolva recomenda��es gen�ricas
      - Se houver despesasMensaisMedias, totalParcelasMensais e sobraMensalReal na simula��o, trate esses n�meros como a base principal do caixa real do usu�rio
      - Quando existir despesasMensaisMedias, NUNCA diga que n�o tem o valor exato das despesas
      - Quando existir despesasMensaisMedias, NUNCA assuma cen�rio t�pico, valor m�dio inventado, estimativa gen�rica ou n�mero hipot�tico de despesas
      - Quando existir sobraMensalReal, N�O trate renda mensal menos parcelas como sobra final dispon�vel
      - Renda mensal menos parcelas pode aparecer apenas como refer�ncia intermedi�ria, mas a recomenda��o principal deve ser constru�da sobre a sobraMensalReal
      - Quando houver diferen�a entre renda mensal declarada e sobra mensal real, explique isso com clareza, mostrando que as despesas recorrentes reduzem a capacidade real de amortiza��o
      - O valor sugerido para pagamento extra deve sair prioritariamente da sobraMensalReal, com postura conservadora e sem comprometer a reserva m�nima do perfil
      - Para cada d�vida, compare a taxa mensal com o retorno l�quido mensal de renda fixa e conclua explicitamente se vale ou n�o antecipar
      - Estime os meses para quita��o da d�vida priorit�ria: cen�rio normal (s� parcela) vs. cen�rio com pagamento extra
      - Quando houver financiamento parcelado, inclua a orienta��o de antecipar as �ltimas parcelas mensalmente
      - Estruture as a��es em tr�s blocos: (1) esta semana, (2) este m�s, (3) em 3 meses � cada um com a��es espec�ficas aos n�meros do usu�rio
      - Ao final, assine como: Nexus, analista de cen�rios financeiros do Finan�as Pro Invest
      - Responda em texto natural de consultoria, sem JSON
      `;
        const messages = [
            { role: "user", content: userMessage },
        ];
        logger.info(`[generateDebtPlan] Chamada �nica � plano consultivo para userId=${userId}`);
        const llmResponse = await router.routeRequest(messages, systemPromptEtapa1);
        const planoMarkdownBruto = typeof llmResponse === "string"
            ? llmResponse
            : llmResponse?.content || "";
        const planoMarkdown = planoMarkdownBruto
            .replace(/\uFFFD/g, "")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        logger.info("[generateDebtPlan] PLANO_MARKDOWN_GERADO", {
            provider: llmResponse?.provider,
            model: llmResponse?.model,
            tamanho: planoMarkdown.length,
            preview: planoMarkdown.slice(0, 500),
        });
        if (!planoMarkdown || planoMarkdown.length < 120) {
            throw new https_1.HttpsError("internal", "O Nexus n�o conseguiu gerar um plano completo neste momento.");
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
        const tituloPlano = `Plano de quita��o - ${dataHoraTitulo}`;
        const db = (0, firestore_1.getFirestore)();
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
            model: llmResponse?.model,
            provider: llmResponse?.provider,
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