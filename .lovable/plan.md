

# Macros Privadas vs Publicas

## Resumo

Adicionar um campo `is_private` na tabela `chat_macros` para distinguir macros pessoais (visíveis apenas ao criador) de macros públicas (visíveis a todo o tenant). A criação/edição de macros ganha um toggle "Macro particular" no dialog. A listagem no admin e no workspace filtra de acordo.

## Mudancas

### 1. Migration SQL - Adicionar coluna `is_private`

```sql
ALTER TABLE public.chat_macros ADD COLUMN is_private boolean NOT NULL DEFAULT false;
```

Nenhuma mudanca de RLS necessaria - a politica atual ja filtra por tenant. A filtragem privada sera feita no codigo (queries com filtro `user_id` ou `is_private = false`).

### 2. `src/pages/AdminSettings.tsx` - CRUD de macros

- Adicionar campo `is_private` ao `macroForm` state (default: `false`)
- No dialog de criacao/edicao, adicionar um Switch/Checkbox "Macro particular" com descricao "Visível apenas para você"
- No `saveMacro`, incluir `is_private` no insert/update
- Na query `fetchAll`, buscar tambem `is_private` e `user_id`
- Na listagem de macros, mostrar badge "Particular" ou "Publica" em cada macro
- Filtrar: mostrar macros publicas do tenant + macros privadas apenas do usuario logado
- Alterar a query para: `.or('is_private.eq.false,user_id.eq.{userId}')` apos obter o userId da sessao

### 3. `src/components/chat/ChatInput.tsx` - Macros no workspace

- Alterar a query de macros para filtrar: macros publicas do tenant + macros privadas do usuario logado
- Obter o `userId` da sessao via `supabase.auth.getSession()`
- Query: `.or('is_private.eq.false,user_id.eq.{userId}')`

### 4. Interface do Macro (tipo)

Na Macro interface dos dois arquivos, adicionar `is_private?: boolean` e `user_id?: string`.

## Detalhes tecnicos

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | `ALTER TABLE chat_macros ADD COLUMN is_private boolean NOT NULL DEFAULT false` |
| `AdminSettings.tsx` | Toggle no dialog, filtro na query, badge na listagem |
| `ChatInput.tsx` | Filtro na query de macros |

Macros existentes terao `is_private = false` (publicas) por default, mantendo compatibilidade retroativa.

