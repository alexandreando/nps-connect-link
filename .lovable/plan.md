

## Plano: Corrigir tema, preview com fundo claro, e editor mostrando 2 linhas

### Problemas identificados

1. **Tema não alterna**: Existe um conflito entre `next-themes` (`ThemeProvider` em `App.tsx` com `attribute="class"` e `defaultTheme="light"`) e o gerenciamento manual em `SidebarLayout.tsx` que usa `localStorage("journey-theme")` e aplica a classe `dark` num div wrapper. O `next-themes` controla a classe no `<html>`, sobrescrevendo o controle manual. As chaves de localStorage também divergem (`"theme"` vs `"journey-theme"`).

2. **Preview escuro**: O container do preview usa `bg-muted/20`, que herda do tema dark do admin. O banner em si tem cores inline corretas, mas o fundo ao redor é escuro, prejudicando a visualização.

3. **Editor não mostra 2 linhas**: O `contentEditable` tem `min-h-[2.5rem] max-h-[4.5rem]` — a altura mínima é de apenas 1 linha (~40px). O editor deveria mostrar visualmente 2 linhas para guiar o usuário.

---

### Alterações

| Arquivo | Mudança |
|---------|---------|
| `src/components/SidebarLayout.tsx` | Remover gerenciamento manual de tema (`isDark`, `toggleTheme`, `localStorage("journey-theme")`). Usar `useTheme()` do `next-themes` para ler e alternar o tema. Passar `theme` e `setTheme` para `AppSidebar`. |
| `src/components/AppSidebar.tsx` | Ajustar props para receber `theme` (string) e `setTheme` (fn) em vez de `isDark`/`onToggleTheme`. Alternar entre `"light"` e `"dark"` via `setTheme`. |
| `src/pages/AdminBanners.tsx` | Envolver o `BannerPreview` (desktop e mobile) num div com `bg-white rounded-lg p-3` para forçar fundo claro independente do tema, simulando o site do cliente. |
| `src/components/chat/BannerRichEditor.tsx` | Aumentar `min-h` do editor para `min-h-[3.5rem]` (~2 linhas) para que o campo de texto mostre visualmente as 2 linhas disponíveis. |

### Detalhes técnicos

**Tema (SidebarLayout)**:
```typescript
import { useTheme } from "next-themes";
const { theme, setTheme } = useTheme();
const isDark = theme === "dark";
// Remover useState isDark, toggleTheme, themeClass
// O div wrapper não precisa mais da classe manual — next-themes aplica no <html>
```

**Preview com fundo claro**: Adicionar wrapper `<div className="bg-white rounded-lg p-3">` ao redor de ambos os `BannerPreview` (mobile e desktop) para garantir contraste correto.

**Editor 2 linhas**: Trocar `min-h-[2.5rem]` por `min-h-[3.5rem]` no `contentEditable` div, garantindo que o campo exiba visualmente espaço para 2 linhas de texto.

