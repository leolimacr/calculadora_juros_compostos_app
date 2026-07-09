## Goal
- Conduct three successive audits of the Finanças Pro Invest repository: (1) comprehensive global audit, (2) deep surgical audit of the sovereign financial core, (3) audit of UX layer, navigation hierarchy, and product surfaces.

## Constraints & Preferences
- Be factual, evidence-based, minucioso; never give business strategy recommendations; always cite file paths, functions, components, and types; never invent behavior not supported by code.

## Progress
### Done
- **Audit 1 — Global structural audit of entire repository**: 12+ functional areas mapped (src/components/ — 15 subdirs; src/services/ — 22+ services; src/hooks/ — 25+ hooks; src/contexts/ — 6 contexts; src/core/ — 4 subdirs; src/routes/ — 365-line AppRoutes; src/config/ — stripe, nav, constants; src/theme/ — fpiVoiceGuide; src/utils/ — calculations, 321 lines; src/types/ — types; src/firebase/ — config). Financial domain model identified with 4 philosophical axes (Caixa, Pressão, Proteção, Trajetória) traced in code. 8+ business rules identified, 14 in `calculations.ts` line 289 `calculateSovereignBalance` diverges from core engine. Nexus/IA architecture fully documented: 8 backend modules (functions/) + 5+ frontend surfaces (NexusInsightCard, NexusFeed, NexusInlineAdvisor, AiAdvisor, CentralHub Nexus section). Monetization mapped: Free/Pro/Premium in `config/stripePlans.ts`. 26+ test files found across the project. Philosophical coherence confirmed: `fpiVoiceGuide.ts` as single source of truth for all product vocabulary (309 lines). Two lacunas: `derived-state/` subdirs (aggregators, calculators, selectors) completely empty; two frontends (mobile app + web SPA) diverging in some behavior.

- **Audit 2 — Deep surgical audit of sovereign financial core**: No single source of truth — `useSovereignSnapshot` (`src/hooks/useSovereignSnapshot.ts:113`) is the primary orchestrator but `CockpitHero` (`src/components/Home/Cockpit/CockpitHero.tsx:505`) overrides hero value using `transactions.length >= 5` (a criterion absent from the calculation engine). `buildSovereignSnapshot` (`src/utils/calculations.ts:201`) is the central calculation engine, calls `computeSovereignMetrics` (line 157). `calculateSovereignBalance` (line 289) is a parallel dangerous function with different formula (`currentBalance - upcomingInvoices - monthlyFixedExpenses - reserveProvision`) vs core formula (`accumulatedBalance - virtualImpact - pendingBills - protectionShortfall`), used only by Nexus but represents divergence risk. `virtualImpact` has dual semantics: in `aggregateMonthFlow` (line 77) it means `isVirtual` expenses (credit-card-like without cash impact); in `useSovereignSnapshot` (line 91) it means `cardInvoiceRemaining`. `derived-state/` is completely empty (aggregators/, calculators/, selectors/ all empty; `runtime/domain-graph.ts` has `DependencyGraph` class but receives zero nodes — abandoned architecture). 6 calculation inconsistencies between engine and UI documented. Redundant debt bridges: both `DebtContext` and `FinanceContext` call `createDebtRealtimeBridge`.

- **Audit 3 — UX layer, navigation hierarchy, product surfaces audit**: 5 main surfaces mapped (Home/Cockpit, Controla, Central/ExplorarHub, Explorar, Mais). Home/Cockpit is the main surface but has dispersed attention — shows hero value, sovereign buckets, margin trajectory, accounts, card invoices, market data, news, articles, courses, and 3+ Nexus surfaces simultaneously. CentralHub (`src/components/CentralHub.tsx:678`) competes with Home rather than complementing it — re-implements base de proteção, Nexus insights, wealth aggregates. Navigation label inconsistency: `navigation.config.ts` line 35 uses `id: 'explora'` with label `'Explora'` and path `/explora`, while `appPrimaryNav.ts` uses `toolId: 'explorar'` with label `'Explorar'` and `TOOL_ROUTES['explorar']` → `/app/explorar`. No route `/explora` exists — the config is dead code. MobileBottomNav has 5 items (Home, +, Central, Bell, Menu) while desktop PRIMARY_NAV_ITEMS has 4 (Home, Controla, Central, Explorar) — different surfaces between platforms. SettingsPage (`src/components/SettingsPage.tsx:857`) acts as a superficial catch-all for pricing, logout, profile editing, and misc actions. `PRIMARY_NAV_ITEMS` in `appPrimaryNav.ts` uses `isPrimaryNavTool` to filter but many secondary routes are not primary (minhas-dividas, passivos, investimentos, metas, tools).

