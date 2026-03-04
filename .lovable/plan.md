

# Plano: Customizacao granular do painel lateral (campo a campo)

## Objetivo

Expandir a aba Workspace para permitir controle fino sobre cada campo e metrica exibida no painel lateral, incluindo campos customizados que devem aparecer como "ligados" por default mas com opcao de desligar individualmente.

## Mapeamento completo dos campos do VisitorInfoPanel

### Secao "Empresa" (ws_show_company_info — nova)
Campos individuais:
- Nome / Razao Social (sempre visivel se secao ativa)
- CNPJ (`ws_show_company_cnpj`, default true)
- External ID (`ws_show_company_external_id`, ja existe)
- Setor (`ws_show_company_sector`, default true)
- Localização (`ws_show_company_location`, default true)

### Secao "Metricas" (ws_show_metrics, ja existe)
Campos individuais:
- Health Score (`ws_show_metric_health`, default true)
- MRR (`ws_show_metric_mrr`, default true)
- Valor Contrato (`ws_show_metric_contract`, default true)
- NPS (`ws_show_metric_nps`, default true)
- Data Renovação (`ws_show_metric_renewal`, default true)

### Secao "Dados do Contato" (ws_show_contact_data, ja existe)
Campos individuais:
- Departamento (`ws_show_contact_department`, default true)
- External ID (`ws_show_contact_external_id`, ja existe)
- Estatísticas de Chat — sessoes, CSAT medio, ultimo chat (`ws_show_contact_chat_stats`, default true)

### Secao "Campos Customizados" (ws_show_custom_fields, ja existe)
Em vez de colunas fixas, usar um JSON column `ws_hidden_custom_fields` (text[], default '{}') que armazena as `key`s dos campos desligados. Na UI, carregar todos os `chat_custom_field_definitions` ativos e renderizar cada um como toggle (default: ligado). Quando desligado, adicionar a key ao array. O VisitorInfoPanel filtra os campos cuja key esta nesse array.

### Secao "Timeline" (ws_show_timeline, ja existe)
- Quantidade maxima de eventos (`ws_timeline_max_events`, default 10)

### Secao "Chats Recentes" (ws_show_recent_chats, ja existe)
- Quantidade por pagina (`ws_recent_chats_count`, ja existe)

### Comportamento
- Painel aberto por default (`ws_default_panel_open`, default true)

## Mudancas

### 1. Migration SQL
Novas colunas em `chat_settings`:
- `ws_show_company_info` boolean default true
- `ws_show_company_cnpj` boolean default true
- `ws_show_company_sector` boolean default true
- `ws_show_company_location` boolean default true
- `ws_show_metric_health` boolean default true
- `ws_show_metric_mrr` boolean default true
- `ws_show_metric_contract` boolean default true
- `ws_show_metric_nps` boolean default true
- `ws_show_metric_renewal` boolean default true
- `ws_show_contact_department` boolean default true
- `ws_show_contact_chat_stats` boolean default true
- `ws_hidden_custom_fields` text[] default '{}'
- `ws_timeline_max_events` integer default 10
- `ws_default_panel_open` boolean default true

### 2. WorkspaceDisplayTab.tsx
Reorganizar em cards granulares:

**Card "Empresa"**: toggle master `ws_show_company_info` + sub-toggles para CNPJ, Setor, Localização

**Card "Metricas"**: toggle master `ws_show_metrics` + sub-toggles para Health Score, MRR, Valor Contrato, NPS, Data Renovação

**Card "Dados do Contato"**: toggle master `ws_show_contact_data` + sub-toggles para Departamento, External ID Contato, Estatísticas de Chat

**Card "Campos Customizados"**: toggle master `ws_show_custom_fields` + lista dinamica carregada de `chat_custom_field_definitions` (cada campo com toggle, default ligado, desligar adiciona key ao array `ws_hidden_custom_fields`)

**Card "Timeline"**: toggle `ws_show_timeline` + select para `ws_timeline_max_events` (5, 10, 20)

**Card "Chats Recentes"**: toggle `ws_show_recent_chats` + select `ws_recent_chats_count`

**Card "IDs Externos"**: toggles existentes

**Card "Comportamento"**: toggle `ws_default_panel_open` + select `ws_sort_order`

### 3. VisitorInfoPanel.tsx
Receber settings (via fetch no AdminWorkspace ou prop). Condicionar cada campo individualmente:
- Secao Empresa: `ws_show_company_info` → sub-campos CNPJ, setor, localização
- Secao Metricas: `ws_show_metrics` → sub Health, MRR, Contrato, NPS, Renovação
- Secao Contato: `ws_show_contact_data` → sub Departamento, Stats
- Campos Customizados: `ws_show_custom_fields` → filtrar por `ws_hidden_custom_fields`
- Timeline: `ws_show_timeline` + limit `ws_timeline_max_events`
- Chats Recentes: `ws_show_recent_chats` + `ws_recent_chats_count`

### 4. AdminWorkspace.tsx
Fetch `chat_settings` e passar como prop para VisitorInfoPanel. Respeitar `ws_default_panel_open`.

## Arquivos impactados

1. **Nova migration SQL** — 14 colunas adicionais em `chat_settings`
2. `src/components/chat/WorkspaceDisplayTab.tsx` — UI granular com sub-toggles e lista dinamica de custom fields
3. `src/components/chat/VisitorInfoPanel.tsx` — condicionar cada campo via settings
4. `src/pages/AdminWorkspace.tsx` — fetch settings + passar como props

