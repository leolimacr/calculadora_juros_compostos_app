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
exports.testMistral = exports.getMarketData = exports.askAiAdvisor = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const identity_1 = require("./nexus-core/identity");
const discretion_engine_1 = require("./nexus-core/discretion-engine");
const data_integrator_1 = require("./nexus-core/data-integrator");
const MultiModelRouter_1 = require("./nexus-core/MultiModelRouter");
(0, app_1.initializeApp)();
async function getUserPlan(userId) {
    try {
        const db = (0, firestore_1.getFirestore)();
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
    }
    catch (error) {
        logger.error(`[Subscription] Erro ao buscar plano: ${error.message}`);
        return undefined;
    }
}
function describeHistoryWindow(plan) {
    switch (plan) {
        case 'free': return 'Você está no plano Free, então posso analisar apenas os últimos 3 dias do seu histórico';
        case 'pro': return 'Você está no plano Pro, então posso analisar os últimos 30 dias do seu histórico';
        case 'premium': return 'Você está no plano Premium, então posso analisar os últimos 90 dias do seu histórico';
        case 'premium_anual': return 'Você está no plano Premium Anual, então posso analisar todo o seu histórico de lançamentos (ilimitado)';
        default: return 'analiso um recorte recente do seu histórico, definido pelo seu plano';
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
            logger.info('[Tavily] ✓ Resposta obtida');
            return data.answer;
        }
        if (data.results && data.results.length > 0) {
            const summary = data.results
                .slice(0, 3)
                .map((r) => r.content || r.snippet || '')
                .filter((s) => s.length > 0)
                .join('\n\n');
            if (summary.length > 0) {
                logger.info('[Tavily] ✓ Resultados concatenados');
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
            logger.info(`[Scraping] ✓ ${matches.length} resultados extraídos`);
            return matches.join('\n\n');
        }
        logger.warn('[Scraping] Nenhum resultado extraído');
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
    return "Não consegui obter informações atualizadas no momento. Tente novamente em alguns instantes.";
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
    const needsUSDExplicit = /dólar|dolar|usd|dollar|us\$/i.test(prompt);
    let needsUSDContext = false;
    if (history.length > 0) {
        const lastTwoMsgs = history.slice(-2);
        needsUSDContext = lastTwoMsgs.some((h) => /dólar|dolar|usd|dollar|US\$/i.test(h.text || ''));
    }
    const needsUSD = needsUSDExplicit || needsUSDContext;
    if (cryptos.length > 0) {
        if (needsUSD) {
            const cpDual = await fetchCryptoPricesDual(cryptos);
            if (Object.keys(cpDual).length > 0) {
                Object.entries(cpDual).forEach(([symbol, data]) => {
                    results.push(`${symbol}: US$ ${data.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / R$ ${data.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (cotação de ${data.lastUpdated})`);
                });
                hasAnyData = true;
            }
        }
        else {
            const cp = await fetchCryptoPrices(cryptos);
            if (Object.keys(cp).length > 0) {
                Object.entries(cp).forEach(([symbol, data]) => {
                    results.push(`${symbol}: R$ ${data.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (cotação de ${data.lastUpdated})`);
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
                        return `${ticker}: R$ ${d.results[0].regularMarketPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (cotação de ${date} às ${time})`;
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
            logger.error("Erro busca ações", error);
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
        'itaú': { type: 'b3', ticker: 'ITUB4' },
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
exports.askAiAdvisor = (0, https_1.onCall)({
    memory: "1GiB",
    timeoutSeconds: 120,
    region: "us-central1"
}, async (request) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const brapiToken = process.env.BRAPI_TOKEN;
    const router = MultiModelRouter_1.MultiModelRouter.getInstance();
    router.updateApiKeys({
        gemini: geminiApiKey,
        openrouter: openrouterApiKey,
        mistral: mistralApiKey
    });
    try {
        if (!request.auth)
            throw new https_1.HttpsError("unauthenticated", "Login necessário.");
        const { prompt, userName, history = [], isFirstInteraction, context: frontendContext = {} } = request.data;
        const { assets = [], passives = [], goals = [] } = frontendContext;
        console.log("📌 assets recebidos:", JSON.stringify(assets));
        console.log("📌 passives recebidos:", JSON.stringify(passives));
        console.log("📌 goals recebidos do frontend:", JSON.stringify(goals));
        const safeUserName = (userName || "Investidor").split(' ')[0];
        const userId = request.auth.uid;
        let isFirst;
        if (typeof isFirstInteraction === 'boolean') {
            isFirst = isFirstInteraction;
            logger.info(`[FirstMsg] Flag explícito do Flutter: ${isFirst}`);
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
                'oi', 'olá', 'ola', 'oie', 'opa', 'eai', 'e ai', 'e aí',
                'bom dia', 'boa tarde', 'boa noite', 'ei', 'hey', 'hi', 'hello',
                'alô', 'alo', 'fala', 'fala aí', 'fala ai', 'beleza'
            ];
            if (simpleGreetings.includes(cleanPrompt)) {
                const greeting = identity_1.NexusIdentity.getInitialGreeting(safeUserName);
                logger.info("✓ Saudação simples detectada");
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
            /o que fa[çz]o com.*reais/i,
            /sugere.*investimento/i,
            /indica.*investimento/i
        ];
        if (investmentRequestPatterns.some(p => p.test(prompt))) {
            logger.warn(`⚠️ BLOQUEIO CVM`);
            return {
                success: true,
                answer: `${safeUserName}, não posso fazer recomendações específicas de investimento, pois isso exige análise de perfil completo e está regulamentado pela CVM.\n\nO que posso fazer:\n• Explicar conceitos gerais (ex: o que é renda fixa, ações, etc)\n• Mostrar dados de mercado atuais\n• Tirar dúvidas sobre produtos financeiros\n\nPara recomendações personalizadas, você deve consultar um assessor de investimentos registrado na CVM.\n\nPosso explicar algum conceito ou produto específico?`,
                context: { intent: 'investment_request_blocked', model: 'system' }
            };
        }
        let userData;
        let historyDescription = 'analiso um recorte recente do seu histórico, definido pelo seu plano';
        try {
            const userPlan = await getUserPlan(userId);
            logger.info(`🔍 [DEBUG] userId: ${userId}`);
            logger.info(`🔍 [DEBUG] Plano retornado: "${userPlan}"`);
            logger.info(`🔍 [DEBUG] Tipo: ${typeof userPlan}`);
            historyDescription = describeHistoryWindow(userPlan);
            logger.info(`🔍 [DEBUG] historyDescription: "${historyDescription}"`);
            userData = await data_integrator_1.DataIntegrator.gatherUserData(userId, userPlan);
        }
        catch (dataError) {
            logger.error("Falha dados usuário:", dataError);
            userData = { goals: [], recentTransactions: [], simulations: [], summary: '', hasData: false, dataStatus: 'error' };
        }
        console.log("🔍 DEBUG - INÍCIO DO PROCESSAMENTO DE METAS");
        console.log("🔍 userData existe?", !!userData);
        console.log("🔍 userData.goals é array?", Array.isArray(userData?.goals));
        console.log("🔍 Quantidade de goals em userData:", userData?.goals?.length || 0);
        if (userData?.goals?.length > 0) {
            console.log("🔍 Primeira goal:", JSON.stringify(userData.goals[0]));
        }
        console.log("🔍 userData.hasData:", userData?.hasData);
        const assetsSummary = assets && assets.length > 0
            ? `\n📊 PATRIMÔNIO ATIVO (${assets.length} itens):\n` + assets.map((a) => `  • ${a.name} (${a.category || 'Outros'}): R$ ${(a.currentValue || 0).toFixed(2)}`).join('\n')
            : '\n📊 Patrimônio ativo: Nenhum ativo registrado.';
        const passivesSummary = passives && passives.length > 0
            ? `\n📉 PATRIMÔNIO PASSIVO (${passives.length} itens):\n` + passives.map((p) => `  • ${p.description || p.name} (${p.category || 'Outros'}): R$ ${(p.currentValue || 0).toFixed(2)}`).join('\n')
            : '\n📉 Patrimônio passivo: Nenhum passivo registrado.';
        const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
        const totalPassives = passives.reduce((sum, p) => sum + (p.currentValue || 0), 0);
        const patrimonioLiquido = (totalAssets - totalPassives).toFixed(2);
        const patrimonioLiquidoStr = `💰 Patrimônio Líquido: R$ ${patrimonioLiquido}`;
        console.log("📌 assets recebidos:", JSON.stringify(assets));
        console.log("📌 passives recebidos:", JSON.stringify(passives));
        console.log("📌 assetsSummary:", assetsSummary);
        console.log("📌 passivesSummary:", passivesSummary);
        console.log("📌 patrimonioLiquidoStr:", patrimonioLiquidoStr);
        const validHistory = Array.isArray(history) ? history.filter((h) => h && h.text && h.text.trim()) : [];
        let marketData = "";
        const extracted = extractTickersFallback(prompt);
        if (extracted.b3.length > 0 || extracted.crypto.length > 0) {
            marketData = await fetchAllMarketData(extracted.b3, extracted.crypto, brapiToken, prompt, validHistory);
        }
        if (validHistory.length > 0 && marketData && /quando|horário|horario|data|dia|atualização|atualizacao|cotação|cotacao|qual.*hora|que.*hora|qual.*dia|que.*dia/i.test(prompt) && marketData.includes('cotação de')) {
            logger.info("✓ Follow-up timestamp");
            return {
                success: true,
                answer: `Os dados que forneci já incluem data e horário:\n\n${marketData}`,
                context: { intent: 'timestamp_clarification', model: 'system' }
            };
        }
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
            logger.info("🚨 Usuário corrigindo informação - forçando busca web");
        }
        const context = discretion_engine_1.DiscretionEngine.analyzeContext(prompt, validHistory, {
            hasGoals: userData.goals.length > 0,
            hasRecentTransactions: userData.recentTransactions.length > 0,
            hasSimulations: userData.simulations.length > 0
        });
        let transactionsForPrompt = "Nenhuma transação registrada.";
        let goalsForPrompt = "Nenhuma meta definida.";
        if (goals && goals.length > 0) {
            const mappedGoals = goals.map((g) => {
                const nome = g.nome || g.name || 'Meta sem nome';
                const valor = g.valor || g.targetAmount || 0;
                const frequencia = g.frequencia || g.frequency || 'N/A';
                return `• ${nome}: R$ ${typeof valor === 'number' ? valor.toFixed(2) : parseFloat(valor).toFixed(2)} (${frequencia})`;
            }).join('\n');
            goalsForPrompt = `**METAS DO USUÁRIO (${goals.length}):**\n${mappedGoals}`;
            console.log("🔍 goalsForPrompt GERADO (frontend):", goalsForPrompt);
        }
        else if (userData.goals && userData.goals.length > 0) {
            goalsForPrompt = data_integrator_1.DataIntegrator.formatGoalsForPrompt(userData.goals, context);
            console.log("🔍 goalsForPrompt GERADO (DataIntegrator):", goalsForPrompt);
        }
        else {
            console.log("🔍 goalsForPrompt permaneceu como padrão: 'Nenhuma meta definida.'");
        }
        console.log("🔍 goalsForPrompt:", goalsForPrompt);
        console.log("🚀 Chamando getSystemPrompt com assetsSummary:", assetsSummary);
        console.log("🚀 passivesSummary:", passivesSummary);
        console.log("🚀 patrimonioLiquidoStr:", patrimonioLiquidoStr);
        const systemPrompt = identity_1.NexusIdentity.getSystemPrompt(safeUserName, context, marketData, assetsSummary, passivesSummary, patrimonioLiquido, transactionsForPrompt, goalsForPrompt, "", isFirst, userData, historyDescription);
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
                    logger.warn("⚠️ Pergunta repetida detectada");
                    avoidRepetition = "\n\n**IMPORTANTE:** O usuário fez a mesma pergunta novamente. NÃO repita a resposta anterior idêntica. Se já respondeu, reconheça isso brevemente e ofereça expandir algum ponto específico.";
                }
            }
        }
        logger.info('[Router] Primeira chamada para análise...');
        const enhancedSystemPrompt = `${systemPrompt}${avoidRepetition}

# 🔍 IMPORTANTE: BUSCA NA WEB

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
- "Qual a taxa Selic atual?" → [BUSCAR_WEB: taxa selic atual Brasil]
- "Notícias sobre inflação" → [BUSCAR_WEB: notícias inflação IPCA Brasil hoje]
- "Máxima histórica do BTC" → [BUSCAR_WEB: bitcoin máxima histórica all-time high]
- "Quanto o BTC valia em 2020?" → [BUSCAR_WEB: preço bitcoin 2020]
- Usuário corrige: "A máxima não é 68k, é 126k" → [BUSCAR_WEB: bitcoin máxima histórica recorde]

${isUserCorrection ? "\n**ATENÇÃO:** O usuário está CORRIGINDO uma informação que você deu. Você DEVE buscar na web para validar e admitir o erro se estiver errado." : ""}`;
        const firstResponse = await router.routeRequest(messages, enhancedSystemPrompt, {
            temperature: 0.6,
            maxTokens: 1200,
            fallbackContext: {
                primaryIntent: context.intent,
                userName: safeUserName
            }
        });
        let finalAnswer = firstResponse.content || "Desculpe, estou com instabilidade momentânea.";
        const webSearchMatch = finalAnswer.match(/\[BUSCAR_WEB:\s*(.+?)\]/i);
        if (webSearchMatch) {
            const searchQuery = webSearchMatch[1].trim();
            logger.info(`[WebSearch] 🔍 Nexus solicitou busca: "${searchQuery}"`);
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
            logger.info(`[Router] ✓ Resposta final com busca de: ${secondResponse.provider}`);
        }
        else {
            logger.info(`[Router] ✓ Resposta direta de: ${firstResponse.provider} (${firstResponse.model})`);
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
            context: { model: firstResponse.provider, intent: context.intent }
        };
    }
    catch (error) {
        logger.error("Erro Nexus:", error);
        return {
            success: false,
            answer: "Desculpe, ocorreu um erro temporário. Por favor, tente novamente.",
            error: error.message
        };
    }
});
var marketData_1 = require("./marketData");
Object.defineProperty(exports, "getMarketData", { enumerable: true, get: function () { return marketData_1.getMarketData; } });
exports.testMistral = (0, https_1.onCall)({
    timeoutSeconds: 30,
    region: "us-central1"
}, async (request) => {
    logger.info("🧪 TESTE MISTRAL - Iniciando...");
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const apiKey = mistralApiKey;
    if (!apiKey) {
        logger.error("❌ MISTRAL_API_KEY não configurada!");
        return {
            success: false,
            error: "API Key não encontrada",
            details: "Configure MISTRAL_API_KEY no Firebase"
        };
    }
    logger.info("✓ API Key encontrada");
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
    logger.info("📤 Enviando requisição para Mistral...");
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
        logger.info(`📥 Response Status: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`❌ Mistral HTTP ${response.status}: ${errorText}`);
            return {
                success: false,
                error: `HTTP ${response.status}`,
                details: errorText.substring(0, 500)
            };
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            logger.error("❌ Resposta sem conteúdo");
            return {
                success: false,
                error: "Resposta vazia",
                details: JSON.stringify(data)
            };
        }
        logger.info("✅ MISTRAL FUNCIONANDO!");
        logger.info(`Resposta: ${content}`);
        return {
            success: true,
            message: "✅ Mistral funcionando corretamente!",
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
        logger.error(`❌ Erro na requisição: ${error.message}`);
        return {
            success: false,
            error: error.name,
            message: error.message,
            details: "Verifique se a API key é válida e se o modelo existe"
        };
    }
});
//# sourceMappingURL=index.js.map