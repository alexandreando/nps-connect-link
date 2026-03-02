

# Redesign da Tabela de Permissoes - Dropdown de Nivel + Rolagem

## Problema Atual

1. **4 switches por linha** e dificil de entender e visualmente poluido
2. **Sem rolagem funcional** - o dialog nao rola e o usuario nao consegue ver todos os modulos

## Solucao

### 1. Substituir switches por um Dropdown de Nivel por Linha

Cada linha (modulo pai e submodulo) tera um unico `Select` com niveis hierarquicos. Cada nivel inclui os anteriores:

| Nivel | can_view | can_edit | can_delete | can_manage |
|-------|----------|----------|------------|------------|
| Nenhum | false | false | false | false |
| Visualizar | true | false | false | false |
| Editar | true | true | false | false |
| Excluir | true | true | true | false |
| Gerenciar | true | true | true | true |

O dropdown so mostra as opcoes relevantes para cada linha (baseado no `actions` do node). Ex: se um submodulo so tem `["view"]`, o dropdown mostra apenas "Nenhum" e "Visualizar".

### 2. Submodulos desabilitados se o pai estiver "Nenhum"

- Se o modulo pai estiver em "Nenhum", todas as linhas filhas ficam desabilitadas (grayed out) e nao e possivel selecionar nivel nelas
- Ao habilitar o pai (qualquer nivel acima de Nenhum), os filhos ficam disponiveis para configuracao

### 3. Corrigir rolagem do Dialog

- Trocar `Dialog` por `Sheet` lateral (`side="right"`) com largura fixa, que tem scroll nativo melhor
- Ou manter o Dialog mas garantir `overflow-y-auto` no corpo interno com `max-h` calculado corretamente
- Adicionar `overflow-y-auto` explicito no container de permissoes em vez de depender do `ScrollArea` do Radix

### Layout Proposto

```text
+--------------------------------------------------+
| [Avatar] Nome do usuario                          |
| email@empresa.com                                 |
+--------------------------------------------------+
| [Admin Toggle]  [Perfil: v]  [Copiar de usuario]  |
+--------------------------------------------------+
| CS Info (collapsible)                              |
+--------------------------------------------------+
| Permissoes                                         |
|                                                    |
| Modulo                              Nivel          |
| ------------------------------------------------- |
| [icon] CS                         [Gerenciar v]    |
|   Dashboard CS                    [Visualizar v]   |
|   Kanban                          [Editar v]       |
|   Trilhas                         [Excluir v]      |
|   ...                                              |
|                                                    |
| [icon] Chat                       [Nenhum v]       |
|   Workspace (desabilitado)        [-- v]           |
|   Historico (desabilitado)        [-- v]           |
|   ...                                              |
+--------------------------------------------------+
| [Cancelar]                           [Salvar]      |
+--------------------------------------------------+
```

## Mudancas Tecnicas

### `src/components/UserPermissionsDialog.tsx`

- **Remover** a grid de 4 switches e a header "Ver | Editar | Excluir | Gerenciar"
- **Adicionar** funcao `getLevel(perm)` que retorna o nivel atual baseado nos booleans
- **Adicionar** funcao `setLevel(module, level)` que seta os booleans corretos
- **Trocar** cada linha por: `Nome do modulo` + `Select` com opcoes de nivel filtradas pelo `actions` do node
- **Logica de pai**: filhos ficam `disabled` quando `getLevel(parentKey) === "none"`
- **Corrigir scroll**: usar `overflow-y-auto` com `max-h-[calc(94vh-280px)]` na area de permissoes, removendo dependencia do ScrollArea para o body principal

### Niveis disponiveis por node

```typescript
function availableLevels(actions: Action[]): Level[] {
  const levels: Level[] = ["none"];
  if (actions.includes("view")) levels.push("view");
  if (actions.includes("edit")) levels.push("edit");
  if (actions.includes("delete")) levels.push("delete");
  if (actions.includes("manage")) levels.push("manage");
  return levels;
}
```

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/UserPermissionsDialog.tsx` | Dropdown de nivel, logica pai/filho, fix scroll |
| `src/locales/pt-BR.ts` | Labels: "Nenhum", "Visualizar", "Editar", "Excluir", "Gerenciar" |
| `src/locales/en.ts` | Labels: "None", "View", "Edit", "Delete", "Manage" |

Nenhuma mudanca de banco de dados necessaria.

