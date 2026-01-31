"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketData = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
// DOMÍNIOS PERMITIDOS (CORS)
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://financasproinvest.com',
    'https://financasproinvest.com.br',
];
exports.getMarketData = (0, https_1.onRequest)(async (request, response) => {
    const origin = request.headers.origin;
    // --- LÓGICA DE CORS ATUALIZADA ---
    let finalOrigin = origin;
    // Se a origem for do Vercel Preview/Staging, permitimos, pois a URL é dinâmica.
    if (origin && origin.includes('.vercel.app')) {
        finalOrigin = origin; // Permite a URL completa do Preview
    }
    else if (origin && ALLOWED_ORIGINS.includes(origin)) {
        finalOrigin = origin; // Permite as origens fixas (localhost, produção)
    }
    else {
        finalOrigin = ALLOWED_ORIGINS[0]; // Padrão de segurança: retorna o localhost se for inválida
    }
    response.setHeader('Access-Control-Allow-Origin', finalOrigin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    try {
        // ===== 1. BUSCAR ÍNDICES (IBOV e S&P 500) =====
        const indexTickers = ["%5EBVSP", "%5EGSPC"];
        const indexPromises = indexTickers.map(async (ticker) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
                const res = await fetch(url);
                const json = await res.json();
                if (!json.chart || !json.chart.result || json.chart.result.length === 0)
                    return null;
                const meta = json.chart.result[0].meta;
                const changePercent = ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100;
                let name = ticker === "%5EBVSP" ? "IBOV" : "S&P 500";
                return {
                    symbol: name,
                    price: meta.regularMarketPrice, // Número puro
                    change: changePercent, // Número puro
                    up: changePercent >= 0
                };
            }
            catch (e) {
                return null;
            }
        });
        const indexResults = await Promise.all(indexPromises);
        const indices = indexResults.filter(i => i !== null);
        // ===== 2. BUSCAR AÇÕES (Yahoo Finance) =====
        const stockTickers = ["VALE3.SA", "PETR4.SA", "ITUB4.SA", "BBDC4.SA", "ABEV3.SA", "BBAS3.SA", "ELET3.SA", "WEGE3.SA", "BPAC11.SA", "SUZB3.SA"];
        const stockPromises = stockTickers.map(async (ticker) => {
            try {
                const stockUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
                const response = await fetch(stockUrl);
                const data = await response.json();
                if (!data.chart || !data.chart.result || data.chart.result.length === 0)
                    return null;
                const meta = data.chart.result[0].meta;
                const changePercent = ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100;
                return {
                    symbol: ticker.replace('.SA', ''),
                    price: meta.regularMarketPrice, // Número puro
                    change: changePercent, // Número puro
                    up: changePercent >= 0
                };
            }
            catch (error) {
                return null;
            }
        });
        const stockResults = await Promise.all(stockPromises);
        const stocks = stockResults.filter((stock) => stock !== null);
        // ===== 3. RESPOSTA FINAL =====
        const formattedData = {
            indices: indices.length > 0 ? indices : [],
            stocks: stocks.length > 0 ? stocks : [],
            currencies: [],
            cryptos: []
        };
        response.json(formattedData);
        logger.info("Dados enviados com sucesso (Raw Numbers).");
    }
    catch (error) {
        logger.error("Erro CRÍTICO", error);
        // Em caso de erro, usamos o fallback
        response.json({
            indices: [],
            stocks: [],
            currencies: [],
            cryptos: []
        });
    }
});
//# sourceMappingURL=marketData.js.map