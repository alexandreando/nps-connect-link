

## Plano: Rascunhos persistentes, busca padronizada e macros inline

### 1. Rascunhos de mensagem por sala (revisado)

**Estado atual**: `draftsRef = useRef<Map>()` dentro do componente (linha 62). Funciona ao trocar sala, mas perde tudo se o componente desmonta (navegar para Dashboard, etc.).

**Solução**: Mover o `Map` para escopo de módulo (fora do componente). Exportar `clearDraft(roomId)`.

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/ChatInput.tsx` | Criar `const draftsMap = new Map<string, string>()` no escopo de módulo (linha ~13). Remover `draftsRef`. Substituir `draftsRef.current` por `draftsMap` nas linhas 151-153. Exportar `export function clearDraft(roomId: string) { draftsMap.delete(roomId); }`. |
| `src/pages/AdminWorkspace.tsx` | Importar `clearDraft` de `ChatInput`. Dentro de `handleConfirmClose` (linha 365), após fechar a sala com sucesso, chamar `clearDraft(closingRoomId)`. |

**Garantias de segurança**:
- Afeta **apenas** o estado `value` da textarea — zero interferência com `onSend`, mensagens automáticas, macros ou artigos
- Sem chamadas a banco, sem localStorage, sem overhead
- Rascunhos sobrevivem navegação entre páginas, mas limpam no F5 (Map em memória)
- Salas fechadas têm draft limpo via `clearDraft`

---

### 2. Busca padronizada no Help Center

**Estado atual**: `HelpPublicHome.tsx` busca por `title.ilike` + `subtitle.ilike` (linha 108) — não busca no corpo. `PortalHelpTab.tsx` e `ChatInput.tsx` usam filtro client-side por título.

**Solução**: Criar função SQL que busca com prioridade (título exato > título parcial > corpo) e usar em todos os pontos.

| Arquivo | Mudança |
|---------|---------|
| **Migration SQL** | Criar `search_help_articles(p_tenant_id uuid, p_query text, p_limit int)` — extrai texto do `body_json`, ordena por relevância: `CASE WHEN title ILIKE query THEN 1 WHEN title ILIKE '%query%' THEN 2 WHEN body_text ILIKE '%query%' THEN 3 END`. |
| `src/pages/HelpPublicHome.tsx` | Substituir query `or(title.ilike, subtitle.ilike)` por `.rpc("search_help_articles", ...)`. Adicionar highlight do termo no título e snippet do corpo quando match é no conteúdo. |
| `src/components/portal/PortalHelpTab.tsx` | Substituir filtro client-side por RPC `search_help_articles` com debounce 300ms. |
| `src/components/chat/ChatInput.tsx` | Na busca de artigos (popup), usar RPC ao invés de filtro client-side `filteredArticles`. |

---

### 3. Macros inline (inserir no cursor)

**Estado atual**: Macros só ativam com `v.startsWith("/")` (linha 333) e substituem todo o texto (linha 341).

**Solução**: Detectar "/" em qualquer posição e inserir conteúdo no cursor.

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/ChatInput.tsx` | Adicionar `slashPosRef = useRef<number>(-1)`. **handleChange**: Detectar `/` via `textBeforeCursor.match(/(?:^|\n|\s)(\/\S*)$/)`, guardar posição do "/" em `slashPosRef`. **handleSelectMacro**: Calcular `before = value.slice(0, slashPos)`, `after = value.slice(cursorPos)`. Inserir `before + prefixNewline + macro.content + suffixNewline + after`. Posicionar cursor após conteúdo inserido. Prefixar/sufixar `\n` apenas se necessário. |

---

### Arquivos modificados (resumo)

| Arquivo | Frentes |
|---------|---------|
| `src/components/chat/ChatInput.tsx` | 1, 2, 3 |
| `src/pages/AdminWorkspace.tsx` | 1 |
| `src/pages/HelpPublicHome.tsx` | 2 |
| `src/components/portal/PortalHelpTab.tsx` | 2 |
| **Migration** | 2 |

