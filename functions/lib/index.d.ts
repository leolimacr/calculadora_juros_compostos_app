export declare const askAiAdvisor: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    answer: string;
    context: {
        intent: string;
        model: string;
    };
    error?: undefined;
} | {
    success: boolean;
    answer: string;
    error: any;
    context?: undefined;
}>, unknown>;
export declare const testMistral: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    error: string;
    details: string;
    message?: undefined;
    response?: undefined;
    model?: undefined;
    tokensUsed?: undefined;
} | {
    success: boolean;
    message: string;
    response: any;
    model: any;
    tokensUsed: any;
    details: {
        promptTokens: any;
        completionTokens: any;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    message: any;
    details: string;
    response?: undefined;
    model?: undefined;
    tokensUsed?: undefined;
}>, unknown>;
