import type { UserContext, NexusInsight } from './nexusInsightEngine';

type InsightDomain = 'protecao' | 'cartao' | 'orcamento';

interface InsightTrace {
  insightId: string;
  domain: InsightDomain;
  shownAt: number;
  deepLink: string;
  metricKey: string;
  metricValue: number;
  navigated: boolean;
}

interface FollowUpResult {
  text: string;
  domain: InsightDomain;
}

interface DomainBehaviorEntry {
  domain: InsightDomain;
  shownCount: number;
  navigatedCount: number;
  improvedCount: number;
  lastShownAt: number;
  lastResponseAt: number;
}

const STORAGE_KEY = 'fpi-insight-traces-v1';
const BEHAVIOR_KEY = 'fpi-domain-behavior-v1';
const MAX_TRACES = 5;
const FOLLOW_UP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function readTraces(): InsightTrace[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeTraces(traces: InsightTrace[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(traces));
    }
  } catch { /* localStorage full — silencia */ }
}

function readDomainBehavior(): Record<string, DomainBehaviorEntry> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(BEHAVIOR_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeDomainBehavior(behaviors: Record<string, DomainBehaviorEntry>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behaviors));
    }
  } catch { /* silencia */ }
}

function ensureEntry(behavior: Record<string, DomainBehaviorEntry>, domain: InsightDomain): DomainBehaviorEntry {
  if (!behavior[domain]) {
    behavior[domain] = { domain, shownCount: 0, navigatedCount: 0, improvedCount: 0, lastShownAt: 0, lastResponseAt: 0 };
  }
  return behavior[domain];
}

function getDomain(insight: NexusInsight): InsightDomain | null {
  const id = insight.id;
  if (id === 'home-sovereign-deficit' || id === 'home-margin-thin' || id === 'central-cushion-warning') return 'protecao';
  if (id === 'fatima_reserva' || id === 'home-bill-pressure' || id.startsWith('nexus-event-card-')) return 'cartao';
  if (id.startsWith('budget-')) return 'orcamento';
  return null;
}

function extractMetric(domain: InsightDomain, ctx: UserContext): { key: string; value: number } {
  if (domain === 'protecao') {
    const buffer = (ctx.marcoZero ?? 0) + (ctx.reserveCurrent ?? 0);
    return { key: 'bufferProtecao', value: buffer };
  }
  if (domain === 'cartao') {
    const inv = ctx.upcomingCreditCardBill?.estimatedValue ?? 0;
    return { key: 'faturaRestante', value: inv };
  }
  if (domain === 'orcamento') {
    const pct = ctx.budgetProgress?.totalPercentage ?? 0;
    return { key: 'orcamentoPct', value: pct };
  }
  return { key: 'desconhecido', value: 0 };
}

function formatMetric(domain: InsightDomain, value: number): string {
  if (domain === 'orcamento') return `${Math.round(value)}%`;
  if (domain === 'protecao' || domain === 'cartao') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  return String(value);
}

function buildFollowUp(trace: InsightTrace, ctx: UserContext): string {
  const domain = trace.domain;
  const current = extractMetric(domain, ctx);
  const delta = current.value - trace.metricValue;
  const improved = domain === 'protecao' ? delta > 0 : delta < 0;

  const domainLabels: Record<InsightDomain, string> = {
    protecao: 'sugeri revisar sua proteção financeira',
    cartao: 'alertei sobre sua fatura de cartão',
    orcamento: 'apontei que seu orçamento estava sob pressão',
  };

  const navText = trace.navigated
    ? 'Você acessou a área indicada'
    : 'Você não acessou a área indicada';

  let outcomeText: string;
  if (domain === 'protecao') {
    outcomeText = improved
      ? 'e o valor da proteção aumentou'
      : 'e o valor da proteção continua no mesmo patamar';
  } else if (domain === 'cartao') {
    outcomeText = improved
      ? 'e o valor da fatura reduziu'
      : `e o valor da fatura segue em ${formatMetric(domain, current.value)}`;
  } else {
    outcomeText = improved
      ? 'e o ritmo de consumo reduziu'
      : `e o consumo segue em ${formatMetric(domain, current.value)}`;
  }

  return `${domainLabels[domain]}. ${navText} ${outcomeText}.`;
}

