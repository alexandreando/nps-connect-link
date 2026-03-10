

## Plano: 4 melhorias no widget e mensagens automáticas

### 1. Widget CSAT — remover "Pular", adicionar "Voltar" no header

**Arquivo**: `src/pages/ChatWidget.tsx`

- Na seção CSAT (linhas 1708-1756): remover o botão "Pular" do `div.flex.gap-2` e deixar apenas o botão "Enviar Avaliação" ocupando largura total
- No header (linha 1262): adicionar `phase === "csat"` à condição que mostra o botão ArrowLeft, fazendo o clique chamar `handleBackToHistory()`

### 2. Widget CSAT — tela de agradecimento após envio

**Arquivo**: `src/pages/ChatWidget.tsx`

- Adicionar estado `csatSubmitted` (boolean)
- No `handleSubmitCsat`: em vez de ir direto para `handleBackToHistory()` ou `setPhase("closed")`, setar `csatSubmitted = true`
- Na seção CSAT: quando `csatSubmitted === true`, mostrar mensagem de agradecimento (ícone check + "Obrigado pelo seu feedback!") com botão "Ver conversas" que chama `handleBackToHistory()`
- Aplicar mesma lógica no `PortalChatView.tsx` / `PortalCSATForm.tsx`: após submit, mostrar tela de agradecimento antes de voltar

### 3. Widget — exibir nota CSAT ao visualizar conversa avaliada

**Arquivo**: `src/pages/ChatWidget.tsx`

- No `handleViewTranscript`: buscar `csat_score` além de `resolution_status`
- Criar estado `viewTranscriptCsatScore`
- Na fase `viewTranscript`, no footer (linhas 1863-1880): quando `viewTranscriptCsatScore` existir, exibir as estrelas preenchidas de acordo com a nota (somente leitura)
- Aplicar mesma lógica no `PortalChatView.tsx`: quando `phase === "closed"` e room tem `csat_score`, mostrar as estrelas

### 4. Auto-close — opção de resolution_status configurável

**Arquivo**: `src/components/chat/AutoMessagesTab.tsx`

- Adicionar campo `metadata` (jsonb) ou usar `chat_auto_rules` para guardar `close_resolution_status` para a regra `auto_close`
- Como a tabela `chat_auto_rules` não tem coluna de metadata, usar a abordagem mais simples: adicionar coluna `close_resolution_status` (text, default 'archived') à tabela

**Migration**:
```sql
ALTER TABLE public.chat_auto_rules 
ADD COLUMN close_resolution_status text NOT NULL DEFAULT 'archived';
```

**Arquivo**: `src/components/chat/AutoMessagesTab.tsx`
- Atualizar interface `AutoRule` para incluir `close_resolution_status`
- Na renderização do accordion item do `auto_close`: adicionar um Select com opções "Pendente", "Resolvida", "Arquivada" (padrão)
- Salvar junto com as outras edits locais

**Arquivo**: `supabase/functions/process-chat-auto-rules/index.ts`
- Incluir `close_resolution_status` no SELECT da query de regras
- Na seção `auto_close` (linha 250-259): usar `stepRule.close_resolution_status ?? "archived"` em vez de hardcoded "archived"

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Nova coluna `close_resolution_status` |
| `src/pages/ChatWidget.tsx` | Remover "Pular", back no header, tela agradecimento, nota no transcript |
| `src/components/portal/PortalChatView.tsx` | Tela agradecimento, nota CSAT em closed |
| `src/components/portal/PortalCSATForm.tsx` | Estado de agradecimento pós-submit |
| `src/components/chat/AutoMessagesTab.tsx` | Select de resolution_status no auto_close |
| `supabase/functions/process-chat-auto-rules/index.ts` | Usar resolution_status configurável |

