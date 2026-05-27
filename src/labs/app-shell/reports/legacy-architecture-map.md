# Legado: Mapa de Anatomia Estrutural

Este relatório mapeia a anatomia estrutural do sistema legado antes de qualquer migração funcional.

## Classificação Arquitetural
* **PRESENTATIONAL**: UI pura, sem estado, sem efeitos, sem lógica de negócio.
* **CONTAINER**: Gerencia estado local e conecta dados (UI + lógica).
* **ORCHESTRATOR**: Gerencia navegação, orquestra múltiplos domínios ou fluxos complexos (e.g., `AppRoutes.tsx`, `useAppState`).
* **INFRASTRUCTURE_COUPLED**: Depende diretamente de Firebase, Auth, Realtime DB ou APIs externas (alto acoplamento).
* **DOMAIN_MIXED**: Mistura UI, lógica de negócio e infraestrutura no mesmo arquivo.

---

## Mapeamento de Componentes

| Componente | Classificação | Responsabilidade | Risco de Extração |
| :--- | :--- | :--- | :--- |
| `AppHeader.tsx` | PRESENTATIONAL | Layout Header | Baixo |
| `AppRoutes.tsx` | ORCHESTRATOR | Roteamento / Controle de View | Crítico |
| `AuthLogin.tsx` | DOMAIN_MIXED | Auth + UI + Firebase | Alto |
| `DebtOptimizerTool.tsx` | DOMAIN_MIXED | Cálculos complexos + UI + Estado | Alto |
| `SettingsPage.tsx` | INFRASTRUCTURE_COUPLED | CRUD Firebase + UI + Auth | Crítico |
| `HomeTerminalMercado.tsx` | CONTAINER | Busca de ativos + UI | Médio |

---

## Anatomia do Sistema

### 1. Fluxos de Autenticação
* **Central**: `AuthProvider` (via `main.tsx`) e `AppRoutes.tsx`.
* **Side Effects**: `signInWithEmailAndPassword`, `signOut`, `sendEmailVerification` via `firebase/auth`.
* **Acoplamento**: Todos os componentes de auth estão intimamente ligados à instância `auth` de `firebase.ts`.

### 2. Fluxos Financeiros (Core)
* **Controladores**: `Dashboard` e componentes de `tools/wealth`.
* **Persistência**: Firestore (`collection`, `addDoc`, etc.).
* **Dependências**: `useFirebase` hook (que injeta contexto do Firestore).
* **Problema**: O Firebase é consumido em componentes de UI. Não há camada de serviço.

### 3. Orquestração e Estado
* **`AppRoutes.tsx`**: O orquestrador central. Depende totalmente de `useAppState`.
* **`useAppState`**: O orquestrador de estado. Agrupa Auth, lançamentos, categorias e configurações.

---

## Plano Realista de Migração

### Ordem Segura de Extração
1. **Ferramentas (`tools/*.tsx`)**: São `CONTAINER`s ou `DOMAIN_MIXED` mas possuem dependências baixas de sistema. Ótimos para converter em componentes isolados no `Explora`.
2. **Layouts Globais (`AppHeader`, `AppSidebar`)**: `PRESENTATIONAL`s fáceis de mover.
3. **Páginas de Configuração (`Mais`)**: `DOMAIN_MIXED`. Requer extração de lógica de persistência para hooks de *Service*.
4. **Núcleo Operacional (`Controla`)**: Alto risco. Requer refatoração de estado antes da migração.

### Estimativas de Esforço
* **Extração de Ferramentas**: Baixa / Médio risco.
* **Extração de Core Operacional**: Alta complexidade / Risco crítico.

---

## Diagnóstico Final

* **Gargalos arquiteturais**: O acoplamento entre UI e infraestrutura Firebase; a centralização excessiva no `useAppState`.
* **Melhores candidatos**: As `tools/*.tsx`. Elas podem ser movidas para o novo território `Explora` apenas encapsulando sua lógica interna.
* **Piores candidatos**: `Dashboard.tsx` e `SettingsPage.tsx`. Estão intrinsecamente ligados a múltiplos serviços Firebase.

**Conclusão**: O sistema é um "Monólito de UI/Infra" onde a interface é o próprio controlador de dados. A migração precisa focar primeiro em **isolar a lógica de persistência**, para só então mover a UI para a nova arquitetura de territórios.
