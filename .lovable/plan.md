

## Plano: Corrigir espaçamento do banner flutuante + gap texto-link

### Alterações em `BannerPreview.tsx`

**1. Floating — margens e sombra reais**
- Linha 144: trocar `mx-4 mt-2` por `mx-4 my-3`
- Linha 146: trocar `shadow-sm` por `shadow-lg`
- Linha 138: remover `overflow-hidden` do container pai para não cortar cantos arredondados

**2. Reduzir gap entre texto e link/ações**
- Linha 142: trocar `gap-3` por `gap-1.5` no container flex-col do banner
- Linha 142: trocar `py-3` por `py-2.5` para equilibrar padding vertical

### Arquivo afetado

`src/components/chat/BannerPreview.tsx` — 3 linhas ajustadas

