
# Fila de Outros Times + Menus Colapsiveis

## Resumo

Duas mudancas: (1) adicionar uma nova secao "Fila de outros times" no submenu do Workspace mostrando atendentes que nao pertencem aos times do usuario logado, e (2) tornar todas as secoes de menu da sidebar colapsiveis com estado persistido em localStorage.

## 1. SidebarDataContext - Separar atendentes por time

Atualmente o contexto carrega apenas os atendentes do mesmo time (para nao-admins). Precisamos tambem carregar os atendentes de **outros times** do tenant.

**Mudancas no `initializeData`:**
- Para usuarios nao-admin com time: alem de buscar `teamAttendants` (atendentes dos mesmos times), fazer uma segunda query buscando **todos** os atendentes do tenant (`tenant_id = currentTenantId`) e filtrar removendo os IDs ja presentes em `teamAttendants`
- Armazenar em novo state `otherTeamAttendants: TeamAttendant[]`
- Calcular `otherTeamsTotalChats` para o badge
- Expor via contexto: `otherTeamAttendants`, `otherTeamsTotalChats`

**Logica de separacao:**
```
myTeamIds = chat_team_members WHERE attendant_id = myProfile.id -> team_ids
myTeamAttendantIds = chat_team_members WHERE team_id IN myTeamIds -> attendant_ids (atual)
allTenantAttendants = attendant_profiles WHERE tenant_id = tenantId
otherTeamAttendants = allTenantAttendants FILTER id NOT IN myTeamAttendantIds
```

Para admins/master: `otherTeamAttendants` fica vazio (ja veem todos na lista principal).

**Realtime e resync:** os handlers existentes (`handleRoomChange`, `handleAttendantChange`, `resyncCounts`) precisam atualizar tambem o `otherTeamAttendants` state com a mesma logica de patch.

## 2. AppSidebar - Nova secao "Fila de outros times"

Adicionar logo abaixo da lista de `teamAttendants` no submenu do Workspace:

```text
Workspace [badge total]
  |- Nao Atribuido [badge]
  |- (eu) Joao [badge]
  |- Maria [badge]
  |
  |- Outros times [badge total outros] [v]  <-- NOVO, colapsivel
  |    |- Carlos [badge]
  |    |- Ana [badge]
```

- Novo estado `otherTeamsOpen` com localStorage persistence (`sidebar-other-teams-open`)
- Usa Collapsible igual ao padrao existente
- Cada atendente de outro time funciona igual: click navega para `?attendant={id}` no workspace
- Badge mostra total de chats ativos dos outros times

## 3. Todos os menus colapsiveis

As secoes que hoje NAO sao colapsiveis (CS, Cadastros, Help Center, Backoffice) passam a ser, usando o mesmo padrao de Collapsible ja usado em NPS/Chat/Reports:

| Secao | Estado localStorage |
|-------|-------------------|
| Backoffice | `sidebar-backoffice-open` |
| Customer Success | `sidebar-cs-open` |
| Cadastros | `sidebar-contacts-open` |
| Help Center | `sidebar-help-open` |

Cada um tera:
- Estado `useState` com default `true` (aberto)
- Persist em localStorage
- ChevronDown/ChevronRight no label
- Mesmo estilo visual dos colapsiveis existentes (NPS, Chat, Reports)

## 4. Localizacao

Adicionar labels em `pt-BR.ts` e `en.ts`:
- `chat.workspace.otherTeams`: "Outros times" / "Other teams"

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/contexts/SidebarDataContext.tsx` | Adicionar `otherTeamAttendants` e `otherTeamsTotalChats` ao contexto; query separada para atendentes de outros times; atualizar handlers de realtime e resync |
| `src/components/AppSidebar.tsx` | Nova secao colapsivel "Outros times" no submenu Workspace; tornar CS, Cadastros, Help Center e Backoffice colapsiveis com persist em localStorage |
| `src/locales/pt-BR.ts` | Label "Outros times" |
| `src/locales/en.ts` | Label "Other teams" |
