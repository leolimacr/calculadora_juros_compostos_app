import type { NexusInsight } from './nexusInsightEngine';
import { trackInsightAcknowledged, trackInsightDismissed } from './nexusAnalyticsService';

export interface FeedEntry {
  insight: NexusInsight;
  acknowledgedAt: number | null;
}

type Listener = (insight: NexusInsight | null) => void;
type FeedListener = (feed: FeedEntry[]) => void;

interface StoreState {
  current: NexusInsight | null;
  history: FeedEntry[];
  dismissedIds: string[];
}

let state: StoreState = { current: null, history: [], dismissedIds: [] };

const insightListeners = new Set<Listener>();
const feedListeners = new Set<FeedListener>();

const MAX_HISTORY = 5;

function notifyInsight(): void {
  const insight = state.current;
  insightListeners.forEach((fn) => fn(insight));
}

function notifyFeed(): void {
  const entries: FeedEntry[] = state.current
    ? [{ insight: state.current, acknowledgedAt: null }, ...state.history]
    : state.history;
  feedListeners.forEach((fn) => fn(entries));
}

// ── localStorage dedup ──

const SEEN_KEY = 'nexus-event-driven-seen-v1';
const MAX_SEEN = 10;

function getSeenIds(): string[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SEEN_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markSeen(id: string): void {
  try {
    const seen = getSeenIds();
    const updated = [id, ...seen.filter((s) => s !== id)].slice(0, MAX_SEEN);
    localStorage.setItem(SEEN_KEY, JSON.stringify(updated));
  } catch { /* noop */ }
}

function isSeen(id: string): boolean {
  return getSeenIds().includes(id);
}

// ── Priority replacement rules ──

const PRIORITY_RANK: Record<string, number> = { alta: 0, media: 1, baixa: 2, inline: 3 };

function extractBaseId(id: string): string {
  const idx = id.lastIndexOf('-');
  if (idx <= 0) return id;
  return id.substring(0, idx);
}

function shouldReplace(newInsight: NexusInsight, current: NexusInsight | null): boolean {
  if (!current) return true;
  if (newInsight.priority === 'alta') return true;

  const newBase = extractBaseId(newInsight.id);
  const curBase = extractBaseId(current.id);

  if (newBase === curBase) return true;

  const newRank = PRIORITY_RANK[newInsight.priority] ?? 3;
  const curRank = PRIORITY_RANK[current.priority] ?? 3;

  if (newRank < curRank) return true;

  return false;
}

// ── Helpers ──

function archiveCurrent(): void {
  if (!state.current) return;
  state.history = [{ insight: state.current, acknowledgedAt: null }, ...state.history];
  // Keep total feed (current + history) at MAX_HISTORY
  if (state.history.length >= MAX_HISTORY) {
    state.history = state.history.slice(0, MAX_HISTORY - 1);
  }
  state.current = null;
}



function trimDismissed(): void {
  if (state.dismissedIds.length > 50) {
    state.dismissedIds = state.dismissedIds.slice(-25);
  }
}

// ── Public API (backward-compat) ──

export function getEventInsight(): NexusInsight | null {
  return state.current;
}

export function setEventInsight(insight: NexusInsight | null): boolean {
  if (!insight) {
    if (state.current) {
      archiveCurrent();
      notifyInsight();
      notifyFeed();
    }
    return false;
  }

  if (state.dismissedIds.includes(insight.id)) return false;
  if (isSeen(insight.id)) return false;

  if (!shouldReplace(insight, state.current)) return false;

  markSeen(insight.id);

  if (state.current) {
    archiveCurrent();
  }

  state.current = insight;
  notifyInsight();
  notifyFeed();
  return true;
}

export function dismissCurrentInsight(surface: string = 'feed'): void {
  if (!state.current) return;
  trackInsightDismissed(state.current.id, state.current.priority, surface);
  state.dismissedIds = [...state.dismissedIds, state.current.id].slice(-50);
  state.current = null;
  notifyInsight();
  notifyFeed();
}

export function dismissFeedEntry(insightId: string, surface: string = 'feed'): void {
  const entry = state.current?.id === insightId
    ? state.current
    : state.history.find((e) => e.insight.id === insightId)?.insight;
  if (entry) {
    trackInsightDismissed(insightId, entry.priority, surface);
  }
  state.dismissedIds = [...state.dismissedIds, insightId].slice(-50);
  state.history = state.history.filter((e) => e.insight.id !== insightId);
  if (state.current?.id === insightId) {
    state.current = null;
  }
  notifyInsight();
  notifyFeed();
}

export function acknowledgeCurrentInsight(surface: string = 'feed'): void {
  if (!state.current) return;
  trackInsightAcknowledged(state.current.id, state.current.priority, surface);
  const archived = { insight: state.current, acknowledgedAt: Date.now() };
  state.current = null;
  state.history = [archived, ...state.history];
  keepFeedWithinBounds();
  notifyInsight();
  notifyFeed();
}

export function acknowledgeFeedEntry(insightId: string, surface: string = 'feed'): void {
  if (state.current?.id === insightId) {
    acknowledgeCurrentInsight(surface);
    return;
  }
  const idx = state.history.findIndex((e) => e.insight.id === insightId);
  if (idx === -1) return;
  const entry = state.history[idx];
  trackInsightAcknowledged(insightId, entry.insight.priority, surface);
  state.history[idx] = { ...entry, acknowledgedAt: entry.acknowledgedAt ?? Date.now() };
  notifyInsight();
  notifyFeed();
}

// ── Feed API ──

function keepFeedWithinBounds(): void {
  const total = (state.current ? 1 : 0) + state.history.length;
  if (total > MAX_HISTORY) {
    const excess = total - MAX_HISTORY;
    state.history = state.history.slice(0, state.history.length - excess);
  }
}

export function getEventFeed(): FeedEntry[] {
  keepFeedWithinBounds();
  return state.current
    ? [{ insight: state.current, acknowledgedAt: null }, ...state.history]
    : state.history;
}

// ── Subscription API ──

export function subscribe(fn: Listener): () => void {
  insightListeners.add(fn);
  fn(state.current);
  return () => { insightListeners.delete(fn); };
}

export function subscribeFeed(fn: FeedListener): () => void {
  feedListeners.add(fn);
  fn(getEventFeed());
  return () => { feedListeners.delete(fn); };
}

/** Reset store — useful for tests or user logout */
export function clearEventInsightStore(): void {
  state = { current: null, history: [], dismissedIds: [] };
  notifyInsight();
  notifyFeed();
}
