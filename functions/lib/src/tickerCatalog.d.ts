export type BrapiQuoteListItem = {
    stock: string;
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
    indexes?: Array<{
        stock: string;
        name: string;
    }>;
    stocks: BrapiQuoteListItem[];
    availableSectors?: string[];
    availableStockTypes?: string[];
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalCount: number;
    hasNextPage: boolean;
};
export declare function refreshTickerCatalog(params: {
    brapiToken: string;
}): Promise<void>;
