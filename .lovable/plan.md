

# Fix: Proteção Contra Sobrescrita de Dados Reais por Valores Default (0)

## Diagnostico Confirmado

Analisando os logs do resolver e o banco de dados, identifiquei a causa raiz:

### O que acontece

1. O site do cliente carrega a pagina e chama `NPSChat.update()` **ANTES** da resposta da API estar pronta, enviando **valores default**: `mrr: 0`, `employee_in_contract: 0`, `tickets: []`
2. O resolver recebe esses defaults e os persiste:
   - `mrr: 0` vai para coluna direta (maps_to: "mrr") → sobrescreve o valor real (66.97)
   - `employee_in_contract: 0` vai para custom_fields → sobrescreve o valor real (39)
   - `tickets: []` e filtrado por `isEmptyValue` (array vazio) → dados antigos permanecem (com links truncados tipo "1163" em vez de URLs completas)
3. Quando a API do site retorna os valores corretos (mrr: 66.97, employeeInContract: 39, tickets com URLs), ou a segunda chamada nao acontece, ou usa chaves em camelCase que nao batem com as definicoes (ex: `employeeInContract` vs `employee_in_contract`)

### Evidencia nos logs

```text
Direct update for contact: { mrr: 0, company_document: "24297866000174" }
customUpdate: { employee_in_contract: 0, link_master: "https://..." }
```

O `mrr` chega como `0` (nao 66.97). O `employee_in_contract` chega como `0` (nao 39). E `tickets` nem aparece no customUpdate — foi filtrado como vazio.

## Solucao

### Mudanca 1: Proteger colunas diretas contra downgrade para zero

**Arquivo: `supabase/functions/resolve-chat-visitor/index.ts`**

Em `applyCustomData`, antes de gravar os directUpdates, buscar os valores atuais da coluna. Se o valor existente e diferente de zero/null e o novo valor e `0`, pular o update para essa coluna especifica.

Logica:
```text
// Buscar valores atuais das colunas que serao atualizadas
// Para cada coluna em directUpdate:
//   Se valor_atual != null && valor_atual != 0 && novo_valor == 0
//     → Remover da lista de updates (nao sobrescrever)
//   Senao
//     → Manter o update normalmente
```

Isso protege contra o cenario mais comum (defaults de `0` chegando antes dos dados reais) sem impedir updates genuinos (ex: null → 0, ou 100 → 50).

### Mudanca 2: Mesma protecao para custom_fields numericos

Em `applyCustomData`, ao mesclar custom_fields, verificar se o campo tem tipo numerico (via fieldDefs) e aplicar a mesma logica de protecao: nao sobrescrever valor nao-zero existente com 0.

### Mudanca 3: Adicionar log dos VALORES recebidos (nao so chaves)

Atualmente o log mostra apenas `custom_data_keys`. Adicionar um log que mostra os valores completos do `custom_data` para facilitar debug futuro.

### Mudanca 4: Normalizar camelCase para snake_case no embed

**Arquivo: `public/nps-chat-embed.js`**

Adicionar funcao `camelToSnake()` no `buildResolverPayload()` para converter automaticamente chaves como `employeeInContract` → `employee_in_contract` e `perfilCompany` → `perfil_company`. Isso garante que os dados do API response do cliente casem com as definicoes de campo, mesmo que o cliente envie em camelCase.

---

## Resultado esperado

- `mrr: 0` enviado como default → NAO sobrescreve 66.97 existente
- `employee_in_contract: 0` como default → NAO sobrescreve 39 existente
- Se o cliente enviar o valor correto depois (66.97), o update funciona normalmente (66.97 != 0)
- Chaves camelCase sao convertidas para snake_case automaticamente, garantindo match com field definitions
- Tickets vazios continuam sendo ignorados (isEmptyValue ja cuida disso)

## Arquivos impactados

1. `supabase/functions/resolve-chat-visitor/index.ts` — protecao contra downgrade para zero + logs detalhados
2. `public/nps-chat-embed.js` — normalizacao camelCase → snake_case
