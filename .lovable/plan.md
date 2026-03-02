

# Plano: 6 Funcionalidades - Dashboard Tags, Ausencias, Intervalos, Reabrir Resolvido, Notificacao Broadcast, Auto-Offline

## 1. Top Tags no Dashboard Gerencial

Adicionar ao `useDashboardStats` a contagem de tags por periodo e exibir no `AdminDashboardGerencial` um novo grafico/card de "Top Tags".

**Tecnico:**
- `useDashboardStats.ts`: Buscar `chat_room_tags` com join em `chat_tags` para os room IDs filtrados. Agrupar por tag, retornar `topTags: { name: string; color: string; count: number }[]` no stats.
- `AdminDashboardGerencial.tsx`: Adicionar um `ChartCard` com barras horizontais ou lista ranqueada das top 10 tags com badge colorido e contagem.

---

## 2. Cadastro de Ausencias (Feriados/Datas Especiais) no Working Hours

Permitir cadastrar datas especificas onde o horario semanal nao se aplica (feriados, recesso, etc.), podendo definir horario especial ou marcar como "sem expediente".

**Tecnico:**
- **Migration**: Criar tabela `chat_business_hour_overrides`:
  - `id`, `tenant_id`, `user_id`, `override_date` (date, unique per tenant), `is_closed` (boolean, default true), `start_time`, `end_time`, `label` (text, ex: "Feriado Nacional"), `offline_message` (text, mensagem customizada), `created_at`
  - RLS: tenant members manage
- **AdminSettings.tsx** (aba "Horarios"): Adicionar secao "Ausencias e Feriados" com formulario para adicionar data, label, toggle fechado/horario especial, e mensagem de ausencia. Listar ausencias futuras com opcao de editar/excluir.
- **Trigger `assign_chat_room`**: Antes de verificar `chat_business_hours`, checar se existe override para a data atual. Se `is_closed = true`, nao atribuir. Se tem horario especial, usar esse horario ao inves do semanal.
- **Widget `get-widget-config`**: Verificar overrides ao determinar se esta dentro do horario.

---

## 3. Intervalos nos Working Hours

Adicionar suporte a intervalos (ex: almoco 12:00-13:00) dentro de cada dia, com mensagem especifica para quando o cliente envia mensagem durante o intervalo.

**Tecnico:**
- **Migration**: Criar tabela `chat_business_hour_breaks`:
  - `id`, `business_hour_id` (FK para `chat_business_hours`), `tenant_id`, `start_time`, `end_time`, `message` (texto exibido durante o intervalo), `created_at`
  - RLS: tenant members manage
- **AdminSettings.tsx** (aba "Horarios"): Para cada dia, adicionar botao "Adicionar intervalo" que expande campos de horario inicio/fim e mensagem. Listar intervalos existentes com opcao de remover.
- **Trigger `assign_chat_room`**: Apos confirmar que o dia esta ativo e dentro do horario, verificar se o horario atual cai dentro de algum intervalo. Se sim, nao atribuir (mesma logica de fora do horario).
- **Widget**: Quando em intervalo, exibir a mensagem de intervalo configurada ao inves da mensagem de fora de horario padrao.

---

## 4. Configuracao para Reabrir Chat Resolvido (com re-CSAT)

Permitir que o admin configure se atendentes podem reabrir chats ja resolvidos. Ao fechar novamente, pedir nova avaliacao CSAT que sobrepoe a anterior.

**Tecnico:**
- **Migration**: Adicionar colunas na tabela `chat_settings`:
  - `allow_reopen_resolved` (boolean, default false)
- **AdminSettings.tsx** (aba "Regras"): Adicionar switch "Permitir reabrir chats resolvidos" com descricao explicando que a nota CSAT sera substituida.
- **AdminWorkspace.tsx**: No cabecalho de um chat fechado com `resolution_status = 'resolved'`, se `allow_reopen_resolved` estiver habilitado, exibir botao "Reabrir". Ao reabrir:
  - Limpar `csat_score`, `csat_comment`, `resolution_status`, `closed_at`
  - Status volta para `active` com o mesmo `attendant_id`
  - Inserir mensagem de sistema "Chat reaberto por [atendente]"
