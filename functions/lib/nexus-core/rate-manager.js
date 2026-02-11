"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateManager = void 0;
class RateManager {
    constructor() {
        this.limits = new Map();
        this.limits.set('groq', {
            service: 'groq',
            used: 0,
            limit: 90000,
            lastCheck: new Date(),
            isCritical: false
        });
    }
    static getInstance() {
        if (!RateManager.instance) {
            RateManager.instance = new RateManager();
        }
        return RateManager.instance;
    }
    shouldUseFallbackModel() {
        const groqLimit = this.limits.get('groq');
        if (!groqLimit)
            return { useFallback: false };
        const usagePercentage = (groqLimit.used / groqLimit.limit) * 100;
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
    recordUsage(service, tokens) {
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
    processRateLimitError(error) {
        const groqLimit = this.limits.get('groq') || {
            service: 'groq',
            used: 0,
            limit: 90000,
            lastCheck: new Date(),
            isCritical: false
        };
        const errorMsg = error.message || '';
        groqLimit.isCritical = true;
        const waitMatch = errorMsg.match(/try again in (\d+)m(\d+\.\d+)s/);
        if (waitMatch) {
            const minutes = parseInt(waitMatch[1]);
            const seconds = parseFloat(waitMatch[2]);
            const resetTime = new Date();
            resetTime.setMinutes(resetTime.getMinutes() + minutes);
            resetTime.setSeconds(resetTime.getSeconds() + seconds);
            groqLimit.resetTime = resetTime;
        }
        groqLimit.used = groqLimit.limit;
        this.limits.set('groq', groqLimit);
    }
    getFriendlyMessage() {
        const groqLimit = this.limits.get('groq');
        if (!groqLimit?.isCritical)
            return '';
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
    getSuggestedModel() {
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
    canRespondNormally() {
        const groqLimit = this.limits.get('groq');
        if (!groqLimit)
            return true;
        return !groqLimit.isCritical && (groqLimit.used / groqLimit.limit) < 0.9;
    }
    calculateWaitTime(limit) {
        if (!limit.resetTime)
            return 30;
        const now = new Date();
        return Math.ceil((limit.resetTime.getTime() - now.getTime()) / (1000 * 60));
    }
}
exports.RateManager = RateManager;
//# sourceMappingURL=rate-manager.js.map