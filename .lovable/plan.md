
# Mensagens em Massa (Broadcast) no Chat

## Visao Geral

Criar um modulo completo de **Mensagens em Massa** (Broadcast) dentro do Chat, permitindo que atendentes enviem mensagens proativas para multiplos contatos simultaneamente, com agendamento, status (rascunho/live), e metricas de engajamento (visualizacao, cliques).

## Novas Tabelas

### `chat_broadcasts`
Armazena cada campanha de broadcast.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| tenant_id | uuid | |
| user_id | uuid | Criador |
| title | text | Nome da campanha |
| message | text | Conteudo da mensagem |
| status | text | `draft`, `scheduled`, `live`, `completed`, `cancelled` |
| scheduled_at | timestamptz | Agendamento (null = imediato) |
| sent_at | timestamptz | Quando foi disparada |
| completed_at | timestamptz | Quando terminou de enviar |
| total_recipients | int | Total de destinatarios |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `chat_broadcast_recipients`
Lista de destinatarios de cada broadcast com metricas individuais.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| broadcast_id | uuid FK | |
| company_contact_id | uuid FK | Contato destinatario |
| contact_id | uuid FK | Empresa do contato |
| tenant_id | uuid | |
| status | text | `pending`, `sent`, `failed` |
| sent_at | timestamptz | Quando a msg foi enviada |
| delivered_at | timestamptz | Quando foi entregue/visualizada |
| clicked_at | timestamptz | Quando clicou em link |
| chat_room_id | uuid | Sala criada para este envio |
| created_at | timestamptz | |

### RLS
- Ambas as tabelas: `tenant_id = get_user_tenant_id(auth.uid())` para todas as operacoes.
- Realtime habilitado em `chat_broadcasts` para atualizacoes de status.

## Logica de Disparo

Uma **Edge Function** `process-chat-broadcasts` sera responsavel por:

1. Buscar broadcasts com `status = 'live'` (ou `scheduled` com `scheduled_at <= now()`)
2. Para cada recipient `pending`:
   - Resolver/criar visitor (mesma logica do `ProactiveChatDialog`)
   - Criar `chat_room` com status `active`
   - Inserir mensagem inicial
   - Atualizar recipient para `sent`
3. Ao finalizar todos recipients, marcar broadcast como `completed`

Essa function sera agendada via cron (a cada minuto) ou invocada manualmente ao clicar "Enviar agora".

## Metricas de Engajamento

- **Visualizacao**: Quando o visitante abre a conversa no widget/portal, atualiza `delivered_at` no recipient (via realtime ou ao carregar mensagens)
- **Cliques**: Links na mensagem sao rastreados. Quando o visitante clica em um link dentro de uma mensagem de broadcast, o widget registra o evento atualizando `clicked_at`
- O dashboard do broadcast mostra: total enviados, entregues, visualizados, clicados, taxa de abertura, taxa de clique

## Interface - Nova Pagina `/admin/broadcasts`

### Listagem
- Tabela com: titulo, status (badge colorido), destinatarios, taxa de abertura, taxa de clique, data criacao, acoes
- Botao "Nova Mensagem em Massa"
- Filtros por status

### Dialog/Pagina de Criacao/Edicao
1. **Titulo** da campanha
2. **Mensagem** (textarea com preview)
3. **Selecao de destinatarios**:
   - Filtro por Empresa (multi-select ou busca)
   - Filtro por Cargo, Departamento
   - Lista de contatos com checkboxes (selecao individual ou "Selecionar todos")
   - Contador de selecionados
4. **Agendamento**:
   - "Enviar agora" ou "Agendar para" (date/time picker)
5. **Acoes**:
   - "Salvar como rascunho" (status = draft)
   - "Agendar" (status = scheduled)
   - "Enviar agora" (status = live)

### Pagina de Detalhes do Broadcast
- Metricas: cards com Enviados, Entregues, Visualizados, Clicados
- Tabela de recipients com status individual
- Preview da mensagem

## Permissionamento

Adicionar novos nodes ao `PERMISSION_TREE` em `UserPermissionsDialog.tsx`:

```text
chat.broadcasts -> view, edit, delete, manage
```

E tambem adicionar ao sidebar a verificacao `hasPermission("chat.broadcasts", "view")`.

### Outras permissoes faltantes a adicionar

Revisar e adicionar ao PERMISSION_TREE nodes para funcionalidades que ja existem mas nao estao no permissionamento:
- `chat.dashboard` -> view (Dashboard do Chat)
- `chat.csat` -> view (Relatorio CSAT)
- `chat.gerencial` -> view (Dashboard Gerencial)

## Mudancas por Arquivo

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Criar tabelas `chat_broadcasts` e `chat_broadcast_recipients` com RLS |
| `supabase/functions/process-chat-broadcasts/index.ts` | Edge Function de processamento |
| `src/pages/AdminBroadcasts.tsx` | Nova pagina de listagem + CRUD |
| `src/App.tsx` | Rota `/admin/broadcasts` |
| `src/components/AppSidebar.tsx` | Menu item "Mensagens em Massa" no grupo Chat |
| `src/components/UserPermissionsDialog.tsx` | Adicionar `chat.broadcasts`, `chat.dashboard`, `chat.csat`, `chat.gerencial` |
| `src/locales/pt-BR.ts` + `en.ts` | Labels de traducao |
| `supabase/config.toml` | Config da nova edge function (verify_jwt = false) |

## Fluxo do Usuario

```text
1. Acessa "Mensagens em Massa" no menu Chat
2. Clica "Nova Mensagem"
3. Escreve titulo e mensagem
4. Filtra por empresa e seleciona contatos
5. Escolhe: Rascunho / Agendar / Enviar agora
6. Acompanha metricas na listagem e pagina de detalhes
```
