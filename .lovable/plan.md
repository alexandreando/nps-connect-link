

## Plano: Formas geométricas decorativas opcionais + preview colapsável

### 1. Adicionar propriedade `hasDecorations` ao banner

**`BannerPreview.tsx`**: Nova prop `hasDecorations?: boolean`. Quando `true`, renderiza formas geométricas SVG absolutas (círculos à esquerda, retângulos arredondados à direita) usando `bannerColor` com `opacity-[0.12]`, posicionadas com valores negativos para extrapolar os limites. O banner usa `overflow-visible` quando decorado; o container pai mantém `overflow-hidden` para clipar no card.

**`VARIANT_STYLES`**: Adicionar campo `decorations: boolean` a cada variante. Variantes com fundo forte/gradiente (premium, ocean, sunset, midnight, neon) terão `true` por padrão. Variantes leves (warning, success, neutral) terão `false`. Custom começa `false`.

### 2. Toggle no formulário de edição

**`AdminBanners.tsx`**: Adicionar `has_decorations: boolean` ao form state. Renderizar um Switch "Formas decorativas" junto às opções visuais (ao lado de Flutuante/Pode fechar). Ao trocar variante, o valor padrão de `has_decorations` vem do `VARIANT_STYLES[variant].decorations`. Passar como prop ao `BannerPreview`.

### 3. Preview colapsável no desktop

**`AdminBanners.tsx`**: Envolver o preview fixo (linhas 1104-1127) em um `Collapsible` com trigger compacto (ícone Eye + "Preview" + ChevronDown). Iniciar aberto (`defaultOpen`). Isso libera espaço vertical no dialog quando o usuário não precisa ver o preview.

### 4. Persistência

Salvar `has_decorations` no payload de save e ler no `openBannerDialog`. O campo já pode ir no JSON do banco como coluna extra ou, se preferir evitar migration, embutir no campo `shadow_style` ou similar existente. **Recomendação**: criar coluna `has_decorations boolean default false` via migration para manter limpo.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/BannerPreview.tsx` | Prop `hasDecorations`, SVGs decorativos com overflow-visible |
| `src/pages/AdminBanners.tsx` | Form field `has_decorations`, Switch no form, preview colapsável no desktop |
| Migration | `ALTER TABLE chat_banners ADD COLUMN has_decorations boolean DEFAULT false` |

