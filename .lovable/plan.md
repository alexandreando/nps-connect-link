

# Fix: Workspace Save, Welcome Message Timing, Attendant Name no Widget

## Problema 1: Configurações do Workspace não persistem

O `WorkspaceDisplayTab` salva cada toggle individualmente via `save()`, mas o `update` pode estar falhando silenciosamente (sem verificação de erro) ou as colunas podem não existir ainda na tabela `chat_settings`. Solução: adicionar botão "Salvar" que faz batch update, com verificação de erro e feedback.

**Mudança:** Reescrever `WorkspaceDisplayTab.tsx` para acumular alterações localmente e salvar tudo com um botão "Salvar configurações" no topo. Remover auto-save por toggle. Adicionar estado `dirty` para habilitar/desabilitar o botão.

## Problema 2: Mensagem de boas-vindas enviada no momento errado

Atualmente o `sendWelcomeMessage` é chamado na edge function `assign-chat-room` (linha 136) para "any new room regardless of assignment". O usuário quer que seja enviada **quando um atendente é atribuído ao chat** (não quando a sala é criada em "waiting").

**Mudança em `supabase/functions/assign-chat-room/index.ts`:**
- Mover a chamada `sendWelcomeMessage` para DENTRO do bloco `if (room.status === "active" && room.attendant_id)` (quando o trigger já atribuiu)
- Também enviar welcome no bloco de retorno do edge function quando `assigned: true` (atribuição manual via workspace "Atender")
- Remover a chamada genérica na linha 136

## Problema 3: Nome do atendente não aparece no header do widget

O header mostra `companyName` ("Suporte" por padrão) + subtítulo. O `attendantName` é setado corretamente no realtime (linhas 449-455) quando o room muda para "active". Mas o `companyName` do tenant aloco@aloco.com está vazio, então cai no default "Suporte".

Há dois sub-problemas:
1. O subtítulo mostra `attendantName` corretamente quando `phase === "chat"` e `attendantName` existe. Preciso verificar se o `attendantName` está sendo populado — o realtime listener na linha 444 tem closure sobre `phase`, e o `useEffect` depende de `[roomId, phase]`. Se o room já é criado como "active" pelo trigger (assignment imediato), o listener pode não pegar porque `phase` ainda é "waiting" quando o subscribe acontece.

**Solução:** No `checkRoomAssignment` (linha 609), quando `data.assigned` é true, já seta `attendantName` (OK). Mas no fluxo onde o trigger atribui imediatamente e a room já vem como "active" do insert, o realtime UPDATE nunca dispara porque não houve mudança de status. A init (linhas 280-287) já trata isso. O problema real pode ser que `checkRoomAssignment` é chamado mas o `attendant_name` retornado pela edge function é null.

**Verificar:** A edge function retorna `attendant?.display_name` — se o attendant_profile não tem `display_name` preenchido, retorna null.

**Mudança:** Garantir fallback no widget — se `attendantName` é null mas `phase === "chat"`, mostrar "Atendente" como fallback em vez de "Chat ativo".

## Arquivos impactados

1. `src/components/chat/WorkspaceDisplayTab.tsx` — botão salvar + estado dirty
2. `supabase/functions/assign-chat-room/index.ts` — mover welcome message para momento de atribuição
3. `src/pages/ChatWidget.tsx` — fallback de nome do atendente

