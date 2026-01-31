"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTickerCatalog = refreshTickerCatalog;
const logger = require("firebase-functions/logger");
const firestore_1 = require("firebase-admin/firestore");
function stripDiacritics(input) {
    return input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
function normalizeText(input) {
    return stripDiacritics((input || "").toLowerCase())
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
const STOPWORDS = new Set([
    "acao",
    "acoes",
    "ação",
    "ações",
    "empresa",
    "companhia",
    "bolsa",
    "b3",
    "brasil",
    "do",
    "da",
    "de",
    "das",
    "dos",
    "e",
    "que",
    "tem",
    "nome",
    "na",
    "no",
    "hoje",
    "custa",
    "quanto",
]);
function toNameTokens(name) {
    const n = normalizeText(name);
    if (!n)
        return [];
    return Array.from(new Set(n.split(" ").filter((t) => t.length >= 3 && !STOPWORDS.has(t))));
}
async function fetchBrapiQuoteListPage(params) {
    const url = new URL("https://brapi.dev/api/quote/list");
    url.searchParams.set("page", String(params.page));
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("token", params.token);
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`brapi quote/list HTTP ${res.status} ${text}`.trim());
    }
    return (await res.json());
}
async function commitBatchWithChunking(items, chunkSize, handler) {
    for (let i = 0; i < items.length; i += chunkSize) {
        await handler(items.slice(i, i + chunkSize));
    }
}
async function refreshTickerCatalog(params) {
    const db = (0, firestore_1.getFirestore)();
    const limit = 200; // mais alto = menos páginas, mas teste primeiro
    let page = 1;
    let totalUpserts = 0;
    while (true) {
        const data = await fetchBrapiQuoteListPage({
            token: params.brapiToken,
            page,
            limit,
        });
        const stocks = Array.isArray(data.stocks) ? data.stocks : [];
        await commitBatchWithChunking(stocks, 400, async (chunk) => {
            const batch = db.batch();
            for (const item of chunk) {
                const ticker = (item.stock || "").toUpperCase().trim();
                if (!ticker)
                    continue;
                const name = (item.name || "").toString();
                const normalizedName = normalizeText(name);
                const nameTokens = toNameTokens(name);
                const ref = db.collection("tickerCatalog").doc(ticker);
                batch.set(ref, {
                    ticker,
                    name,
                    normalizedName,
                    nameTokens,
                    type: item.type || null,
                    sector: item.sector || null,
                    logo: item.logo || null,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    source: "brapi_quote_list",
                }, { merge: true });
            }
            await batch.commit();
        });
        totalUpserts += stocks.length;
        logger.info("tickerCatalog page ingested", {
            page: data.currentPage,
            totalPages: data.totalPages,
            count: stocks.length,
            totalUpserts,
            hasNextPage: data.hasNextPage,
        });
        if (!data.hasNextPage)
            break;
        page += 1;
    }
    logger.info("tickerCatalog refresh complete", { totalUpserts });
}
//# sourceMappingURL=tickerCatalog.js.map