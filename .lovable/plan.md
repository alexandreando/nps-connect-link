

## Plano: Corrigir layout de banners no embed + preview admin

### Problema

Banners com conteúdo HTML rico (links longos, tags `<p>`, `<strong>`) quebram o layout no script de embed, expandindo horizontalmente além da viewport.

### Alterações

#### 1. `public/nps-chat-embed.js` — `renderBanner()`

**Container principal** (linha 89-94):
- Adicionar `overflow:hidden;box-sizing:border-box;max-width:100vw;`

**Content div** (linha 119):
- Adicionar `max-width:100%;overflow:hidden;min-width:0;`

**Texto span** (linha 128-129):
- Trocar `display:block;max-height:3em;` por `display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;`
- Adicionar `min-width:0;overflow-wrap:break-word;word-break:break-word;`

**Sanitização de HTML rico**:
- Após `text.innerHTML = banner.content_html`, percorrer `<a>` tags dentro e aplicar `word-break:break-all` inline para URLs longas não estourarem

#### 2. `src/components/chat/BannerPreview.tsx`

- No span de `contentHtml` (linha 113-117): adicionar classes `min-w-0 overflow-hidden` e trocar `maxHeight:"3em"` por line-clamp via Tailwind (`line-clamp-3`)
- No span de texto plano (linha 119): adicionar `min-w-0 overflow-hidden`

#### 3. Correção retroativa de banners já publicados

Como o script de embed é servido como arquivo estático (`public/nps-chat-embed.js`), a correção no código do script **já é retroativa** — todos os sites que carregam o embed via `<script src="...nps-chat-embed.js">` receberão automaticamente a versão corrigida na próxima vez que a página for carregada (ou após cache expirar). Não é necessária migration nem atualização de dados, pois o problema é puramente de renderização no client-side.

Para garantir que o cache não impeça a correção:
- Adicionar query string de versão no script tag documentado: `nps-chat-embed.js?v=2` (documentação/exemplo)
- No `BannerRichEditor.tsx` ou no save do banner: sanitizar `content_html` para adicionar `style="word-break:break-all"` em tags `<a>` no momento da persistência, prevenindo o problema na fonte

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `public/nps-chat-embed.js` | Overflow, line-clamp, word-break no renderBanner |
| `src/components/chat/BannerPreview.tsx` | min-w-0, line-clamp, overflow no preview |
| `src/components/chat/BannerRichEditor.tsx` | Sanitizar links no HTML ao salvar (word-break) |

