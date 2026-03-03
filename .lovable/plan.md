

# Fix: Eliminar Recarregamento Total ao Trocar de Aba ou Refresh de Token

## Problema

Toda vez que o atendente sai da aba do chat e volta (ou o token de sessao renova automaticamente a cada ~1h), a tela inteira fica bloqueada com loading. Isso acontece por causa de uma cadeia:

1. `onAuthStateChange` dispara em TODOS os eventos de sessao (TOKEN_REFRESHED, tab focus, etc.)
2. Cada disparo chama `loadUserData()` que seta `userDataLoading = true`
3. `SidebarLayout` mostra spinner de tela cheia quando `userDataLoading = true`
4. `SidebarDataContext` depende de `[user?.id, isAdmin, tenantId]` -- quando `isAdmin` muda de `false → true → false` durante o reload, o effect re-executa, destruindo e recriando canais realtime
5. Canais realtime sao destruidos e recriados, causando rajada de requisicoes

## Analise: O que PRECISA de realtime e como esta hoje

### Dados que JA tem realtime e funcionam bem (NAO mexer):

- **Lista de salas de chat** (`useChatRealtime.ts`): Ja usa `initialLoadDone` ref para evitar loading apos primeiro fetch. Patches cirurgicos em INSERT/UPDATE/DELETE. Som e notificacao para novas mensagens. Funciona perfeitamente DESDE QUE os canais nao sejam destruidos.

- **Mensagens do chat ativo** (`useChatMessages`): Canal por room_id, INSERT realtime. Funciona bem.

- **Contadores da sidebar** (`SidebarDataContext`): Canais em `chat_rooms` e `attendant_profiles` para atualizar contadores de atendimento e status (online/offline). Resync a cada 60s como safety net.

- **Indicadores de digitacao**: Via Supabase Realtime Broadcast (nao depende de postgres_changes).

### O problema NAO e o realtime -- e a DESTRUICAO dos canais

Quando `onAuthStateChange` dispara um TOKEN_REFRESHED:
1. `loadUserData` roda → seta `isAdmin = false` (resetando) → depois seta `isAdmin = true`
2. `SidebarDataContext` effect depende de `isAdmin` → destroi canais → recria → refaz todas as queries
3. `useChatRooms` depende de `ownerUserId` → se o user object muda (nova referencia), recria tudo
4. Tela inteira fica bloqueada pelo spinner de `userDataLoading`

---

## Solucao

### Mudanca 1: AuthContext -- Ignorar token refresh se usuario nao mudou

**Arquivo: `src/contexts/AuthContext.tsx`**

- Adicionar `useRef<string | null>` para guardar o `user.id` atual
- No `onAuthStateChange`: se `session.user.id === currentUserIdRef.current`, NAO chamar `loadUserData` e NAO setar `userDataLoading = true`
- Apenas executar `loadUserData` quando o user.id realmente muda (login/logout/troca de conta)
- No `init()`, salvar o user.id no ref apos o primeiro load

Isso elimina a cascata inteira: sem `userDataLoading`, sem spinner, sem destruicao de canais.

### Mudanca 2: SidebarLayout -- Loading apenas no boot inicial

**Arquivo: `src/components/SidebarLayout.tsx`**

- Mudar a condicao do spinner de tela cheia de `if (loading || userDataLoading)` para `if (loading)`
- `loading` so e `true` durante o `init()` (primeiro boot da app)
- `userDataLoading` passa a ser apenas informativo para componentes que queiram mostrar feedback sutil (nao bloqueia mais a tela)

### Mudanca 3: SidebarDataContext -- Estabilizar canais realtime

**Arquivo: `src/contexts/SidebarDataContext.tsx`**

- Separar o effect de canais realtime do effect de inicializacao de dados
- Canais realtime devem depender apenas de `user?.id` e `tenantId` (valores estaveis)
- Remover `isAdmin` e `isImpersonating` das dependencias do effect de canais (esses valores podem flutuar durante reloads)
- `initializeData` continua dependendo de `isAdmin` mas usando um ref para o valor atual, evitando re-execucao do effect

---

## Resultado Esperado

- Trocar de aba e voltar: zero loading, zero requisicoes extras, canais realtime intactos
- Token renovado automaticamente (~1h): transparente, sem interrupcao
- Login real (novo usuario): loading normal como hoje
- Atendente mantem todas as conversas e contadores em tempo real sem interrupcao

## Arquivos Impactados

1. `src/contexts/AuthContext.tsx` -- ref para user.id + skip de reload em token refresh
2. `src/components/SidebarLayout.tsx` -- loading apenas no boot inicial
3. `src/contexts/SidebarDataContext.tsx` -- separar canais realtime da inicializacao

