
# Fix: Dados Inconsistentes no Painel do Visitante (MRR, Funcs, Tickets)

## Diagnostico

Apos analise profunda do banco de dados e do codigo, identifiquei **4 problemas combinados**:

### Problema 1: `findOrCreateVisitor` SUBSTITUI metadata em vez de MESCLAR

Quando o resolver e chamado, a funcao `findOrCreateVisitor` (linha 434-438) faz:
```text
updates.metadata = nonEmptyMeta;  // SUBSTITUI TUDO
```
Isso significa que se uma chamada envia `{mrr: 66.97, tickets: [...]}`, as chaves que existiam antes no metadata (como `employee_in_contract`, `link_master`) sao **perdidas**. E se a chamada inicial (sem custom_data) roda, o metadata pode ser substituido por um objeto parcial.

### Problema 2: Valores antigos em `custom_fields` nunca sao limpos

O campo `mrr` tem `maps_to: mrr` na definicao de campo customizado. Isso significa que `applyCustomData` corretamente coloca o valor em `contacts.mrr` (coluna direta). Porem, o valor ANTIGO `mrr: 0` que ja existia em `contacts.custom_fields` nunca foi removido. O mesmo acontece com `employee_in_contract: 0`.

### Problema 3: Display mostra `custom_fields` em duplicidade com metricas

O `VisitorInfoPanel` (linha 509-513) primeiro verifica `visitorMetadata[fd.key]` e depois `companyCustomFields[fd.key]`. Para campos com `maps_to` (como mrr), o valor deveria vir da coluna direta (ja exibido na secao Metricas), mas o display mostra o valor ANTIGO/STALE do `custom_fields` na secao "Campos Customizados".

No caso do MRR:
- Metricas: `company.mrr = 0` → nao exibe (condicao `> 0`)
- Campos Customizados: `custom_fields.mrr = 0` → exibe "R$ 0,00"
- Valor correto enviado: 66.97 → nunca foi persistido corretamente

### Problema 4: Falta de logging no resolver

Sem logs no resolver, e impossivel rastrear exatamente quais valores chegam e quais sao persistidos. Os logs atuais mostram apenas boot/shutdown.

---

## Solucao

### Correcao 1: Mesclar metadata em vez de substituir (`resolve-chat-visitor`)

Na funcao `findOrCreateVisitor`, ao atualizar metadata de visitante existente:

```text
// ANTES (substitui):
updates.metadata = nonEmptyMeta;

// DEPOIS (mescla):
// Buscar metadata atual, mesclar com novos valores nao-vazios
const { data: current } = await supabase
  .from("chat_visitors")
  .select("metadata")
  .eq("id", existing.id)
  .single();
const existingMeta = current?.metadata ?? {};
const merged = { ...existingMeta };
for (const [k, v] of Object.entries(nonEmptyMeta)) {
  if (!isEmptyValue(v)) merged[k] = v;
}
updates.metadata = merged;
```

Isso garante que campos existentes no metadata nao sejam perdidos.

### Correcao 2: Limpar valores stale de `custom_fields` quando `maps_to` existe (`resolve-chat-visitor`)

Na funcao `applyCustomData`, apos mover valores para colunas diretas via `maps_to`, remover essas chaves do `custom_fields`:

```text
// Apos processar directUpdate, coletar chaves que foram para colunas diretas
const keysMovedToDirect = Object.keys(mapsToLookup)
  .filter(key => customData[key] !== undefined && mapsToLookup[key]);

// Ao mesclar custom_fields, remover chaves que agora vivem em colunas diretas
if (keysMovedToDirect.length > 0) {
  for (const k of keysMovedToDirect) {
    delete merged[k];
  }
}
```

### Correcao 3: Display nao exibir campos com `maps_to` na secao de campos customizados (`VisitorInfoPanel`)

Na secao "Campos Customizados" do `VisitorInfoPanel`, filtrar field defs que tem `maps_to` definido, pois esses valores ja sao exibidos na secao "Metricas":

```text
// Filtrar field defs que maps_to existe (exibidos em Metricas)
fieldDefs.forEach((fd) => {
  if (fd.maps_to) return;  // Skip — exibido na secao Metricas
  // ... resto da logica
});
```

Tambem aplicar no visitor metadata (mesma logica).

### Correcao 4: Adicionar logs de diagnostico ao resolver (`resolve-chat-visitor`)

Adicionar `console.log` estrategicos para rastrear:
- O payload recebido (com custom_data)
- O resultado do `applyCustomData` (directUpdate, customUpdate)
- Confirmacao de updates bem-sucedidos

---

## Arquivos Impactados

1. `supabase/functions/resolve-chat-visitor/index.ts` — merge de metadata + limpeza de stale custom_fields + logs
2. `src/components/chat/VisitorInfoPanel.tsx` — filtrar campos com maps_to da secao custom fields
