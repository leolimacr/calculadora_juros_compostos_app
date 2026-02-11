/**
 * DISCRETION ENGINE 2.0 - Motor de Bom Senso Contextual Avançado
 * Toma decisões inteligentes sobre quando falar, quanto falar e como falar
 */

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

export class DiscretionEngine {
    static analyzeContext(
        userMessage: string,
        messageHistory: Array<{role: string, text: string, timestamp?: Date}>,
        userData: {
            hasGoals: boolean;
            hasRecentTransactions: boolean;
            hasSimulations: boolean;
        }
    ): {
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
    } {
        const message = userMessage.toLowerCase().trim();
        
        // Detectar se é um teste de presença
        const isTesting = this.isTestingPresence(message, messageHistory);
        
        const intent = isTesting ? 'presence_check' : this.determineIntent(message);
        const complexity = this.assessComplexity(message, intent, messageHistory);
        const requirements = this.analyzeDataRequirements(message, intent);
        const isSimpleGreeting = this.isSimpleGreeting(message, intent);
        const shouldSuggest = this.shouldSuggestActions(message, intent, messageHistory, userData);
        const timeOfDay = this.getTimeOfDay();
        const userMood = this.analyzeUserMood(message, messageHistory);
        const requiresFollowUp = this.requiresFollowUp(message, intent, messageHistory);
        
        return {
            intent,
            complexity,
            requiresMarketData: requirements.marketData,
            requiresDate: requirements.date,
            requiresTime: requirements.time,
            isSimpleGreeting,
            shouldSuggest,
            timeOfDay,
            userMood,
            requiresFollowUp,
            isProbablyTesting: isTesting
        };
    }
    
