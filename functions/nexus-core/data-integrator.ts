import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export interface FinancialProfile {
    monthlyIncome: number;
    emergencyReserveTarget: number;
    emergencyReserveCurrent: number;
}

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
    financialProfile?: FinancialProfile;
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
            let financialProfile: FinancialProfile | undefined = undefined;
            let summary = '';
            let hasData = false;
            let dataStatus: 'ok' | 'empty' | 'error' = 'ok';
            let error: string | undefined = undefined;

            try {
                logger.info(`[DataIntegrator] Iniciando coleta para userId: ${userId}`);
                
                const [txs, glds, userDoc] = await Promise.all([
                    this.fetchRecentTransactionsWithTimeout(userId, 2500, userPlan),
                    this.fetchUserGoalsWithTimeout(userId, 2500),
                    getFirestore().doc(`users/${userId}`).get()
                ]);
                transactions = txs;
                goals = glds;
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    financialProfile = userData?.financialProfile;
                }

                const totalItems = goals.length + transactions.length;
                hasData = totalItems > 0;
                dataStatus = hasData ? 'ok' : 'empty';
                summary = this.generateDataSummary(goals, transactions, simulations, financialProfile);
                
                logger.info(`[DataIntegrator] Sucesso. userId=${userId}, transações=${transactions.length}, metas=${goals.length}, status=${dataStatus}`);

            } catch (err: any) {
                logger.error('[DataIntegrator] Erro crítico no fluxo:', err);
                dataStatus = 'error';
                error = err.message;
                summary = 'Erro técnico ao acessar os dados.';
            }

            return { goals, recentTransactions: transactions, simulations, summary, hasData, dataStatus, error, financialProfile };
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
                
                const daysToFetch = this.getPeriodByPlan(userPlan);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysToFetch);
                const cutoffStr = cutoffDate.toISOString().split('T')[0];

                const snapshot = await userTransactionsRef
                    .orderByChild('date')
                    .startAt(cutoffStr)
                    .get();
                
                clearTimeout(timeoutId);
                
                if (!snapshot.exists()) {
                    resolve([]);
                    return;
                }
                
                const transactions: UserTransaction[] = [];
                snapshot.forEach((childSnapshot: any) => {
                    const data = childSnapshot.val();
                    const transactionDate = new Date(data.date);
                    
                    transactions.push({
                        id: childSnapshot.key || '',
                        date: transactionDate,
                        description: data.description?.trim() || 'Sem descrição',
                        amount: parseFloat(data.amount) || 0,
                        category: data.category || 'Outros',
                        type: data.type === 'income' ? 'income' : 'expense',
                        userId: data.userId || userId
                    });
                });
                
                transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
                
                logger.info(`[DataIntegrator] ${transactions.length} transações dos últimos ${daysToFetch} dias (Filtro: ${cutoffStr})`);
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

    static formatTransactionsForPrompt(transactions: UserTransaction[], _context: any): string {
        if (!transactions || transactions.length === 0) return 'Nenhuma transação recente registrada.';
        
        const relevant = this.filterRelevantTransactions(transactions, _context);
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

    static formatGoalsForPrompt(goals: UserGoal[], _context: any): string {
        if (!goals || goals.length === 0) return 'Nenhuma meta financeira registrada.';
        return `**METAS ATIVAS (${goals.length}):**\n${goals.map(g => `• ${g.name}: R$ ${g.currentAmount}/${g.targetAmount}`).join('\n')}`;
    }

    static formatAssetsSummary(assets: any[]): string {
        if (!assets || assets.length === 0) return '\n🏦 Ativos patrimoniais / produtivos: Nenhum ativo registrado.';
        
        return `\n🏦 ATIVOS PATRIMONIAIS / PRODUTIVOS (${assets.length} itens):\n` +
          assets.map((a: any) => {
            const nome = a.name || a.description || 'Item sem nome';
            const categoria = a.category || 'Outros';
            const valor = Number(a.currentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `  • ${nome} (${categoria}): R$ ${valor}`;
          }).join('\n');
    }

    static formatPassivesSummary(passives: any[]): string {
        if (!passives || passives.length === 0) return '\n🏠 Passivos patrimoniais / imobilizados: Nenhum passivo registrado.';
        
        return `\n🏠 PASSIVOS PATRIMONIAIS / IMOBILIZADOS (${passives.length} itens):\n` +
          passives.map((p: any) => {
            const nome = p.description || p.name || 'Item sem nome';
            const categoria = p.category || 'Outros';
            const valor = Number(p.currentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `  • ${nome} (${categoria}): R$ ${valor}`;
          }).join('\n');
    }

    static formatDebtsSummary(debts: any[]): string {
        if (!debts || debts.length === 0) return '\n💳 Dívidas: Nenhuma dívida cadastrada no app.';
        
        return `\n💳 DÍVIDAS CADASTRADAS (${debts.length} itens):\n` +
          debts.map((d: any) => {
            const nome = d.nome || 'Dívida sem nome';
            const tipo = d.tipo || 'Outros';
            const saldo = Number(d.saldoDevedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const taxa = Number(d.taxaMensal || 0).toFixed(2);
            const parcelas = d.parcelasRestantes ?? 'N/A';
            const parcela = d.valorParcela ? `R$ ${Number(d.valorParcela).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês` : 'N/A';
            return `  • ${nome} (${tipo}): Saldo R$ ${saldo} | Taxa ${taxa}%/mês | ${parcelas} parcelas restantes | Parcela: ${parcela}`;
          }).join('\n');
    }

    static formatPatrimonioVisaoGerencial(assets: any[], passives: any[]): string {
        const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0);
        const totalPassives = passives.reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);
        const patrimonioTotalMonitorado = totalAssets + totalPassives;

        return `📊 VISÃO PATRIMONIAL DO APP:\n` +
        `• Total em ativos patrimoniais / produtivos: R$ ${totalAssets.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `• Total em passivos patrimoniais / imobilizados: R$ ${totalPassives.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `• Patrimônio total monitorado no app: R$ ${patrimonioTotalMonitorado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `ℹ️ No Finanças Pro Invest, "passivos" são bens patrimoniais que exigem manutenção/aportes e não devem ser tratados automaticamente como dívidas.`;
    }

    static formatSimulationsForPrompt(simulations: UserSimulation[], _context: any): string {
        if (!simulations || simulations.length === 0) return 'Nenhuma simulação recente.';
        return `**SIMULAÇÕES (${simulations.length}):**\n${simulations.map(s => `• ${s.label}`).join('\n')}`;
    }

    private static filterRelevantTransactions(transactions: UserTransaction[], _context: any): UserTransaction[] {
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
    private static generateDataSummary(goals: UserGoal[], transactions: UserTransaction[], _simulations: UserSimulation[], financialProfile?: FinancialProfile): string {
        const activeGoals = goals.filter(g => new Date(g.deadline) > new Date() && g.currentAmount < g.targetAmount).length;
        
        let summaryText = "";

        // Colocamos o Perfil Financeiro no TOPO para ser a primeira coisa que a IA lê
        if (financialProfile) {
            summaryText += `### PERFIL FINANCEIRO DECLARADO (PRIORIDADE MÁXIMA) ###\n`;
            summaryText += `ESTE É O DADO OFICIAL PARA O PLANO. IGNORE MÉDIAS DE LANÇAMENTOS ANTERIORES SE CONFLITAREM COM ISTO:\n`;
            summaryText += `- Renda Mensal Líquida: R$ ${financialProfile.monthlyIncome}\n`;
            summaryText += `- Meta da Reserva de Emergência: ${financialProfile.emergencyReserveTarget} meses de custo de vida\n`;
            summaryText += `- Saldo Atual da Reserva: R$ ${financialProfile.emergencyReserveCurrent}\n`;
            summaryText += `\nINSTRUÇÃO: Use a 'Renda Mensal Líquida' acima como a base de cálculo para o fôlego financeiro e amortizações extras. Não pergunte a renda ao usuário.\n\n`;
        }

        summaryText += `### CONTEXTO SECUNDÁRIO (HISTÓRICO) ###\n`;
        summaryText += `Usuário possui ${activeGoals} metas ativas e ${transactions.length} transações recentes no gerenciador financeiro.`;

        return summaryText;
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
