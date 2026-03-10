
## Plano: Refazer editor de banners com design premium + melhorar fluxo de empresas

### Visão geral

Redesign completo do editor de banners (dialog de criação/edição) e do dialog de atribuição de empresas. O BannerPreview será atualizado para refletir o novo sistema de variantes com glassmorphism. O fluxo de empresas ganha busca melhorada, seleção em batch, e monitoramento visual de engajamento.

---

### 1. Novo sistema de variantes no `BannerPreview.tsx`

Substituir o sistema atual de cores inline por variantes semânticas com suporte a dark mode:

| Variante | Fundo | Borda | Texto | Ícone |
|----------|-------|-------|-------|-------|
| warning | amber-50 | amber-200 | amber-900 | Hammer |
| destructive | red-50 | red-200 | red-900 | ShieldAlert |
| success | emerald-50 | emerald-200 | emerald-900 | CheckCircle |
| neutral | slate-50 | slate-200 | slate-900 | Info |
| brand | indigo-50 | indigo-200 | indigo-900 | Megaphone |

Cada variante terá contraparte dark (ex: `dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100`).

**Layout do banner preview**:
- `py-3 px-5`, `rounded-2xl`, `gap-3` entre ícone/texto/CTA
- Efeito glassmorphism: `bg-white/70 backdrop-blur-md` (light) / `bg-slate-900/70 backdrop-blur-md` (dark)
- `shadow-sm` + borda sutil de 1px
- Texto `text-sm leading-relaxed`
- Link/CTA com `font-semibold underline hover:opacity-80`
- Modo "floating": `mx-4 mt-4 rounded-2xl` vs. full-width no topo
- Prop `canClose` para mostrar/ocultar botão X
- Manter compatibilidade com cores customizadas (hex/gradient) quando variant não é usada

**Arquivo**: `src/components/chat/BannerPreview.tsx`

### 2. Refazer o editor no `AdminBanners.tsx` — seção de aparência

Atualizar a Section 3 (Appearance) no dialog de criação/edição:

- Adicionar seletor de **variante** como grid de cards visuais (similar ao seletor de tipo atual), onde cada card mostra a paleta de cores da variante com mini-preview
- Quando uma variante é selecionada, preencher `bg_color` e `text_color` automaticamente com as cores da variante
- Manter opção "Customizado" para cores manuais (hex/gradient) — toggle entre modo variante e modo manual
- Adicionar toggles visuais para `isFloating` e `canClose`
- Substituir selects de borda/sombra por botões visuais com mini-preview de cada estilo
- Mover o WCAG contrast badge para ficar inline com a seleção de cores

**Arquivo**: `src/pages/AdminBanners.tsx` (seções 3 e 6 do dialog)

### 3. Melhorar fluxo de atribuição de empresas (Assignment Dialog)

Redesign do dialog de assignments (`assignDialog`) em `AdminBanners.tsx`:

**Painel de adição (topo)**:
- Componente SearchableMultiSelect (já existe em `src/components/ui/searchable-multi-select.tsx`) para selecionar empresas em batch
- Mostrar count de empresas selecionadas com botão "Adicionar X empresas"
- Excluir automaticamente empresas já atribuídas da lista de seleção

**Painel de monitoramento (corpo)**:
- Tabela com colunas: Empresa, Views, Voto, Status (ativo/dismissed), Última visualização
- Filtros inline: busca por nome, filtro por status (Ativo/Dismissed/Todos), filtro por voto (Positivo/Negativo/Sem voto)
- Badge visual de status: verde para ativo, cinza para dismissed
- Indicador de progresso se `max_views` está configurado (barra de progresso views/max_views)
- Sorting por views count (crescente/decrescente)
- Ação de remover individual com confirmação inline

**Métricas resumidas no header do dialog**:
- Total atribuídos | Total views | Taxa de favorabilidade | Dismissed count

**Arquivo**: `src/pages/AdminBanners.tsx` (seção do assignDialog, linhas 1122-1214)

### 4. Atualizar `BannerRichEditor.tsx`

- Adicionar opção de inserir link inline (botão na toolbar que abre popover com input de URL)
- Manter sanitização de links com `word-break: break-all`

**Arquivo**: `src/components/chat/BannerRichEditor.tsx`

### 5. Sync com embed script

- Atualizar `public/nps-chat-embed.js` `renderBanner()` para suportar as novas variantes quando `banner_type` corresponde a uma variante conhecida — aplicar as cores corretas automaticamente
- Manter fallback para cores customizadas

**Arquivo**: `public/nps-chat-embed.js`

---

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/BannerPreview.tsx` | Novo sistema de variantes, glassmorphism, floating, dark mode |
| `src/pages/AdminBanners.tsx` | Seletor de variantes, toggles visuais, assignment dialog redesign |
| `src/components/chat/BannerRichEditor.tsx` | Botão de link inline na toolbar |
| `public/nps-chat-embed.js` | Suporte a variantes no renderBanner |

Nenhuma migration necessária — usa campos existentes (`banner_type`, `bg_color`, `text_color`, `position`, `border_style`, `shadow_style`).
