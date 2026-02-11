/**
 * RATE MANAGER - Gerenciador Inteligente de Limites de API
 * Monitora e gerencia limites para evitar que o Nexus pare de funcionar
 */

export interface RateLimitStatus {
    service: 'groq' | 'tavily' | 'brapi';
    used: number;
    limit: number;
    resetTime?: Date;
    lastCheck: Date;
    isCritical: boolean;
}

export class RateManager {
    private static instance: RateManager;
    private limits: Map<string, RateLimitStatus> = new Map();
    
    private constructor() {
        // Inicializar com limites conhecidos
        this.limits.set('groq', {
            service: 'groq',
            used: 0,
            limit: 90000, // Margem de segurança: 90% do real
            lastCheck: new Date(),
            isCritical: false
        });
    }
    
    static getInstance(): RateManager {
        if (!RateManager.instance) {
            RateManager.instance = new RateManager();
        }
        return RateManager.instance;
    }
    
    /**
     * Verifica se pode usar o modelo principal ou deve usar fallback
     */
    shouldUseFallbackModel(): { useFallback: boolean; reason?: string; waitTime?: number } {
        const groqLimit = this.limits.get('groq');
        if (!groqLimit) return { useFallback: false };
        
        const usagePercentage = (groqLimit.used / groqLimit.limit) * 100;
        
        // Níveis de alerta
        if (usagePercentage >= 95) {
            return { 
                useFallback: true, 
                reason: 'Limite crítico atingido',
                waitTime: this.calculateWaitTime(groqLimit)
            };
        }
        
        if (usagePercentage >= 85) {
            return { 
                useFallback: true, 
                reason: 'Limite próximo do máximo',
                waitTime: this.calculateWaitTime(groqLimit)
            };
        }
        
        return { useFallback: false };
    }
    
    /**
     * Atualiza uso após uma requisição
     */
    recordUsage(service: 'groq' | 'tavily' | 'brapi', tokens: number): void {
        const limit = this.limits.get(service) || {
            service,
            used: 0,
            limit: service === 'groq' ? 90000 : 10000,
            lastCheck: new Date(),
            isCritical: false
        };
        
        limit.used += tokens;
        limit.lastCheck = new Date();
        limit.isCritical = (limit.used / limit.limit) >= 0.95;
        
        this.limits.set(service, limit);
    }
    
    /**
     * Processa erro de rate limit para extrair informações
     */
    processRateLimitError(error: any): void {
        const groqLimit = this.limits.get('groq') || {
            service: 'groq',
            used: 0,
            limit: 90000,
            lastCheck: new Date(),
            isCritical: false
        };
        
        // Extrair informações do erro
        const errorMsg = error.message || '';
        groqLimit.isCritical = true;
        
        // Tentar extrair tempo de espera
        const waitMatch = errorMsg.match(/try again in (\d+)m(\d+\.\d+)s/);
        if (waitMatch) {
            const minutes = parseInt(waitMatch[1]);
            const seconds = parseFloat(waitMatch[2]);
            const resetTime = new Date();
            resetTime.setMinutes(resetTime.getMinutes() + minutes);
            resetTime.setSeconds(resetTime.getSeconds() + seconds);
            groqLimit.resetTime = resetTime;
        }
        
        // Marcar como usado 100%
        groqLimit.used = groqLimit.limit;
        this.limits.set('groq', groqLimit);
    }
    
    /**
     * Obtém mensagem amigável para o usuário
     */
    getFriendlyMessage(): string {
        const groqLimit = this.limits.get('groq');
        if (!groqLimit?.isCritical) return '';
        
        if (groqLimit.resetTime) {
            const now = new Date();
            const diffMs = groqLimit.resetTime.getTime() - now.getTime();
            const diffMinutes = Math.ceil(diffMs / (1000 * 60));
            
            if (diffMinutes <= 0) {
                return 'Os limites técnicos foram restaurados. Pode continuar!';
            }
            
            return `Estou processando muitas informações no momento. ` +
                   `Por favor, aguarde **${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}** ` +
                   `ou pergunte algo que não precise de dados em tempo real.`;
        }
        
        return 'Estou com limitações técnicas temporárias. ' +
               'Posso ajudá-lo com análise de seus dados financeiros enquanto isso.';
    }
    
    /**
     * Sugere modelo baseado no status
     */
    getSuggestedModel(): { model: string; maxTokens: number } {
        const status = this.shouldUseFallbackModel();
        
        if (status.useFallback) {
            return {
                model: 'llama-3.1-8b-instant',
                maxTokens: 800
            };
        }
        
        return {
            model: 'llama-3.3-70b-versatile',
            maxTokens: 2000
        };
    }
    
    /**
     * Verifica se pode responder normalmente
     */
    canRespondNormally(): boolean {
        const groqLimit = this.limits.get('groq');
        if (!groqLimit) return true;
        
        return !groqLimit.isCritical && (groqLimit.used / groqLimit.limit) < 0.9;
    }
    
    private calculateWaitTime(limit: RateLimitStatus): number {
        if (!limit.resetTime) return 30; // 30 minutos padrão
        
        const now = new Date();
        return Math.ceil((limit.resetTime.getTime() - now.getTime()) / (1000 * 60));
    }
}