    static makeDecision(
        contextAnalysis: ReturnType<typeof DiscretionEngine.analyzeContext>,
        userData: {
            hasGoals: boolean;
            hasRecentTransactions: boolean;
            hasSimulations: boolean;
        }
    ): DiscretionDecision {
        const decision: DiscretionDecision = {
            responseDepth: 'concise',
            includeMarketData: false,
            includeGoals: false,
            includeTransactions: false,
            includeSimulations: false,
            shouldSuggestActions: false,
            shouldOfferWebSearch: false,
            shouldProposeSimulation: false,
            useBulletPoints: false,
            useParagraphs: true,
            includeClosingQuestion: false,
            formalityLevel: 'high',
            useFirstNameFrequency: 'occasional',
            includeDateTime: 'none',
            shouldAcknowledgePreviousMessage: false,
            shouldBeExtraPolite: false
        };
        
        // ========== DETECÇÃO DE TESTE DE PRESENÇA ==========
        if (contextAnalysis.isProbablyTesting || contextAnalysis.intent === 'presence_check') {
            decision.responseDepth = 'minimal';
            decision.includeClosingQuestion = true;
            decision.useFirstNameFrequency = 'frequent';
            decision.formalityLevel = 'medium';
            decision.shouldAcknowledgePreviousMessage = true;
            return decision;
        }
        
        // ========== ANÁLISE DE HUMOR DO USUÁRIO ==========
        switch (contextAnalysis.userMood) {
            case 'impatient':
                decision.responseDepth = 'minimal';
                decision.useBulletPoints = false;
                decision.includeClosingQuestion = false;
                decision.formalityLevel = 'medium';
                decision.shouldBeExtraPolite = true;
                break;
                
            case 'confused':
                decision.responseDepth = 'detailed';
                decision.useBulletPoints = true;
                decision.includeClosingQuestion = true;
                decision.formalityLevel = 'medium';
                decision.shouldBeExtraPolite = true;
                break;
                
            case 'curious':
                decision.responseDepth = 'comprehensive';
                decision.useBulletPoints = true;
                decision.includeClosingQuestion = true;
                decision.formalityLevel = 'medium';
                break;
                
            case 'detailed':
                decision.responseDepth = 'detailed';
                decision.useBulletPoints = true;
                decision.includeClosingQuestion = true;
                decision.formalityLevel = 'high';
                break;
                
            case 'testing':
                decision.responseDepth = 'minimal';
                decision.includeClosingQuestion = true;
                decision.useFirstNameFrequency = 'frequent';
                break;
        }
        
        // ========== DECISÕES BASEADAS NA INTENÇÃO ==========
        switch (contextAnalysis.intent) {
            case 'greeting':
                decision.responseDepth = 'minimal';
                decision.includeClosingQuestion = true;
                decision.shouldSuggestActions = false;
                decision.useFirstNameFrequency = 'frequent';
                decision.includeDateTime = 'none';
                decision.shouldAcknowledgePreviousMessage = contextAnalysis.requiresFollowUp;
                break;
                
            case 'market_query':
                decision.responseDepth = contextAnalysis.complexity === 'high' ? 'detailed' : 'concise';
                decision.includeMarketData = true;
                decision.shouldOfferWebSearch = contextAnalysis.requiresMarketData;
                decision.useBulletPoints = contextAnalysis.complexity === 'high';
                decision.formalityLevel = 'high';
                decision.includeDateTime = contextAnalysis.requiresTime ? 'both' : 
                                          contextAnalysis.requiresDate ? 'date' : 'none';
                decision.includeClosingQuestion = contextAnalysis.complexity === 'high';
                break;
                
            case 'investment_advice':
                decision.responseDepth = 'comprehensive';
                decision.includeMarketData = true;
                decision.includeGoals = userData.hasGoals;
                decision.includeTransactions = userData.hasRecentTransactions;
                decision.includeSimulations = userData.hasSimulations;
                decision.shouldSuggestActions = true;
                decision.shouldProposeSimulation = true;
                decision.useBulletPoints = true;
                decision.formalityLevel = 'medium';
                decision.useFirstNameFrequency = 'frequent';
                decision.includeClosingQuestion = true;
                decision.shouldBeExtraPolite = true; // Importante para CVM
                break;
                
            case 'identity_query':
                decision.responseDepth = 'minimal';
                decision.includeClosingQuestion = true;
                decision.formalityLevel = 'high';
                decision.shouldAcknowledgePreviousMessage = true;
                break;
                
            case 'date_time_query':
                decision.responseDepth = 'minimal';
                decision.includeClosingQuestion = true;
                decision.includeDateTime = 'both';
                break;
                
            case 'user_data_query':
                decision.responseDepth = 'detailed';
                decision.includeGoals = userData.hasGoals;
                decision.includeTransactions = userData.hasRecentTransactions;
                decision.includeSimulations = userData.hasSimulations;
                decision.shouldSuggestActions = true;
                decision.useBulletPoints = true;
                decision.formalityLevel = 'medium';
                decision.useFirstNameFrequency = 'frequent';
                decision.includeClosingQuestion = true;
                break;
                
            case 'explanation_query':
                decision.responseDepth = 'detailed';
                decision.useBulletPoints = true;
                decision.includeClosingQuestion = true;
                decision.formalityLevel = 'medium';
                decision.shouldBeExtraPolite = true;
                break;
                
            case 'follow_up':
                decision.responseDepth = 'concise';
                decision.shouldAcknowledgePreviousMessage = true;
                decision.useFirstNameFrequency = 'occasional';
                decision.includeClosingQuestion = false;
                break;
        }
        
        // ========== REGRAS DE BOM SENSO ==========
        
        // Se é uma saudação simples subsequente, não repetir saudação completa
        if (contextAnalysis.isSimpleGreeting && contextAnalysis.requiresFollowUp) {
            decision.responseDepth = 'minimal';
            decision.shouldSuggestActions = false;
            decision.includeClosingQuestion = true;
        }
        
        // Se o usuário parece impaciente, ser mais direto
        if (contextAnalysis.userMood === 'impatient') {
            decision.responseDepth = 'minimal';
            decision.useBulletPoints = false;
            decision.includeClosingQuestion = false;
            decision.shouldBeExtraPolite = true;
        }
        
        // Se é baixa complexidade, evitar formatação complexa
        if (contextAnalysis.complexity === 'low') {
            decision.responseDepth = 'minimal';
            decision.useBulletPoints = false;
            decision.includeClosingQuestion = false;
        }
        
        // Se o usuário pediu especificamente por algo, incluir
        if (contextAnalysis.requiresMarketData) {
            decision.includeMarketData = true;
        }
        
        return decision;
    }
    
    // ========== MÉTODOS PRIVADOS APRIMORADOS ==========
    
