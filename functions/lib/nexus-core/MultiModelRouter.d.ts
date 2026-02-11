export interface ModelProvider {
    name: string;
    apiKey: string;
    baseURL: string;
    models: {
        primary: string;
        fallbacks?: string[];
    };
    priority: number;
    isAvailable: boolean;
    errorCount: number;
    maxTokens: number;
    headers?: Record<string, string>;
}
export interface RouterResponse {
    success: boolean;
    content: string;
    provider: string;
    model: string;
    tokensUsed: number;
    cached: boolean;
}
export declare class MultiModelRouter {
    private static instance;
    private providers;
    private cache;
    private readonly CACHE_TTL;
    private constructor();
    static getInstance(): MultiModelRouter;
    private initializeProviders;
    updateApiKeys(keys: {
        gemini?: string;
        openrouter?: string;
        mistral?: string;
        groq?: string;
        deepseek?: string;
    }): void;
    routeRequest(messages: any[], systemPrompt?: string, options?: {
        temperature?: number;
        maxTokens?: number;
        tools?: any[];
        fallbackContext?: {
            primaryIntent?: string;
            userName?: string;
        };
    }): Promise<RouterResponse>;
    private tryProvider;
    private tryProviderWithModel;
    private callGemini;
    private callOpenAIFormat;
    private getAvailableProviders;
    private markProviderError;
    private resetProviderErrors;
    private getContingencyResponse;
    private generateCacheKey;
    private getCachedResponse;
    private cacheResponse;
}
