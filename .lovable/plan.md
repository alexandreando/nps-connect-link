

## Plano: 4 melhorias simultâneas

### 1. Tags editáveis no ReadOnlyChatDialog (chat fechado)

Adicionar o componente `ChatTagSelector` no painel lateral de chat aberto via histórico.

**Arquivo**: `src/components/chat/ReadOnlyChatDialog.tsx`
- Substituir a exibição estática de tags (linhas 181-188) pelo componente `ChatTagSelector` já existente, passando `roomId`
- Manter a exibição compacta com `compact` prop

### 2. Filtros multi-seleção com busca em todos os relatórios

Criar um componente reutilizável `SearchableMultiSelect` que combina multi-seleção (checkboxes) + campo de busca interno para listas longas.

**Novo arquivo**: `src/components/ui/searchable-multi-select.tsx`
- Props: `label`, `options[]`, `selected[]`, `onChange`, `placeholder`
- UI: Popover com Input de busca no topo + lista de checkboxes filtráveis + botão limpar
- Badge com contagem de selecionados

**Arquivos a atualizar** (substituir todos os `<Select>` de filtro simples pelo novo componente multi-seleção):

| Página | Filtros afetados |
|--------|-----------------|
| `AdminCSATReport.tsx` | Atendente, Time, Tag, Empresa, Contato → todos multi-seleção com busca |
| `AdminDashboard.tsx` | Atendente, Categoria, Tag, Empresa, Contato → todos multi-seleção com busca |
| `AdminChatHistory.tsx` | Já usa `MultiSelectFilter` mas SEM busca → adicionar busca interna |

**Hooks afetados** (ajustar tipos de filtro de `string | null` para `string[]`):
- `useCSATReport.ts` — `attendantId`, `teamId`, `tagId`, `contactId`, `companyContactId` → arrays
- `useDashboardStats.ts` — `attendantId`, `categoryId`, `tagId`, `contactId`, `companyContactId` → arrays

### 3. Remover Gerencial dos Relatórios

**Arquivos**:
- `src/components/AppSidebar.tsx` — Remover o item de menu `/admin/gerencial` (linhas 485-491)
- `src/App.tsx` — Remover a rota `/admin/gerencial`
- NÃO deletar o arquivo `AdminDashboardGerencial.tsx` (manter para não quebrar imports residuais, ou deletar se não houver referências)

### 4. Corrigir preview de artigo no editor

O `ArticlePreview` usa classes Tailwind de prose genéricas que não correspondem à renderização real em `HelpPublicArticle.tsx`. A correção é alinhar os estilos do preview com os da página pública.

**Arquivo**: `src/components/help/ArticlePreview.tsx`
- Copiar as classes de prose exatas do `HelpPublicArticle.tsx` (linhas 225-234): tamanhos de heading maiores, estilos de tabela, blockquote, imagens com sombra, etc.
- Adicionar inline styles para variáveis CSS (`--tw-prose-links`, etc.) com cor primária padrão
- Usar `max-w-3xl mx-auto` para simular a largura real da publicação
- Adicionar data de atualização e metadados visuais para fidelidade