    private static isTestingPresence(message: string, history: any[]): boolean {
        // CORREÇÃO CRÍTICA DO DEEPSEEK: Se não há histórico, é a primeira interação.
        // Nunca tratar a primeira mensagem como teste, mesmo que seja "Oi".
        if (!history || history.length === 0) return false;

        const testPatterns = [
            'oi', 'olá', 'tá aí', 'still there', 'ainda está aí', 'hello?', 
            'alô', 'testando', 'hey', 'opa'
        ];
        
        const isShortTest = testPatterns.some(pattern => 
            message.toLowerCase() === pattern || message.toLowerCase().startsWith(pattern + ' ')
        );
        
        if (!isShortTest) return false;
        
        // Verificar contexto: se já conversamos recentemente
        const lastMessage = history[history.length - 1];
        const timeSinceLast = lastMessage.timestamp ? 
            (new Date().getTime() - new Date(lastMessage.timestamp).getTime()) / 1000 : 0;
        
        // Se a última mensagem foi há mais de 30 segundos, pode ser um novo início
        if (timeSinceLast > 30) return false;
        
        // Se já respondemos recentemente e ele manda "oi" de novo, é teste
        return history.length > 2 && message.length < 10;
    }
    
    private static determineIntent(message: string): string {
        const messageLower = message.toLowerCase();
        
        if (this.isSimpleGreeting(messageLower, '')) return 'greeting';
        
        const marketKeywords = ['dólar', 'ibov', 'ação', 'ações', 'bitcoin', 'mercado', 'cotação', 'preço', 'valor'];
        const investmentKeywords = ['investir', 'aplicar', 'onde colocar', 'melhor investimento', 'onde investir', 'recomende investimento'];
        const identityKeywords = ['quem é você', 'seu nome', 'você é', 'o que é nexus'];
        const dateKeywords = ['que dia é hoje', 'qual a data', 'que horas são', 'dia atual', 'hora atual'];
        const userDataKeywords = [
            'minhas despesas', 'minhas receitas', 'meu orçamento', 'meus gastos', 'minha situação',
            'meus lançamentos', 'minhas transações', 'meu saldo', 'meus registros', 
            'meus dados', 'minha conta', 'como estão meus', 'lançamentos de despesas'
        ];
        const explanationKeywords = ['o que é', 'como funciona', 'diferença entre', 'significa', 'qual a diferença'];
        const followUpKeywords = ['e', 'também', 'além disso', 'outra coisa', 'certo', 'então'];
        
        // Ordem de precedência (CORRIGIDA)
        if (userDataKeywords.some(k => messageLower.includes(k))) return 'user_data_query';
        if (explanationKeywords.some(k => messageLower.includes(k))) return 'explanation_query';
        if (marketKeywords.some(k => messageLower.includes(k))) return 'market_query';
        if (investmentKeywords.some(k => messageLower.includes(k))) return 'investment_advice';
        if (identityKeywords.some(k => messageLower.includes(k))) return 'identity_query';
        if (dateKeywords.some(k => messageLower.includes(k))) return 'date_time_query';
        if (followUpKeywords.some(k => messageLower.startsWith(k)) && messageLower.length < 50) return 'follow_up';
        
        return 'general_query';
    }
    
    private static assessComplexity(message: string, intent: string, history: any[]): 'low' | 'medium' | 'high' {
        // Mensagens muito curtas são de baixa complexidade
        if (message.split(' ').length <= 3) return 'low';
        
        // Perguntas de investimento são sempre altas (devido à CVM)
        if (intent === 'investment_advice') return 'high';
        
        // Perguntas explicativas são altas
        if (intent === 'explanation_query') return 'high';
        
        // Se o usuário já fez várias perguntas seguidas
        const recentUserMessages = history
            .filter((h: any) => h.role === 'user')
            .slice(-3);
            
        if (recentUserMessages.length >= 2) {
            const timeBetween = recentUserMessages.length > 1 ? 
                Math.abs(
                    new Date(recentUserMessages[0].timestamp || Date.now()).getTime() - 
                    new Date(recentUserMessages[1].timestamp || Date.now()).getTime()
                ) / 1000 : 0;
                 
            if (timeBetween < 30 && message.length < 100) {
                return 'low'; // Usuário parece ter pressa
            }
        }
        
        // Perguntas com "por que" ou "como" são médias/altas
        if (message.includes('por que') || message.includes('como')) {
            return message.length > 50 ? 'high' : 'medium';
        }
        
        return 'medium';
    }
    
