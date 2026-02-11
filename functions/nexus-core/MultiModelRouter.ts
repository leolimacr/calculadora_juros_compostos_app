/**
 * MULTI-MODEL ROUTER - Cascata Otimizada
 * 1º OpenRouter (DeepSeek/MiMo/Llama) → 2º Mistral → 3º Gemini
 */

import * as logger from "firebase-functions/logger";

export interface ModelProvider {
  name: string;
  apiKey: string;
  baseURL: string;
  models: {
    primary: string;
    fallbacks?: string[];
  };
  priority: number;
  isAvailable: boolean;
  errorCount: number;
  maxTokens: number;
  headers?: Record<string, string>;
}

export interface RouterResponse {
  success: boolean;
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cached: boolean;
}

export class MultiModelRouter {
  private static instance: MultiModelRouter;
  private providers: Map<string, ModelProvider> = new Map();
  private cache: Map<string, { response: RouterResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 2 * 60 * 1000;

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): MultiModelRouter {
    if (!MultiModelRouter.instance) {
      MultiModelRouter.instance = new MultiModelRouter();
    }
    return MultiModelRouter.instance;
  }

  private initializeProviders(): void {
    // 1º TIER: OpenRouter (Hub com múltiplos modelos) - PRIORIDADE MÁXIMA
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
      priority: 1,  // ← PRIMEIRA TENTATIVA
      isAvailable: true,
      errorCount: 0,
      maxTokens: 8000,
      headers: {
        'HTTP-Referer': 'https://financas-pro-invest.web.app',
        'X-Title': 'Nexus Financial'
      }
    });

    // 2º TIER: Mistral Direto - BACKUP ROBUSTO
    this.providers.set('mistral', {
      name: 'mistral',
      apiKey: '',
      baseURL: 'https://api.mistral.ai/v1',
      models: {
        primary: 'mistral-small-latest'
      },
      priority: 2,  // ← SEGUNDA TENTATIVA
      isAvailable: true,
      errorCount: 0,
      maxTokens: 8000
    });

    // 3º TIER: Gemini (Google) - CASO VOLTE A FUNCIONAR
    this.providers.set('gemini', {
      name: 'gemini',
      apiKey: '',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      models: {
        primary: 'gemini-2.0-flash-exp'
      },
      priority: 3,  // ← ÚLTIMA TENTATIVA (atualmente com erro 404)
      isAvailable: true,
      errorCount: 0,
      maxTokens: 8000
    });
  }

  public updateApiKeys(keys: {
    gemini?: string;
    openrouter?: string;
    mistral?: string;
    // Manter compatibilidade
    groq?: string;
    deepseek?: string;
  }): void {
    if (keys.gemini) {
      const p = this.providers.get('gemini');
      if (p) p.apiKey = keys.gemini;
    }
    if (keys.openrouter) {
      const p = this.providers.get('openrouter');
      if (p) p.apiKey = keys.openrouter;
    }
    if (keys.mistral) {
      const p = this.providers.get('mistral');
      if (p) p.apiKey = keys.mistral;
    }
  }

  async routeRequest(
    messages: any[],
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      tools?: any[];
      fallbackContext?: {
        primaryIntent?: string;
        userName?: string;
      };
    }
  ): Promise<RouterResponse> {
    const cacheKey = this.generateCacheKey(messages);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return { ...cached.response, cached: true };

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
      } catch (error: any) {
        logger.error(`[Router] ${provider.name} falhou: ${error.message}`);
        this.markProviderError(provider.name);

        // Se for OpenRouter, tentar modelos fallback
        if (provider.name === 'openrouter' && provider.models.fallbacks) {
          for (const fallbackModel of provider.models.fallbacks) {
            try {
              logger.info(`[Router] Tentando fallback: ${fallbackModel}`);
              const fallbackRes = await this.tryProviderWithModel(
                provider,
                fallbackModel,
                messages,
                systemPrompt,
                options
              );
              if (fallbackRes.success) {
                logger.info(`[Router] ✓ OpenRouter fallback: ${fallbackModel}`);
                return fallbackRes;
              }
            } catch (fbError) {
              logger.warn(`[Router] Fallback ${fallbackModel} falhou`);
            }
          }
        }
      }
    }

    logger.error("[Router] ⚠️ Todos providers falharam - modo contingência");
    return this.getContingencyResponse(options?.fallbackContext);
  }

  private async tryProvider(
    provider: ModelProvider,
    messages: any[],
    systemPrompt?: string,
    options?: any
  ): Promise<RouterResponse> {
    return this.tryProviderWithModel(
      provider,
      provider.models.primary,
      messages,
      systemPrompt,
      options
    );
  }

  private async tryProviderWithModel(
    provider: ModelProvider,
    modelName: string,
    messages: any[],
    systemPrompt?: string,
    options?: any
  ): Promise<RouterResponse> {
    if (!provider.isAvailable) {
      throw new Error('Provider indisponível');
    }

    // Gemini tem formato especial
    if (provider.name === 'gemini') {
      return this.callGemini(provider, modelName, messages, systemPrompt, options);
    }

    // OpenRouter e Mistral usam formato OpenAI
    return this.callOpenAIFormat(provider, modelName, messages, systemPrompt, options);
  }

  private async callGemini(
    provider: ModelProvider,
    modelName: string,
    messages: any[],
    systemPrompt?: string,
    options?: any
  ): Promise<RouterResponse> {
    const contents = [];

    // System prompt como primeira mensagem
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

    // Converter mensagens
    messages.forEach(msg => {
      if (msg.role === 'system') return;
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
      const response = await fetch(
        `${provider.baseURL}/models/${modelName}:generateContent?key=${provider.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[Gemini] HTTP ${response.status}: ${errorText.substring(0, 150)}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data: any = await response.json();
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async callOpenAIFormat(
    provider: ModelProvider,
    modelName: string,
    messages: any[],
    systemPrompt?: string,
    options?: any
  ): Promise<RouterResponse> {
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const requestBody: any = {
      model: modelName,
      messages: fullMessages,
      temperature: options?.temperature || 0.6,
      max_tokens: options?.maxTokens || provider.maxTokens,
      stream: false
    };

    const headers: Record<string, string> = {
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

      const data: any = await response.json();
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getAvailableProviders(): ModelProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.isAvailable)
      .sort((a, b) => a.priority - b.priority);
  }

  private markProviderError(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (!provider) return;

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

  private resetProviderErrors(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (provider && provider.errorCount > 0) {
      provider.errorCount = 0;
    }
  }

  private getContingencyResponse(context?: {
    primaryIntent?: string;
    userName?: string;
  }): RouterResponse {
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

  private generateCacheKey(messages: any[]): string {
    return JSON.stringify(messages.slice(-2));
  }

  private getCachedResponse(key: string): { response: RouterResponse; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    if (cached) this.cache.delete(key);
    return null;
  }

  private cacheResponse(key: string, response: RouterResponse): void {
    if (this.cache.size > 500) this.cache.clear();
    this.cache.set(key, { response, timestamp: Date.now() });
  }
}
