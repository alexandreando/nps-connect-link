
# Plano Consolidado: Melhorias de UX/UI + Segmentação por Regras + Validação de Conflito nos Banners

## Escopo

Unificar todas as melhorias em uma única implementação:
1. Melhorias de UX/UI no admin e no embed
2. **Melhorias de layout e tipografia do banner**
3. Segmentação por regras de campo (padrão CategoryFieldRules)
4. Validação de conflito de período ao publicar

---

## 1. Database Migration

**Tabela `chat_banner_field_rules`:**
| Coluna | Tipo |
|--------|------|
| id | uuid PK |
| banner_id | uuid FK → chat_banners |
| tenant_id | uuid |
| field_source | text (`native` / `custom`) |
| field_key | text |
| operator | text |
| field_value | text |
| created_at | timestamptz |

**Novas colunas em `chat_banners`:**
- `position` text default `'top'` (top / bottom / float)
- `auto_dismiss_seconds` integer nullable
- `display_frequency` text default `'always'`
- `border_style` text default `'none'` (none / subtle / rounded / pill)
- `shadow_style` text default `'none'` (none / soft / medium / strong)

---

## 2. Melhoria de Layout e Tipografia do Banner (NOVO)

### Problema Atual
O banner usa `justify-content: space-between` que distribui conteúdo e ações nos extremos. O `textAlign` é aplicado apenas no container interno, não centralizando de fato o conteúdo visual.

### Solução: Layout Centralizado

**Estrutura proposta:**
```text
┌─────────────────────────────────────────────────────────────────┐
│                                                          [X]   │
│                        [Ícone] Texto do banner                 │
│                   [Link/CTA]  [👍] [👎]                         │
└─────────────────────────────────────────────────────────────────┘
```

- **Layout flex-col com items-center**: Todo o conteúdo centralizado verticalmente e horizontalmente
- **Botão fechar absoluto**: Posicionado no canto superior direito, fora do fluxo
- **Texto centralizado**: Usar `text-center` + `justify-center` no container principal
- **Ações embaixo do texto**: Botões de link e votação em linha separada, também centralizados

### Estilização Elegante

**Opções de borda (`border_style`):**
| Valor | CSS |
|-------|-----|
| `none` | Sem borda |
| `subtle` | `border-bottom: 1px solid rgba(255,255,255,0.15)` |
| `rounded` | `border-radius: 0 0 12px 12px` (cantos inferiores) |
| `pill` | `margin: 8px 16px; border-radius: 24px` (banner flutuante) |

**Opções de sombra (`shadow_style`):**
| Valor | CSS |
|-------|-----|
| `none` | Sem sombra |
| `soft` | `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` |
| `medium` | `box-shadow: 0 4px 16px rgba(0,0,0,0.12)` |
| `strong` | `box-shadow: 0 8px 32px rgba(0,0,0,0.18)` |

**Tipografia melhorada:**
- Font-weight: 500 (medium) para melhor legibilidade
- Line-height: 1.5 para espaçamento confortável
- Letter-spacing: 0.01em para elegância
- Padding vertical aumentado: 14px → 18px

---

## 3. Componente `BannerFieldRules`

Adaptado de `CategoryFieldRules.tsx`, recebe `bannerId`. Mesma lógica de staging com preview de empresas correspondentes. Integrado na seção "Segmentação" do formulário.

---

## 4. Validação de Conflito ao Publicar

Ao clicar "Criar Banner" com `is_active = true`:
1. Determinar empresas-alvo (target_all / regras / atribuições manuais)
2. Consultar banners ativos com período sobreposto
3. Se conflito: exibir `BannerConflictDialog` (Empresa | Banner Existente | Período)
4. Usuário confirma ou cancela

---

## 5. UI Admin - Seção de Aparência Expandida

Adicionar seletores para:
- **Posição**: Topo / Rodapé / Flutuante
- **Estilo de borda**: Nenhuma / Sutil / Arredondada / Pill
- **Estilo de sombra**: Nenhuma / Suave / Média / Forte
- **Auto-dismiss**: Campo numérico (segundos)
- **Frequência**: Sempre / 1x por sessão / 1x por dia

Badge de contraste WCAG (AA/AAA/Falha) baseado em luminance ratio.

---

## 6. Melhorias no Embed Script

**Layout centralizado:**
```javascript
// Container principal
div.style.cssText = 
  "padding:18px 48px 18px 20px;" +
  "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
  "position:relative;";

// Botão fechar absoluto
closeBtn.style.cssText = 
  "position:absolute;top:12px;right:12px;";

// Conteúdo centralizado
contentDiv.style.cssText = 
  "display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;";

// Ações centralizadas abaixo
actionsDiv.style.cssText = 
  "display:flex;align-items:center;justify-content:center;gap:12px;margin-top:6px;";
```

**Estilização:**
- Aplicar `border_style` e `shadow_style` do payload
- Animação CSS `translateY(-100%)` → `translateY(0)` com transition 0.3s
- Auto-dismiss com setTimeout
- Frequência via sessionStorage/localStorage

---

## 7. Edge Function `get-visitor-banners`

- Carregar regras de `chat_banner_field_rules` para cada banner
- Avaliar regras contra dados do `contacts` (AND logic)
- Retornar novos campos: `position`, `auto_dismiss_seconds`, `display_frequency`, `border_style`, `shadow_style`

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Criar `chat_banner_field_rules` + novas colunas |
| `BannerPreview.tsx` | Layout centralizado + estilos de borda/sombra |
| `BannerFieldRules.tsx` | Novo (adaptado de CategoryFieldRules) |
| `BannerConflictDialog.tsx` | Novo |
| `AdminBanners.tsx` | Integrar regras, conflito, novos campos de aparência |
| `nps-chat-embed.js` | Layout centralizado, animações, estilos |
| `get-visitor-banners/index.ts` | Avaliar regras + retornar novos campos |

---

## Ordem de Implementação

1. Migration: tabela + colunas novas
2. Layout centralizado no `BannerPreview.tsx`
3. Layout centralizado no `nps-chat-embed.js`
4. Estilos de borda/sombra no preview e embed
5. `BannerFieldRules` + integração no formulário
6. `BannerConflictDialog` + validação no save
7. UI de aparência expandida (position, border, shadow, auto-dismiss, frequency)
8. Edge Function com avaliação de regras + novos campos
9. Animações e frequência no embed
