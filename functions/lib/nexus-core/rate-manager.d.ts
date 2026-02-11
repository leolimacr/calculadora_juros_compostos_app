export interface RateLimitStatus {
    service: 'groq' | 'tavily' | 'brapi';
    used: number;
    limit: number;
    resetTime?: Date;
    lastCheck: Date;
    isCritical: boolean;
}
export declare class RateManager {
    private static instance;
    private limits;
    private constructor();
    static getInstance(): RateManager;
    shouldUseFallbackModel(): {
        useFallback: boolean;
        reason?: string;
        waitTime?: number;
    };
    recordUsage(service: 'groq' | 'tavily' | 'brapi', tokens: number): void;
    processRateLimitError(error: any): void;
    getFriendlyMessage(): string;
    getSuggestedModel(): {
        model: string;
        maxTokens: number;
    };
    canRespondNormally(): boolean;
    private calculateWaitTime;
}
