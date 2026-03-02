

# Redesign da Tela de Permissoes

## Visao Geral

Refazer o `UserPermissionsDialog` com melhor UX/UI, adicionar permissoes faltantes, perfis pre-configurados e opcao de copiar permissoes de outro usuario.

## 1. Permissoes Faltantes a Adicionar

Itens que existem no sidebar mas nao estao no `PERMISSION_TREE`:

| Modulo | Key | Descricao |
|--------|-----|-----------|
| CS | `cs.dashboard` | Dashboard CS (visao geral) |
| CS | `cs.csms` | Gestao de CSMs |
| Chat | `chat.settings.custom_fields` | Campos personalizados do chat |
| Chat | `chat.settings.auto_rules` | Regras automaticas |
| Chat | `chat.settings.business_hours` | Horario comercial |
| Chat | `chat.settings.assignment` | Config de distribuicao |
| Help | `help.overview` | Dashboard do Help Center |

## 2. Perfis Pre-Configurados

Adicionar um select/dropdown no topo da secao de permissoes com perfis prontos:

| Perfil | Descricao | Permissoes |
|--------|-----------|------------|
| **Administrador** | Acesso total | Liga admin toggle |
| **Gerente CS** | CS completo + NPS + Contatos + Relatorios | Todos os modulos CS, NPS, Contatos com view/edit/manage |
| **Atendente Chat** | Workspace + historico + macros | Chat workspace, history, macros, banners (view) |
| **Analista NPS** | Dashboard + campanhas (sem settings) | NPS dashboard e campaigns (view/edit) |
| **Visualizador** | Somente leitura em tudo | can_view em todos os modulos |
| **Personalizado** | Nenhuma pre-selecao | Estado atual / manual |

Ao selecionar um perfil, as permissoes sao carregadas automaticamente nos toggles abaixo. O usuario pode ajustar antes de salvar.

## 3. Copiar Permissoes de Outro Usuario

Adicionar um botao "Copiar de outro usuario" que abre um dropdown/popover com a lista de membros do tenant. Ao selecionar, carrega as permissoes daquele usuario (incluindo admin toggle) para o formulario atual, permitindo ajuste antes de salvar.

## 4. Redesign do Layout

### Estrutura do Dialog (agora `Sheet` lateral ou Dialog maior)

```text
+--------------------------------------------------+
| [Avatar] Nome do usuario                          |
| email@empresa.com                                 |
+--------------------------------------------------+
| [Admin Toggle]  [Perfil: Dropdown v]  [Copiar v]  |
+--------------------------------------------------+
| Informacoes CS (collapsible, mais compacto)       |
| Telefone | Departamento | Especialidades          |
+--------------------------------------------------+
| Permissoes por Modulo                              |
|                                                    |
| Header: Modulo | Ver | Editar | Excluir | Gerenc. |
|                                                    |
| [CS]  ============================================ |
|   Dashboard CS        [x]                          |
|   Kanban              [x] [x]                      |
|   Trilhas             [x] [x] [x]                  |
|   ...                                              |
|                                                    |
| [NPS] ============================================ |
|   ...                                              |
+--------------------------------------------------+
| [Cancelar]                           [Salvar]      |
+--------------------------------------------------+
```

### Melhorias de UI/UX

- **Dialog mais largo**: `sm:max-w-3xl` para dar mais espaco
- **Secao CS collapsible**: os campos de telefone/departamento/especialidades ficam em um collapsible para nao poluir
- **Barra de acoes no topo**: Admin toggle, dropdown de perfil e botao copiar lado a lado em uma faixa visual destacada
- **Tabela de permissoes mais limpa**: remover o accordion e usar uma tabela flat com separadores visuais por grupo (header colorido por modulo). Isso melhora a escaneabilidade
- **Indicador visual por grupo**: icone + cor sutil no header de cada grupo
- **Switch menores e alinhados**: manter scale-75 mas com grid mais limpo
- **Scroll interno**: area de permissoes com scroll independente para manter header/footer sempre visiveis
- **Badge de perfil selecionado**: mostrar qual perfil esta ativo (ou "Personalizado" se foi editado manualmente)

## 5. Mudancas por Arquivo

| Arquivo | Mudanca |
|---------|---------|
| `src/components/UserPermissionsDialog.tsx` | Redesign completo: novo layout, perfis, copiar usuario, permissoes faltantes |
| `src/locales/pt-BR.ts` | Labels para novos modulos e perfis |
| `src/locales/en.ts` | Labels para novos modulos e perfis |

## 6. Detalhes Tecnicos

### Perfis pre-configurados
- Definidos como constante `PRESET_PROFILES` no componente
- Cada perfil e um mapa de `module -> { can_view, can_edit, can_delete, can_manage }`
- Ao selecionar, popula o state `permissions` e `isAdminToggle`
- Qualquer alteracao manual muda o label do perfil para "Personalizado"

### Copiar permissoes
- Busca `user_permissions` + `user_roles` do usuario selecionado
- Carrega no formulario atual sem salvar (usuario pode ajustar)
- Lista de usuarios vem de `user_profiles` do mesmo tenant (excluindo o usuario sendo editado)

### Sem mudancas de banco
- Nenhuma migration necessaria. As novas keys de permissao serao salvas na tabela `user_permissions` existente (campo `module` ja e texto livre)

