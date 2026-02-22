"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataIntegrator = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const database_1 = require("firebase-admin/database");
class DataIntegrator {
    static async gatherUserData(userId, userPlan) {
        const timeoutMs = 3000;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`DataIntegrator timeout global`)), timeoutMs));
        const dataPromise = (async () => {
            let goals = [];
            let transactions = [];
            let simulations = [];
            let summary = '';
            let hasData = false;
            let dataStatus = 'ok';
            let error = undefined;
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
            }
            catch (err) {
                logger.error('[DataIntegrator] Erro crítico no fluxo:', err);
                dataStatus = 'error';
                error = err.message;
                summary = 'Erro técnico ao acessar os dados.';
            }
            return { goals, recentTransactions: transactions, simulations, summary, hasData, dataStatus, error };
        })();
        try {
            return await Promise.race([dataPromise, timeoutPromise]);
        }
        catch (timeoutError) {
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
    static async fetchRecentTransactionsWithTimeout(userId, timeout, userPlan) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                logger.warn(`[DataIntegrator] Timeout na busca de transações (${timeout}ms)`);
                resolve([]);
            }, timeout);
            try {
                const rtdb = (0, database_1.getDatabase)();
                const path = `transactions/${userId}`;
                const userTransactionsRef = rtdb.ref(path);
                const snapshot = await userTransactionsRef.orderByKey().get();
                clearTimeout(timeoutId);
                if (!snapshot.exists()) {
                    resolve([]);
                    return;
                }
                const transactions = [];
                const daysToFetch = this.getPeriodByPlan(userPlan);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysToFetch);
                snapshot.forEach((childSnapshot) => {
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
            }
            catch (error) {
                clearTimeout(timeoutId);
                logger.error(`[DataIntegrator] Erro ao ler transações:`, error);
                resolve([]);
            }
        });
    }
    static async fetchUserGoalsWithTimeout(userId, timeout) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                logger.warn(`[DataIntegrator] Timeout na busca de metas (${timeout}ms)`);
                resolve([]);
            }, timeout);
            try {
                const rtdb = (0, database_1.getDatabase)();
                const path = `meta/${userId}`;
                const userGoalsRef = rtdb.ref(path);
                const snapshot = await userGoalsRef.get();
                clearTimeout(timeoutId);
                if (!snapshot.exists()) {
                    resolve([]);
                    return;
                }
                const goals = [];
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    goals.push({
                        id: childSnapshot.key || '',
                        name: data.name || 'Meta sem nome',
                        targetAmount: parseFloat(data.targetAmount) || 0,
                        currentAmount: parseFloat(data.currentAmount) || 0,
                        deadline: new Date(data.deadline || new Date().setFullYear(new Date().getFullYear() + 1)),
                        category: this.mapGoalCategory(data.category),
                        priority: (['high', 'medium', 'low'].includes(data.priority)) ? data.priority : 'medium'
                    });
                });
                resolve(goals);
            }
            catch (error) {
                clearTimeout(timeoutId);
                logger.error(`[DataIntegrator] Erro ao ler metas:`, error);
                resolve([]);
            }
        });
    }
    static formatTransactionsForPrompt(transactions, context) {
        if (!transactions || transactions.length === 0)
            return 'Nenhuma transação recente registrada.';
        const relevant = this.filterRelevantTransactions(transactions, context);
        if (relevant.length === 0)
            return 'Nenhuma transação relevante para o contexto atual.';
        const summary = this.generateTransactionSummary(relevant);
        const recentList = relevant.slice(0, 8).map(t => {
            const date = new Date(t.date).toLocaleDateString('pt-BR');
            const amount = t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `• ${date}: ${t.description} - ${amount} (${t.category})`;
        });
        return `**RESUMO CALCULADO (use estes valores nas respostas):**\n${summary}\n\n**ÚLTIMAS TRANSAÇÕES (apenas para contexto, não some manualmente):**\n${recentList.join('\n')}`;
    }
    static formatGoalsForPrompt(goals, context) {
        if (!goals || goals.length === 0)
            return 'Nenhuma meta financeira registrada.';
        return `**METAS ATIVAS (${goals.length}):**\n${goals.map(g => `• ${g.name}: R$ ${g.currentAmount}/${g.targetAmount}`).join('\n')}`;
    }
    static formatSimulationsForPrompt(simulations, context) {
        if (!simulations || simulations.length === 0)
            return 'Nenhuma simulação recente.';
        return `**SIMULAÇÕES (${simulations.length}):**\n${simulations.map(s => `• ${s.label}`).join('\n')}`;
    }
    static filterRelevantTransactions(transactions, context) {
        return transactions;
    }
    static generateTransactionSummary(transactions) {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const recent = transactions.filter(t => new Date(t.date) >= last30Days);
        const income = recent.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = recent.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const savings = income - expenses;
        const expenseCount = recent.filter(t => t.type === 'expense').length;
        return `Últimos 30 dias:\n• Receitas: R$ ${income.toLocaleString('pt-BR')}\n• Despesas: R$ ${expenses.toLocaleString('pt-BR')} (${expenseCount})\n• Saldo: R$ ${savings.toLocaleString('pt-BR')}\n• Economia: ${income > 0 ? ((savings / income) * 100).toFixed(1) : 0}%`;
    }
    static generateDataSummary(goals, transactions, simulations) {
        const activeGoals = goals.filter(g => new Date(g.deadline) > new Date() && g.currentAmount < g.targetAmount).length;
        return `Usuário tem ${activeGoals} metas ativas e ${transactions.length} transações recentes.`;
    }
    static mapGoalCategory(category) {
        const valid = ['retirement', 'travel', 'property', 'education', 'emergency', 'investment'];
        return valid.includes(category) ? category : 'investment';
    }
    static getPeriodByPlan(plan) {
        switch (plan) {
            case 'free': return 3;
            case 'pro': return 30;
            case 'premium': return 90;
            case 'annual': return 9999;
            default: return 30;
        }
    }
}
exports.DataIntegrator = DataIntegrator;
//# sourceMappingURL=AiAdvisor.js.map