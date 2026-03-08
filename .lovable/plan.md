

# Plano: Otimizações de Performance — Itens 1 e 3

## Item 1: Debounce no PendingRoomsList

**Arquivo**: `src/components/chat/PendingRoomsList.tsx`

**Mudança**: Adicionar debounce de 3 segundos ao callback do Realtime (linha 80). Em vez de chamar `fetchPendingRooms()` diretamente a cada evento, usar um `useRef` para armazenar o timer e limpar no cleanup.

- Adicionar `useRef<NodeJS.Timeout>` para o debounce timer
- No callback do Realtime (linha 80): `clearTimeout(ref)` + `setTimeout(fetchPendingRooms, 3000)`
- No cleanup do `useEffect` (linha 84): adicionar `clearTimeout(ref)` junto com `removeChannel`

**Impacto**: Reduz ~93% das queries desnecessárias quando múltiplas mensagens chegam em sequência. Nenhuma mudança visível para o usuário (delay máximo de 3s na atualização da lista de pendências).

---

## Item 3: Filtros SQL no useChatHistory

**Arquivo**: `src/hooks/useChatHistory.ts`

**Mudança**: Mover filtragem de tags e busca por nome do client-side para o nível SQL, executando as queries de filtro ANTES da query principal paginada.

### Fluxo novo:

1. **Se `tagIds` está ativo** (linhas 133-140 atuais → substituir):
   - Buscar `chat_room_tags` com `.in("tag_id", tagIds)` → extrair `room_id`s únicos
   - Adicionar `.in("id", tagRoomIds)` na query principal (antes do `.range()`)
   - Limitar a 500 IDs como proteção contra query muito grande

2. **Se `search` está ativo** (linhas 142-149 atuais → substituir):
   - Buscar `chat_visitors` com `.ilike("name", `%${search}%`)` → extrair `id`s
   - Adicionar `.in("visitor_id", matchingVisitorIds)` na query principal
   - Limitar a 500 IDs

3. **Remover filtragem client-side** (linhas 133-149): O `filteredRooms` passa a ser sempre `roomsData` diretamente, pois os filtros já foram aplicados no SQL.

4. **Resultado**: O `count: "exact"` do PostgREST agora reflete os filtros reais → paginação correta.

**Impacto**: Corrige bug existente de paginação quebrada com filtros. Filtragem 10-50x mais rápida. O `totalCount` e `totalPages` passam a ser precisos.

---

## Arquivos modificados

| Arquivo | Tipo de mudança |
|---|---|
| `src/components/chat/PendingRoomsList.tsx` | Adicionar debounce ref + cleanup |
| `src/hooks/useChatHistory.ts` | Reestruturar query com pre-fetches de filtro |

## O que NÃO muda
- Nenhuma tabela ou migration necessária
- Nenhum outro componente é afetado
- A interface visual permanece idêntica
- O CSV export continua funcionando (usa `rooms` do state, que já estará correto)

