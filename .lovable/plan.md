

## Plano: Limite de 80 chars, banner ajustado, tipo Página, renomear para Outbound

Este plano cobre 4 frentes: limitação de caracteres no conteúdo do banner, ajuste de largura do banner flutuante, novo tipo "Página" (HTML rico + imagem), e renomeação do menu para "Outbound".

---

### 1. Limite de 80 caracteres por linha no conteúdo do banner

**Editor (`BannerRichEditor.tsx`)**: Adicionar validação visual — exibir contador de caracteres restantes abaixo do editor. Limitar o texto plano a 160 chars total (2 linhas × 80). Mostrar aviso vermelho se ultrapassar.

**Preview (`BannerPreview.tsx`)**: Aplicar `max-width: 80ch` no span de texto do banner + `line-clamp-2` para garantir 2 linhas máximas. Quando `isFloating`, ajustar o container para `width: fit-content` com `max-width: 80ch` + padding, eliminando o espaço vazio lateral.

**Embed (`nps-chat-embed.js`)**: Mesmo tratamento — `max-width:80ch`, `line-clamp:2`, e no modo flutuante `width:fit-content;max-width:calc(80ch + 80px);margin:12px auto`.

**Form (`AdminBanners.tsx`)**: Mostrar `{form.content.length}/160` abaixo do editor com cor condicional. Informar "Máximo 80 caracteres por linha (2 linhas)".

---

### 2. Banner flutuante com largura ajustada ao conteúdo

**Preview**: Trocar `max-w-lg` fixo por `w-fit max-w-[calc(80ch+5rem)]` no container do banner flutuante. Manter `mx-auto` para centralizar.

**Embed**: No modo flutuante, aplicar `width:fit-content;max-width:calc(80ch + 80px);margin:12px auto` no div do banner.

---

### 3. Novo tipo "Página" (page)

**Database**: Adicionar migration:
- `ALTER TABLE chat_banners ADD COLUMN page_html text DEFAULT NULL`
- `ALTER TABLE chat_banners ADD COLUMN outbound_type text NOT NULL DEFAULT 'banner'` — valores: `banner`, `page`

**AdminBanners.tsx**:
- Adicionar seletor de tipo no topo do formulário: "Banner" ou "Página"
- Quando tipo = "page": esconder campos de banner (variante, flutuante, voting, decorações) e mostrar editor HTML completo com TipTap (já instalado no projeto) + upload de imagem (usar bucket `help-images` existente)
- Na listagem, exibir badge "Banner" ou "Página" ao lado do status
- O campo `page_html` armazena o HTML da página

**Edge function (`get-visitor-banners`)**: Incluir `outbound_type` e `page_html` no SELECT e no resultado. O embed renderiza de forma diferente se `outbound_type === 'page'`.

**Embed (`nps-chat-embed.js`)**: Para tipo `page`, renderizar como modal/overlay (não como banner top) com o HTML da página, botão de fechar, e `max-width:480px`. Disparar dismiss ao fechar.

---

### 4. Renomear menu para "Outbound"

**Sidebar (`AppSidebar.tsx`)**: Trocar label do item de menu de `t("banners.title")` para `t("outbound.title")`.

**Locales (`pt-BR.ts` e `en.ts`)**: Adicionar:
- `"outbound.title": "Outbound"`
- `"outbound.subtitle": "Gerencie banners e páginas exibidos para seus clientes"`

**PageHeader**: Atualizar título e subtítulo no `AdminBanners.tsx` para usar `outbound.title` / `outbound.subtitle`.

**Rota**: Manter `/admin/banners` como path (evita breaking change).

---

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBanners.tsx` | Seletor banner/page, limite chars, form page com TipTap, badges na listagem, título Outbound |
| `src/components/chat/BannerPreview.tsx` | `max-width:80ch`, `line-clamp-2`, `width:fit-content` flutuante |
| `src/components/chat/BannerRichEditor.tsx` | Contador de caracteres 160 max |
| `public/nps-chat-embed.js` | `max-width:80ch`, largura fit-content flutuante, renderização modal para pages |
| `supabase/functions/get-visitor-banners/index.ts` | Retornar `outbound_type`, `page_html` |
| `src/components/AppSidebar.tsx` | Label → `outbound.title` |
| `src/locales/pt-BR.ts` + `src/locales/en.ts` | Novas chaves outbound |
| Migration SQL | `page_html text`, `outbound_type text` na `chat_banners` |

