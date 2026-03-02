

# Atalho de Artigos do Help Center no Workspace de Chat

## Resumo

Adicionar um botao de atalho no ChatInput do workspace para buscar e inserir artigos do Help Center como mensagens formatadas. No widget do visitante, o artigo sera renderizado como um card visual clicavel (titulo + subtitulo) que abre o artigo em nova aba.

## Arquitetura

O artigo sera enviado como uma mensagem normal com `message_type: "help_article"` e metadata contendo os dados do artigo:

```json
{
  "article_id": "uuid",
  "article_title": "Como configurar...",
  "article_subtitle": "Guia passo a passo para...",
  "article_url": "https://app.com/tenant-slug/help/a/article-slug",
  "article_slug": "article-slug",
  "tenant_slug": "tenant-slug"
}
```

## Mudancas

### 1. ChatInput.tsx - Botao e popup de busca de artigos

- Adicionar novo estado `articlesOpen` e `articles` (lista carregada)
- Adicionar botao com icone `BookOpen` na barra de acoes (ao lado de macros/emoji)
- Ao clicar, abrir popup similar ao de macros com campo de busca (Command/CommandList)
- Buscar artigos publicados do tenant logado: `help_articles` com `status = 'published'`
- Cada item mostra titulo + subtitulo truncado
- Ao selecionar, chamar `onSend` com `message_type: "help_article"` e metadata do artigo
- Precisa do `tenantId` (via useAuth) para filtrar artigos e do `tenant slug` para montar a URL publica

### 2. Atualizar `onSend` signature no ChatInput e AdminWorkspace

- A prop `onSend` ja aceita metadata, mas precisa aceitar tambem `message_type` customizado
- Atualizar a interface ChatInputProps para permitir passar `message_type` opcional
- AdminWorkspace: ao receber `message_type: "help_article"`, inserir a mensagem com `message_type = "help_article"` e a metadata do artigo

### 3. ChatMessageList.tsx - Renderizar card de artigo no workspace

- Detectar `message_type === "help_article"` e `metadata.article_url`
- Renderizar um card estilizado dentro da bolha: icone BookOpen + titulo em negrito + subtitulo + link "Abrir artigo"
- O card sera clicavel e abre em nova aba

### 4. ChatWidget.tsx - Renderizar card visual para o visitante

- Na area de renderizacao de mensagens (linhas ~1463), detectar `message_type === "help_article"`
- Renderizar um card/botao visual bonito com:
  - Icone de artigo (BookOpen ou FileText)
  - Titulo do artigo em negrito
  - Subtitulo em texto secundario
  - Botao "Ler artigo" que abre `metadata.article_url` em `window.open(..., '_blank')`
- Estilo: borda arredondada, fundo suave, hover effect

### 5. Detalhes tecnicos

**Busca de artigos no ChatInput:**
- Query: `help_articles` com join em `help_collections` para contexto
- Filtro: `tenant_id = tenantId` (do useAuth) + `status = 'published'`
- Select: `id, title, subtitle, slug, collection_id`
- Busca client-side por titulo/subtitulo (filtragem no popup)
- Carregar no mount (lazy, ao abrir popup pela primeira vez)

**Montagem da URL publica:**
- Precisa do tenant slug: buscar `tenants.slug` onde `id = tenantId`
- URL: `{origin}/{tenantSlug}/help/a/{articleSlug}`

**Formato da mensagem enviada:**
- `content`: titulo do artigo (fallback textual para contexto)
- `message_type`: `"help_article"`
- `metadata`: `{ article_id, article_title, article_subtitle, article_url, article_slug, tenant_slug }`

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/chat/ChatInput.tsx` | Botao BookOpen + popup de busca de artigos + envio com message_type |
| `src/pages/AdminWorkspace.tsx` | Ajustar handleSendMessage para aceitar message_type da metadata |
| `src/components/chat/ChatMessageList.tsx` | Renderizar card de artigo quando message_type = help_article |
| `src/pages/ChatWidget.tsx` | Renderizar card visual clicavel para o visitante |
| `src/locales/pt-BR.ts` | Labels: buscar artigo, ler artigo, nenhum artigo |
| `src/locales/en.ts` | Labels em ingles |

## UX do popup de artigos

```text
+---------------------------------------------+
| [Buscar artigos...]                         |
+---------------------------------------------+
| BookOpen  Como configurar o widget          |
|           Guia passo a passo para...        |
|-------------------------------------------- |
| BookOpen  Primeiros passos                  |
|           Aprenda a configurar sua conta... |
+---------------------------------------------+
```

Navegacao: setas cima/baixo + Enter para selecionar (mesmo padrao das macros).

## UX do card no widget (visitante)

```text
+---------------------------------------------+
| +-------------------------------------------+|
| | [BookOpen]                                ||
| | **Como configurar o widget**              ||
| | Guia passo a passo para integrar...       ||
| |                                           ||
| | [Ler artigo ->]                           ||
| +-------------------------------------------+|
+---------------------------------------------+
```

Card com borda, fundo claro, hover com sombra, botao que abre em nova aba.

