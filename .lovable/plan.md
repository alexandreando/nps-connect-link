

## Plano: Correções no editor de banners

### Problemas identificados

1. **Tipo duplicado na identificação**: A Seção 1 mostra seletor de `banner_type` (5 cards) E o título. O tipo deve ser removido — manter apenas título.
2. **Preview quebrado**: O preview está na coluna lateral direita, mas a coluna `overflow-y-auto` com `sticky top-0` não funciona bem dentro de um grid com `overflow-hidden`. Precisa ser movido para um painel fixo abaixo do form.
3. **Métricas de visualização pós**: Não há consulta de métricas na listagem principal — apenas contadores simples. Falta um dialog/painel de métricas detalhadas por banner.
4. **Isolamento por tenant**: O `fetchBanners` (linha 273) faz `select("*")` SEM filtrar por `tenant_id`. A RLS permite SELECT de banners ativos (`is_active = true`) para qualquer role público, então banners de outros tenants aparecem.
5. **Aparência compacta**: A seção de Appearance é grande demais, os gradientes e cores ocupam muito espaço vertical.

---

### Alterações

#### 1. `AdminBanners.tsx` — Remover tipo, manter apenas título

- Na Seção 1 (linhas 774-812): Remover o grid de `BANNER_TYPES` e o label "Tipo". Manter apenas o campo de título.
- O `banner_type` será derivado da `variant` selecionada na Seção 3 (Appearance), usando mapeamento reverso.

#### 2. `AdminBanners.tsx` — Corrigir preview e reposicionar

- Remover a coluna lateral de preview (linhas 1101-1127)
- Adicionar o `BannerPreview` como painel fixo (`sticky bottom-0`) abaixo do formulário, dentro do dialog, antes do footer
- Usar um card compacto com borda superior, fundo `bg-muted/20`, com o preview dentro
- No mobile, manter o collapsible existente

#### 3. `AdminBanners.tsx` — Métricas de visualização por banner

- Adicionar botão de "Métricas" (ícone Eye) na listagem de cada banner card (junto aos botões de ação)
- Ao clicar, abrir um dialog com:
  - Resumo: Total atribuídos, views totais, favorabilidade, dismissed
  - Tabela com empresa, views, voto, status (reutilizar a mesma tabela do assignDialog)
- Isso é essencialmente abrir o `assignDialog` em modo "somente leitura" ou reutilizar o mesmo dialog

#### 4. `AdminBanners.tsx` — Filtrar banners por tenant

- Importar `useAuthContext` para obter `tenantId`
- No `fetchBanners`: adicionar `.eq("tenant_id", tenantId)` à query de banners
- No `fetchBanners`: adicionar `.eq("tenant_id", tenantId)` à query de assignments
- No `saveBanner`: incluir `tenant_id: tenantId` no payload de insert (já existe no trigger `set_tenant_id_from_user`, mas garantir explicitamente)
- Na query de contacts do assignDialog: adicionar `.eq("tenant_id", tenantId)`

#### 5. `AdminBanners.tsx` — Seção de Aparência mais compacta

- Envolver a seção de variantes + cores customizadas dentro de um `ScrollArea` com `max-h-[280px]`
- Colocar gradientes dentro de um `Collapsible` que começa fechado, expandindo apenas quando o usuário quer ver
- Reduzir o grid de variantes de `grid-cols-3` para `grid-cols-6` (mais compacto, apenas dot+label sem description)

---

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBanners.tsx` | Remover tipo, reposicionar preview, filtro tenant, métricas, aparência compacta |

Nenhuma migration necessária.

