export interface UserGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    category: 'retirement' | 'travel' | 'property' | 'education' | 'emergency' | 'investment';
    priority: 'low' | 'medium' | 'high';
}
export interface UserTransaction {
    id: string;
    date: Date;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    userId: string;
}
export interface UserSimulation {
    id: string;
    label: string;
    details: string;
    createdAt: Date;
    parameters: Record<string, any>;
    results: Record<string, any>;
}
export interface UserDataResult {
    goals: UserGoal[];
    recentTransactions: UserTransaction[];
    simulations: UserSimulation[];
    summary: string;
    hasData: boolean;
    dataStatus: 'ok' | 'empty' | 'error';
    error?: string;
}
export declare class DataIntegrator {
    static gatherUserData(userId: string, userPlan?: string): Promise<UserDataResult>;
    private static fetchRecentTransactionsWithTimeout;
    private static fetchUserGoalsWithTimeout;
    static formatTransactionsForPrompt(transactions: UserTransaction[], context: any): string;
    static formatGoalsForPrompt(goals: UserGoal[], context: any): string;
    static formatSimulationsForPrompt(simulations: UserSimulation[], context: any): string;
    private static filterRelevantTransactions;
    private static generateTransactionSummary;
    private static generateDataSummary;
    private static mapGoalCategory;
    private static getPeriodByPlan;
}
