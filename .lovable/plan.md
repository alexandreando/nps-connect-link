

# Redesign do Side Panel do Workspace + Correcao MRR

## 1. Correcao do bug de MRR na integracao

**Problema identificado**: Quando `NPSChat.update({ mrr: 500 })` e chamado, o embed script envia para o `resolve-chat-visitor`, mas ha dois cenarios onde o MRR nao e salvo:

- Cenario A: Na chamada `update()`, se `company_id`/`company_name` nao forem enviados junto, o edge function so chama `applyCustomData` se `contactId` existir (linha 172). Se o contato nao tem `company_id` vinculado, o custom_data e ignorado.
- Cenario B: O `findOrCreateVisitor` salva `customData` como `metadata` no visitor, mas nao propaga os campos `maps_to` para a tabela `contacts`.

**Correcao**: Na funcao `resolve-chat-visitor`, garantir que `applyCustomData` seja chamado em TODOS os cenarios onde `custom_data` existe e um `contactId` e resolvido, incluindo o fluxo sem `external_id` (linhas 99-119).

## 2. Unificacao das abas Contato + Empresa no VisitorInfoPanel

Remover as 3 abas (Contato / Empresa / Timeline) e substituir por um layout unificado com secoes visuais separadas por divisores:

**Layout novo (de cima para baixo)**:

```text
+----------------------------------+
| [Avatar] Nome do Contato         |
| cargo@empresa.com   [Refresh]    |
| +55 11 99999-9999                |
+----------------------------------+
| EMPRESA                          |
| Nome Fantasia (Razao Social)     |
| CNPJ: 12.345.678/0001-90        |
| Setor | Cidade, UF               |
+----------------------------------+
| METRICAS                         |
| [Health 78] [MRR R$500] [NPS 9]  |
| Contrato: R$2.000 | Renov: 15/06 |
+----------------------------------+
| DADOS DO CONTATO                 |
| Depto: Suporte | ExtID: abc123   |
| Sessoes: 12 | CSAT Medio: 4.2    |
+----------------------------------+
| CAMPOS CUSTOMIZADOS              |
| Funcs contratados: 38            |
| Link master: (clicavel)          |
| Perfil: B                        |
+----------------------------------+
| ULTIMOS CHATS                    |
| [card chat 1] [card chat 2] ... |
| [Carregar mais]                  |
+----------------------------------+
| TIMELINE                         |
| (inline, sem aba separada)       |
+----------------------------------+
```

## 3. Links clicaveis em todos os campos

- Atualizar `CustomFieldRow` para detectar URLs em campos do tipo `text` (regex `https?://` ou `www.`) e renderizar como link clicavel
- Campos do tipo `url` ja sao clicaveis, mas melhorar o visual
- E-mails devem ser clicaveis com `mailto:`
- Telefones clicaveis com `tel:`

## 4. Campos ausentes a adicionar

Campos que existem no banco mas nao estao no panel:
- `company_document` (CNPJ) da empresa
- `company_sector` (Setor) da empresa  
- `external_id` do contato (company_contact)
- `renewal_date` (Data de renovacao)
- `contract_value` (Valor do contrato)
- `custom_fields` da empresa (campos custom via JSONB)
- `custom_fields` do company_contact (se houver)

## 5. Redesign visual do panel

**Principios**:
- Remover cards com bordas desnecessarias, usar divisores sutis (border-t)
- Metricas em badges/pills compactos em linha ao inves de grid
- Cores semanticas para Health Score (verde/amarelo/vermelho) com barra de progresso fina
- NPS com badge colorido inline
- Secoes com labels uppercase 10px (usar `SectionLabel` existente)
- Links com hover underline e cor primary
- Scroll area unico para todo o conteudo
- Manter o botao de refresh no header
- Manter o ReadOnlyChatDialog para ver historico de chats
- Links de navegacao para modulos (CS, NPS, Financeiro) mantidos mas com icone menor e hover sutil

---

## Detalhes tecnicos

### Arquivo: `supabase/functions/resolve-chat-visitor/index.ts`
- No fluxo sem `external_id` (linhas 99-119), apos encontrar `existingCC`, chamar `applyCustomData` se `custom_data` existir e `existingCC.company_id` existir
- Carregar `fieldDefs` mesmo quando `external_id` nao existe (mover o fetch de defs para antes do branch)

### Arquivo: `src/components/chat/VisitorInfoPanel.tsx`
- Remover sistema de `Tabs` (3 abas)
- Criar layout sequencial com `ScrollArea` unico
- Secoes: Header, Empresa, Metricas, Dados do Contato, Campos Custom, Ultimos Chats, Timeline
- Tornar email clicavel (`mailto:`), telefone clicavel (`tel:`)
- Atualizar `CustomFieldRow` para auto-detectar URLs em campos texto e renderizar como `<a>`
- Buscar `company_contacts.custom_fields` alem dos dados atuais
- Adicionar `external_id`, `department` do company_contact e `company_document`, `company_sector`, `renewal_date`, `contract_value` da empresa

### Arquivo: `src/components/CustomFieldsDisplay.tsx`
- Na funcao `formatFieldValue`, para tipo `text`, verificar se o valor parece URL e renderizar como link clicavel

