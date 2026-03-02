
# Correção: Broadcast em Massa + Menu Outros Times

## Problema 1: Broadcast em massa não funciona

Foram identificados **4 bugs** que impedem o funcionamento:

### Bug A: Recipients não são salvos no banco
A inserção de `chat_broadcast_recipients` não inclui `tenant_id`. A política de segurança (RLS) exige que `tenant_id` corresponda ao tenant do usuário, então a inserção é bloqueada silenciosamente.

**Correção em `AdminBroadcasts.tsx`:** Adicionar `tenant_id` no insert dos recipients. Também corrigir `contact_id` que pode ficar como string vazia (UUID inválido) quando o contato não tem `company_id`.

### Bug B: Edge function bloqueada por autenticação
A função `process-chat-broadcasts` não está registrada no `config.toml` com `verify_jwt = false`. Como é invocada pelo client, precisa aceitar chamadas autenticadas, mas para segurança e consistência com as demais funções, deve ser adicionada ao config.

**Correção:** Adicionar `[functions.process-chat-broadcasts] verify_jwt = false` ao `config.toml`.

### Bug C: Broadcasts agendados nunca disparam
Não existe nenhum mecanismo (cron, scheduler) para invocar a edge function quando `scheduled_at` é atingido. A edge function só é chamada manualmente quando o status é "live".

**Correção:** Adicionar um `pg_cron` job (migration) que invoque a edge function a cada 1 minuto, OU (mais simples) adicionar ao `process-chat-auto-rules` (que já roda periodicamente) uma chamada adicional para ativar broadcasts agendados. A abordagem mais prática: adicionar a lógica de ativação de broadcasts agendados dentro da edge function `process-chat-auto-rules`, que já é chamada periodicamente.

### Bug D: Room criada sem attendant_id
A edge function cria o `chat_room` sem `attendant_id`, fazendo com que a sala fique sem atendente. O broadcast deveria atribuir o remetente como atendente.

**Correção em `process-chat-broadcasts/index.ts`:** Buscar o `attendant_profile` do `broadcast.user_id` e definir `attendant_id` na criação da room. Também mudar `sender_type` de "system" para "attendant" para que a mensagem apareça corretamente no widget.

---

## Problema 2: Menu "Outros times" não aparece

O código atual só busca `otherTeamAttendants` para usuários **não-admin** (linha 88: `!adminStatus`). Para admins, todos os atendentes vão para a lista principal e `otherTeamAttendants` fica vazio, então a seção nunca aparece.

**Correção em `SidebarDataContext.tsx`:** Para admins, também fazer a separação por times:
- Buscar os times do admin (via `chat_team_members`)
- Atendentes dos mesmos times vão para `teamAttendants`
- Atendentes de outros times vão para `otherTeamAttendants`
- Se o admin não está em nenhum time, manter o comportamento atual (todos na lista principal)

---

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBroadcasts.tsx` | Adicionar `tenant_id` no insert dos recipients; tratar `contact_id` vazio |
| `supabase/functions/process-chat-broadcasts/index.ts` | Buscar attendant_id do remetente; usar sender_type "attendant"; incluir sender_id/sender_name |
| `supabase/functions/process-chat-auto-rules/index.ts` | Adicionar chamada para ativar broadcasts agendados |
| `supabase/config.toml` | Adicionar `process-chat-broadcasts` com `verify_jwt = false` |
| `src/contexts/SidebarDataContext.tsx` | Para admins, separar atendentes por times (meu time vs outros) |

## Detalhes técnicos

### AdminBroadcasts - insert recipients corrigido
```typescript
const recipientRows = Array.from(selectedContactIds).map((contactId) => {
  const contact = contacts.find((c) => c.id === contactId);
  return {
    broadcast_id: broadcastId,
    company_contact_id: contactId,
    contact_id: contact?.company_id || null,
    tenant_id: tenantId, // <-- FALTAVA
    status: "pending",
  };
});
```

### Edge function - atribuir attendant
```typescript
// Buscar attendant do remetente
const { data: senderAtt } = await supabase
  .from("attendant_profiles")
  .select("id, display_name")
  .eq("user_id", broadcast.user_id)
  .maybeSingle();

// Criar room COM attendant
const { data: room } = await supabase
  .from("chat_rooms")
  .insert({
    visitor_id: visitorId,
    owner_user_id: broadcast.user_id,
    attendant_id: senderAtt?.id ?? null,
    // ...
  });

// Mensagem como attendant
await supabase.from("chat_messages").insert({
  room_id: room.id,
  sender_type: senderAtt ? "attendant" : "system",
  sender_id: senderAtt?.id ?? null,
  sender_name: senderAtt?.display_name ?? "Broadcast",
  content: broadcast.message,
});
```

### SidebarDataContext - admin com separação por times
Na branch `adminStatus`, após buscar todos os atendentes do tenant, verificar se o admin pertence a algum time e separar:
- Se tem times: `teamAttendants` = colegas de time, `otherTeamAttendants` = restante
- Se não tem times: todos ficam em `teamAttendants` (comportamento atual)
