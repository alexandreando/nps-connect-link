

## Plano: Expandir modelos de aparência + limpar elementos não utilizados

### Análise do estado atual

**Elementos não utilizados ou redundantes identificados:**
- `TYPE_DEFAULT_COLORS` (linha 97-103): nunca consumido após introdução de variantes
- `BANNER_TYPES` (linha 149-155): usado apenas no listing card para ícone/label, mas redundante com VARIANT_OPTIONS
- `POSITION_OPTIONS` (linha 157-161): definido mas nunca renderizado no UI
- `getTypeConfig()` (linha 626): mapeia para BANNER_TYPES que não é mais usado no editor
- Badge `typeConfig.label` no card de listing (linha 687): mostra tipo legado ao invés da variante
- Mock page content no `BannerPreview` (linhas 218-241): completamente vazio, espaço morto
- Borda/Sombra selectors (linhas 950-971): redundantes — floating toggle já controla borda, e sombra é fixa por variante

**Modelo atual**: 5 variantes semânticas + 1 custom = 6 opções, todas pastel/leves

---

### Alterações

#### 1. `AdminBanners.tsx` — Expandir para 9 modelos + 1 custom

Substituir `VARIANT_OPTIONS` (6 itens) por 10 opções com estilos mais elegantes e de alto contraste:

| # | Nome | Estilo | Cores |
|---|------|--------|-------|
| 1 | Alerta | Pastel amber claro | amber-50/200/900 |
| 2 | Urgente | Alto contraste vermelho sólido | red-600 bg, white text |
| 3 | Sucesso | Emerald suave | emerald-50/200/900 |
| 4 | Neutro | Slate glassmorphism | slate-50/200/900 |
| 5 | Premium | Indigo profundo | indigo-600 bg, white text |
| 6 | Oceano | Gradiente azul→violeta | linear-gradient(135deg, #3B82F6, #8B5CF6) |
| 7 | Sunset | Gradiente laranja→vermelho | linear-gradient(135deg, #F97316, #EF4444) |
| 8 | Midnight | Escuro alto contraste | slate-900 bg, slate-100 text |
| 9 | Neon | Gradiente rosa→ciano | linear-gradient(135deg, #EC4899, #06B6D4) |
| 10 | Customizado | Cores manuais | user-defined |

Modelos 2, 5, 8 são "alto contraste" (texto branco sobre fundo sólido escuro). Modelos 6, 7, 9 são gradientes. Modelos 1, 3, 4 são pastel/glassmorphism clássicos.

Atualizar `BannerVariant` type para incluir os novos nomes. Cada variante agora carrega `bg_color` e `text_color` defaults que são aplicados ao formulário ao selecionar.

Grid de seleção: manter `grid-cols-5` (2 linhas de 5) com mini-preview visual mostrando o gradiente/cor de fundo real.

#### 2. `BannerPreview.tsx` — Suportar novos modelos

Expandir `VARIANT_STYLES` para 9 variantes. As variantes com gradiente/sólido usam `style` inline ao invés de classes Tailwind. Adicionar conteúdo mock na área de página (linhas vazias 218-241) — 3 retângulos skeleton simulando conteúdo.

#### 3. `AdminBanners.tsx` — Remover elementos não utilizados

- Remover `TYPE_DEFAULT_COLORS`
- Remover `BANNER_TYPES` array
- Remover `POSITION_OPTIONS`
- Remover `getTypeConfig()` e uso de `typeConfig` no listing
- Remover seletores de Borda e Sombra do editor (linhas 950-971) — floating toggle já é suficiente
- No card de listing: substituir badge de tipo legado por um dot colorido representando a variante
- Remover `BORDER_STYLE_OPTIONS` e `SHADOW_STYLE_OPTIONS`

#### 4. `nps-chat-embed.js` — Sync novos modelos

Expandir mapa de variantes no embed para aplicar cores corretas dos novos modelos (ocean, sunset, midnight, neon, etc.)

---

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBanners.tsx` | Expandir variantes, remover dead code, limpar editor |
| `src/components/chat/BannerPreview.tsx` | Novos estilos de variantes, mock content |
| `public/nps-chat-embed.js` | Mapear novos modelos |