- **Sovereignty Map implementation** (implemented 2026-06-29): 6-stage financial classification engine at `src/services/sovereignMap.ts` — `classifyStage` function uses `sovereignFreeBalance`, `protectionShortfall`, `leewayDays`, `launchCount`. Stages: `Indefinido → Pressão → Colchão Incompleto → Estável → Sólido → Expansão`. Each stage has explanation, blocking factors, and next step. Rendered as `<SovereignMapCard>` in `HomeMainColumn.tsx` after the Nexus insight card. Stage data computed in `useHomePanelData.ts` via `classifyFromSnapshot`. 15 tests in `src/services/__tests__/sovereignMap.test.ts`.

- **Command Ritual implementation** (implemented 2026-06-29): New `<CommandRitual>` component at `src/components/Home/CommandRitual.tsx` — compact session-briefing card rendered at top of `HomeMainColumn.tsx`. Answers 4 ritual questions in sequence: **Posição** (stage name + delta from last visit via localStorage), **Atenção** (Nexus insight title or first blocker), **Comando** (stage's next step). Delta tracking uses single localStorage key `fpi-comando-prev-stage` — no new infrastructure. Exiting cards (`SovereignMapCard`, `NexusInsightCard`) kept as detailed reference below. Total addition: 1 component (~50 lines), 3 lines in HomeMainColumn.

- **Phase 7 aterragem operacional** (implemented 2026-06-29): Added `COMMAND_ACTIONS` mapping in `CommandRitual.tsx` — each stage's comando now has a CTA button navigating to the real product destination (manager, central, investimentos, or transaction form). No new infrastructure.

- **Phase 8 — retention by continuity** (implemented 2026-06-29): Added metric-level session bridge in `CommandRitual.tsx`. Stores `{ freeBalance, shortfall, launchCount, date }` in localStorage key `fpi-comando-prev-metrics`. Shows "Histórico" line on return with days since last visit + most relevant metric changes (folio delta, protection progress, new transactions). Continuity displayed as: `"Desde 3d: +R$ 800 na folga · proteção avançou R$ 500"` or `"Sessão retomada hoje"`.

- **Invoice period-end link + optimistic cache** (implemented 2026-07-01):
  - Added `linkedInvoicePeriodEnd` / `linkedInvoiceId` to Transaction type and saved in `payInvoiceService.ts:72-77`
  - Changed `invoiceGeneratorService.ts:73-80` to match billPayments by explicit `linkedInvoicePeriodEnd` instead of date window, eliminating boundary misassignment
  - Added initial sync on mount in `useInvoiceSync.ts:61-69` to reconcile legacy stored invoices
  - Added `queryClient.setQueryData` in `useTransactions.ts` after save (line ~536), edit (~353), and delete (~667) — makes new items appear in the list instantly without waiting for the RTDB bridge (fixes 20-50s save delay)
  
- **Optimistic UI — save/delete instantâneo** (implemented 2026-07-01):
  - Moved `setQueryData` to **antes de qualquer await** em `saveLancamento` e `deleteLancamento`
  - Card/debt reactions movidos para background (`async` fire-and-forget dentro de `backgroundOp`)
  - Save: `setQueryData` executado imediatamente após `push()`, antes de `updateCard`/`updateDebt`/`set()`
  - Delete: `setQueryData` executado imediatamente, antes das reversões e do `remove()`
  - Rollback: se `set()`/`remove()` falhar, o cache é desfeito (remove ou restaura o item)
  - Installments: todas as keys geradas no topo, `setQueryData` com array completo, `Promise.all` em background
  
- **Caller do save — modal fecha imediatamente** (implementado 2026-07-01):
  - `AppLayout.tsx:226`: `await saveLancamento()` → `handleCloseModal()` + `saveLancamento().then(...).catch(...)`
  - Modal fecha antes do Firebase write, toasts de sucesso no `.then()`, toast de erro no `.catch()`
  - `sovereignFreeBalance` capturado antes do close (mesmo valor que antes, bridge já era pré-save)

### In Progress
- (none)

### Blocked
- **useDashboardState return statement broken** (inherited from prior refactor): hook's `return {...}` references ~20 variables that were deleted (`guardedSetViewMode`, `commandMode`, `showCalibrationOffer`, `calibrationInviteCopy`, `handleDeferCalibration`, `handleDismissCalibrationInvite`, `handleStartCalibration`, `handleCalibrationComplete`, `categoryStats`, `categorySummary`, `categoryTransactionsMap`, `categoryNames`, `guardedChangeDate`, `guardedDateSelect`, `handleExportPDF`, `handleClearCardFilter`, `handleFilterByCard`, `setRecurringBills`, `setUserCards`). These are all TS2304/TS18004 errors — code unreachable until fixed. Not caused by console.time instrumentation.

### Done
- **console.time instrumentation** (2026-07-07):
  - `useDashboardState.ts`: added `console.time`/`console.timeEnd('uds-filtered-calc')` and `('uds-stats-calc')` inside `filtered` and `stats` useMemos; moved stray `performance.mark/measure` inside the `filtered` useMemo (they were dead code after the closing `]);`); added `console.time('uds-activeInvoices-calc')`
  - `calculations.ts`: added `console.time('calc-aggregateAllTimeFlow')` and `('calc-buildSovereignSnapshot')` to `aggregateAllTimeFlow` and `buildSovereignSnapshot`; refactored `aggregateAllTimeFlow` from `forEach` to `for` loop
  - Fixed stats useMemo closing (`}, [deps]);` was replaced by the hook's `return {` when adding console.timeEnd)
  - Removed unused `getCurrentInvoice` import

## Key Findings (All Audits)

### Sovereign Calculation Architecture
- **Orchestrator**: `useSovereignSnapshot` (`src/hooks/useSovereignSnapshot.ts`) extends `SovereignSnapshot` with 4 extra fields (`totalPendingBills`, `virtualImpact`, `cardFuturePressure`, `rotativoDebtBalance`). Calls `aggregateMonthFlow`, `aggregateAllTimeFlow`, `buildSovereignSnapshot`, `computeSovereignMetrics`.
- **Engine**: `buildSovereignSnapshot` (`src/utils/calculations.ts:201`) takes params and returns `SovereignSnapshot`. Key call chain: `buildSovereignSnapshot` → `computeSovereignMetrics` (line 157) → `getColchaoShortfall/reserveShortfall/protectionBuffer`. Formula: `sovereignFreeBalance = accumulatedBalance - virtualImpact - pendingBills - protectionShortfall` (line 169).
- **Parallel danger**: `calculateSovereignBalance` (`src/utils/calculations.ts:289`) uses formula `currentBalance - upcomingInvoices - monthlyFixedExpenses - reserveProvision`. Called by Nexus only. Different inputs, different result.
- **Missmatch**: In `buildSovereignSnapshot` line 202, `virtualImpact = (params.virtualImpact ?? 0) + (params.rotativoDebtBalance ?? 0)` — `rotativoDebtBalance` is added inside the engine, but `useSovereignSnapshot` line 98 already passes it separately and it appears on both line 99 (`rotativoDebtBalance`) and line 91 (`virtualImpact: cardInvoiceRemaining`). Double-counting risk is mitigated by `cardInvoiceRemaining` being set to 0 for `rotativoConverted` invoices (line 53-54), but the engine's internal addition of `rotativoDebtBalance` is an implicit mixing of card pressure + rotativo debt.
- **CockpitHero override**: Lines 77-86 of `CockpitHero.tsx` override hero value: `heroValue = showFreeBalanceHero ? sovereign.sovereignFreeBalance : sovereign.heroValue`. Decision depends on `transactions.length >= 5` — a heuristic absent from any calculation engine.

### Derived-State Abandoned Architecture
- `src/core/derived-state/aggregators/` — empty
- `src/core/derived-state/calculators/` — empty
- `src/core/derived-state/selectors/` — empty
- `src/core/derived-state/runtime/domain-graph.ts` — `DependencyGraph` class exists but never populated with nodes (line 29: `export const domainGraph = new DependencyGraph()` — zero calls to `addDependency` anywhere in the codebase)

### Navigation & UX Inconsistencies
- `navigation.config.ts` uses `id: 'explora'`/label `'Explora'`/path `/explora` — but `appPrimaryNav.ts` uses `toolId: 'explorar'`/label `'Explorar'`/route `/app/explorar`. The config file routes (`/home`, `/controla`, `/central`, `/explora`, `/mais`) don't match TOOL_ROUTES (`/app/home`, `/app/controla`, `/app/central`, `/app/explorar`, `/app/mais`).
- MobileBottomNav (5 items: Home, Add, Central, Alertas, Mais) ≠ desktop PRIMARY_NAV_ITEMS (4 items: Home, Controla, Central, Explorar). Different surfaces exposed per platform.
- CentralHub (`/app/central`, $HOME) rehashes what Home already shows: base de proteção, reserves, wealth aggregates, Nexus insights. Purpose overlap with Home's CockpitHero + SovereignBuckets.
- ExplorarHub (`/app/explorar`, $HOME) = market data (quotes, news, ticker) + tools (juros, dívidas, alugar, inflação, fire, dividendos, compra) + courses. Serves as a secondary landing for content, competing with Home.
- SettingsPage (`/app/mais`, 857 lines) = profile editor + financial profile + pricing redirect + app version + user deletion + logout action list. No logical grouping, no hierarchy. A settings catch-all.

### Philosophical Axes (Traced in Code)
1. **Caixa (Cash)**: `monthBalance`, `realBalance`, `aggregateMonthFlow` — tracks immediate cash in/out.
2. **Pressão (Pressure)**: `virtualImpact` (invoice remaining), `cardFuturePressure`, `pendingBills`, `obligationsDeduction` — obligations that consume cash.
3. **Proteção (Protection)**: `protectionBuffer`, `colchaoShortfall`, `reserveShortfall`, `marcoZero`, `emergencyReserveCurrent` — layers of financial safety.
4. **Trajetória (Trajectory)**: `buildMarginTrajectory` in `trajectoryEngine.ts`, `freedomVelocity`, `leewayDays` — direction over time.
- But `trajectoryEngine.ts` line 48 uses `flow.realBalance - protection` for margin points — which references `realBalance` (month flow), not `sovereignFreeBalance` (accumulated). Only the current month margin may be overridden by `currentMargin`.

### Nexus/IA Architecture
- **Backend** (8+ modules in `functions/`): `MultiModelRouter.ts` (454 lines, cascading router), `askAiAdvisor.ts` (601 lines, main CF), `analyzeFinancialHealth.ts`, `generateBriefing.ts`, `suggestActions.ts`, `insightRanking.ts`, `contextBuilder.ts`, `personaAnalysis.ts`.
- **Frontend** (5+ surfaces): `NexusInsightCard` (Home), `NexusFeed` (Home sidebar + mobile), `NexusInlineAdvisor` (Controla form), `AiAdvisor` (Chat), `CentralHub Nexus section` (Central), `NexusActionButton` (inline action button).
- `nexusInsightEngine.ts` (634 lines): 15+ insight generators. `buildUserContext` gathers all financial data. `getCentralInsights` produces centralized insights.
- `nexusEventEvaluator.ts` + `eventInsightStore.ts` + `useNexusEventBridge.ts`: event-streamed insight delivery, dedup, analytics.

### Monetization & Plan Gating
- `config/stripePlans.ts` defines Free/Pro/Premium plans.
- Two parallel subscription fields: `subscription.plan` (used by `useSubscriptionAccess`) vs `subscription.planId` (used by `isAppPremium` in user.ts for analytics).
- Nexus actions check `action.requiresPlan` against plan hierarchy (line 42 `planHierarchy = { free: 0, pro: 1, premium: 2 }`).
- `FeatureGate`, `PremiumUpgradePrompt`, `PaywallModal` all in `src/components/` — consistent gating pattern.

## Relevant Files (Mapped Across All 3 Audits)
- `src/utils/calculations.ts` (321 lines) — 11 functions: `aggregateMonthFlow`, `aggregateAllTimeFlow`, `computeSovereignMetrics`, `buildSovereignSnapshot`, `calculateSovereignBalance`, `calculateLeewayDays`, `calculateFreedomVelocity`, computeLaunchImpact, maskCurrency, and helpers (getProtectionBuffer, getColchaoShortfall, getReserveShortfall, getTotalShortfall)
- `src/hooks/useSovereignSnapshot.ts` (113 lines) — Sovereign orchestrator, extension of SovereignSnapshot with 4 extra fields
- `src/components/Home/Cockpit/CockpitHero.tsx` (505 lines) — Overrides hero calculation, adds `transactions.length >= 5` heuristic
- `src/core/derived-state/` — Empty aggregators/calculators/selectors; abandoned DependencyGraph
- `src/theme/fpiVoiceGuide.ts` (309 lines) — Central vocabulary, 4-axis copy, institutional definitions
- `src/services/nexusInsightEngine.ts` (634 lines) — 15+ insights, buildUserContext, getCentralInsights, NexusAdvisoryContext
- `functions/nexus-core/MultiModelRouter.ts` (454 lines) — Multi-model cascading router
- `functions/askAiAdvisor.ts` (601 lines) — Main Nexus Cloud Function
- `src/routes/AppRoutes.tsx` (381 lines) — Central router with loading orchestration (T0-3s, 3-7s, >7s)
- `src/components/MobileBottomNav.tsx` (124 lines) — 5-item bottom nav (Home, Add, Central, Bell, Menu)
- `src/config/appPrimaryNav.ts` (48 lines) — 4-item primary desktop nav (Home, Controla, Central, Explorar)
- `src/config/navigation.config.ts` (48 lines) — Dead config with 'explora'/'Explora'/='/explora' (inconsistent with appPrimaryNav)
- `src/components/CentralHub.tsx` (678 lines) — Competes with Home, rehashes base proteção, Nexus, wealth aggregates
- `src/components/ExplorarHub.tsx` (223 lines) — Market data + tools + courses secondary landing
- `src/components/SettingsPage.tsx` (857 lines) — Superficial catch-all settings (profile + pricing + logout + delete)
- `src/components/Home/NexusInsightCard.tsx` (98 lines) — Home card Nexus surface
- `src/components/Home/NexusActionButton.tsx` (117 lines) — Inline action button with plan gating
- `src/hooks/useNavigation.ts` (158 lines) — Navigation orchestrator with TOOL_ROUTES, Capacitor persistence
- `src/services/trajectoryEngine.ts` (94 lines) — Margin trajectory builder, uses `flow.realBalance - protection`
- `config/stripePlans.ts` — Free/Pro/Premium plan definitions
- `src/types/index.ts` — CardInvoice, InvoiceStatus, FinancialProfile types
- `src/services/debt/debt.realtime.ts` + `src/services/card.realtime.ts` + `src/services/transaction.realtime.ts` — Realtime bridge services (3 bridges)
- `src/contexts/DebtContext.tsx` + `src/contexts/FinanceContext.tsx` — Both call `createDebtRealtimeBridge` (duplicate)
- `src/core/orchestration/domainEvents.ts` — 8 typed domain events
- `src/core/orchestration/event-bus.ts` — EventBus implementation
- `src/services/nexusAnalyticsService.ts` — Analytics tracking (trackInsightClicked, trackActionSuggested, etc.)
- `src/services/eventInsightStore.ts` — Insight dedup store
- `src/hooks/useNexusEventBridge.ts` — Bridge between events and insight store
- `src/services/nexusEventEvaluator.ts` — Evaluates events for relevance
- `src/components/Nexus/NexusFeed.tsx` + `src/components/Nexus/NexusFeedItem.tsx` — Feed surfaces
- `src/services/sovereignMap.ts` (NEW, 137 lines) — 6-stage classification engine: `classifyStage`, `classifyFromSnapshot`, `StageInfo`
- `src/components/Home/SovereignMapCard.tsx` (NEW, 80 lines) — Sovereign Map card rendered in HomeMainColumn
- `src/services/__tests__/sovereignMap.test.ts` (NEW, 114 lines) — 15 tests covering all 6 stages + edge cases

## Conceptual Model (Inferred from Code)
```
CASH (Caixa)
  monthBalance = income - expenses (aggregateMonthFlow.realBalance)
  accumulatedBalance = allTimeFlow.realBalance
  
PRESSURE (Pressão)
  virtualImpact = invoice.remainingAmount (card pressure)
  cardFuturePressure = totalCreditUsed - cardInvoiceRemaining - rotativoDebtBalance
  pendingBills = active unpaid recurring bills
  rotativoDebtBalance = sum(rotativo_cartao debts)
  obligationsDeduction = virtualImpact + pendingBills (+ rotativoDebtBalance inside engine)

PROTECTION (Proteção)
  protectionBuffer = marcoZero + emergencyReserveCurrent
  colchaoShortfall = max(0, colchaoTarget - marcoZero)
  reserveShortfall = max(0, reserveTarget - reserveCurrent)
  protectionShortfall = colchaoShortfall + reserveShortfall

TRAJECTORY (Trajetória)
  sovereignFreeBalance = accumulatedBalance - obligationsDeduction - protectionShortfall
  leewayDays = floor(sovereignFreeBalance / dailyCost)
  freedomVelocity = (monthlyAport / expenses) * 30
  margin trajectory = flow.realBalance - protection (monthly series)

HERO (Display)
  mode = 'rotina' (show monthBalance) | 'comando' (show sovereignFreeBalance)
  Override: CockpitHero uses transactions.length >= 5 OR commandMode
```
