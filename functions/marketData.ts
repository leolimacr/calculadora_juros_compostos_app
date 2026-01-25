import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// DOMÍNIOS PERMITIDOS (CORS)
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://financasproinvest.com',
    'https://financasproinvest.com.br'
];

// Dados locais de fallback (Números puros, sem strings formatadas)
const FALLBACK_DATA = {
    indices: [
        { symbol: 'IBOV', price: 128450, change: 0.85, up: true },
        { symbol: 'S&P 500', price: 5120, change: 1.10, up: true },
    ],
    stocks: [
        { symbol: 'VALE3', price: 62.50, change: 0.50, up: true },
        { symbol: 'PETR4', price: 38.20, change: -1.20, up: false },
    ],
    currencies: [],
    cryptos: []
};

export const getMarketData = onRequest(async (request, response) => {
    const origin = request.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
    }
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
                const json = await res.json() as any;

                if (!json.chart || !json.chart.result || json.chart.result.length === 0) return null;
                const meta = json.chart.result[0].meta;
                
                const changePercent = ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100;
                let name = ticker === "%5EBVSP" ? "IBOV" : "S&P 500";

                return {
                    symbol: name,
                    price: meta.regularMarketPrice, // Item 2: Número puro
                    change: changePercent,          // Item 2: Número puro
                    up: changePercent >= 0
                };
            } catch (e) {
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
                const data = await response.json() as any;

                if (!data.chart || !data.chart.result || data.chart.result.length === 0) return null;

                const meta = data.chart.result[0].meta;
                const changePercent = ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100;

                return {
                    symbol: ticker.replace('.SA', ''),
                    price: meta.regularMarketPrice, // Item 2: Número puro
                    change: changePercent,          // Item 2: Número puro
                    up: changePercent >= 0
                };
            } catch (error) {
                return null;
            }
        });

        const stockResults = await Promise.all(stockPromises);
        const stocks = stockResults.filter((stock) => stock !== null);

        // ===== 3. RESPOSTA FINAL (Item 1: Sem Indicators) =====
        const formattedData = {
            indices: indices.length > 0 ? indices : FALLBACK_DATA.indices,
            stocks: stocks.length > 0 ? stocks : FALLBACK_DATA.stocks,
            currencies: [], 
            cryptos: []
        };

        response.json(formattedData);
        logger.info("Dados enviados com sucesso (Raw Numbers).");

    } catch (error) {
        logger.error("Erro CRÍTICO", error);
        response.json(FALLBACK_DATA);
    }
});