export function traceInsightShown(insight: NexusInsight, ctx: UserContext): void {
  const domain = getDomain(insight);
  if (!domain) return;

  const traces = readTraces();
  const metric = extractMetric(domain, ctx);

  traces.unshift({
    insightId: insight.id,
    domain,
    shownAt: Date.now(),
    deepLink: insight.deepLink,
    metricKey: metric.key,
    metricValue: metric.value,
    navigated: false,
  });

  writeTraces(traces.slice(0, MAX_TRACES));

  const behavior = readDomainBehavior();
  const entry = ensureEntry(behavior, domain);
  entry.shownCount++;
  entry.lastShownAt = Date.now();
  writeDomainBehavior(behavior);
}

export function traceNavigation(insightId: string): void {
  const traces = readTraces();
  const idx = traces.findIndex((t) => t.insightId === insightId && !t.navigated);
  if (idx === -1) return;
  traces[idx] = { ...traces[idx], navigated: true };
  writeTraces(traces);

  const behavior = readDomainBehavior();
  const entry = ensureEntry(behavior, traces[idx].domain);
  entry.navigatedCount++;
  entry.lastResponseAt = Date.now();
  writeDomainBehavior(behavior);
}

export function collectFollowUp(ctx: UserContext): FollowUpResult | null {
  const traces = readTraces();
  const recent = traces.find((t) => Date.now() - t.shownAt <= FOLLOW_UP_WINDOW_MS);
  if (!recent) return null;

  const domain = recent.domain;
  const current = extractMetric(domain, ctx);

  const relevantChanged = current.value !== recent.metricValue;
  if (!relevantChanged && !recent.navigated) return null;

  const improved = domain === 'protecao' ? current.value > recent.metricValue : current.value < recent.metricValue;

  const text = buildFollowUp(recent, ctx);

  const remaining = traces.filter((t) => t.insightId !== recent.insightId);
  writeTraces(remaining);

  const behavior = readDomainBehavior();
  const entry = ensureEntry(behavior, domain);
  if (improved) entry.improvedCount++;
  entry.lastResponseAt = Date.now();
  writeDomainBehavior(behavior);

  return { text, domain };
}

function getDomainResponse(domain: InsightDomain): { responseRatio: number; shownCount: number; navigatedCount: number; improvedCount: number } {
  const behavior = readDomainBehavior();
  const entry = behavior[domain];
  if (!entry) return { responseRatio: 0, shownCount: 0, navigatedCount: 0, improvedCount: 0 };
  const responses = entry.navigatedCount + entry.improvedCount;
  return {
    responseRatio: entry.shownCount > 0 ? responses / entry.shownCount : 0,
    shownCount: entry.shownCount,
    navigatedCount: entry.navigatedCount,
    improvedCount: entry.improvedCount,
  };
}

export function getEffectivePriorityDelta(domain: InsightDomain): number {
  const stats = getDomainResponse(domain);
  if (stats.shownCount >= 2 && stats.responseRatio >= 0.5) return -1;
  if (stats.shownCount >= 3 && stats.responseRatio === 0) return 1;
  return 0;
}

export function getDomainSuppressionMultiplier(domain: InsightDomain): number {
  const stats = getDomainResponse(domain);
  if (stats.shownCount >= 2 && stats.responseRatio >= 0.5) return 0.5;
  if (stats.shownCount >= 3 && stats.responseRatio === 0) return 2;
  return 1;
}

export function getToneMarker(domain: InsightDomain): string {
  const stats = getDomainResponse(domain);
  if (stats.shownCount >= 3 && stats.navigatedCount === 0 && stats.improvedCount === 0) return 'Observação: ';
  return '';
}