- **ChatWidget.tsx**: Ao fechar o chat reaberto com status "resolvido", exibir CSAT normalmente. A nova nota sobrescreve a anterior.
- **AdminChatHistory.tsx**: Tambem exibir opcao de reabrir resolvidos se a config permitir.

---

## 5. Notificacao no Widget para Broadcasts e Chats Reabertos

Chats abertos por broadcast ou reabertos devem notificar o cliente no widget da mesma forma que uma nova mensagem em chat ativo.

**Tecnico:**
- **ChatWidget.tsx**: O widget ja escuta mudancas via realtime em `chat_rooms` e `chat_messages`. O que falta e:
  - Quando o widget recebe uma nova mensagem de um `room_id` diferente do ativo, ou de um room que estava fechado, incrementar `unreadCount` e emitir `chat-unread-count` via postMessage.
  - Adicionar subscription para `INSERT` em `chat_rooms` filtrando pelo `visitor_id` atual. Quando um novo room aparece (broadcast) ou um room existente muda de `closed` para `waiting/active` (reaberto), tratar como nova notificacao.
- **process-chat-broadcasts**: Ja foi corrigido para criar rooms com attendant. Verificar que a mensagem inserida dispara o realtime corretamente (ja deve funcionar pois `chat_messages` tem realtime habilitado).

---

## 6. Auto-Offline para Atendentes Deslogados + Restaurar Ultimo Status

Quando o atendente sai da plataforma (fecha aba/logout), seu status deve ir automaticamente para offline. Ao voltar, restaurar o ultimo status ativo.

**Tecnico:**
- **Migration**: Adicionar coluna `previous_status` (text, nullable) na tabela `attendant_profiles` para guardar o status antes de ficar offline.
- **SidebarLayout.tsx ou AuthContext.tsx**: 
  - No mount (login/abertura da aba): buscar `attendant_profiles` do usuario. Se `previous_status` existe e != 'offline', restaurar para esse status e limpar `previous_status`.
  - No unmount/beforeunload: salvar status atual em `previous_status` e setar status para 'offline'.
  - Usar `navigator.sendBeacon` ou `fetch keepalive` no `beforeunload` para garantir que o update chegue ao servidor.
- **Logout handler**: Antes de fazer signOut, salvar `previous_status` e setar offline.
- **MyProfile.tsx**: Ao mudar status manualmente, limpar `previous_status` (pois e uma escolha intencional).

---

## Resumo de Arquivos

| Arquivo | Mudancas |
|---------|----------|
| `src/hooks/useDashboardStats.ts` | Adicionar topTags ao stats |
| `src/pages/AdminDashboardGerencial.tsx` | Renderizar card de Top Tags |
| `src/pages/AdminSettings.tsx` | Secao ausencias, intervalos, config reabrir resolvido |
| `src/pages/AdminWorkspace.tsx` | Botao reabrir resolvido (condicional) |
| `src/pages/AdminChatHistory.tsx` | Botao reabrir resolvido (condicional) |
| `src/pages/ChatWidget.tsx` | Notificacao para broadcasts/reopens |
| `src/pages/MyProfile.tsx` | Limpar previous_status ao mudar status manual |
| `src/components/SidebarLayout.tsx` | Auto-offline no unmount, restore no mount |
| **Migration 1** | Tabela `chat_business_hour_overrides` |
| **Migration 2** | Tabela `chat_business_hour_breaks` |
| **Migration 3** | Colunas `allow_reopen_resolved` em `chat_settings`, `previous_status` em `attendant_profiles` |
| **Trigger update** | `assign_chat_room` - verificar overrides e breaks |

## Ordem de implementacao

1. Migrations (tabelas + colunas)
2. Top Tags no dashboard
3. Ausencias e intervalos no working hours
4. Config reabrir resolvido
5. Notificacoes widget (broadcast/reopen)
6. Auto-offline + restore status

