import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export type BrapiQuoteListItem = {
  stock: string; // ticker
  name?: string;
  close?: number;
  change?: number;
  volume?: number;
  market_cap?: number;
  logo?: string;
  sector?: string;
  type?: "stock" | "fund" | "bdr";
};

export type BrapiQuoteListResponse = {
  indexes?: Array<{ stock: string; name: string }>;
  stocks: BrapiQuoteListItem[];
  availableSectors?: string[];
  availableStockTypes?: string[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalCount: number;
  hasNextPage: boolean;
};

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeText(input: string): string {
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

function toNameTokens(name: string): string[] {
  const n = normalizeText(name);
  if (!n) return [];
  return Array.from(
    new Set(
      n.split(" ").filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    )
  );
}

async function fetchBrapiQuoteListPage(params: {
  token: string;
  page: number;
  limit: number;
}): Promise<BrapiQuoteListResponse> {
  const url = new URL("https://brapi.dev/api/quote/list");
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("limit", String(params.limit));
  url.searchParams.set("token", params.token);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`brapi quote/list HTTP ${res.status} ${text}`.trim());
  }
  return (await res.json()) as BrapiQuoteListResponse;
}

async function commitBatchWithChunking<T>(
  items: T[],
  chunkSize: number,
  handler: (chunk: T[]) => Promise<void>
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    await handler(items.slice(i, i + chunkSize));
  }
}

export async function refreshTickerCatalog(params: { brapiToken: string }) {
  const db = getFirestore();

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
        if (!ticker) continue;

        const name = (item.name || "").toString();
        const normalizedName = normalizeText(name);
        const nameTokens = toNameTokens(name);

        const ref = db.collection("tickerCatalog").doc(ticker);

        batch.set(
          ref,
          {
            ticker,
            name,
            normalizedName,
            nameTokens,
            type: item.type || null,
            sector: item.sector || null,
            logo: item.logo || null,
            updatedAt: FieldValue.serverTimestamp(),
            source: "brapi_quote_list",
          },
          { merge: true }
        );
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

    if (!data.hasNextPage) break;
    page += 1;
  }

  logger.info("tickerCatalog refresh complete", { totalUpserts });
}
