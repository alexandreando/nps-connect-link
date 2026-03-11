

## Plano: Corrigir preview de banners — cores fixas, sem influência de dark mode

### Problema raiz

O `BannerPreview` usa classes Tailwind com prefixo `dark:` (ex: `dark:bg-amber-950/40`, `dark:text-amber-100`) para variantes como warning, success e neutral. Como o admin roda em dark mode por padrão, essas classes escuras sobrescrevem as cores originais planejadas — o banner aparece escuro/apagado em vez de exibir as cores exatas da variante.

A screenshot confirma: o banner "Premium" deveria ter fundo `#4F46E5` com texto branco, mas o preview não coincide com o resultado real porque o container herda estilos do tema dark.

### Solução

**Eliminar TODAS as classes Tailwind de cor** do `BannerPreview` e usar **exclusivamente inline styles** para garantir que as cores sejam absolutas e independentes do tema.

### Alterações

#### 1. `BannerPreview.tsx` — Todas as variantes via inline style

Refatorar `VARIANT_STYLES` para que **todas** as 9 variantes usem `inlineStyle` com cores absolutas (hex), removendo `bg`, `border` e `text` como classes Tailwind:

| Variante | backgroundColor | borderColor | color |
|----------|----------------|-------------|-------|
| warning | #FFFBEB (amber-50) | #FDE68A (amber-200) | #78350F (amber-900) |
| urgent | #DC2626 (red-600) | #B91C1C (red-700) | #FFFFFF |
| success | #ECFDF5 (emerald-50) | #A7F3D0 (emerald-200) | #064E3B (emerald-900) |
| neutral | #F8FAFC (slate-50) | #E2E8F0 (slate-200) | #0F172A (slate-900) |
| premium | #4F46E5 (indigo-600) | #4338CA (indigo-700) | #FFFFFF |
| ocean | gradient blue→violet | transparent | #FFFFFF |
| sunset | gradient orange→red | transparent | #FFFFFF |
| midnight | #0F172A | #334155 (slate-700) | #F1F5F9 |
| neon | gradient pink→cyan | transparent | #FFFFFF |

- Remover propriedades `bg`, `border`, `text` do type `VariantStyle` — substituir por `inlineStyle` obrigatório com `backgroundColor`/`background`, `borderColor`, `color`
- O container do banner NÃO deve usar nenhuma classe Tailwind de cor (`text-*`, `bg-*`, `border-*` semânticas)
- Botão X, link CTA, thumbs up/down: todos herdam `color` via inline style do container
- Badge de agendamento: usar `style={{ color, borderColor: 'currentColor' }}` inline
- O wrapper externo (mock page) mantém `bg-background` para simular a página, mas o banner em si é 100% inline

#### 2. `BannerPreview.tsx` — Custom variant

Para `custom`, já usa inline styles com `bgColor`/`textColor` — manter esse comportamento sem alteração.

### Arquivo afetado

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/BannerPreview.tsx` | Migrar todas as cores de Tailwind classes para inline styles absolutos |

