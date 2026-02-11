/**
 * CONTEXT ANALYZER - Analisador de Inteligência Contextual
 * Analisa mensagens do usuário para determinar profundidade, tom e conteúdo necessário
 * ATUALIZADO: Suporte a detecção de perguntas sobre dados do usuário
 */

export interface ContextualInsights {
    // Análise semântica
    primaryIntent: string;
    secondaryIntents: string[];
    
    // Análise de profundidade
    requiresDetailedExplanation: boolean;
    requiresExamples: boolean;
    requiresStepByStep: boolean;
    
    // Análise emocional (básica)
    userTone: 'neutral' | 'curious' | 'concerned' | 'rushed' | 'detailed';
    
    // Análise de conhecimento
    userSophistication: 'beginner' | 'intermediate' | 'advanced';
    
    // Análise temporal
    isTimeSensitive: boolean;
    requiresCurrentData: boolean;
    
    // Análise de relacionamento
    isFirstInteractionToday: boolean;
    prefersConciseAnswers: boolean;
}

export class ContextAnalyzer {
    static analyzeMessage(
        message: string,
        history: Array<{role: string, text: string, timestamp: Date}>,
        userProfile: {
            experienceLevel: 'beginner' | 'intermediate' | 'advanced';
            interactionFrequency: 'low' | 'medium' | 'high';
            preferredDetailLevel: 'low' | 'medium' | 'high';
        }
    ): ContextualInsights {
        const insights: ContextualInsights = {
            primaryIntent: this.extractPrimaryIntent(message),
            secondaryIntents: this.extractSecondaryIntents(message),
            requiresDetailedExplanation: this.requiresDetailedExplanation(message, history),
            requiresExamples: this.requiresExamples(message),
            requiresStepByStep: this.requiresStepByStep(message),
            userTone: this.analyzeUserTone(message, history),
            userSophistication: this.assessUserSophistication(message, history, userProfile),
            isTimeSensitive: this.isTimeSensitive(message),
            requiresCurrentData: this.requiresCurrentData(message),
            isFirstInteractionToday: this.isFirstInteractionToday(history),
            prefersConciseAnswers: this.prefersConciseAnswers(history, userProfile)
        };

        return insights;
    }

    static shouldIncludeMarketData(message: string, insights: ContextualInsights): boolean {
        const marketKeywords = [
            'dólar', 'ibov', 'bolsa', 'ação', 'ações', 'bitcoin', 'cripto',
            'mercado', 'cotação', 'preço', 'valor', 'selic', 'cdi',
            'inflação', 'ipca', 'juros', 'taxa', 'rendimento'
        ];
        
        const hasMarketKeywords = marketKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        return hasMarketKeywords || insights.requiresCurrentData;
    }

