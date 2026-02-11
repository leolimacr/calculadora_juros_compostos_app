export declare class NexusIdentity {
    static getInitialGreeting(userName: string): string;
    static getSystemPrompt(userName: string, context: any, marketData: string, transactions: string, goals: string, simulations: string, isFirst: boolean, userData: {
        hasData: boolean;
        dataStatus: 'ok' | 'empty' | 'error';
        error?: string;
    }): string;
}
