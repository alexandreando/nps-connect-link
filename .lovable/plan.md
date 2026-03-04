

# Melhorias: Listagem de Chats no Widget + Header + Contador de Regras Automáticas

## 1. Melhorias na listagem de histórico do widget

### Problemas identificados na screenshot
- **Horário duplicado**: Exibe "agora — agora" e "há 8h — há 8h" (created_at — closed_at com valores quase idênticos)
- **Preview da última mensagem** existe mas não se diferencia visualmente
- **Falta contexto**: sem nome do atendente, sem duração da conversa

### Mudanças propostas em `ChatWidget.tsx`

**a) Horários inteligentes** — Em vez de mostrar "created_at — closed_at" sempre, mostrar:
- Para chats ativos/pendentes: apenas "há Xmin" (tempo relativo desde criação)
- Para chats encerrados: data de encerramento + duração total (ex: "03/03 14:30 · 12min")
- Elimina a duplicação "agora — agora"

**b) Preview da última mensagem** — Já existe (linha 1330-1332), mas melhorar:
- Cor mais sutil: `text-muted-foreground/60` em vez de `text-muted-foreground`
- Prefixo "Você: " quando a última mensagem for do visitante
- Truncar em 50 chars para não dominar o card

**c) Nome do atendente** — Buscar `attendant_id` na query do `fetchHistory` (já existe na tabela), fazer lookup em `attendant_profiles` e exibir como subtítulo discreto (ex: "Atendido por chuckzera")

**d) Ícone de status diferenciado por tipo**:
- Pendente: ícone `Clock` laranja (já tem)
- Encerrado/Resolvido: `CheckCircle2` verde
- Arquivado: `Archive` cinza
- Ativo: ícone pulsante com cor primária

**e) Layout do card refinado** — Reordenar:
```
[Ícone] Status          [CSAT stars]
Preview da mensagem...
há 2h · 15min · por chuckzera
[Botão Retomar] (se pendente)
```

## 2. Header: nome do atendente ainda mostra "Suporte"

### Problema
O `companyName` vem do query param `?companyName=` na URL do embed. Se o tenant não configura esse param, cai no default "Suporte". A mudança anterior (linha 1196) troca para `attendantName` quando `phase === "chat"`, mas o problema reportado sugere que `attendantName` está null no momento da renderização.

### Causa raiz
Na init (linhas 280-287), quando o widget recarrega e encontra um room ativo, busca o attendant_id e faz lookup. Mas se o `checkRoomAssignment` (linha 609) retorna `data.attendant_name` como null (porque `attendant_profiles.display_name` está vazio para esse atendente), o nome nunca é setado.

### Solução
- No `checkRoomAssignment`: se `data.attendant_name` é null mas `data.assigned` é true, buscar fallback direto do `attendant_profiles` usando o `attendant_id` retornado
- No realtime listener (linha 449-455): já busca corretamente
- Na edge function `assign-chat-room`: garantir que retorna o `display_name` OU um fallback (email do user, ou "Atendente")
- **Arquivo:** `supabase/functions/assign-chat-room/index.ts` — adicionar fallback no retorno do `attendant_name`

## 3. Contador de mensagens automáticas não zera ao reabrir

### Problema
A edge function `process-chat-auto-rules` detecta a cadeia de regras (inactivity_warning → inactivity_warning_2 → auto_close) verificando mensagens do tipo system com metadata `auto_rule`. Quando um chat é reaberto, essas mensagens antigas permanecem no histórico, e a cadeia continua de onde parou.

### Causa raiz (linha 230-237)
A lógica verifica se o visitante respondeu APÓS a última mensagem da cadeia para resetar. Mas a mensagem de reabertura tem `sender_type: "system"` (não "visitor"), então não é contada como reset.

### Solução em `process-chat-auto-rules/index.ts`
Na detecção da cadeia, além de verificar se o visitante respondeu após o último chain msg, também verificar se houve uma mensagem de sistema com conteúdo de reabertura (`"[Sistema] Chat reaberto"`) após o último chain msg. Isso resetará a cadeia.

Alternativa mais robusta: ao reabrir um chat (handleReopenChat no widget, linha 720, e também no workspace), inserir uma mensagem de reset com metadata especial `{ auto_rule: "chain_reset" }`. Na edge function, tratar `chain_reset` como um corte na cadeia.

**Escolha:** Usar a metadata `{ auto_rule: "chain_reset" }` — é mais explícito e não depende de parsing de texto.

**Mudanças:**
1. `ChatWidget.tsx` (linha 727-733): adicionar `metadata: { auto_rule: "chain_reset" }` na mensagem de reabertura
2. `process-chat-auto-rules/index.ts` (linha 220): incluir `"chain_reset"` na detecção de chain system msgs, e tratar como reset (igual a resposta do visitante)
3. Buscar no workspace (ReadOnlyChatDialog ou AdminWorkspace) onde atendentes reabrem chats e adicionar a mesma metadata

## Arquivos impactados

1. **`src/pages/ChatWidget.tsx`** — Melhorar cards do histórico (horário, preview, atendente), garantir attendantName no header
2. **`supabase/functions/assign-chat-room/index.ts`** — Fallback no attendant_name retornado
3. **`supabase/functions/process-chat-auto-rules/index.ts`** — Reconhecer `chain_reset` como corte na cadeia
4. **`src/pages/AdminChatHistory.tsx`** ou componente de reopen no workspace — Adicionar metadata de chain_reset

