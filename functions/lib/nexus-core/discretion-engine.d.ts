export interface DiscretionDecision {
    responseDepth: 'minimal' | 'concise' | 'detailed' | 'comprehensive';
    includeMarketData: boolean;
    includeGoals: boolean;
    includeTransactions: boolean;
    includeSimulations: boolean;
    shouldSuggestActions: boolean;
    shouldOfferWebSearch: boolean;
    shouldProposeSimulation: boolean;
    useBulletPoints: boolean;
    useParagraphs: boolean;
    includeClosingQuestion: boolean;
    formalityLevel: 'high' | 'medium' | 'low';
    useFirstNameFrequency: 'never' | 'occasional' | 'frequent';
    includeDateTime: 'none' | 'time' | 'date' | 'both';
    shouldAcknowledgePreviousMessage: boolean;
    shouldBeExtraPolite: boolean;
}
export declare class DiscretionEngine {
    static analyzeContext(userMessage: string, messageHistory: Array<{
        role: string;
        text: string;
        timestamp?: Date;
    }>, userData: {
        hasGoals: boolean;
        hasRecentTransactions: boolean;
        hasSimulations: boolean;
    }): {
        intent: string;
        complexity: 'low' | 'medium' | 'high';
        requiresMarketData: boolean;
        requiresDate: boolean;
        requiresTime: boolean;
        isSimpleGreeting: boolean;
        shouldSuggest: boolean;
        timeOfDay?: 'morning' | 'afternoon' | 'evening';
        userMood: 'neutral' | 'curious' | 'impatient' | 'confused' | 'detailed' | 'testing';
        requiresFollowUp: boolean;
        isProbablyTesting: boolean;
    };
    static makeDecision(contextAnalysis: ReturnType<typeof DiscretionEngine.analyzeContext>, userData: {
        hasGoals: boolean;
        hasRecentTransactions: boolean;
        hasSimulations: boolean;
    }): DiscretionDecision;
    private static isTestingPresence;
    private static determineIntent;
    private static assessComplexity;
    private static analyzeDataRequirements;
    private static isSimpleGreeting;
    private static shouldSuggestActions;
    private static getTimeOfDay;
    private static analyzeUserMood;
    private static requiresFollowUp;
}
