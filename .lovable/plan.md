

## Bug: Contadores de atendentes no menu nao atualizam em tempo real

### Causa raiz

A tabela `attendant_profiles` **nao esta na publicacao `supabase_realtime`**. O `SidebarDataContext` ja tem o codigo correto para escutar mudancas realtime nessa tabela (linha 304-310), mas como a tabela nao esta publicada, os eventos nunca chegam ao cliente.

Tabelas atualmente publicadas:
- `chat_rooms` (ok)
- `chat_messages`
- `chat_banner_assignments`
- `help_articles`
- `chat_broadcasts`

Faltando: `attendant_profiles`

### Correcao

**1 migration SQL:**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendant_profiles;
```

Isso e tudo. O codigo do `SidebarDataContext` ja trata corretamente os eventos `UPDATE` na `attendant_profiles`, atualizando `active_count`, `status` e `display_name` via o handler `handleAttendantChange` (linha 202-234). Os triggers de banco (`decrement_attendant_active_conversations`, `assign_chat_room`) ja atualizam `active_conversations` na tabela — so falta o Realtime propagar essas mudancas pro frontend.

### Impacto

- Zero mudanca de codigo frontend
- Zero impacto em clientes existentes
- Contadores passam a atualizar instantaneamente quando chats sao atribuidos, fechados ou reatribuidos

