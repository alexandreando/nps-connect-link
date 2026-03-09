

## Fix: Notas internas não devem afetar triggers de inatividade

### Problema

A Edge Function `process-chat-auto-rules` não diferencia notas internas (`is_internal = true`) de mensagens reais. Quando um atendente adiciona uma nota interna, ela é tratada como mensagem de atendente, o que:
- Na regra de **ausência do atendente**: uma nota interna "responde" ao visitante, impedindo o disparo do aviso
- Na **cadeia de inatividade**: uma nota interna do atendente é considerada como "última mensagem do atendente", reiniciando o timer de inatividade indevidamente

### Solução

Uma única mudança no `process-chat-auto-rules/index.ts`:

1. **Adicionar `is_internal` ao SELECT** da query de mensagens (linha 105)
2. **Filtrar notas internas** em todos os pontos onde se busca a última mensagem não-sistema:
   - Linha 126: `lastNonSystem` para regra de ausência — adicionar `&& !m.is_internal`
   - Linhas 157-165: detecção de `lastVisitorMsg` e `lastAttendantMsg` para cadeia — adicionar `&& !m.is_internal`
   - Linha 195: `lastNonSystem` para início da cadeia — adicionar `&& !m.is_internal`

Essencialmente, notas internas passam a ser **invisíveis** para o motor de regras automáticas, como se não existissem.

### Arquivo modificado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/process-chat-auto-rules/index.ts` | Adicionar `is_internal` ao select e filtrar `!is_internal` em todas as buscas de última mensagem |

