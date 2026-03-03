
# Suporte a Arrays e Tipos Complexos nos Campos Customizaveis

## Resumo

Adicionar novos tipos de campo (`list`, `list_url`, `list_object`) ao sistema de campos customizaveis, e atualizar toda a cadeia de exibicao para renderizar arrays de forma inteligente (listas, listas de links, tabelas de objetos).

## 1. Novos tipos de campo

Adicionar ao array `FIELD_TYPES` em `CustomFieldDefinitionsTab.tsx`:

| Tipo | Label | Descricao | Exemplo de valor |
|------|-------|-----------|------------------|
| `list` | Lista | Array de valores simples (strings/numeros) | `["Item A", "Item B"]` |
| `list_url` | Lista de Links | Array de URLs | `["https://a.com", "https://b.com"]` |
| `list_object` | Lista de Objetos | Array de objetos com propriedades | `[{"Titulo":"X","Link":"...","Status":"Ativo"}]` |
| `json` | JSON / Objeto | Objeto simples chave-valor | `{"chave": "valor"}` |

Nenhuma alteracao de banco e necessaria - o campo `field_type` ja e `text` livre.

## 2. Renderizacao inteligente em `CustomFieldsDisplay.tsx`

Atualizar `formatFieldValue` para detectar e renderizar arrays:

**Lista simples (`list`)**: Renderizar como `<ul>` com bullets, cada item em uma linha.

**Lista de URLs (`list_url`)**: Renderizar como lista vertical de links clicaveis com icone `ExternalLink`.

**Lista de objetos (`list_object`)**: Renderizar como mini-tabela ou cards empilhados. Cada objeto mostra suas propriedades como pares label/valor. Valores que parecem URLs sao automaticamente clicaveis. Exemplo visual:

```text
+----------------------------------+
| Titulo: Relatorio Q1             |
| Link: relatorio.com/q1  [click]  |
| Status: Ativo                    |
+----------------------------------+
| Titulo: Relatorio Q2             |
| Link: relatorio.com/q2  [click]  |
| Status: Pendente                 |
+----------------------------------+
```

**JSON / Objeto (`json`)**: Renderizar propriedades como pares chave/valor empilhados.

**Auto-deteccao**: Se o tipo declarado e `text` mas o valor recebido for um array, aplicar heuristica automatica:
- Array de strings simples -> renderizar como lista
- Array de objetos -> renderizar como lista de objetos
- Objeto simples -> renderizar como JSON

## 3. Renderizacao em `VisitorInfoPanel.tsx`

Atualizar `CustomFieldRow` para suportar os mesmos tipos. Quando o valor for array/objeto, o layout muda de `flex items-center justify-between` (label | valor inline) para layout vertical (label em cima, conteudo expandido em baixo).

## 4. Layout adaptativo

Campos escalares (text, decimal, integer, boolean, url, date) mantem o layout horizontal atual:
```text
Label .............. Valor
```

Campos complexos (list, list_url, list_object, json) usam layout vertical:
```text
Label
  - Item 1
  - Item 2
  - Item 3
```

## 5. Descricao no dialog de definicao

Adicionar uma `<p>` descritiva abaixo do select de tipo quando um tipo de array for selecionado, explicando o formato esperado do payload JSON.

---

## Detalhes tecnicos

### Arquivo: `src/components/chat/CustomFieldDefinitionsTab.tsx`
- Adicionar 4 novos itens ao array `FIELD_TYPES`: `list`, `list_url`, `list_object`, `json`
- Adicionar texto de ajuda contextual no dialog quando tipo array/json selecionado

### Arquivo: `src/components/CustomFieldsDisplay.tsx`
- Extrair nova funcao `formatComplexValue(value, fieldType)` que lida com arrays e objetos
- Criar componentes internos: `SimpleList`, `UrlList`, `ObjectList`, `JsonDisplay`
- `SimpleList`: `<ul>` com `<li>` para cada item
- `UrlList`: lista vertical com links clicaveis e icone
- `ObjectList`: cards empilhados com bordas sutis, cada propriedade do objeto como par chave/valor. URLs auto-detectadas sao clicaveis
- `JsonDisplay`: grid de pares chave/valor
- Atualizar `formatFieldValue` para delegar para `formatComplexValue` quando o valor for array/objeto
- Atualizar layout do `CustomFieldsDisplay` para usar layout vertical quando campo e complexo
- Aplicar mesma logica no `CustomFieldsInline`

### Arquivo: `src/components/chat/VisitorInfoPanel.tsx`
- Atualizar `CustomFieldRow` para detectar se o valor e array/objeto
- Se complexo, mudar para layout `flex-col` ao inves de `flex justify-between`
- Reutilizar os mesmos sub-componentes (`SimpleList`, `UrlList`, `ObjectList`) criados em `CustomFieldsDisplay.tsx` exportando-os

### Arquivos impactados:
1. `src/components/chat/CustomFieldDefinitionsTab.tsx` - novos tipos
2. `src/components/CustomFieldsDisplay.tsx` - renderizacao complexa
3. `src/components/chat/VisitorInfoPanel.tsx` - renderizacao no painel lateral
