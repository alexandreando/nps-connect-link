

# Plano: Redesign Sidebar + Responsividade Global

## 1. Sidebar Header — Logo e Toggle

**Arquivo:** `src/components/AppSidebar.tsx`

### Expandido
- Logo reduzido de `h-10` para `h-7`, mais elegante
- `SidebarTrigger` com icone `PanelLeftClose` alinhado a direita
- Padding compacto: `px-3 py-2.5`
- Border mais sutil: `border-sidebar-border/50`

### Colapsado (fix do layout quebrado)
- Layout muda para `flex-col items-center gap-2`
- Logo icon centralizado com `h-6 w-6`
- `SidebarTrigger` com `PanelLeftOpen` abaixo, centralizado
- Garantir que o container nao ultrapasse a largura de 48px

### Footer colapsado
- Quando colapsado: empilhar botoes verticalmente (`flex-col items-center gap-1`)
- Esconder dropdown de idioma (nao cabe em 48px)
- Manter apenas tema + logout

### Refinamentos visuais
- Active item: `bg-accent/10` mais sutil
- Hover: `hover:bg-sidebar-accent/70`
- Borders: `border-sidebar-border/50` (mais transparente)
- Spacing entre grupos: `mt-1`

## 2. Responsividade Global — Tabelas e Layouts

**Problema:** Tabelas com muitas colunas (People: 8 colunas, Contacts, HelpArticles, AdminChatHistory) estouram em telas < 1024px. Grids de metricas ficam apertados.

### a) Wrapper de tabela com scroll horizontal

**Arquivos:** `People.tsx`, `Contacts.tsx`, `HelpArticles.tsx`, `AdminChatHistory.tsx`, `AdminCSATReport.tsx`

Envolver cada `<Table>` com `<div className="overflow-x-auto">` para permitir scroll horizontal em telas pequenas sem quebrar o layout.

### b) Esconder colunas secundarias em mobile

**Arquivo:** `People.tsx` — esconder colunas Role, Phone, Chats, CSAT, Portal em telas < 768px usando `hidden md:table-cell` nos `<TableHead>` e `<TableCell>` correspondentes.

**Arquivo:** `Contacts.tsx` — esconder colunas menos importantes (telefone, empresa) em mobile.

### c) Padding responsivo do SidebarLayout

**Arquivo:** `src/components/SidebarLayout.tsx` linha 234

Atualizar padding do container principal:
```
p-3 sm:p-4 md:p-6 lg:p-8
```
Em vez do atual `p-4 md:p-6 lg:p-8`, dando mais espaco em telas muito pequenas.

### d) Dashboard grids

**Arquivo:** `AdminDashboard.tsx` — A grid de metricas `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6` ja e responsiva. Verificar que os `MetricCard` tenham `min-w-0` e `truncate` nos textos para nao estourar.

### e) Filtros em mobile

**Arquivos:** `People.tsx`, `Contacts.tsx` — Os filtros ja usam `flex-wrap`, mas garantir que inputs tenham `min-w-0` em vez de `min-w-[200px]` fixo em telas < 640px. Usar `min-w-[140px] sm:min-w-[200px]`.

## 3. Workspace — Ajustes adicionais

**Arquivo:** `AdminWorkspace.tsx`

- Em mobile (`isMobile`), garantir que a view de chat ocupe 100% sem padding lateral desnecessario
- O panel de lista em mobile deve ter overflow-y controlado

## Arquivos impactados

1. `src/components/AppSidebar.tsx` — Header/footer redesign + fix colapsado
2. `src/components/SidebarLayout.tsx` — Padding responsivo
3. `src/pages/People.tsx` — overflow-x-auto + colunas responsivas
4. `src/pages/Contacts.tsx` — overflow-x-auto + colunas responsivas
5. `src/pages/HelpArticles.tsx` — overflow-x-auto
6. `src/pages/AdminChatHistory.tsx` — overflow-x-auto
7. `src/pages/AdminWorkspace.tsx` — Ajustes mobile

