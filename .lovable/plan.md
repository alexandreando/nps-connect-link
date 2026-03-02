

# Correcao do Slug do Tenant + Validacao

## Problema

Ao tentar trocar o slug do tenant na aba de Organizacao, o banco retorna erro `23505` (unique constraint `tenants_slug_key`) porque:
1. O campo nao aplica slugify automatico (o usuario pode digitar qualquer coisa)
2. Nao ha validacao previa de unicidade antes de salvar
3. O erro bruto do banco e exibido ao usuario sem tratamento amigavel

## Solucao

### 1. OrganizationSettingsTab.tsx - Validacao e UX

- Importar a funcao `slugify` de `src/utils/helpSlug.ts` (ja existe no projeto)
- Aplicar `slugify` automaticamente ao valor do input de slug (on change ou on blur)
- Antes de salvar, verificar unicidade: query `tenants` onde `slug = novoSlug` e `id != tenantId`
- Se slug duplicado, mostrar toast amigavel: "Este slug ja esta em uso por outra organizacao"
- Se slug vazio, permitir salvar como `null`
- Adicionar texto auxiliar explicando que o slug e usado nas URLs publicas do Help Center

### 2. Locais que usam o tenant slug (auditoria)

Todos os locais abaixo leem o slug **dinamicamente do banco** a cada carregamento, entao trocar o slug na tabela `tenants` propaga automaticamente:

| Arquivo | Uso |
|---------|-----|
| `src/pages/HelpPublicHome.tsx` | Resolve tenant por slug na URL `/:tenantSlug/help` |
| `src/pages/HelpPublicCollection.tsx` | Resolve tenant por slug na URL `/:tenantSlug/help/c/:slug` |
| `src/pages/HelpPublicArticle.tsx` | Resolve tenant por slug na URL `/:tenantSlug/help/a/:slug` |
| `src/pages/HelpArticles.tsx` | Busca slug para montar link publico e copiar URL |
| `src/components/chat/ChatInput.tsx` | Busca slug para montar URL do artigo ao enviar no chat |
| `src/App.tsx` | Rotas `/:tenantSlug/help/*` (parametro dinamico, sem hardcode) |

**Unico ponto de atencao:** Mensagens de chat ja enviadas com `message_type: "help_article"` tem o slug antigo salvo em `metadata.article_url` e `metadata.tenant_slug`. Essas URLs antigas vao quebrar. Para resolver:
- No **ChatWidget.tsx** e **ChatMessageList.tsx**, ao renderizar cards de artigos, reconstruir a URL usando o slug atual do artigo (buscar do banco) em vez de confiar na URL salva na metadata. Alternativa mais simples: as paginas publicas do Help Center ja fazem fallback por `article_id` ou `article_slug` sem depender do tenant slug, entao os links antigos simplesmente redirecionam.

### 3. Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/OrganizationSettingsTab.tsx` | Slugify automatico, validacao de unicidade, erro amigavel, texto auxiliar |
| `src/locales/pt-BR.ts` | Labels: slug em uso, descricao do slug |
| `src/locales/en.ts` | Labels em ingles |

### 4. Detalhes tecnicos

**Validacao pre-save:**
```typescript
// Slugify
const finalSlug = slug ? slugify(slug) : null;

// Check uniqueness
if (finalSlug) {
  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", finalSlug)
    .neq("id", tenantId)
    .maybeSingle();

  if (existing) {
    toast({ title: "Erro", description: t("organization.slugInUse"), variant: "destructive" });
    return;
  }
}

await supabase.from("tenants").update({ name, slug: finalSlug }).eq("id", tenantId);
```

**Input com slugify on blur:**
```typescript
<Input
  value={slug}
  onChange={(e) => setSlug(e.target.value)}
  onBlur={() => setSlug(slug ? slugify(slug) : "")}
/>
<p className="text-xs text-muted-foreground mt-1">
  {t("organization.slugDescription")}
</p>
```