    static shouldReferenceGoals(message: string, insights: ContextualInsights): boolean {
        if (insights.primaryIntent === 'investment_advice' || insights.primaryIntent === 'user_data_query') return true;
        
        const goalKeywords = [
            'meta', 'objetivo', 'sonho', 'planejamento', 'futuro',
            'aposentadoria', 'viagem', 'carro', 'casa', 'faculdade'
        ];
        
        return goalKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    static shouldReferenceTransactions(message: string, insights: ContextualInsights): boolean {
        if (insights.primaryIntent === 'user_data_query') return true;
        
        const transactionKeywords = [
            'despesa', 'receita', 'gasto', 'compra', 'conta',
            'orçamento', 'finanças', 'dinheiro', 'salário'
        ];
        
        return transactionKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    static determineResponseLength(insights: ContextualInsights): 'short' | 'medium' | 'long' {
        if (insights.prefersConciseAnswers) return 'short';
        
        if (insights.requiresDetailedExplanation || 
            insights.requiresStepByStep || 
            insights.requiresExamples) {
            return 'long';
        }
        
        if (insights.userSophistication === 'beginner' && 
            (insights.primaryIntent === 'investment_advice' || insights.primaryIntent === 'user_data_query')) {
            return 'long';
        }
        
        if (insights.userTone === 'rushed' || insights.isTimeSensitive) {
            return 'short';
        }
        
        return 'medium';
    }

    // ========== MÉTODOS PRIVADOS ==========

    private static extractPrimaryIntent(message: string): string {
        const messageLower = message.toLowerCase();
        
        const intentPatterns: {pattern: RegExp | string, intent: string}[] = [
            {pattern: /^(oi|olá|bom dia|boa tarde|boa noite)/i, intent: 'greeting'},
            {pattern: /quanto (está|vale|custa)/i, intent: 'price_query'},
            {pattern: /(investir|aplicar|onde colocar|melhor investimento)/i, intent: 'investment_advice'},
            {pattern: /(análise|tendência|previsão|como vai)/i, intent: 'market_analysis'},
            {pattern: /(explicar|como funciona|o que é)/i, intent: 'explanation'},
            {pattern: /(simular|projeção|quanto vai render)/i, intent: 'simulation_request'},
            {pattern: /(comparar|diferença entre|qual melhor)/i, intent: 'comparison'},
            {pattern: /(meta|objetivo|planejamento)/i, intent: 'goal_planning'},
            {pattern: /(quem é você|seu nome|o que é nexus)/i, intent: 'identity_query'},
            {pattern: /(que dia|que horas|data atual)/i, intent: 'time_query'},
            {pattern: /(minhas despesas|minhas receitas|meu orçamento|meus gastos|minha situação)/i, intent: 'user_data_query'}
        ];
        
        for (const {pattern, intent} of intentPatterns) {
            if (typeof pattern === 'string' ? messageLower.includes(pattern) : pattern.test(message)) {
                return intent;
            }
        }
        
        return 'general_query';
    }

    private static extractSecondaryIntents(message: string): string[] {
        const secondaryIntents: string[] = [];
        const messageLower = message.toLowerCase();
        
        const intentKeywords = [
            {keyword: 'também', intent: 'additional_info'},
            {keyword: 'além disso', intent: 'elaboration'},
            {keyword: 'por exemplo', intent: 'example_request'},
            {keyword: 'especificamente', intent: 'specification'},
            {keyword: 'detalhe', intent: 'detailed_explanation'}
        ];
        
        intentKeywords.forEach(({keyword, intent}) => {
            if (messageLower.includes(keyword)) {
                secondaryIntents.push(intent);
            }
        });
        
        return secondaryIntents;
    }

    private static requiresDetailedExplanation(message: string, history: any[]): boolean {
        const detailedIndicators = [
            'como funciona',
            'me explique',
            'detalhadamente',
            'passo a passo',
            'pode detalhar'
        ];
        
        const hasIndicator = detailedIndicators.some(indicator => 
            message.toLowerCase().includes(indicator)
        );
        
        const previousRequests = history.filter(msg => 
            msg.role === 'user' && 
            detailedIndicators.some(indicator => msg.text.toLowerCase().includes(indicator))
        ).length;
        
        return hasIndicator || previousRequests > 0;
    }

    private static requiresExamples(message: string): boolean {
        const exampleIndicators = [
            'por exemplo',
            'exemplo',
            'como assim',
            'ilustre',
            'mostre um caso'
        ];
        
        return exampleIndicators.some(indicator => 
            message.toLowerCase().includes(indicator)
        );
    }

    private static requiresStepByStep(message: string): boolean {
        const stepIndicators = [
            'passo a passo',
            'etapas',
            'sequência',
            'como fazer',
            'procedimento'
        ];
        
        return stepIndicators.some(indicator => 
            message.toLowerCase().includes(indicator)
        );
    }

    private static analyzeUserTone(message: string, history: any[]): 
        'neutral' | 'curious' | 'concerned' | 'rushed' | 'detailed' {
        
        const messageLower = message.toLowerCase();
        
        if (messageLower.includes('??') || messageLower.includes('?!')) return 'concerned';
        if (messageLower.includes('urgente') || messageLower.includes('rápido')) return 'rushed';
        if (messageLower.includes('curiosidad') || messageLower.includes('saberia')) return 'curious';
        if (messageLower.includes('detalhe') || messageLower.includes('especific')) return 'detailed';
        
        const recentMessages = history.slice(-3);
        const hasDetailedQuestions = recentMessages.some(msg => 
            msg.role === 'user' && 
            (msg.text.includes('?') || msg.text.length > 50)
        );
        
        return hasDetailedQuestions ? 'curious' : 'neutral';
    }

    private static assessUserSophistication(
        message: string, 
        history: any[], 
        userProfile: any
    ): 'beginner' | 'intermediate' | 'advanced' {
        if (userProfile.experienceLevel) {
            return userProfile.experienceLevel;
        }
        
        const advancedTerms = [
            'alocação', 'diversificação', 'risk-return', 'duration',
            'markowitz', 'beta', 'alpha', 'juros compostos', 'valuation'
        ];
        
        const intermediateTerms = [
            'cdb', 'lci', 'lca', 'tesouro direto', 'fii', 'etf',
            'ibovespa', 'ipca', 'selic', 'dólar futuro'
        ];
        
        const hasAdvancedTerms = advancedTerms.some(term => 
            message.toLowerCase().includes(term)
        );
        
        const hasIntermediateTerms = intermediateTerms.some(term => 
            message.toLowerCase().includes(term)
        );
        
        if (hasAdvancedTerms) return 'advanced';
        if (hasIntermediateTerms) return 'intermediate';
        
        const totalQuestions = history.filter(msg => msg.role === 'user').length;
        if (totalQuestions > 10) return 'intermediate';
        
        return 'beginner';
    }

    private static isTimeSensitive(message: string): boolean {
        const timeSensitiveIndicators = [
            'agora', 'hoje', 'imediatamente', 'urgente', 'para já',
            'neste momento', 'logo', 'rapidamente'
        ];
        
        return timeSensitiveIndicators.some(indicator => 
            message.toLowerCase().includes(indicator)
        );
    }

    private static requiresCurrentData(message: string): boolean {
        const currentDataIndicators = [
            'hoje', 'agora', 'atual', 'momento', 'última cotação',
            'preço atual', 'valor hoje', 'mercado agora'
        ];
        
        return currentDataIndicators.some(indicator => 
            message.toLowerCase().includes(indicator)
        );
    }

    private static isFirstInteractionToday(history: any[]): boolean {
        if (history.length === 0) return true;
        
        const lastInteraction = history[history.length - 1].timestamp;
        const today = new Date();
        
        return (
            lastInteraction.getDate() !== today.getDate() ||
            lastInteraction.getMonth() !== today.getMonth() ||
            lastInteraction.getFullYear() !== today.getFullYear()
        );
    }

    private static prefersConciseAnswers(history: any[], userProfile: any): boolean {
        if (userProfile.preferredDetailLevel === 'low') return true;
        
        if (history.length < 3) return false;
        
        const userMessages = history
            .filter(msg => msg.role === 'user')
            .slice(-5);
        
        const conciseResponses = userMessages.filter(msg => 
            msg.text.length < 30 || 
            msg.text.toLowerCase().includes('obrigado') ||
            msg.text.toLowerCase().includes('entendi')
        ).length;
        
        return conciseResponses >= 3;
    }
}