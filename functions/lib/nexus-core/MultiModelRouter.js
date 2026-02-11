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
exports.MultiModelRouter = void 0;
const logger = __importStar(require("firebase-functions/logger"));
class MultiModelRouter {
    constructor() {
        this.providers = new Map();
        this.cache = new Map();
        this.CACHE_TTL = 2 * 60 * 1000;
        this.initializeProviders();
    }
    static getInstance() {
        if (!MultiModelRouter.instance) {
            MultiModelRouter.instance = new MultiModelRouter();
        }
        return MultiModelRouter.instance;
    }
    initializeProviders() {
        this.providers.set('openrouter', {
            name: 'openrouter',
            apiKey: '',
            baseURL: 'https://openrouter.ai/api/v1',
            models: {
                primary: 'deepseek/deepseek-v3.1:free',
                fallbacks: [
                    'xiaomi/mimo-v2-flash:free',
                    'meta-llama/llama-3.3-70b-instruct:free'
                ]
            },
            priority: 1,
            isAvailable: true,
            errorCount: 0,
            maxTokens: 8000,
            headers: {
                'HTTP-Referer': 'https://financas-pro-invest.web.app',
                'X-Title': 'Nexus Financial'
            }
        });
        this.providers.set('mistral', {
            name: 'mistral',
            apiKey: '',
            baseURL: 'https://api.mistral.ai/v1',
            models: {
                primary: 'mistral-small-latest'
            },
            priority: 2,
            isAvailable: true,
            errorCount: 0,
            maxTokens: 8000
        });
        this.providers.set('gemini', {
            name: 'gemini',
            apiKey: '',
            baseURL: 'https://generativelanguage.googleapis.com/v1beta',
            models: {
                primary: 'gemini-2.0-flash-exp'
            },
            priority: 3,
            isAvailable: true,
            errorCount: 0,
            maxTokens: 8000
        });
    }
    updateApiKeys(keys) {
        if (keys.gemini) {
            const p = this.providers.get('gemini');
            if (p)
                p.apiKey = keys.gemini;
        }
        if (keys.openrouter) {
            const p = this.providers.get('openrouter');
            if (p)
                p.apiKey = keys.openrouter;
        }
        if (keys.mistral) {
            const p = this.providers.get('mistral');
            if (p)
                p.apiKey = keys.mistral;
        }
    }
    async routeRequest(messages, systemPrompt, options) {
        const cacheKey = this.generateCacheKey(messages);
        const cached = this.getCachedResponse(cacheKey);
        if (cached)
            return { ...cached.response, cached: true };
        const sortedProviders = this.getAvailableProviders();
        for (const provider of sortedProviders) {
            if (!provider.apiKey) {
                logger.warn(`[Router] ${provider.name} sem API key - pulando`);
                continue;
            }
            try {
                logger.info(`[Router] Tentando: ${provider.name} (prioridade ${provider.priority})`);
                const response = await this.tryProvider(provider, messages, systemPrompt, options);
                if (response.success) {
                    this.resetProviderErrors(provider.name);
                    this.cacheResponse(cacheKey, response);
                    logger.info(`[Router] ✓ ${provider.name} (${response.model}) - ${response.tokensUsed} tokens`);
                    return response;
                }
            }
            catch (error) {
                logger.error(`[Router] ${provider.name} falhou: ${error.message}`);
                this.markProviderError(provider.name);
                if (provider.name === 'openrouter' && provider.models.fallbacks) {
                    for (const fallbackModel of provider.models.fallbacks) {
                        try {
                            logger.info(`[Router] Tentando fallback: ${fallbackModel}`);
                            const fallbackRes = await this.tryProviderWithModel(provider, fallbackModel, messages, systemPrompt, options);
                            if (fallbackRes.success) {
                                logger.info(`[Router] ✓ OpenRouter fallback: ${fallbackModel}`);
                                return fallbackRes;
                            }
                        }
                        catch (fbError) {
                            logger.warn(`[Router] Fallback ${fallbackModel} falhou`);
                        }
                    }
                }
            }
        }
        logger.error("[Router] ⚠️ Todos providers falharam - modo contingência");
        return this.getContingencyResponse(options?.fallbackContext);
    }
    async tryProvider(provider, messages, systemPrompt, options) {
        return this.tryProviderWithModel(provider, provider.models.primary, messages, systemPrompt, options);
    }
    async tryProviderWithModel(provider, modelName, messages, systemPrompt, options) {
        if (!provider.isAvailable) {
            throw new Error('Provider indisponível');
        }
        if (provider.name === 'gemini') {
            return this.callGemini(provider, modelName, messages, systemPrompt, options);
        }
        return this.callOpenAIFormat(provider, modelName, messages, systemPrompt, options);
    }
    async callGemini(provider, modelName, messages, systemPrompt, options) {
        const contents = [];
        if (systemPrompt) {
            contents.push({
                role: 'user',
                parts: [{ text: `[INSTRUÇÕES DO SISTEMA]\n${systemPrompt}\n\n[FIM DAS INSTRUÇÕES]` }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'Entendido. Vou seguir essas diretrizes.' }]
            });
        }
        messages.forEach(msg => {
            if (msg.role === 'system')
                return;
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
        const requestBody = {
            contents,
            generationConfig: {
                temperature: options?.temperature || 0.6,
                maxOutputTokens: options?.maxTokens || provider.maxTokens
            }
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        try {
            const response = await fetch(`${provider.baseURL}/models/${modelName}:generateContent?key=${provider.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[Gemini] HTTP ${response.status}: ${errorText.substring(0, 150)}`);
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error('Resposta inválida do Gemini');
            }
            return {
                success: true,
                content: text,
                provider: provider.name,
                model: modelName,
                tokensUsed: data.usageMetadata?.totalTokenCount || 0,
                cached: false
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    async callOpenAIFormat(provider, modelName, messages, systemPrompt, options) {
        const fullMessages = systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages;
        const requestBody = {
            model: modelName,
            messages: fullMessages,
            temperature: options?.temperature || 0.6,
            max_tokens: options?.maxTokens || provider.maxTokens,
            stream: false
        };
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
            ...(provider.headers || {})
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        try {
            const response = await fetch(`${provider.baseURL}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[${provider.name}] HTTP ${response.status}: ${errorText.substring(0, 150)}`);
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            const message = data.choices?.[0]?.message;
            if (!message) {
                throw new Error('Resposta inválida');
            }
            return {
                success: true,
                content: message.content || '',
                provider: provider.name,
                model: modelName,
                tokensUsed: data.usage?.total_tokens || 0,
                cached: false
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    getAvailableProviders() {
        return Array.from(this.providers.values())
            .filter(p => p.isAvailable)
            .sort((a, b) => a.priority - b.priority);
    }
    markProviderError(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider)
            return;
        provider.errorCount++;
        logger.warn(`[Router] ${providerName}: ${provider.errorCount}/5 erros`);
        if (provider.errorCount >= 5) {
            provider.isAvailable = false;
            logger.error(`[Router] ${providerName} DESATIVADO temporariamente`);
            setTimeout(() => {
                provider.isAvailable = true;
                provider.errorCount = 0;
                logger.info(`[Router] ${providerName} reativado`);
            }, 2 * 60 * 1000);
        }
    }
    resetProviderErrors(providerName) {
        const provider = this.providers.get(providerName);
        if (provider && provider.errorCount > 0) {
            provider.errorCount = 0;
        }
    }
    getContingencyResponse(context) {
        const userName = context?.userName || 'Investidor';
        const content = `${userName}, estou com instabilidade momentânea. Por favor, tente novamente em alguns instantes.`;
        return {
            success: true,
            content: content,
            provider: 'contingency',
            model: 'fallback',
            tokensUsed: 0,
            cached: false
        };
    }
    generateCacheKey(messages) {
        return JSON.stringify(messages.slice(-2));
    }
    getCachedResponse(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached;
        }
        if (cached)
            this.cache.delete(key);
        return null;
    }
    cacheResponse(key, response) {
        if (this.cache.size > 500)
            this.cache.clear();
        this.cache.set(key, { response, timestamp: Date.now() });
    }
}
exports.MultiModelRouter = MultiModelRouter;
//# sourceMappingURL=MultiModelRouter.js.map