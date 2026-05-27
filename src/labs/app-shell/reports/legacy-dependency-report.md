# Legado Dependency Report: Mapa de Acoplamento

Este documento mapeia os principais componentes da aplicação e classifica seu nível de acoplamento com o sistema legado (`useAppState`, `firebase`, contexto global).

## Classificação de Risco
* **PURE**: Sem dependências globais ou externas.
* **SEMI_COUPLED**: Dependências moderadas (ex: Firebase local, props específicas).
* **HIGHLY_COUPLED**: Fortemente dependente de `useAppState`, Firebase global, contextos complexos.

---

## Análise de Componentes

### 1. SettingsPage
* **Classificação**: **HIGHLY_COUPLED**
* **Dependências**: `firebase/firestore`, `firebase/auth`, `firebase/database`, `useFirebase` (hook customizado).
* **Uso de Hooks**: `useFirebase`.
* **Side effects**: Manipulação direta de dados no Firebase, deleção de usuário, manipulação de Realtime Database.
* **Estratégia de Adaptação**: Necessita de criação de *Adapters* para isolar a lógica de escrita/leitura do Firebase. Transformar em um módulo de "Conta" na nova arquitetura.

### 2. DebtManager / GoalManager / ActiveWealthManager
* **Classificação**: **HIGHLY_COUPLED**
* **Dependências**: `firebase/firestore`, `useFirebase`.
* **Side effects**: CRUD intensivo via Firestore.
* **Estratégia de Adaptação**: Extrair lógica de CRUD para hooks customizados de *Server State* (React Query/SWR) no futuro.

### 3. AuthLogin / AuthRegister
* **Classificação**: **HIGHLY_COUPLED**
* **Dependências**: `firebase/auth`, `firebase/firestore`.
* **Side effects**: Autenticação global.
* **Estratégia de Adaptação**: Migrar para `AuthShell` e abstrair lógica de auth para um provider global dedicado.

---

## Resumo Diagnóstico

### Classificação Geral de Risco da Aplicação
**ALTO.** O sistema possui um forte acoplamento com o Firebase e com o hook monolítico `useAppState`. A maioria dos componentes que manipulam dados (gerenciamento de riqueza, dívidas, metas) injeta dependências de infraestrutura diretamente na UI.

### Componentes Mais Perigosos
1. **SettingsPage**: Possui o maior número de dependências de infraestrutura distintas (Firestore, Auth, Realtime DB).
2. **Dashboard / AppRoutes (Legados)**: O epicentro da lógica de orquestração via `currentTool`.

### Componentes Prontos para Migração Imediata
* **ExplorarHub** e páginas de conteúdo puras (se existirem, sem Firebase intenso).
* **Ferramentas (`tool-*`)**: Muitas destas parecem possuir lógica de cálculo isolada (podem ser refatoradas para `PURE` com facilidade).

### Proposta de Ordem Segura de Migração
1. **Fase 1**: Refatorar componentes financeiros (`DebtManager`, `GoalManager`) para isolar a lógica do Firebase em *hooks* de Server State (preparação).
2. **Fase 2**: Migrar territórios de baixo risco (`Mais` - configuracoes, perfil).
3. **Fase 3**: Migrar `Explora` e ferramentas isoladas.
4. **Fase 4**: Migrar o core operacional (`Controla`) após a refatoração do estado.
