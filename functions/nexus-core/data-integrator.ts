import { getDatabase } from "firebase-admin/database";
import * as logger from "firebase-functions/logger";

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

export class DataIntegrator {
    static async gatherUserData(userId: string, userPlan?: string): Promise<UserDataResult> {
        const timeoutMs = 3000; 
        const timeoutPromise = new Promise<UserDataResult>((_, reject) =>
            setTimeout(() => reject(new Error(`DataIntegrator timeout global`)), timeoutMs)
        );

        const dataPromise = (async () => {
            let goals: UserGoal[] = [];
            let transactions: UserTransaction[] = [];
            let simulations: UserSimulation[] = [];
            let summary = '';
            let hasData = false;
            let dataStatus: 'ok' | 'empty' | 'error' = 'ok';
            let error: string | undefined = undefined;

            try {
                logger.info(`[DataIntegrator] Iniciando coleta para userId: ${userId}`);
                
                [transactions, goals] = await Promise.all([
                    this.fetchRecentTransactionsWithTimeout(userId, 2500, userPlan),
                    this.fetchUserGoalsWithTimeout(userId, 2500)
                ]);

                const totalItems = goals.length + transactions.length;
                hasData = totalItems > 0;
                dataStatus = hasData ? 'ok' : 'empty';
                summary = this.generateDataSummary(goals, transactions, simulations);
                
                logger.info(`[DataIntegrator] Sucesso. userId=${userId}, transações=${transactions.length}, metas=${goals.length}, status=${dataStatus}`);

            } catch (err: any) {
                logger.error('[DataIntegrator] Erro crítico no fluxo:', err);
                dataStatus = 'error';
                error = err.message;
                summary = 'Erro técnico ao acessar os dados.';
            }

            return { goals, recentTransactions: transactions, simulations, summary, hasData, dataStatus, error };
        })();

        try {
            return await Promise.race([dataPromise, timeoutPromise]);
        } catch (timeoutError: any) {
            logger.error('[DataIntegrator] Abortado por timeout global.');
            return {
                goals: [],
                recentTransactions: [],
                simulations: [],
                summary: 'Sistema de dados lento.',
                hasData: false,
                dataStatus: 'error',
                error: 'timeout'
            };
        }
    }

