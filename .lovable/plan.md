

# Plano: Melhorias de UX/UI e Fluxo — Journey CS (sem Chat e Perfil)

## Premissa de Segurança
Nenhum arquivo do módulo Chat será alterado (AdminWorkspace, ChatWidget, ChatInput, ChatMessageList, ChatRoomList, VisitorInfoPanel, assign-chat-room, resolve-chat-visitor, nps-chat-embed.js, etc.). O fluxo de atendente e widget permanece 100% intacto.

---

## 1. Navegação e Home Unificada

**O que muda:**
- Nova página `/home` pós-login com cards resumidos de cada módulo (NPS score atual, health score médio, artigos pendentes, empresas at risk)
- Cada card linka para o dashboard do módulo respectivo
- Breadcrumbs consistentes em todas as páginas internas
- Badges de "ação necessária" na sidebar (ex: health crítico, artigos pendentes)

**Arquivos:**
- `src/pages/Home.tsx` (novo)
- `src/components/AppSidebar.tsx` (badges + link Home)
- `src/App.tsx` (nova rota `/home`, redirect pós-login)
- `src/contexts/AuthContext.tsx` (redirect para `/home` em vez de módulo específico)

---

## 2. Customer Success

**Filtro por CSM no Kanban:**
- Select de CSM no topo do `CSKanbanBoard` para filtrar carteira por responsável

**MetricCards com delta temporal:**
- Migrar summary cards do Health e Financial para usar o componente `MetricCard` existente com variação percentual vs período anterior

**Health Score composto (visual):**
- No `CompanyCSDetailsSheet`, exibir breakdown visual do health score (NPS 30%, CSAT 20%, atividade chat 20%, dias sem contato 15%, MRR trend 15%) — apenas exibição, sem alterar cálculo automático neste momento

**Timeline unificada na empresa:**
- No `CompanyCSDetailsSheet`, mostrar timeline de atividades cross-módulo (NPS respondido, trails completadas, health changes)

**Arquivos:**
- `src/components/cs/CSKanbanBoard.tsx` (filtro CSM)
- `src/components/cs/CSMetricsHeader.tsx` (delta)
- `src/pages/CSHealthPage.tsx` (padronizar MetricCard)
- `src/pages/CSFinancialPage.tsx` (padronizar MetricCard)
- `src/components/cs/CompanyCSDetailsSheet.tsx` (breakdown + timeline)

---

## 3. NPS

**Segmentação no dashboard:**
- Adicionar filtros por estado, faixa de MRR e health score no dashboard NPS

**NPS Trend por empresa:**
- No detalhe da empresa, gráfico de evolução do NPS ao longo do tempo (linha temporal com recharts)

**Alerta de detrator (visual):**
- Destacar visualmente respostas de detratores (score ≤ 6) com badge vermelho e ícone de alerta na listagem

**Arquivos:**
- `src/pages/Dashboard.tsx` (filtros de segmentação)
- `src/pages/Results.tsx` (badge detrator)
- `src/components/cs/CompanyCSDetailsSheet.tsx` (NPS trend chart)

---

## 4. Help Center

**Artigos relacionados no portal público:**
- No rodapé de `HelpPublicArticle`, exibir até 3 artigos da mesma coleção

**Feedback em artigos:**
- Adicionar "Este artigo foi útil? Sim / Não" no portal público com contagem salva no banco

**Editor split-view:**
- Preview do artigo ao lado do editor em telas largas (usando `react-resizable-panels`)

**Arquivos:**
- `src/pages/HelpPublicArticle.tsx` (artigos relacionados + feedback)
- `src/pages/HelpArticleEditor.tsx` (split-view preview)
- Migration: tabela `help_article_feedback` (article_id, helpful boolean, created_at)

---

## 5. CRM (Contatos e Pessoas)

**Toggle Cards/Tabela:**
- Alternar entre visualização em cards (atual) e tabela compacta na página de Contatos

**Importação com mapeamento:**
- No `BulkImportDialog`, adicionar passo de mapeamento de colunas do CSV para campos do sistema com preview de primeiras linhas

**Navegação empresa ↔ pessoas:**
- No `CompanyDetailsSheet`, listar pessoas vinculadas com link direto. No `PersonDetailsSheet`, mostrar empresa com link.

**Arquivos:**
- `src/pages/Contacts.tsx` (toggle view)
- `src/components/BulkImportDialog.tsx` (mapeamento de colunas)
- `src/components/CompanyDetailsSheet.tsx` (lista de pessoas)
- `src/components/PersonDetailsSheet.tsx` (link empresa)

---

## 6. Portal do Cliente

**Expansão com abas:**
- Adicionar abas: "Meus Chats" (atual), "NPS Pendentes", "Base de Conhecimento" (link Help Center), "Meus Dados" (editar nome, telefone)
- Banner de NPS pendente no topo quando há pesquisa ativa

**IMPORTANTE:** Nenhuma alteração no fluxo de chat existente do portal. A aba "Meus Chats" permanece idêntica, apenas encapsulada numa estrutura de Tabs.

**Arquivos:**
- `src/pages/UserPortal.tsx` (tabs + novas seções)
- `src/components/portal/PortalNPSTab.tsx` (novo)
- `src/components/portal/PortalProfileTab.tsx` (novo)
- `src/components/portal/PortalHelpTab.tsx` (novo)

---

## 7. UI/Design System

**EmptyState component:**
- Componente reutilizável com ícone, título, descrição e CTA primário

**PageSkeleton component:**
- Componente de loading com variantes (cards, tabela, kanban)

**Padronizar MetricCard:**
- Migrar todos os summary cards manuais para usar `MetricCard` com suporte a delta

**Arquivos:**
- `src/components/ui/empty-state.tsx` (novo)
- `src/components/ui/page-skeleton.tsx` (novo)
- Integrar nos módulos CS, NPS, Help, CRM

---

## 8. Performance

**Server-side pagination no Dashboard NPS:**
- Migrar `Dashboard.tsx` de carregar tudo client-side para paginação com `count: "exact"`

**React Query no Dashboard NPS:**
- Substituir useState + useEffect manual por useQuery para cache e loading automáticos

**Lazy loading nos módulos CS e NPS:**
- Aplicar `lazy()` nos imports de páginas CS e NPS no App.tsx (igual ao Help Center)

**Arquivos:**
- `src/pages/Dashboard.tsx` (react-query + pagination)
- `src/App.tsx` (lazy imports)

---

## Database Migrations

1. `help_article_feedback` (article_id uuid FK, helpful boolean, visitor_ip text, created_at timestamptz)
2. RLS: insert público, select por tenant

---

## Ordem de Implementação

1. EmptyState + PageSkeleton (base para os demais)
2. MetricCards padronizados no CS (Health + Financial)
3. Filtro CSM no Kanban CS
4. Filtros de segmentação no Dashboard NPS
5. Home unificada + badges sidebar
6. Help Center: artigos relacionados + feedback
7. CRM: toggle cards/tabela + importação melhorada
8. Portal expandido com tabs
9. Performance: lazy loading + react-query no NPS
10. Help Editor split-view + NPS trend chart

