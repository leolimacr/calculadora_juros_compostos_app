import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { Bell, BellOff, CalendarDays, ChevronLeft, ChevronRight, X, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Timestamp } from 'firebase/firestore';
import {
  fetchMonthCommitments,
  fetchUpcomingCommitments,
  addCommitment,
  updateCommitment,
  deleteCommitment,
  toggleCommitment,
  type AgendaCommitment,
} from '../services/agendaService';
import {
  scheduleAlarm, cancelAlarm, requestNotificationPermission,
  startAlarmChecker, stopAlarmChecker, setAlarmCallback, type AlarmInfo,
} from '../services/alarmService';

interface AgendaHubProps {
  onNavigate?: (tool: string, state?: any) => void;
  /** Modo de validação dev: compromissos em memória, sem Firebase (página dev-agenda.html). */
  seedCommitments?: AgendaCommitment[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface MonthSectionRect {
  year: number;
  month: number;
  top: number;
  bottom: number;
}

// Mês ativo do cabeçalho: a primeira seção mensal (da mais alta para a mais
// baixa) que contém estritamente a linha de referência — o fim do cabeçalho
// sticky. Enquanto a linha estiver dentro da mesma seção o rótulo não muda;
// só alterna quando a fronteira do próximo mês cruza a linha.
function pickActiveMonth(sections: MonthSectionRect[], referenceY: number): { year: number; month: number } | null {
  for (const s of sections) {
    if (s.top < referenceY && s.bottom >= referenceY) return { year: s.year, month: s.month };
  }
  return null;
}

// Altura única de cada faixa da agenda — fonte única de verdade para TODAS as
// linhas (vazias, compromisso de 1 linha e cada fragmento de compromisso multilinha).
const AGENDA_ROW_HEIGHT = 19;

// Pauta única do caderno: uma linha horizontal no fim de cada faixa, derivada da
// mesma constante AGENDA_ROW_HEIGHT. Aplicada UMA vez no wrapper do caderno;
// nenhuma linha desenha a própria régua.
const agendaPautaStyle: React.CSSProperties = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${AGENDA_ROW_HEIGHT - 1}px, #7dd3fc ${AGENDA_ROW_HEIGHT - 1}px ${AGENDA_ROW_HEIGHT}px)`,
};

// Limite máximo de "Próximos Compromissos" e chave de persistência (localStorage)
const UPCOMING_LIMIT_MAX = 50;
const UPCOMING_LIMIT_KEY = 'fpi-agenda-proximos-limit';

function getInitialUpcomingLimit(): number {
  try {
    const v = Number(localStorage.getItem(UPCOMING_LIMIT_KEY));
    if (Number.isFinite(v) && v >= 1) return Math.min(Math.floor(v), UPCOMING_LIMIT_MAX);
  } catch {
    /* localStorage indisponível — usa padrão */
  }
  return 5;
}

function measureCommitLines(el: HTMLElement): string[] | null {
  const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE) as Text | undefined;
  if (!textNode) return null;
  const text = textNode.textContent ?? '';
  if (!text) return [''];
  try {
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (rects.length <= 1) return [text];
    const spansLines = (start: number, end: number): number => {
      const r = document.createRange();
      r.setStart(textNode, start);
      r.setEnd(textNode, end);
      return r.getClientRects().length;
    };
    const lines: string[] = [];
    let start = 0;
    while (start < text.length) {
      while (start < text.length && /\s/.test(text[start])) start++;
      if (start >= text.length) break;
      let lineEnd = start;
      let idx = start;
      while (idx < text.length) {
        let wordEnd = idx;
        while (wordEnd < text.length && !/\s/.test(text[wordEnd])) wordEnd++;
        let afterWord = wordEnd;
        while (afterWord < text.length && /\s/.test(text[afterWord])) afterWord++;
        if (spansLines(start, afterWord) >= 2) break;
        lineEnd = afterWord;
        idx = afterWord;
      }
      if (lineEnd === start) {
        let lo = start + 1;
        let hi = text.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (spansLines(start, mid) >= 2) hi = mid;
          else lo = mid + 1;
        }
        lines.push(text.slice(start, lo - 1));
        start = lo - 1;
      } else {
        lines.push(text.slice(start, lineEnd));
        start = lineEnd;
      }
    }
    return lines;
  } catch {
    return [text];
  }
}

function tsToDate(ts: Timestamp | Date): Date {
  return ts instanceof Date ? ts : ts.toDate();
}

function toDateInputStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function groupSeedByMonth(seed: AgendaCommitment[] | undefined): Record<string, AgendaCommitment[]> {
  const out: Record<string, AgendaCommitment[]> = {};
  if (!seed) return out;
  for (const c of seed) {
    const d = tsToDate(c.date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    (out[k] ??= []).push(c);
  }
  return out;
}

const AgendaHub: React.FC<AgendaHubProps> = ({ onNavigate, seedCommitments }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [activeYear, setActiveYear] = useState(today.getFullYear());
  const [activeMonth, setActiveMonth] = useState(today.getMonth());
  const [isTodayVisible, setIsTodayVisible] = useState(true);

  // Stream de meses — só cresce, nunca encolhe
  const [monthStream, setMonthStream] = useState<Array<{ year: number; month: number }>>(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    const result: Array<{ year: number; month: number }> = [];
    for (let i = -2; i <= 2; i++) {
      let nm = m + i;
      let ny = y;
      while (nm < 0) { nm += 12; ny -= 1; }
      while (nm > 11) { nm -= 12; ny += 1; }
      result.push({ year: ny, month: nm });
    }
    return result;
  });

  // Linhas medidas de cada título quebrado (commit id → linhas)
  const [commitLines, setCommitLines] = useState<Record<string, string[]>>({});

  const [allMonths, setAllMonths] = useState<Record<string, AgendaCommitment[]>>(() => groupSeedByMonth(seedCommitments));
  const [upcoming, setUpcoming] = useState<AgendaCommitment[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [upcomingLimit, setUpcomingLimit] = useState<number>(() => getInitialUpcomingLimit());
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const upcomingLimitRef = useRef(upcomingLimit);
  upcomingLimitRef.current = upcomingLimit;

  // --- Inline editing ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [addingDayKey, setAddingDayKey] = useState<string | null>(null);
  const [addText, setAddText] = useState('');

  // --- Alarm popover ---
  const [alarmTarget, setAlarmTarget] = useState<{
    id: string; date: Date; title: string; currentAlarm?: Date;
  } | null>(null);

  // --- Calendário popover (navegação rápida para datas distantes) ---
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const userId = user?.uid;
  const notebookRef = useRef<HTMLDivElement | null>(null);
  const loadedKeysRef = useRef<Set<string>>(new Set());
  const monthStreamRef = useRef(monthStream);
  monthStreamRef.current = monthStream;
  const initialLoadingRef = useRef(true);
  const isSavingRef = useRef(false);
  const suppressAutoExtendRef = useRef(false);
  const monthHeaderRef = useRef<HTMLDivElement | null>(null);

  // --- Loading de dados (só carrega meses ao redor do ativo) ---
  const ensureMonthLoaded = useCallback(async (year: number, month: number, force?: boolean) => {
    if (!userId || seedCommitments) return;
    const key = `${year}-${month}`;
    if (!force && loadedKeysRef.current.has(key)) return;
    loadedKeysRef.current.add(key);
    try {
      const data = await fetchMonthCommitments(userId, year, month);
      if (import.meta.env.DEV) console.log(`[Agenda] ensureMonthLoaded ${key} force=${force} → ${data.length} itens`);
      setAllMonths((prev) => {
        const n = prev[key]?.length ?? 0;
        if (import.meta.env.DEV && n !== data.length) console.log(`[Agenda] setAllMonths ${key}: ${n}→${data.length}`);
        return { ...prev, [key]: data };
      });
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[Agenda] Falha ao carregar mês', year, month, e);
      setLoadError(true);
      setAllMonths((prev) => ({ ...prev, [key]: [] }));
    }
  }, [userId, seedCommitments]);

  const loadUpcoming = useCallback(async (limit?: number) => {
    if (seedCommitments) {
      setUpcoming([]);
      return;
    }
    if (!userId) return;
    try {
      const data = await fetchUpcomingCommitments(userId, limit ?? upcomingLimitRef.current);
      setUpcoming(data);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[Agenda] Falha ao carregar próximos compromissos', e);
      setLoadError(true);
      setUpcoming([]);
    }
  }, [userId, seedCommitments]);

  // Aplica um limite de "Próximos Compromissos" e abre (ou atualiza) o painel
  const applyUpcomingLimit = useCallback((raw: number) => {
    const safe = Math.max(1, Math.min(Math.floor(raw), UPCOMING_LIMIT_MAX));
    setUpcomingLimit(safe);
    try { localStorage.setItem(UPCOMING_LIMIT_KEY, String(safe)); } catch { /* ignore */ }
    setShowUpcoming(true);
    setCustomOpen(false);
    loadUpcoming(safe);
  }, [loadUpcoming]);

  const commitCustom = useCallback(() => {
    const n = Number(customInput.trim());
    if (Number.isFinite(n) && n >= 1) {
      applyUpcomingLimit(n);
    } else {
      setCustomOpen(false);
    }
  }, [customInput, applyUpcomingLimit]);

  const toggleUpcoming = useCallback(() => {
    setShowUpcoming((prev) => !prev);
    loadUpcoming();
  }, [loadUpcoming]);

  // Carrega dados APENAS para activeMonth ± 1 (lazy — sem buscas desnecessárias)
  useEffect(() => {
    if (!userId) return;
    const offsets = [-1, 0, 1];
    Promise.all(offsets.map((offset) => {
      let nm = activeMonth + offset;
      let ny = activeYear;
      while (nm < 0) { nm += 12; ny -= 1; }
      while (nm > 11) { nm -= 12; ny += 1; }
      return ensureMonthLoaded(ny, nm);
    })).finally(() => {
      if (initialLoadingRef.current) {
        initialLoadingRef.current = false;
        setInitialLoading(false);
      }
    });
    loadUpcoming();
  }, [activeYear, activeMonth, userId, ensureMonthLoaded, loadUpcoming]);

  // Podar meses distantes para evitar crescimento infinito da DOM
  useEffect(() => {
    setMonthStream(prev => {
      const pruned = prev.filter(({ year, month }) => {
        let diff = (year - activeYear) * 12 + (month - activeMonth);
        return Math.abs(diff) <= 3;
      });
      if (pruned.length === prev.length) return prev;
      return pruned;
    });
    setAllMonths(prev => {
      const keep: Record<string, AgendaCommitment[]> = {};
      for (let i = -3; i <= 3; i++) {
        let nm = activeMonth + i;
        let ny = activeYear;
        while (nm < 0) { nm += 12; ny -= 1; }
        while (nm > 11) { nm -= 12; ny += 1; }
        const key = `${ny}-${nm}`;
        if (prev[key]) keep[key] = prev[key];
      }
      if (Object.keys(keep).length === Object.keys(prev).length) return prev;
      return keep;
    });
  }, [activeYear, activeMonth]);

  // --- Mapa dia → compromissos ---
  const dayMap = useMemo(() => {
    const map = new Map<string, AgendaCommitment[]>();
    for (const [, commitments] of Object.entries(allMonths)) {
      for (const c of commitments) {
        const d = tsToDate(c.date);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      }
    }
    return map;
  }, [allMonths]);

  // --- Detecção de título quebrado: mede o texto real e, se couber em 2+ linhas,
  // armazena os fragmentos para renderizar cada linha como uma faixa própria ---
  useEffect(() => {
    const container = notebookRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let disposed = false;

    const measure = () => {
      if (disposed) return;
      const lines: Record<string, string[]> = {};
      container.querySelectorAll<HTMLElement>('[data-title-anchor]').forEach((titleEl) => {
        const row = titleEl.closest<HTMLElement>('[data-commit-id]');
        const id = row?.dataset.commitId;
        if (!id) return;
        const anchor = row.querySelector<HTMLElement>('[data-measure-anchor]');
        const result = measureCommitLines(anchor ?? titleEl);
        if (result && result.length > 1) lines[id] = result;
      });
      setCommitLines((prev) => {
        const nextLines: Record<string, string[]> = {};
        for (const id of Object.keys(lines)) nextLines[id] = lines[id];
        const same =
          Object.keys(nextLines).length === Object.keys(prev).length &&
          Object.entries(nextLines).every(
            ([id, ls]) => prev[id] && prev[id].length === ls.length && prev[id].every((ln, i) => ln === ls[i]),
          );
        return same ? prev : nextLines;
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    measure();
    if (typeof document.fonts !== 'undefined') {
      document.fonts.ready.then(() => {
        if (!disposed) measure();
      }).catch(() => {});
    }
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [allMonths, monthStream]);

  // --- Extensão do stream (adiciona meses à DOM — nunca remove) ---
  const extendForward = useCallback(() => {
    setMonthStream(prev => {
      const last = prev[prev.length - 1];
      let nm = last.month + 1;
      let ny = last.year;
      if (nm > 11) { nm = 0; ny += 1; }
      if (prev.some(m => m.year === ny && m.month === nm)) return prev;
      return [...prev, { year: ny, month: nm }];
    });
  }, []);

  const prependCountRef = useRef(0);

  const extendBackward = useCallback(() => {
    setMonthStream(prev => {
      const first = prev[0];
      let pm = first.month - 1;
      let py = first.year;
      if (pm < 0) { pm = 11; py -= 1; }
      if (prev.some(m => m.year === py && m.month === pm)) return prev;
      prependCountRef.current += 1;
      return [{ year: py, month: pm }, ...prev];
    });
  }, []);

  // Compensação de scroll sempre que meses são inseridos no início
  useLayoutEffect(() => {
    if (prependCountRef.current === 0) return;
    const count = prependCountRef.current;
    prependCountRef.current = 0;
    const sectionEls = document.querySelectorAll('[data-month-section]');
    let totalHeight = 0;
    for (let i = 0; i < count && i < sectionEls.length; i++) {
      totalHeight += sectionEls[i].getBoundingClientRect().height;
    }
    if (totalHeight > 0) {
      window.scrollBy(0, totalHeight);
    }
  }, [monthStream]);

  // --- Scroll detection: centro da viewport + buffer zones ---
  const activeRef = useRef({ year: activeYear, month: activeMonth });
  activeRef.current = { year: activeYear, month: activeMonth };

  useEffect(() => {
    const BUFFER = 3000;

    const onScroll = () => {
      const sections = document.querySelectorAll('[data-month-section]');

      // Durante um salto programado (HOJE / data), desliga a auto-extensão e a
      // detecção de mês ativo para que o scrollIntoView smooth não seja cancelado
      // pela compensação scrollBy e nem podado o mês alvo antes do scroll assentar.
      if (suppressAutoExtendRef.current) return;

      // Mês ativo: primeira seção que cruza a linha de referência — logo abaixo
      // do cabeçalho sticky. Seções mensais são altas, então o rótulo só alterna
      // quando a fronteira do próximo mês realmente alcança a linha.
      const headerEl = monthHeaderRef.current;
      const referenceY = headerEl ? headerEl.getBoundingClientRect().bottom : window.innerHeight * 0.2;
      const activeRects: MonthSectionRect[] = [];
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const key = section.getAttribute('data-month-section');
        if (!key) continue;
        const [y, m] = key.split('-').map(Number);
        activeRects.push({ year: y, month: m, top: rect.top, bottom: rect.bottom });
      }
      const active = pickActiveMonth(activeRects, referenceY);
      if (active) {
        const cur = activeRef.current;
        if (active.year !== cur.year || active.month !== cur.month) {
          setActiveYear(active.year);
          setActiveMonth(active.month);
        }
      }

      if (sections.length === 0) return;

      // Buffer forward — estende se último mês está próximo do fim da viewport
      const lastSec = sections[sections.length - 1];
      const lastRect = lastSec.getBoundingClientRect();
      if (lastRect.bottom < window.innerHeight + BUFFER) {
        extendForward();
      }

      // Buffer backward — estende se primeiro mês está próximo do topo da viewport
      const firstSec = sections[0];
      const firstRect = firstSec.getBoundingClientRect();
      if (firstRect.top > -BUFFER) {
        extendBackward();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [extendForward, extendBackward]);

  // --- Scroll para o dia atual na abertura ---
  const initialScrollDone = useRef(false);

  useEffect(() => {
    if (initialLoading || initialScrollDone.current) return;
    if (activeYear !== today.getFullYear() || activeMonth !== today.getMonth()) return;
    const el = document.getElementById(`agenda-day-${activeYear}-${activeMonth}-${today.getDate()}`);
    if (el) {
      initialScrollDone.current = true;
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [initialLoading, activeYear, activeMonth, today]);

  // --- Observa se o dia de hoje está visível na tela ---
  useEffect(() => {
    const el = document.getElementById(`agenda-day-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`);
    if (!el) { setIsTodayVisible(false); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { setIsTodayVisible(entry.isIntersecting); },
      { rootMargin: '-1px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [today, activeYear, activeMonth, initialLoading]);

  // --- Pedir permissão de notificação (desktop) na primeira visita ---
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // --- Coletar compromissos com alarme e iniciar checker ---
  const navigate = useNavigate();
  useEffect(() => {
    setAlarmCallback((info: AlarmInfo) => {
      if (onNavigate) {
        onNavigate('agenda', { date: info.dateStr });
      } else {
        navigate(`/app/agenda?date=${info.dateStr}`);
      }
    });
    return () => setAlarmCallback(() => {});
  }, [navigate, onNavigate]);

  useEffect(() => {
    const alarms: AlarmInfo[] = [];
    for (const [, commitments] of Object.entries(allMonths)) {
      for (const c of commitments) {
        if (c.alarmAt && c.id) {
          const d = tsToDate(c.alarmAt);
          alarms.push({
            commitmentId: c.id,
            title: c.title,
            dateStr: toDateInputStr(tsToDate(c.date)),
            alarmAt: d,
          });
        }
      }
    }
    startAlarmChecker(alarms);
    return () => stopAlarmChecker();
  }, [allMonths]);

  // --- Navegação pelos botões do cabeçalho ---
  const goPrevMonth = useCallback(() => {
    let newM = activeMonth - 1;
    let newY = activeYear;
    if (newM < 0) { newM = 11; newY -= 1; }
    setMonthStream(prev => {
      if (prev.some(m => m.year === newY && m.month === newM)) return prev;
      prependCountRef.current += 1;
      return [{ year: newY, month: newM }, ...prev];
    });
    setActiveYear(newY);
    setActiveMonth(newM);
  }, [activeYear, activeMonth]);

  const goNextMonth = useCallback(() => {
    let newM = activeMonth + 1;
    let newY = activeYear;
    if (newM > 11) { newM = 0; newY += 1; }
    setMonthStream(prev => {
      if (prev.some(m => m.year === newY && m.month === newM)) return prev;
      return [...prev, { year: newY, month: newM }];
    });
    setActiveYear(newY);
    setActiveMonth(newM);
  }, [activeYear, activeMonth]);

  // --- Ir para hoje ---
  const goToDate = useCallback((date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    suppressAutoExtendRef.current = true;
    ensureMonthLoaded(y, m);
    setMonthStream(prev => {
      if (prev.some(p => p.year === y && p.month === m)) return prev;
      const idx = prev.findIndex(p => p.year > y || (p.year === y && p.month > m));
      if (idx === -1) return [...prev, { year: y, month: m }];
      if (idx === 0) return [{ year: y, month: m }, ...prev];
      return [...prev.slice(0, idx), { year: y, month: m }, ...prev.slice(idx)];
    });
    setActiveYear(y);
    setActiveMonth(m);
    setTimeout(() => {
      document.getElementById(`agenda-day-${y}-${m}-${d}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.setTimeout(() => { suppressAutoExtendRef.current = false; }, 2000);
    }, 80);
  }, [ensureMonthLoaded]);

  const goToday = useCallback(() => {
    const ty = today.getFullYear();
    const tm = today.getMonth();
    suppressAutoExtendRef.current = true;
    setMonthStream(prev => {
      if (prev.some(m => m.year === ty && m.month === tm)) return prev;
      return [{ year: ty, month: tm }, ...prev];
    });
    setActiveYear(ty);
    setActiveMonth(tm);
    setTimeout(() => {
      const el = document.getElementById(`agenda-day-${ty}-${tm}-${today.getDate()}`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.setTimeout(() => { suppressAutoExtendRef.current = false; }, 2000);
    }, 80);
  }, [today]);

  // --- Navegação interna do calendário popover ---
  const openCalendar = useCallback(() => {
    setCalYear(activeYear);
    setCalMonth(activeMonth);
    setCalendarOpen(true);
  }, [activeYear, activeMonth]);

  const calGoPrev = useCallback(() => {
    let m = calMonth - 1;
    let y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    setCalMonth(m);
    setCalYear(y);
  }, [calMonth, calYear]);

  const calGoNext = useCallback(() => {
    let m = calMonth + 1;
    let y = calYear;
    if (m > 11) { m = 0; y += 1; }
    setCalMonth(m);
    setCalYear(y);
  }, [calMonth, calYear]);

  const pickCalendarDate = useCallback((date: Date) => {
    goToDate(date);
    setCalendarOpen(false);
  }, [goToDate]);

  // --- CRUD callbacks ---
  const reloadData = useCallback(() => {
    if (!userId) return;
    const offsets = [-1, 0, 1];
    Promise.all(offsets.map((offset) => {
      let nm = activeMonth + offset;
      let ny = activeYear;
      while (nm < 0) { nm += 12; ny -= 1; }
      while (nm > 11) { nm -= 12; ny += 1; }
      return ensureMonthLoaded(ny, nm, true);
    }));
    loadUpcoming();
  }, [userId, activeYear, activeMonth, ensureMonthLoaded, loadUpcoming]);

  const handleDelete = useCallback(async (id: string) => {
    if (!userId) return;
    try {
      await deleteCommitment(userId, id);
      reloadData();
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Agenda] Erro ao excluir', e);
      addToast('Não foi possível excluir o compromisso', 'error');
    }
  }, [userId, reloadData, addToast]);

  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    if (!userId) return;
    try {
      await toggleCommitment(userId, id, completed);
      reloadData();
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Agenda] Erro ao marcar/desmarcar', e);
      addToast('Erro ao atualizar status', 'error');
    }
  }, [userId, reloadData, addToast]);

  // --- Inline edit handlers ---
  const startEdit = useCallback((c: AgendaCommitment) => {
    setEditingId(c.id ?? null);
    setEditText(c.title);
  }, []);

  const commitEdit = useCallback(async (id: string) => {
    if (!userId) return;
    const text = editText.trim();
    if (!text) {
      await handleDelete(id);
    } else {
      try {
        await updateCommitment(userId, id, { title: text });
        reloadData();
      } catch (e) {
        if (import.meta.env.DEV) console.error('[Agenda] Erro ao editar', e);
        addToast('Não foi possível salvar a alteração', 'error');
      }
    }
    setEditingId(null);
    setEditText('');
  }, [userId, editText, reloadData, handleDelete, addToast]);

  const startAdd = useCallback((dayKey: string) => {
    setAddingDayKey(dayKey);
    setAddText('');
  }, []);

  const commitAdd = useCallback(async (dateObj: Date) => {
    if (!userId) return;
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      const text = addText.trim();
      if (text) {
        const docRefId = await addCommitment(userId, {
          date: dateObj,
          title: text,
          completed: false,
        });

        const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
        const optimisticCommitment = {
          id: docRefId,
          date: dateObj,
          title: text,
          completed: false,
        } as unknown as AgendaCommitment;
        setAllMonths((prev) => {
          const existing = prev[key] || [];
          return { ...prev, [key]: [...existing, optimisticCommitment] };
        });
        loadedKeysRef.current.delete(key);
      }
      setAddingDayKey(null);
      setAddText('');
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Agenda] Erro ao adicionar', e);
      addToast('Não foi possível adicionar o compromisso', 'error');
    } finally {
      isSavingRef.current = false;
    }
  }, [userId, addText, addToast]);

  // --- Alarm handlers ---
  const openAlarm = useCallback((c: AgendaCommitment) => {
    const d = tsToDate(c.date);
    setAlarmTarget({
      id: c.id ?? '',
      date: d,
      title: c.title,
      currentAlarm: c.alarmAt ? tsToDate(c.alarmAt) : undefined,
    });
  }, []);

  const setAlarm = useCallback(async (time: string) => {
    if (!userId || !alarmTarget) return;
    const [h, m] = time.split(':').map(Number);
    const alarmDate = new Date(alarmTarget.date);
    alarmDate.setHours(h, m, 0, 0);
    try {
      await updateCommitment(userId, alarmTarget.id, { alarmAt: alarmDate });
      scheduleAlarm({
        commitmentId: alarmTarget.id,
        title: alarmTarget.title,
        dateStr: toDateInputStr(alarmTarget.date),
        alarmAt: alarmDate,
      });
      reloadData();
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Agenda] Erro ao definir alarme', e);
      addToast('Erro ao definir alarme', 'error');
    }
    setAlarmTarget(null);
  }, [userId, alarmTarget, reloadData, addToast]);

  const clearAlarm = useCallback(async () => {
    if (!userId || !alarmTarget) return;
    try {
      await updateCommitment(userId, alarmTarget.id, { alarmAt: null });
      cancelAlarm(alarmTarget.id);
      reloadData();
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Agenda] Erro ao remover alarme', e);
      addToast('Erro ao remover alarme', 'error');
    }
    setAlarmTarget(null);
  }, [userId, alarmTarget, reloadData, addToast]);

  function commitmentTimeLabel(c: AgendaCommitment): string {
    if (c.time) return c.time;
    const d = tsToDate(c.date);
    if (d.getHours() || d.getMinutes()) return formatTime(d);
    return '';
  }

  // --- Renderização de cada linha de dia (inline edit + alarme) ---
  function renderDayRow(
    day: number,
    month: number,
    year: number,
  ) {
    const key = `${year}-${month}-${day}`;
    const commitments = dayMap.get(key) || [];
    const dateObj = new Date(year, month, day);
    const dayIdx = dateObj.getDay();
    const dayOfWeek = DAYS_SHORT[dayIdx];
    const isToday = isSameDay(dateObj, today);
    const isWeekend = dayIdx === 0 || dayIdx === 6;
    const isEmpty = commitments.length === 0;
    const isAdding = addingDayKey === key;
    const todayCls = isToday ? 'font-bold italic' : '';

    // Estrutura única de TODA faixa da agenda (vazia, de 1 linha ou fragmento de
    // multilinha): altura fixa = AGENDA_ROW_HEIGHT; a régua vem UMA vez da pauta
    // global do caderno — nenhuma linha desenha a própria régua.
    const rowCls = `relative flex items-end gap-3 -mx-4 px-4 ${todayCls}`;

    const firstCommit = commitments[0];
    const restCommits = commitments.slice(1);
    const firstId = firstCommit?.id ?? '';
    const firstLines = firstId ? commitLines[firstId] : undefined;
    const firstFragments = firstLines && firstLines.length > 1 ? firstLines : null;

    const dayLabel = (
      <span
        className={`self-start w-[70px] shrink-0 text-[11px] font-black uppercase tracking-wider ${
          isToday ? 'text-sky-700 ring-2 ring-sky-500 rounded-full px-1.5' : isWeekend ? 'text-rose-500' : 'text-slate-500'
        }`}
      >
        {dayOfWeek} {day}
      </span>
    );

    // Caixa de texto comum a qualquer compromisso: âncora invisível com o título
    // completo (para medição de quebra) + fragmento 1 (ou o título completo).
    const titleSpan = (c: AgendaCommitment, fragments: string[] | null) => (
      <span
        className={`flex-1 text-sm leading-[19px] break-words cursor-text relative min-w-0 ${
          c.completed ? 'line-through text-slate-400' : 'text-slate-800'
        }`}
        data-title-anchor={c.id}
        onClick={() => startEdit(c)}
      >
        {fragments && (
          <span aria-hidden className="invisible absolute left-0 right-0 top-0" data-measure-anchor>
            {c.title}
          </span>
        )}
        {fragments ? fragments[0] : c.title}
      </span>
    );

    // Linhas 2..N de um compromisso quebrado: faixas reais da mesma grade, sem
    // rótulo de dia/checkbox — só o fragmento, alinhado à 1ª linha.
    const continuationRows = (c: AgendaCommitment, fragments: string[] | null) =>
      fragments && fragments.length > 1 && editingId !== c.id
        ? fragments.slice(1).map((ln, i) => (
            <div
              key={`frag-${c.id}-${i}`}
              data-continuation-row={c.id}
              className={rowCls}
              style={{ height: AGENDA_ROW_HEIGHT }}
            >
              <span className="w-[70px] shrink-0" aria-hidden="true" />
              <span className="shrink-0 w-4 h-4" aria-hidden="true" />
              <span
                className={`flex-1 text-sm leading-[19px] break-words cursor-text min-w-0 ${
                  c.completed ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
                data-fragment-line
                onClick={() => startEdit(c)}
              >
                {ln}
              </span>
            </div>
          ))
        : null;

    const controls = (c: AgendaCommitment) => (
      <>
        {commitmentTimeLabel(c) && (
          <span className="text-[11px] font-mono text-slate-400 shrink-0">{commitmentTimeLabel(c)}</span>
        )}
        <button
          onClick={() => openAlarm(c)}
          className={`transition-colors p-0.5 shrink-0 ${
            c.alarmAt ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
          }`}
          title={c.alarmAt ? 'Alarme definido' : 'Definir alarme'}
        >
          {c.alarmAt ? <Bell size={12} fill="currentColor" /> : <BellOff size={12} />}
        </button>
        <button
          onClick={() => c.id && handleDelete(c.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-0.5 shrink-0"
          title="Excluir"
        >
          <Trash2 size={12} />
        </button>
      </>
    );

    const editInput = (commitId: string | undefined) => (
      <>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={() => commitId && commitEdit(commitId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && commitId) commitEdit(commitId);
            if (e.key === 'Escape') setEditingId(null);
          }}
          className="flex-1 text-sm leading-none bg-transparent outline-none text-slate-800 min-w-0"
          autoFocus
        />
        <button
          onClick={() => commitId && commitEdit(commitId)}
          className="shrink-0 text-emerald-500 hover:text-emerald-600 p-[1px]"
          title="Confirmar"
        >
          <Check size={14} strokeWidth={3} />
        </button>
      </>
    );

    const checkbox = (c: AgendaCommitment) => (
      <button
        onClick={() => c.id && handleToggle(c.id, !c.completed)}
        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors mb-px ${
          c.completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-300 hover:border-sky-400'
        }`}
      >
        {c.completed && <Check size={10} strokeWidth={3} />}
      </button>
    );

    return (
      <div key={key}>
        {/* Linha do dia: cabeçalho + primeiro compromisso na MESMA faixa da grade */}
        <div
          id={`agenda-day-${year}-${month}-${day}`}
          data-commit-id={firstCommit?.id}
          className={`${rowCls} group`}
          style={{ height: AGENDA_ROW_HEIGHT }}
        >
          {dayLabel}

          {firstCommit &&
            (editingId === firstCommit.id ? (
              editInput(firstCommit.id)
            ) : (
              <>
                {checkbox(firstCommit)}
                {titleSpan(firstCommit, firstFragments)}
                {controls(firstCommit)}
              </>
            ))}

          {isEmpty && !isAdding && (
            <span className="text-[11px] text-slate-300 flex-1 cursor-pointer" onClick={() => startAdd(key)}>—</span>
          )}
        </div>

        {/* Fragmentos 2..N do primeiro compromisso — faixas reais da mesma grade */}
        {continuationRows(firstCommit, firstFragments)}

        {/* Demais compromissos: cada um em faixa própria + fragmentos */}
        {restCommits.map((c) => {
          const cId = c.id ?? '';
          const cLines = cId ? commitLines[cId] : undefined;
          const cFragments = cLines && cLines.length > 1 ? cLines : null;
          return (
            <div key={c.id}>
              <div
                data-commit-id={c.id}
                className={`${rowCls} hover:bg-sky-50/50 rounded-sm group`}
                style={{ height: AGENDA_ROW_HEIGHT }}
              >
                <span className="w-[70px] shrink-0" aria-hidden="true" />
                {editingId === c.id ? (
                  editInput(c.id)
                ) : (
                  <>
                    {checkbox(c)}
                    {titleSpan(c, cFragments)}
                    {controls(c)}
                  </>
                )}
              </div>
              {continuationRows(c, cFragments)}
            </div>
          );
        })}

        {isAdding ? (
          <div className="relative flex items-end gap-3 -mx-4 px-4" style={{ height: AGENDA_ROW_HEIGHT }}>
            <span className="w-[70px] shrink-0" aria-hidden="true" />
            <div className="shrink-0 w-4 h-4 rounded border-2 border-dashed border-sky-300" />
            <input
              type="text"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onBlur={() => commitAdd(dateObj)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAdd(dateObj);
                if (e.key === 'Escape') setAddingDayKey(null);
              }}
              placeholder="Digite o compromisso..."
              className="flex-1 text-sm leading-none bg-transparent outline-none text-slate-700 placeholder-slate-400"
              autoFocus
            />
            <button
              onClick={() => commitAdd(dateObj)}
              className="shrink-0 text-emerald-500 hover:text-emerald-600 p-[1px]"
              title="Confirmar"
            >
              <Check size={14} strokeWidth={3} />
            </button>
            <button
              onClick={() => setAddingDayKey(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div
            className="relative flex items-end gap-3 -mx-4 px-4 cursor-pointer hover:bg-sky-50/50 rounded-sm group"
            onClick={() => startAdd(key)}
            style={{ height: AGENDA_ROW_HEIGHT }}
          >
            <span className="w-[70px] shrink-0" aria-hidden="true" />
          </div>
        )}
      </div>
    );
  }

  // --- Divider entre meses ---
  function renderDivider(month: number, year: number) {
    return (
      <div key={`divider-${year}-${month}`} className="flex items-center gap-3 h-[19px] select-none">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {MONTHS[month]} {year}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
    );
  }

  // --- Render ---
  return (
    <>
      {!userId ? (
        <div className="max-w-4xl mx-auto px-4 pt-14 md:pt-6 pb-28 animate-in fade-in duration-500">
          <p className="text-slate-500 text-sm">Faça login para usar a Agenda.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 pb-28">

          {/* Cabeçalho fixo — seção + mês/ano sempre visíveis durante o scroll.
              Usa `fixed` (não `sticky`): o AppLayout tem <main overflow-y-auto>,
              que se torna o "scroll container" mais próximo e impede o sticky de
              engatar. `fixed` prende à viewport, como os botões flutuantes. */}
          <div
            ref={monthHeaderRef}
            data-testid="agenda-header"
            className="fixed top-[calc(4rem+env(safe-area-inset-top))] left-0 right-0 z-[90] bg-white border-b border-slate-100 h-14"
          >
            <div className="relative flex items-center justify-between max-w-4xl mx-auto px-4 h-full">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <CalendarDays size={18} className="text-sky-600" />
                Agenda
              </h1>

              {/* Navegação de mês centralizada em relação ao caderno (folha pautada). */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={goPrevMonth}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 shrink-0"
                  aria-label="Mês anterior"
                  data-testid="agenda-prev-month"
                >
                  <ChevronLeft size={18} />
                </button>
                <span
                  data-testid="agenda-month-label"
                  aria-live="polite"
                  className="text-sm font-black text-slate-800 uppercase tracking-tight text-center mx-1"
                >
                  <time dateTime={`${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`}>
                    {MONTHS[activeMonth]} {activeYear}
                  </time>
                </span>
                <button
                  onClick={goNextMonth}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 shrink-0"
                  aria-label="Próximo mês"
                  data-testid="agenda-next-month"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={openCalendar}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 shrink-0"
                  aria-label="Ir para data"
                  title="Ir para data"
                  data-testid="agenda-open-calendar-header"
                >
                  <CalendarDays size={18} />
                </button>
              </div>

              {/* HOJE + PRÓXIMOS — à direita do mês/ano, na barra fixa */}
              <div className="flex items-center gap-2">
                {userId && !showUpcoming && !isTodayVisible && (
                  <button
                    onClick={goToday}
                    data-testid="agenda-hoje"
                    className="bg-sky-500 text-white px-3.5 py-1.5 rounded-xl shadow hover:bg-sky-600 transition-all active:scale-95 text-sm font-bold"
                  >
                    HOJE
                  </button>
                )}
                <button
                  onClick={toggleUpcoming}
                  data-testid="agenda-proximos-toggle"
                  className="bg-sky-500 text-white px-3.5 py-1.5 rounded-lg shadow hover:bg-sky-600 transition-all active:scale-95 text-sm font-bold"
                >
                  Próximos
                </button>
              </div>
            </div>
          </div>

          {/* Espaçador que reserva a altura do cabeçalho fixo (h-14) para o
              caderno não ficar escondido sob a barra. */}
          <div className="h-14" aria-hidden="true" />

      {showUpcoming ? (
        <section data-testid="agenda-proximos-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Próximos Compromissos
            </h2>
            <button
              onClick={() => setShowUpcoming(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
              aria-label="Voltar ao caderno"
              data-testid="agenda-proximos-close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => applyUpcomingLimit(5)}
              data-testid="agenda-proximos-5"
              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                upcomingLimit === 5 ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              5
            </button>
            <button
              onClick={() => setCustomOpen((v) => !v)}
              data-testid="agenda-proximos-custom"
              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                customOpen || upcomingLimit !== 5 ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              N
            </button>
            {customOpen && (
              <>
                <input
                  type="number"
                  min={1}
                  max={UPCOMING_LIMIT_MAX}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onBlur={commitCustom}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitCustom();
                    if (e.key === 'Escape') setCustomOpen(false);
                  }}
                  autoFocus
                  placeholder="Nº"
                  data-testid="agenda-proximos-input"
                  className="w-20 text-sm px-2 py-1 rounded-lg border border-slate-200 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <button
                  onClick={commitCustom}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  Ver
                </button>
              </>
            )}
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum compromisso futuro.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((c) => {
                const d = tsToDate(c.date);
                const label = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 group">
                    <button
                      onClick={() => c.id && handleToggle(c.id, !c.completed)}
                      className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        c.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-sky-400'
                      }`}
                    >
                      {c.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className="text-[11px] font-black text-slate-500 min-w-[90px] uppercase tracking-tight">
                      {label}
                    </span>
                    <span
                      className={`flex-1 text-sm leading-tight break-words ${
                        c.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {c.title}
                    </span>
                    {commitmentTimeLabel(c) && (
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {commitmentTimeLabel(c)}
                      </span>
                    )}
                    <button
                      onClick={() => c.id && handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-0.5"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
      {/* CADERNO */}
      <div ref={notebookRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative -mt-2">
        <div className="relative">
          {/* Linha vertical vermelha (margem do caderno) */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-red-300 pointer-events-none" />

          <div className="relative pl-14 pr-4" data-notebook-content style={agendaPautaStyle}>
            {initialLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              monthStream.map(({ year, month }, idx) => {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                return (
                  <div key={`sec-${year}-${month}`}>
                    {idx > 0 && renderDivider(month, year)}
                    <div data-month-section={`${year}-${month}`}>
                      {days.map((day) => renderDayRow(day, month, year))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
        </>
      )}

    </div>
      )}

      {/* POPOVER — Configurar alarme */}
      {alarmTarget && (
        <div className="fixed inset-0 z-[100] bg-black/30 flex items-end md:items-center justify-center p-4" onClick={() => setAlarmTarget(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Alarme</h3>
              <button onClick={() => setAlarmTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-600 truncate">{alarmTarget.title}</p>
            {alarmTarget.currentAlarm && (
              <p className="text-[11px] text-amber-600 font-medium">
                Alarme atual: {formatTime(alarmTarget.currentAlarm)}
              </p>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5 block">
                Horário do alarme
              </label>
              <input
                type="time"
                defaultValue={alarmTarget.currentAlarm ? formatTime(alarmTarget.currentAlarm) : ''}
                id="alarm-time-input"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              {alarmTarget.currentAlarm && (
                <button
                  onClick={clearAlarm}
                  className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  Remover
                </button>
              )}
              <button
                onClick={() => {
                  const input = document.getElementById('alarm-time-input') as HTMLInputElement;
                  if (input?.value) setAlarm(input.value);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Definir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPOVER — Calendário de navegação rápida */}
      {calendarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/30 flex items-end md:items-center justify-center p-4"
          onClick={() => setCalendarOpen(false)}
          data-testid="agenda-calendar-popover"
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Calendário</h3>
              <button
                onClick={() => setCalendarOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={calGoPrev}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
                aria-label="Mês anterior no calendário"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {MONTHS[calMonth]} {calYear}
              </span>
              <button
                onClick={calGoNext}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
                aria-label="Próximo mês no calendário"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {DAYS_SHORT.map((d) => (
                <span key={d} className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-1">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const cells: React.ReactNode[] = [];
                const firstDayOffset = new Date(calYear, calMonth, 1).getDay();
                const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                for (let i = 0; i < firstDayOffset; i++) cells.push(<div key={`pad-${i}`} />);
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateObj = new Date(calYear, calMonth, day);
                  const isToday = isSameDay(dateObj, today);
                  const dayIdx = dateObj.getDay();
                  const hasCommits = dayMap.has(`${calYear}-${calMonth}-${day}`);
                  cells.push(
                    <button
                      key={`day-${day}`}
                      onClick={() => pickCalendarDate(dateObj)}
                      data-testid={`calendar-day-${calYear}-${calMonth}-${day}`}
                      className={`relative h-9 rounded-lg text-sm font-semibold transition-colors ${
                        isToday
                          ? 'bg-sky-500 text-white shadow'
                          : dayIdx === 0
                            ? 'text-red-700 hover:bg-red-50'
                            : dayIdx === 6
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-slate-700 hover:bg-sky-50'
                      }`}
                    >
                      {day}
                      {hasCommits && !isToday && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400" />
                      )}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { goToday(); setCalendarOpen(false); }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Hoje
              </button>
              <button
                onClick={() => setCalendarOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {loadError && (
        <div className="fixed bottom-24 right-6 z-50 bg-red-500 text-white px-4 py-2.5 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2">
          <span>Erro ao carregar dados</span>
          <button
            onClick={() => { setLoadError(false); reloadData(); }}
            className="underline font-black"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </>
  );
};

export { AgendaHub, pickActiveMonth };