    private static async fetchRecentTransactionsWithTimeout(userId: string, timeout: number, userPlan?: string): Promise<UserTransaction[]> {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                logger.warn(`[DataIntegrator] Timeout na busca de transações (${timeout}ms)`);
                resolve([]);
            }, timeout);

            try {
                const rtdb = getDatabase();
                const path = `transactions/${userId}`;
                const userTransactionsRef = rtdb.ref(path);
                
                const snapshot = await userTransactionsRef.orderByKey().get();
                
                clearTimeout(timeoutId);
                
                if (!snapshot.exists()) {
                    resolve([]);
                    return;
                }
                
                const transactions: UserTransaction[] = [];
				logger.info(`🔍 [DEBUG DataIntegrator] userPlan recebido: "${userPlan}"`);
				const daysToFetch = this.getPeriodByPlan(userPlan);
				logger.info(`🔍 [DEBUG DataIntegrator] Dias calculados: ${daysToFetch}`);
				const cutoffDate = new Date();
				cutoffDate.setDate(cutoffDate.getDate() - daysToFetch);
                
                snapshot.forEach((childSnapshot: any) => {
                    const data = childSnapshot.val();
                    const transactionDate = new Date(data.date);
                    
                    if (transactionDate >= cutoffDate) {
                        transactions.push({
                            id: childSnapshot.key || '',
                            date: transactionDate,
                            description: data.description?.trim() || 'Sem descrição',
                            amount: parseFloat(data.amount) || 0,
                            category: data.category || 'Outros',
                            type: data.type === 'income' ? 'income' : 'expense',
                            userId: data.userId || userId
                        });
                    }
                });
                
                transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
                
                logger.info(`[DataIntegrator] ${transactions.length} transações dos últimos ${daysToFetch} dias`);
                resolve(transactions);
            } catch (error: any) {
                clearTimeout(timeoutId);
                logger.error(`[DataIntegrator] Erro ao ler transações:`, error);
                resolve([]);
            }
        });
    }

    private static async fetchUserGoalsWithTimeout(userId: string, timeout: number): Promise<UserGoal[]> {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                logger.warn(`[DataIntegrator] Timeout na busca de metas (${timeout}ms)`);
                resolve([]);
            }, timeout);

            try {
                const rtdb = getDatabase();
                const path = `meta/${userId}`;
                const userGoalsRef = rtdb.ref(path);
                
                const snapshot = await userGoalsRef.get();
                
                clearTimeout(timeoutId);
                
                if (!snapshot.exists()) {
                    resolve([]);
                    return;
                }
                
                const goals: UserGoal[] = [];
                snapshot.forEach((childSnapshot: any) => {
                    const data = childSnapshot.val();
                    goals.push({
                        id: childSnapshot.key || '',
                        name: data.name || 'Meta sem nome',
                        targetAmount: parseFloat(data.targetAmount) || 0,
                        currentAmount: parseFloat(data.currentAmount) || 0,
                        deadline: new Date(data.deadline || new Date().setFullYear(new Date().getFullYear() + 1)),
                        category: this.mapGoalCategory(data.category),
                        priority: (['high','medium','low'].includes(data.priority)) ? data.priority : 'medium'
                    });
                });
                
                resolve(goals);
            } catch (error: any) {
                clearTimeout(timeoutId);
                logger.error(`[DataIntegrator] Erro ao ler metas:`, error);
                resolve([]);
            }
        });
    }

    static formatTransactionsForPrompt(transactions: UserTransaction[], context: any): string {
        if (!transactions || transactions.length === 0) return 'Nenhuma transação recente registrada.';
        
        const relevant = this.filterRelevantTransactions(transactions, context);
        if (relevant.length === 0) return 'Nenhuma transação relevante para o contexto atual.';
        
        // Calcular período a partir das transações mais antigas
		const oldestTx = relevant.length > 0 ? relevant[relevant.length - 1] : null;
		let daysToFetch = undefined;
		if (oldestTx) {
			const today = new Date();
			const diffTime = Math.abs(today.getTime() - oldestTx.date.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			daysToFetch = diffDays;
		}
		const summary = this.generateTransactionSummary(relevant, daysToFetch);
        const recentList = relevant.slice(0, 8).map(t => {
            const date = new Date(t.date).toLocaleDateString('pt-BR');
            const amount = t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `• ${date}: ${t.description} - ${amount} (${t.category})`;
        });
        
        return `**RESUMO CALCULADO (use estes valores nas respostas):**\n${summary}\n\n**ÚLTIMAS TRANSAÇÕES (apenas para contexto, não some manualmente):**\n${recentList.join('\n')}`;
    }

    static formatGoalsForPrompt(goals: UserGoal[], context: any): string {
        if (!goals || goals.length === 0) return 'Nenhuma meta financeira registrada.';
        return `**METAS ATIVAS (${goals.length}):**\n${goals.map(g => `• ${g.name}: R$ ${g.currentAmount}/${g.targetAmount}`).join('\n')}`;
    }

    static formatSimulationsForPrompt(simulations: UserSimulation[], context: any): string {
        if (!simulations || simulations.length === 0) return 'Nenhuma simulação recente.';
        return `**SIMULAÇÕES (${simulations.length}):**\n${simulations.map(s => `• ${s.label}`).join('\n')}`;
    }

    private static filterRelevantTransactions(transactions: UserTransaction[], context: any): UserTransaction[] {
        return transactions;
    }

    private static generateTransactionSummary(transactions: UserTransaction[], daysToFetch?: number): string {
       const period = daysToFetch ? `Últimos ${daysToFetch} dias` : 'Período recente';
	   const recent = transactions; // já filtradas pelo período correto
	   const income = recent.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
	   const expenses = recent.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
	   const savings = income - expenses;
	   const expenseCount = recent.filter(t => t.type === 'expense').length;

	   return `${period}:\n• Receitas: R$ ${income.toLocaleString('pt-BR')}\n• Despesas: R$ ${expenses.toLocaleString('pt-BR')} (${expenseCount})\n• Saldo: R$ ${savings.toLocaleString('pt-BR')}\n• Economia: ${income>0?((savings/income)*100).toFixed(1):0}%`;
    }

    private static generateDataSummary(goals: UserGoal[], transactions: UserTransaction[], simulations: UserSimulation[]): string {
        const activeGoals = goals.filter(g => new Date(g.deadline) > new Date() && g.currentAmount < g.targetAmount).length;
        return `Usuário tem ${activeGoals} metas ativas e ${transactions.length} transações recentes.`;
    }

    private static mapGoalCategory(category: string): UserGoal['category'] {
        const valid: UserGoal['category'][] = ['retirement','travel','property','education','emergency','investment'];
        return valid.includes(category as any) ? (category as UserGoal['category']) : 'investment';
    }

    private static getPeriodByPlan(plan?: string): number {
        switch (plan) {
            case 'free': return 3;
            case 'pro': return 30;
            case 'premium': return 90;
            case 'premium_anual': return 9999;
            default: return 30;
        }
    }
}
