

## Plano: Corrigir rascunhos + renomear "Arquivado" → "Inativo" + criar novo "Arquivado"

### 1. Corrigir bug dos rascunhos

**Causa raiz**: No `useEffect` da linha 175, `value` é capturado do closure mas NÃO está no array de dependências (`[roomId]`). Quando o `roomId` muda, o `value` lido na linha 180 é stale (valor antigo ou vazio). O rascunho nunca é salvo corretamente.

**Correção**: Usar `textareaRef.current?.value` ao invés de `value` do estado — mesmo padrão já usado no handler de unmount (linha 200).

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/ChatInput.tsx` | Linha 180: trocar `value` por `textareaRef.current?.value ?? ""` |

---

### 2. Renomear "archived" → "inactive" em toda a lógica de chat

O que hoje é chamado de "Arquivado/archived" como `resolution_status` de chat_rooms passará a ser "Inativo/inactive". Isso inclui:

| Arquivo | Mudanças |
|---------|---------|
| `src/components/chat/CloseRoomDialog.tsx` | Trocar `"archived"` → `"inactive"` no tipo, no `statusOptions`, no estado default. Label: "Inativar". |
| `src/pages/AdminWorkspace.tsx` | Tipo do `handleConfirmClose`: `"archived"` → `"inactive"`. Toast: "Conversa inativada". |
| `src/pages/AdminChatHistory.tsx` | Labels e filtros: `"archived"` → `"inactive"`, "Arquivado" → "Inativo". Bulk/individual actions. |
| `src/pages/AdminDashboard.tsx` | `resolutionColor`: adicionar case `"inactive"`. |
| `src/pages/AdminDashboardGerencial.tsx` | `resolutionColor`: adicionar case `"inactive"`. |
| `src/components/chat/ReadOnlyChatDialog.tsx` | Badge: `"archived"` → `"inactive"`, "Arquivado" → "Inativo". |
| `src/components/chat/AutoMessagesTab.tsx` | Select options: `"archived"` → `"inactive"`, "Arquivada" → "Inativada". Default value. |
| `src/pages/ChatWidget.tsx` | `statusLabel`: `"archived"` → `"inactive"`. `isArchived` → `isInactive`. |
| `src/components/portal/PortalChatList.tsx` | `resolutionBadge`: adicionar case `"inactive"` → "Inativo". |
| `supabase/functions/process-chat-auto-rules/index.ts` | Default fallback: `"archived"` → `"inactive"`. |

### 3. Criar novo status "archived" (manual)

O novo "Arquivado" será um status que só pode ser aplicado manualmente nos pontos de alteração de status (Histórico, CloseRoomDialog). Ele não será o default de nenhuma regra automática.

| Arquivo | Mudanças |
|---------|---------|
| `src/components/chat/CloseRoomDialog.tsx` | Adicionar 4ª opção: `{ value: "archived", label: "Arquivar", icon: Archive, ... }` |
| `src/pages/AdminChatHistory.tsx` | Adicionar "Arquivado" nos filtros e nas ações individuais/bulk. |
| `src/pages/AdminDashboard.tsx` | `resolutionColor`: case `"archived"` → cor cinza/azul diferenciada. |
| `src/pages/AdminDashboardGerencial.tsx` | Idem. |
| `src/components/chat/ReadOnlyChatDialog.tsx` | Badge para `"archived"` → "Arquivado". |
| `src/pages/ChatWidget.tsx` | `statusLabel` e lógica visual para `"archived"`. |
| `src/components/portal/PortalChatList.tsx` | `resolutionBadge` case `"archived"`. |

**Nota**: O `AutoMessagesTab` NÃO terá opção "Arquivado" — regras automáticas só podem usar "Pendente", "Resolvida" ou "Inativada".

### 4. Migração retroativa dos dados

| Arquivo | Mudança |
|---------|---------|
| **Migration SQL** | `UPDATE chat_rooms SET resolution_status = 'inactive' WHERE resolution_status = 'archived';` e `UPDATE chat_auto_rules SET close_resolution_status = 'inactive' WHERE close_resolution_status = 'archived';` |

### Resumo de status finais

| Status | Descrição | Automático? | Manual? |
|--------|-----------|-------------|---------|
| `resolved` | Resolvido | ✅ | ✅ |
| `pending` | Pendente | ✅ | ✅ |
| `inactive` | Inativo (antigo "Arquivado") | ✅ | ✅ |
| `archived` | Arquivado (novo, manual) | ❌ | ✅ |
| `escalated` | Escalado | ✅ | ❌ |

### Arquivos modificados

| Arquivo | Frentes |
|---------|---------|
| `src/components/chat/ChatInput.tsx` | 1 |
| `src/components/chat/CloseRoomDialog.tsx` | 2, 3 |
| `src/pages/AdminWorkspace.tsx` | 2 |
| `src/pages/AdminChatHistory.tsx` | 2, 3 |
| `src/pages/AdminDashboard.tsx` | 2, 3 |
| `src/pages/AdminDashboardGerencial.tsx` | 2, 3 |
| `src/components/chat/ReadOnlyChatDialog.tsx` | 2, 3 |
| `src/components/chat/AutoMessagesTab.tsx` | 2 |
| `src/pages/ChatWidget.tsx` | 2, 3 |
| `src/components/portal/PortalChatList.tsx` | 2, 3 |
| `supabase/functions/process-chat-auto-rules/index.ts` | 2 |
| **Migration** | 4 |

