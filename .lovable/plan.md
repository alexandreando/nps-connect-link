

# Fix: Protecao Contra Sobrescrita com Valores Vazios + Fila de Updates + Token Fallback

## Problema

Tres problemas combinados:

1. **Valores vazios sobrescrevem dados existentes**: Quando o payload envia `null`, `""`, `0` ou `[]` para um campo que ja tem valor no banco, o valor e apagado. O correto e ignorar envios vazios -- so atualizar quando o novo valor e diferente E nao-vazio.

2. **Race condition no reload**: `NPSChat.update()` dispara antes de `resolveVisitor()` completar, causando perda de identidade e dados.

3. **Sem fallback por token**: Se `name`/`email` estao ausentes no payload, o resolver nao consegue identificar o visitante mesmo tendo o `visitor_token` salvo no localStorage.

---

## Fix 1: Ignorar valores vazios em `applyCustomData` e `findOrCreateVisitor`

### Arquivo: `supabase/functions/resolve-chat-visitor/index.ts`

Criar funcao auxiliar `isEmptyValue(val)` que retorna `true` para `null`, `undefined`, `""`, arrays vazios `[]` e objetos vazios `{}`.

**Em `applyCustomData`** (linha 499-508): Antes de adicionar ao `directUpdate` ou `customUpdate`, verificar se o valor NAO e vazio. Se for vazio, ignorar silenciosamente (nao sobrescrever o campo existente).

```text
// Antes:
directUpdate[mapsTo] = val;

// Depois:
if (!isEmptyValue(val)) {
  directUpdate[mapsTo] = val;
}
```

Mesma logica para `customUpdate`. Alem disso, ao fazer merge de `custom_fields`, so sobrescrever chaves cujo novo valor nao seja vazio.

**Em `findOrCreateVisitor`** (linhas 349-355): Aplicar mesma logica -- so incluir `metadata` se `customData` tiver pelo menos uma chave com valor nao-vazio. Nao sobrescrever `phone` com valor vazio.

**Na atualizacao de `company_contacts`** (linhas 187-190): Ja esta correto (so atualiza se valor e truthy e diferente). Manter como esta.

## Fix 2: Fila de updates pendentes no embed

### Arquivo: `public/nps-chat-embed.js`

- Adicionar `resolverReady = false` e `pendingUpdates = []`
- No `NPSChat.update()`: se `resolverReady` for false, acumular em `pendingUpdates` e retornar sem chamar o resolver
- Apos `resolveVisitor()` completar com sucesso: setar `resolverReady = true` e processar todos os `pendingUpdates` em uma unica chamada ao resolver (merge de todos os props acumulados)
- Incluir `visitor_token` do localStorage no payload quando disponivel

## Fix 3: Resolver aceita `visitor_token` como fallback

### Arquivo: `supabase/functions/resolve-chat-visitor/index.ts`

Na branch `!external_id` (linha 91), apos o bloco `if (name && email)`, adicionar:

```text
// Se visitor_token fornecido, identificar por token
if (visitor_token) {
  buscar chat_visitors pelo token
  se encontrar e tiver contact_id:
    aplicar custom_data no contact
    upsert company se necessario
    retornar visitor_token + IDs
}
```

Isso permite que updates enviados com token (mas sem name/email) ainda consigam persistir dados.

---

## Detalhes tecnicos

### Funcao `isEmptyValue` (nova, no resolver)
```text
function isEmptyValue(val: any): boolean {
  if (val === null || val === undefined || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0) return true;
  return false;
}
```

Nota: `0` NAO e considerado vazio (e um valor numerico valido, ex: mrr=0 e um valor real).

### Arquivo: `supabase/functions/resolve-chat-visitor/index.ts`
- Adicionar `visitor_token` ao destructuring do body (linha 16)
- Adicionar funcao `isEmptyValue`
- Modificar `applyCustomData` para filtrar valores vazios antes de persistir
- Modificar `findOrCreateVisitor` para filtrar metadata vazia
- Adicionar branch `visitor_token` na secao `!external_id`

### Arquivo: `public/nps-chat-embed.js`
- Adicionar variaveis `resolverReady` e `pendingUpdates`
- Modificar `update()` para enfileirar quando nao pronto
- Modificar callback de `resolveVisitor()` para processar fila
- Incluir `visitor_token` salvo no payload do resolver

### Arquivos impactados:
1. `supabase/functions/resolve-chat-visitor/index.ts`
2. `public/nps-chat-embed.js`

