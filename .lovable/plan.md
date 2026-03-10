

## Plano: Preview e sync de empresas nas regras de segmentação do banner

### Contexto

O `CategoryFieldRules` possui um fluxo completo: staging de regras, preview de empresas afetadas por regra, e ao salvar, sincroniza (cria/remove) vínculos das empresas com a categoria. O `BannerFieldRules` já tem staging e preview por regra individual, mas **falta**:

1. Um resumo consolidado de **todas** as empresas que serão afetadas (considerando todas as regras juntas, AND logic)
2. A criação imediata de `chat_banner_assignments` ao salvar (sync), para que empresas já existentes recebam o banner na hora — não só em runtime via `get-visitor-banners`
3. Indicação visual de quais empresas são **novas** (serão adicionadas) vs. já estão vinculadas

### Alterações

#### 1. `BannerFieldRules.tsx` — adicionar preview consolidado e sync

- Após salvar regras, buscar todas as empresas que atendem **todas** as regras (AND logic, igual ao `get-visitor-banners`)
- Comparar com `chat_banner_assignments` existentes para o banner
- Mostrar no dialog, antes do botão salvar:
  - Total de empresas que correspondem às regras finais
  - Lista das empresas com indicação visual: existentes (check), novas a serem adicionadas (badge verde), removidas (riscadas)
- Ao salvar: além de persistir as regras, criar `chat_banner_assignments` para empresas que passaram a corresponder e ainda não têm assignment
- Botão "Pré-visualizar empresas" que executa o match sem salvar

#### 2. Fluxo detalhado do preview

```text
[Usuário configura regras no staging]
        ↓
[Clica "Pré-visualizar"]
        ↓
[Busca contacts is_company=true + assignments existentes]
        ↓
[Aplica TODAS as regras (AND) sobre contacts]
        ↓
[Mostra: X empresas correspondem]
  ├── Y já possuem assignment (ícone check)
  ├── Z serão adicionadas (badge "Nova")
  └── W serão removidas (se regras removidas excluem empresas)
        ↓
[Clica "Salvar alterações"]
        ↓
[Persiste regras + cria assignments faltantes em batch]
```

#### 3. Código — `BannerFieldRules.tsx`

- Adicionar estado `previewResult: { existing: MatchedCompany[], toAdd: MatchedCompany[], toRemove: MatchedCompany[] } | null`
- Função `handlePreview()`:
  - Busca todos os contacts (is_company=true) com campos necessários
  - Combina regras existentes (menos removidas) + staged adds
  - Aplica AND de todas as regras
  - Busca assignments existentes para o banner
  - Calcula diff: existentes, novas, removidas
- Botão "Pré-visualizar empresas" entre as regras e o footer
- Seção de preview com ScrollArea mostrando a lista categorizada
- No `handleSaveAll`: após salvar regras, criar assignments em batch para empresas novas

#### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/chat/BannerFieldRules.tsx` | Preview consolidado, sync de assignments, botão pré-visualizar |

Nenhuma migration necessária — usa tabelas existentes (`chat_banner_assignments`, `contacts`, `chat_banner_field_rules`).

