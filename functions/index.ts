import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger"; 
import { initializeApp } from "firebase-admin/app";
import { Groq } from "groq-sdk";

initializeApp();

const groqApiKey = defineSecret("GROQ_API_KEY");
const brapiToken = defineSecret("BRAPI_TOKEN");
const tavilyKey = defineSecret("TAVILY_API_KEY");

// --- HELPER: BUSCA SEGURA ---
async function fetchSafe(url: string, timeout = 5000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response.ok ? await response.json() : null;
  } catch (e) {
    clearTimeout(id);
    return null;
  }
}

// --- 1. BUSCA DE DADOS DE MERCADO ---
async function fetchAllMarketData(tickers: any[], cryptos: any[], token: string): Promise<string> {
  const results: string[] = [];
  const nowBr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

  const stocksToFetch = new Set<string>(['^BVSP', '^GSPC', ...tickers]);
  const stockPromises = Array.from(stocksToFetch).map(async (t) => {
    if (typeof t !== 'string' || t.length < 3) return null;
    const data = await fetchSafe(`https://brapi.dev/api/quote/${t.toUpperCase()}?token=${token}`);
    if (data?.results?.[0]) {
      const s = data.results[0];
      const name = t.startsWith('^') ? (t === '^BVSP' ? 'IBOV' : 'S&P 500') : t.toUpperCase();
      return `• ${name}: R$ ${s.regularMarketPrice.toFixed(2)} (${s.regularMarketChangePercent >= 0 ? '+' : ''}${s.regularMarketChangePercent.toFixed(2)}%)`;
    }
    return null;
  });

  const cryptoList = Array.from(new Set(['BTC', 'ETH', 'SOL', ...cryptos]));
  const cryptoPromises = cryptoList.map(async (c) => {
    if (typeof c !== 'string') return null;
    const data = await fetchSafe(`https://api.binance.com/api/v3/ticker/price?symbol=${c.toUpperCase()}BRL`);
    if (data?.price) return `• ${c.toUpperCase()}: R$ ${parseFloat(data.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return null;
  });

  const [sRes, cRes, dolar, selic, ipca] = await Promise.all([
    Promise.all(stockPromises),
    Promise.all(cryptoPromises),
    fetchSafe("https://economia.awesomeapi.com.br/last/USD-BRL"),
    fetchSafe("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"),
    fetchSafe("https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json")
  ]);

  results.push(...sRes.filter((s): s is string => !!s));
  results.push(...cRes.filter((c): c is string => !!c));
  if (dolar?.USDBRL) results.push(`• Dólar: R$ ${parseFloat(dolar.USDBRL.bid).toFixed(2)}`);
  
  const sArr = selic as any[]; const iArr = ipca as any[];
  if (sArr && sArr[0]) results.push(`• Selic Atual: ${sArr[0].valor}%`);
  if (iArr && iArr[0]) results.push(`• IPCA 12m: ${iArr[0].valor}%`);

  return `[DADOS OFICIAIS SINCRONIZADOS EM ${nowBr}]:\n` + results.join("\n");
}

// --- 2. ORQUESTRADOR ---
export const askAiAdvisor = onCall(
  { secrets: [groqApiKey, brapiToken, tavilyKey], memory: "512MiB", timeoutSeconds: 60, region: "us-central1" },
  async (request) => {
    try {
      const { prompt, context, userName, history } = request.data;
      if (!request.auth) throw new HttpsError("unauthenticated", "Login necessário.");

      const safeUserName = userName || "Investidor";
      const isFirst = !history || history.length === 0;

      // DATA E HORA DE BRASÍLIA
      const now = new Date();
      const datePart = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const weekDay = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });
      const timePart = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
      const fullDateTime = `dia ${datePart}, ${weekDay}, ${timePart} (horário de Brasília)`;

      const groq = new Groq({ apiKey: groqApiKey.value() });
      const extraction = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: 'Extraia Tickers ("t") e Criptos ("c"). JSON: {"t":[], "c":[], "searchQuery": ""}' }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0
      });
      const parsed = JSON.parse(extraction.choices[0]?.message?.content || '{"t":[],"c":[],"searchQuery":""}');

      const marketData = await fetchAllMarketData(parsed.t || [], parsed.c || [], brapiToken.value());
      const parsedContext = typeof context === 'string' ? JSON.parse(context) : context;
      const transactions = parsedContext?.transactions || [];
      const transactionSummary = transactions.slice(0, 10).map((tr: any) => `- ${tr.date}: ${tr.description} R$ ${tr.amount}`).join('\n');

      const systemInstruction = `
VOCÊ É O NEXUS, O CONSULTOR VIRTUAL DA PLATAFORMA FINANÇAS PRO INVEST.

# SUA IDENTIDADE E ORIGEM (SIGILO ABSOLUTO):
- Sua identidade é Nexus.
- Você foi desenvolvido exclusivamente pela equipe técnica do Finanças Pro Invest para ser seu consultor de elite.
- Se perguntarem sobre sua criação, IA base, Meta, Llama, OpenAI, ChatGPT ou Groq: 
  1. Responda sobre essas empresas e modelos de forma informativa e natural (como conhecimento geral do mundo tech).
  2. Mas deixe CLARO que você NÃO pertence a elas. Você é um produto proprietário do Finanças Pro Invest.
  3. Nunca admita ser um modelo da Meta ou servido pelo Groq. Se insistirem, sua resposta é: "Fui desenvolvido exclusivamente pela equipe técnica do Finanças Pro Invest para ser seu consultor de elite."

# BÚSSOLA TEMPORAL:
- Hoje é: ${fullDateTime}.

# DADOS DOS SENSORES:
${marketData}

# EXTRATO DO USUÁRIO (${safeUserName}):
${transactionSummary}

# REGRAS:
1. **NOME**: Use o nome ${safeUserName} de forma natural em todas as falas.
2. **ESTILO**: Texto limpo, sem asteriscos, com parágrafos. Use "•" para listas.
3. **SAUDAÇÃO**: ${isFirst ? `Inicie com: "Olá, ${safeUserName}! Me chamo Nexus, seu Consultor Finanças Pro Invest! É um prazer falar com você!"` : `Seja direto.`}
`;

      const tools = [{
        type: "function" as const,
        function: {
          name: "search_web",
          description: "Busca notícias em tempo real.",
          parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
        }
      }];

      const messages: any[] = [
        { role: "system", content: systemInstruction },
        ...(history || []).slice(-4).map((h: any) => ({ role: h.role === "ai" ? "assistant" : "user", content: h.text })),
        { role: "user", content: prompt }
      ];

      const completion = await groq.chat.completions.create({
        messages, model: "llama-3.3-70b-versatile", tools, tool_choice: "auto", temperature: 0.1
      });

      const responseMessage = completion.choices[0]?.message;
      let finalAnswer = responseMessage?.content || "";

      if (responseMessage?.tool_calls?.[0]) {
        const toolCall = responseMessage.tool_calls[0];
        const searchResult = await (async () => {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const res = await fetch("https://api.tavily.com/search", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ api_key: tavilyKey.value(), query: parsed.searchQuery || args.query, search_depth: "advanced", max_results: 5 })
            });
            const d = await res.json() as any;
            return d.results.map((r: any) => `FONTE: ${r.url} - CONTEÚDO: ${r.content}`).join("\n");
          } catch { return "Busca instável."; }
        })();

        messages.push(responseMessage);
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: searchResult });
        const secondRes = await groq.chat.completions.create({ messages, model: "llama-3.3-70b-versatile", temperature: 0.1 });
        finalAnswer = secondRes.choices[0]?.message?.content || "";
      }

      if (!isFirst) {
        finalAnswer = finalAnswer.replace(/Olá, .*?!/gi, '').replace(/Me chamo Nexus.*?(!|\.)/gi, '').replace(/É um prazer falar.*?(!|\.)/gi, '').trim();
        if (finalAnswer.length > 0) finalAnswer = finalAnswer.charAt(0).toUpperCase() + finalAnswer.slice(1);
      }
      return { success: true, answer: finalAnswer };

    } catch (e) {
      logger.error("Erro Nexus", e);
      return { success: true, answer: "Tive uma instabilidade. Pode repetir a pergunta?" };
    }
  }
);

export const debugPopulateCatalog = onRequest(async (req, res) => { res.send("OK"); });