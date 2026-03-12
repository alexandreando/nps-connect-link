

## Plano: Melhorias de filtros, visões salvas, listagem paginada e Top Tags

### Escopo

4 frentes de melhoria aplicadas ao Dashboard (`AdminDashboard.tsx`), Histórico (`AdminChatHistory.tsx`) e Relatório CSAT (`AdminCSATReport.tsx`).

---

### 1. Padronizar e melhorar filtros nas 3 telas

**Problema**: O Dashboard usa `SearchableMultiSelect` single-value (seleciona 1), o Histórico usa um `MultiSelectFilter` local, e o CSAT usa `SearchableMultiSelect` single-value. Os filtros não são consistentes entre telas e faltam filtros de time e data no Dashboard.

**Solução**: Padronizar as 3 telas com o mesmo set de filtros usando `SearchableMultiSelect` (já existente) com suporte real a multi-seleção onde aplicável:

| Filtro | Dashboard | Histórico | CSAT |
|--------|-----------|-----------|------|
| Período (select) | ✅ já tem | ➕ adicionar | ✅ já tem |
| Data De/Até | ➕ adicionar | ✅ já tem | ✅ já tem |
| Atendente (multi) | ✅→multi | ✅ já tem | ✅→multi |
| Time (multi) | ➕ adicionar | ➕ adicionar | ✅→multi |
| Status | ✅ já tem | ✅ já tem | n/a |
| Tags (multi) | ✅ já tem | ✅ já tem | ✅ já tem |
| Empresa | ✅ já tem | ➕ adicionar | ✅ já tem |
| Contato | ✅ já tem | ➕ adicionar | ✅ já tem |
| Busca texto | ➕ adicionar | ✅ já tem | n/a |
| Botão limpar todos | ➕ adicionar | ➕ adicionar | ➕ adicionar |

**Alterações nos hooks**:
- `useDashboardStats`: Adicionar `dateFrom`, `dateTo`, `teamId`, `attendantIds[]` (multi) e `search` ao `DashboardFilters`. Ajustar query para filtrar por time (buscar attendant_ids do time) e por datas custom.
- `useChatHistory`: Adicionar `teamId`, `companyId`, `companyContactId` ao `HistoryFilter`. Ajustar query.
- `useCSATReport`: Mudar `attendantId` para `attendantIds[]` (multi), `teamId` para `teamIds[]` (multi), `tagId` para `tagIds[]` (multi).

**Alterações nas páginas**: Atualizar os 3 componentes para usar os filtros padronizados com `SearchableMultiSelect` + botão "Limpar filtros" que reseta tudo.

---

### 2. Visões pré-definidas (até 5) no Dashboard

**Armazenamento**: `localStorage` com chave `dashboard-saved-views`. Cada visão salva: `{ id, name, filters: DashboardFilters }`.

**UI**: Abaixo do `FilterBar`, uma barra horizontal com:
- Chips clicáveis para cada visão salva (ex: "Visão 1: Hoje + Time A")
- Ao clicar: aplica os filtros salvos ao filtro atual
- Botão "+" para salvar a visão atual (abre dialog com campo nome, máx 5)
- Ao hover no chip: ícone de editar (renomear) e deletar
- Se já tem 5, o botão "+" fica desabilitado com tooltip "Máximo de 5 visões"

**Comportamento**: Ao clicar numa visão, os filtros são aplicados mas o usuário pode editá-los livremente. A visão salva não muda — sempre replica o que foi salvo. Para alterar a visão, o usuário deleta e salva outra.

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminDashboard.tsx` | Adicionar estado `savedViews`, carregar do localStorage, renderizar barra de visões, dialogs de salvar/deletar |

---

### 3. Listagem paginada de conversas no Dashboard

**Problema**: O Dashboard mostra métricas e gráficos mas não lista as conversas do período filtrado.

**Solução**: Adicionar uma seção "Conversas do Período" no final do dashboard (antes do Status em Tempo Real), com tabela paginada (20 por página) buscando `chat_rooms` com os mesmos filtros do dashboard.

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminDashboard.tsx` | Nova seção com query paginada separada (range-based, 20/página), colunas: Cliente, Atendente, Status, Resolução, CSAT, Duração, Data. Clique abre `ReadOnlyChatDialog`. |

A query será independente do `useDashboardStats` para não pesar — será feita sob demanda com paginação `range(from, to)` e `count: "exact"`. Reutiliza os mesmos filtros.

---

### 4. Redesign do Top Tags

**Problema atual**: Lista simples com barra de progresso fina e número. Pouco informativo e visualmente fraco.

**Novo design**: Card com layout horizontal tipo ranking com muito mais informação:

- Cada tag exibe: posição (#1, #2...), dot colorido, nome, contagem absoluta, percentual do total, barra de progresso proporcional mais expressiva
- Barra usa a cor da tag com gradiente suave
- Tooltip no hover mostrando: "Tag X — N conversas — Y% do total"
- Se houver mais de 10 tags, mostrar top 10 com indicador "+N outras tags"
- Badge de "mais usada" na #1
- Altura fixa com scroll suave se necessário

**Código**: Substituir o bloco `{/* Top Tags */}` no `AdminDashboard.tsx` por um componente mais rico com `Tooltip`, barras mais expressivas (h-3 ao invés de h-1.5), percentuais, badge na primeira posição.

---

### Arquivos modificados

| Arquivo | Mudanças |
|---------|----------|
| `src/hooks/useDashboardStats.ts` | Expandir `DashboardFilters` com `dateFrom`, `dateTo`, `teamId`, `attendantIds[]`, `search`. Ajustar `fetchStats`. |
| `src/pages/AdminDashboard.tsx` | Filtros padronizados, visões salvas (localStorage), listagem paginada de conversas, redesign Top Tags, botão limpar filtros |
| `src/hooks/useChatHistory.ts` | Adicionar `teamId`, `companyId`, `companyContactId` ao `HistoryFilter` e ajustar query |
| `src/pages/AdminChatHistory.tsx` | Adicionar filtros de Time, Empresa, Contato, Período (select), botão limpar filtros. Remover `MultiSelectFilter` local em favor do `SearchableMultiSelect` |
| `src/hooks/useCSATReport.ts` | Mudar para multi-seleção: `attendantIds[]`, `teamIds[]`, `tagIds[]`. Ajustar queries. |
| `src/pages/AdminCSATReport.tsx` | Atualizar para multi-seleção nos filtros, adicionar botão limpar filtros |

