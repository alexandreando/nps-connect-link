

## Plano: Gradientes para Banners + Deleção CSAT

### 1. Deleção de CSAT (Migration SQL)

Limpar `csat_score` e `csat_comment` das 27 salas já identificadas anteriormente:

```sql
UPDATE chat_rooms 
SET csat_score = NULL, csat_comment = NULL, updated_at = now()
WHERE id IN ('426ced67-...', ... /* 27 IDs */);
```

### 2. Gradientes pré-definidos para banners

**Constante `GRADIENT_PRESETS`** em `AdminBanners.tsx` — 16 presets organizados em 2 grupos:

- **Duo-color** (8): Ocean, Sunset, Emerald, Berry, Midnight, Amber, Fuchsia, Teal
- **Monocromáticos** (8): Blue, Red, Green, Purple, Gray, Pink, Orange, Cyan

Cada preset é um objeto `{ name, value, group }` onde `value` é a string CSS completa (ex: `linear-gradient(135deg, #3B82F6, #8B5CF6)`).

**Mudanças por arquivo:**

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBanners.tsx` | Adicionar `GRADIENT_PRESETS`. Na seção Aparência (linhas ~787-800), após o grid de cores sólidas, renderizar 2 sub-seções de gradientes (4×2 swatches retangulares com aspect-ratio 3:1). Ao clicar, seta `form.bg_color` com a string de gradiente. O swatch ativo tem ring. Na preview da cor (linha 784), usar `background` em vez de `backgroundColor` quando for gradiente. Ajustar o swatch de preview do banner na listagem (linha 581) da mesma forma. WCAG badge: esconder quando `bg_color` começa com `linear-gradient` (não faz sentido calcular contraste de gradiente) |
| `src/components/chat/BannerPreview.tsx` | Linha 99: trocar `style={{ backgroundColor: bgColor }}` por lógica que detecta `bgColor.startsWith('linear-gradient')` e usa `background` ou `backgroundColor` conforme o caso |
| `public/nps-chat-embed.js` | Linha 92: trocar `"background-color:" + banner.bg_color` por detecção: se começa com `linear-gradient`, usar `"background:"`, senão `"background-color:"` |

**UX do formulário:**

```text
┌─ Cor de fundo ──────────────────────────┐
│ [■ preview] [#3B82F6_____________]      │
│ ■ ■ ■ ■ ■   (cores sólidas 5x2)        │
│ ■ ■ ■ ■ ■                              │
│                                          │
│ Gradientes                               │
│ ▬▬ ▬▬ ▬▬ ▬▬  (duo-color 4x2)           │
│ ▬▬ ▬▬ ▬▬ ▬▬                            │
│                                          │
│ Monocromáticos                           │
│ ▬▬ ▬▬ ▬▬ ▬▬  (mono 4x2)               │
│ ▬▬ ▬▬ ▬▬ ▬▬                            │
└──────────────────────────────────────────┘
```

A seleção é mutuamente exclusiva: clicar gradiente desmarca cor sólida e vice-versa (a string armazenada em `bg_color` define qual está ativo).