    private static analyzeDataRequirements(message: string, intent: string): {
        marketData: boolean;
        date: boolean;
        time: boolean;
    } {
        const requirements = {
            marketData: false,
            date: false,
            time: false
        };
        
        if (intent === 'market_query') {
            requirements.marketData = true;
            
            // Análise inteligente de contexto
            const timeIndicators = ['agora', 'neste momento', 'atualmente'];
            const dateIndicators = ['hoje', 'nesta data'];
            const nowIndicators = ['quanto está agora', 'preço agora'];
            
            requirements.time = timeIndicators.some(i => message.includes(i)) || 
                               nowIndicators.some(i => message.includes(i));
            requirements.date = dateIndicators.some(i => message.includes(i));
            
            // Para perguntas genéricas de preço, incluir data para contexto
            if (!requirements.time && !requirements.date && message.includes('quanto está')) {
                requirements.date = true;
            }
        }
        
        if (intent === 'date_time_query') {
            if (message.includes('hora') || message.includes('horas')) {
                requirements.time = true;
            }
            if (message.includes('dia') || message.includes('data')) {
                requirements.date = true;
            }
            // Perguntas completas incluem ambos
            if (message.includes('que horas são') || message.includes('que dia é hoje')) {
                requirements.date = true;
                requirements.time = true;
            }
        }
        
        return requirements;
    }
    
    private static isSimpleGreeting(message: string, intent: string): boolean {
        if (intent === 'greeting') return true;
        
        const simpleGreetings = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'hey', 'opa', 'hello', 'hi'];
        const isGreeting = simpleGreetings.some(greeting => 
            message.toLowerCase().startsWith(greeting) && message.split(' ').length <= 4
        );
        
        return isGreeting;
    }
    
    private static shouldSuggestActions(
        message: string, 
        intent: string, 
        history: any[],
        userData: any
    ): boolean {
        // Nunca sugerir em saudações simples
        if (intent === 'greeting') return false;
        
        // Não sugerir se o usuário parece ter pressa
        if (message.includes('rápido') || message.includes('urgente') || message.includes('agora')) {
            return false;
        }
        
        // Analisar histórico recente
        const recentMessages = history.slice(-5);
        const hasRejectedSuggestions = recentMessages.some((msg: any) => 
            msg.role === 'user' && 
            (msg.text.toLowerCase().includes('não quero') || 
             msg.text.toLowerCase().includes('sem sugestão'))
        );
        
        if (hasRejectedSuggestions) return false;
        
        // Para investimentos: sugerir apenas conceitos, nunca produtos
        if (intent === 'investment_advice') return true;
        
        // Para dados do usuário: sugerir análise
        if (intent === 'user_data_query') return true;
        
        // Não sugerir em conversas muito longas
        if (history.length > 10) return false;
        
        return false;
    }
    
    private static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
        const now = new Date();
        const options = { timeZone: 'America/Sao_Paulo' };
        const hour = new Date(now.toLocaleString('en-US', options)).getHours();
        
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    }
    
    private static analyzeUserMood(message: string, history: any[]): 
        'neutral' | 'curious' | 'impatient' | 'confused' | 'detailed' | 'testing' {
        
        const messageLower = message.toLowerCase();
        
        // Indicadores diretos
        if (messageLower.includes('???') || messageLower.includes('!!')) return 'impatient';
        if (messageLower.includes('?') && messageLower.length < 15) return 'confused';
        if (messageLower.includes('entendeu') || messageLower.includes('tá aí')) return 'testing';
        if (messageLower.includes('explic') || messageLower.includes('como funciona')) return 'curious';
        if (messageLower.includes('detalhe') || messageLower.includes('especific')) return 'detailed';
        
        // Análise de padrão
        const recentMessages = history.slice(-3);
        
        // Múltiplas mensagens seguidas muito breves
        if (recentMessages.length >= 2 && recentMessages.every(m => m.role === 'user')) {
            const allShort = recentMessages.every(m => m.text.length < 30);
            if (allShort) return 'impatient';
        }
        
        // Silêncio seguido de mensagem curta
        if (history.length > 0) {
            const lastMsg = history[history.length - 1];
            if (lastMsg.role === 'assistant' || lastMsg.role === 'ai') {
                const timeSince = lastMsg.timestamp ? 
                    (new Date().getTime() - new Date(lastMsg.timestamp).getTime()) / 1000 : 0;
                
                if (timeSince > 60 && message.length < 20) {
                    return 'testing';
                }
            }
        }
        
        return 'neutral';
    }
    
    private static requiresFollowUp(message: string, intent: string, history: any[]): boolean {
        if (intent === 'follow_up') return true;
        
        // Se a última mensagem foi nossa e esta é uma continuação
        if (history.length > 0) {
            const lastMessage = history[history.length - 1];
            if (lastMessage.role === 'assistant' || lastMessage.role === 'ai') {
                // Mensagens que claramente continuam a conversa
                const continuations = ['certo', 'então', 'e', 'também', 'além'];
                if (continuations.some(c => message.toLowerCase().startsWith(c))) {
                    return true;
                }
            }
        }
        
        return false;
    }
}
