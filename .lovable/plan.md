

## Plano: Decorações no banner do cliente + preview compacto + gap do link

### 3 Problemas identificados

1. **Decorações não aparecem no cliente**: a edge function `get-visitor-banners` não seleciona nem retorna `has_decorations`, e o `nps-chat-embed.js` não renderiza SVGs decorativos
2. **Preview ocupa muito espaço**: o mock navbar + mock page content abaixo do banner são desnecessários — remover e exibir apenas o banner
3. **Gap texto-link muito grande no embed**: o `nps-chat-embed.js` usa `gap:12px` e `margin-top:2px` nas ações, criando distância excessiva entre texto e link

### Alterações

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/get-visitor-banners/index.ts` | Adicionar `has_decorations` ao SELECT da query e ao `buildBannerResult` |
| `public/nps-chat-embed.js` | 1) Ler `banner.has_decorations` e renderizar SVGs decorativos (mesmos círculos/retângulos do preview) com posição absoluta e opacidade baixa. 2) Reduzir gap das ações de `gap:12px` para `gap:4px` e remover `margin-top` |
| `src/components/chat/BannerPreview.tsx` | Remover o mock navbar e mock page content (linhas 236-252), manter apenas o banner dentro do container |

### Detalhes do embed (nps-chat-embed.js)

Na função `renderBanner`, após criar o `div` principal, se `banner.has_decorations` for `true`:
- Criar SVGs absolutas (círculos à esquerda, retângulos à direita) com `fill` usando `useText` e `opacity` entre 0.07-0.15
- Garantir `overflow:visible` no div do banner (já tem `overflow:hidden`, trocar condicionalmente)

Para o gap: trocar `gap:12px` por `gap:4px` no container de ações e remover `margin-top:2px`.

### Preview compacto

Remover as seções de mock navbar e mock page content do `BannerPreview.tsx`, mantendo apenas o wrapper com o banner. Isso reduz drasticamente o espaço ocupado pelo preview no admin.

