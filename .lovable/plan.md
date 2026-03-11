

## Plano: Corrigir persistência de layout dos banners

### Problema raiz

Três falhas encadeadas impedem que mudanças de estilo sejam salvas efetivamente:

1. **Seletor de variante não atualiza cores no form**: Ao clicar em uma variante (ex: "Oceano", "Premium"), apenas `form.variant` muda. Os campos `form.bg_color` e `form.text_color` permanecem com os valores antigos. O payload de save envia essas cores antigas para o banco.

2. **Mapeamento lossy (ida e volta)**: Múltiplas variantes mapeiam para o mesmo `banner_type` (ex: `ocean`, `neutral` e `midnight` todos viram `"info"`). Ao reabrir o banner, `TYPE_TO_VARIANT["info"]` retorna sempre `"neutral"`, perdendo a variante original.

3. **Embed ignora cores salvas**: O `nps-chat-embed.js` resolve o `banner_type` para uma variante fixa e usa as cores hardcoded dessa variante, ignorando `bg_color`/`text_color` do banco.

### Solução

Usar `bg_color` e `text_color` como fonte da verdade absoluta. Quando o usuário seleciona uma variante, as cores dessa variante são escritas imediatamente em `form.bg_color`/`form.text_color`. Isso elimina a dependência do mapeamento lossy.

### Alterações

#### 1. `AdminBanners.tsx` — Aplicar cores ao selecionar variante

No `onClick` do seletor de variante: além de `form.variant`, atualizar `form.bg_color` e `form.text_color` com os valores hex da variante selecionada (importados de `VARIANT_STYLES`). Para gradientes, `bg_color` recebe a string CSS do gradiente.

#### 2. `AdminBanners.tsx` — Melhorar resolução ao editar

No `openBannerDialog`: em vez de derivar a variante do `banner_type` (lossy), comparar `bg_color` salvo contra os estilos de cada variante para encontrar a correspondência exata. Se nenhuma corresponder, usar `"custom"`.

#### 3. `nps-chat-embed.js` — Sempre usar cores do banco

Remover a lógica de resolução `TYPE_TO_VARIANT` → `VARIANT_COLORS`. Usar diretamente `banner.bg_color` e `banner.text_color` para todos os banners. Isso garante que o widget exibe exatamente o que foi configurado.

#### 4. `BannerPreview.tsx` — Priorizar cores do form

Quando `bgColor` e `textColor` são fornecidos como props (o que já acontece), usá-los como override final, independentemente da variante resolvida. Garantir que o preview sempre reflita as cores reais do form.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBanners.tsx` | Sync cores ao mudar variante, melhorar resolução ao editar |
| `public/nps-chat-embed.js` | Usar `bg_color`/`text_color` direto, remover mapeamento lossy |
| `src/components/chat/BannerPreview.tsx` | Priorizar props de cor sobre variante |

Nenhuma migration necessária.

