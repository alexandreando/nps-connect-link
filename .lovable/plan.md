

# Plano: External ID da empresa + Aba Workspace + Widget responsivo

## 1. External ID da empresa no VisitorInfoPanel

**Arquivo:** `src/components/chat/VisitorInfoPanel.tsx`

A tabela `contacts` já possui coluna `external_id`. O componente já faz select dessa tabela mas não inclui `external_id` no select nem na interface `Company`.

- Adicionar `external_id` à interface `Company` e ao select da query de contacts
- Exibir na seção "Empresa" logo abaixo do CNPJ, com ícone `Hash` e label "ID Externo"

## 2. Nova aba "Workspace" nas configurações do Chat

**Arquivo:** `src/pages/AdminSettings.tsx` + novo componente `src/components/chat/WorkspaceDisplayTab.tsx`

Nova aba com configurações de personalização do workspace do atendente. As preferências serão salvas na tabela `chat_settings` (novas colunas via migration).

Configurações incluídas:
- **Ordenação da lista de chats**: por data da última mensagem (padrão) ou por tempo de espera
- **Exibir/ocultar seções do side panel**: toggles para Métricas, Dados do Contato, Campos Customizados, Timeline, Chats Recentes
- **Exibir external ID da empresa**: toggle (default: on)
- **Exibir external ID do contato**: toggle (default: on)
- **Quantidade de chats recentes no side panel**: select (5, 10, 15)

**Migration SQL:** Adicionar colunas em `chat_settings`:
- `ws_sort_order` (text, default 'last_message')
- `ws_show_metrics` (boolean, default true)
- `ws_show_contact_data` (boolean, default true)
- `ws_show_custom_fields` (boolean, default true)
- `ws_show_timeline` (boolean, default true)
- `ws_show_recent_chats` (boolean, default true)
- `ws_show_company_external_id` (boolean, default true)
- `ws_show_contact_external_id` (boolean, default true)
- `ws_recent_chats_count` (integer, default 5)

O `VisitorInfoPanel` passará a receber essas configurações (via prop ou context) para condicionar a exibição das seções.

## 3. Widget responsivo em altura

**Arquivos:** `public/nps-chat-embed.js` + `src/pages/ChatWidget.tsx`

### Embed script (`nps-chat-embed.js`)
Quando o widget abre, em vez de usar altura fixa `700px`, calcular `Math.min(700, window.innerHeight - 20)` e aplicar. Adicionar listener de `resize` para recalcular continuamente.

### Widget interno (`ChatWidget.tsx`)
- Garantir que o container principal do widget use `max-h-[100dvh]` ou similar para nunca ultrapassar a viewport
- Usar `dvh` (dynamic viewport height) para respeitar barras de endereço mobile
- As seções internas (histórico, chat, formulário) devem usar `flex-1 overflow-auto` para scroll interno

### Embed script — lógica de resize:
```text
// On toggle open:
var maxH = Math.min(700, window.innerHeight - 16);
iframe.style.height = maxH + "px";

// On window resize (debounced):
window.addEventListener("resize", function() {
  if (isOpen) {
    iframe.style.height = Math.min(700, window.innerHeight - 16) + "px";
  }
});
```

## Arquivos impactados

1. **Nova migration SQL** — colunas de config do workspace em `chat_settings`
2. `src/components/chat/VisitorInfoPanel.tsx` — external_id da empresa + respeitar configs de exibição
3. `src/pages/AdminSettings.tsx` — nova aba "Workspace"
4. `src/components/chat/WorkspaceDisplayTab.tsx` — novo componente da aba
5. `public/nps-chat-embed.js` — altura responsiva do iframe
6. `src/pages/ChatWidget.tsx` — container com altura máxima dinâmica

