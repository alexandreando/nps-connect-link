

## Plano: Correções de Responsividade Mobile da Landing Page

Após revisar todos os componentes, identifiquei os seguintes problemas e correções necessárias:

### Problemas Encontrados

1. **LandingPage (root)**: Falta `overflow-x: hidden` no container raiz — elementos com posição absoluta (glows) causam scroll horizontal.

2. **LandingHero**: O glow decorativo (800px de largura) extrapola a viewport em telas pequenas. Precisa de contenção.

3. **LandingProductSections / ChatWorkspaceMockup**: O mockup do chat usa `flex` com colunas fixas (`w-[140px]` + `w-[130px]`), que não cabem em telas < 400px. Overflow horizontal inevitável.

4. **LeadForm (inline layout)**: No Hero, o form usa `flex-col sm:flex-row` — OK no breakpoint, mas em telas entre 640-768px os 3 inputs + botão ficam apertados numa única linha.

5. **LandingNavbar**: Os botões "Sign In" e CTA são `hidden sm:inline-flex`, mas o menu mobile só aparece em `lg:hidden` — entre `sm` e `lg` (768-1024px), os links de navegação somem mas os botões aparecem, criando inconsistência.

6. **LandingSocialProof**: `flex-wrap` com `gap-8` funciona, mas em telas muito pequenas os metrics podem ficar apertados.

7. **LandingFooter**: Grid `grid-cols-2 md:grid-cols-4` está OK, mas a logo+tagline ocupa `col-span-2 md:col-span-1`, o que em mobile faz a tagline ocupar toda a largura — aceitável.

### Correções Planejadas

| # | Arquivo | Correção |
|---|---------|----------|
| 1 | `LandingPage.tsx` | Adicionar `overflow-x-hidden` no div raiz |
| 2 | `LandingHero.tsx` | Limitar glow a `max-w-full` e garantir `overflow-hidden` no container |
| 3 | `LandingProductSections.tsx` | Esconder sidebar de contexto e sidebar de contatos do ChatWorkspaceMockup em mobile (`hidden sm:block`). Adicionar `overflow-hidden` no mockup wrapper |
| 4 | `LandingNavbar.tsx` | Mudar botões "Sign In"/"CTA" de `hidden sm:` para `hidden lg:` para consistência com o menu hamburger (que já é `lg:hidden`) |
| 5 | `LandingCTA.tsx` | Reduzir padding do card form em mobile (`p-5 sm:p-8`) |
| 6 | `LandingSocialProof.tsx` | Usar `grid grid-cols-2 md:grid-cols-4` em vez de flex-wrap para melhor alinhamento mobile |
| 7 | `LeadForm.tsx` | Mudar breakpoint do inline de `sm:flex-row` para `md:flex-row` para evitar compressão |

### Detalhes Técnicos

- Nenhuma mudança de backend ou banco de dados necessária
- Todas as correções são CSS/layout via classes Tailwind e inline styles
- 7 arquivos serão editados com mudanças pequenas e focadas

