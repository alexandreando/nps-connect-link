

# Help Center Publico - Design Configuravel Completo

## Visao Geral

Tornar o Help Center publico altamente customizavel pelo admin, com campos dedicados para hero (imagem de fundo, altura), header (logo, links de navegacao, cor de fundo), rodape (logo, texto, links, redes sociais), e favicon. Tudo salvo na tabela `help_site_settings` (novas colunas) e consumido pelas paginas publicas com tema claro forcado e design moderno.

## 1. Novas Colunas na `help_site_settings`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `hero_image_url` | text | Imagem de fundo do hero na home |
| `hero_overlay_opacity` | int (0-100) | Opacidade do overlay sobre a imagem |
| `favicon_url` | text | Favicon customizado |
| `header_bg_color` | text | Cor de fundo do header (default: branco) |
| `header_links_json` | jsonb | Links de navegacao no header, ex: `[{"label":"Site","url":"https://..."}]` |
| `footer_logo_url` | text | Logo separado para o rodape |
| `footer_text` | text | Texto simples do rodape (ex: copyright) |
| `footer_links_json` | jsonb | Links do rodape, ex: `[{"label":"Termos","url":"/termos"}]` |
| `footer_social_json` | jsonb | Redes sociais, ex: `[{"type":"linkedin","url":"https://..."}]` |
| `footer_bg_color` | text | Cor de fundo do rodape |

Migration simples com `ALTER TABLE help_site_settings ADD COLUMN ... DEFAULT NULL`.

## 2. Pagina de Configuracoes (`HelpSettings.tsx`) - Novas Secoes

Adicionar novos cards ao formulario admin:

### Card "Hero"
- Campo URL da imagem de fundo
- Slider de opacidade do overlay (0-100)
- Preview em miniatura da imagem

### Card "Header"
- Cor de fundo do header (color picker + input)
- Links de navegacao: editor simples de lista (label + URL) com botao adicionar/remover

### Card "Rodape"
- Logo do rodape (URL)
- Texto do rodape (input simples, ex: "(c) 2025 Empresa")
- Cor de fundo do rodape (color picker)
- Links do rodape: editor de lista (label + URL)
- Redes sociais: editor de lista (tipo dropdown: linkedin/twitter/instagram/facebook/youtube + URL)

### Card "Avancado"
- Favicon URL
- Custom CSS (ja existe, manter)

## 3. Layout Publico Compartilhado (`HelpPublicLayout.tsx`)

Novo componente wrapper usado por Home, Collection e Article. Recebe os settings e renderiza:

### Header
```text
+--------------------------------------------------+
| [Logo]    Central de Ajuda    [Link1] [Link2] ... |
+--------------------------------------------------+
```
- Fundo configuravel (`header_bg_color` ou branco)
- Logo do tenant (`brand_logo_url`)
- Titulo clicavel (volta pra home)
- Links de navegacao do `header_links_json`
- Barra de busca compacta (icone que expande)

### Footer
```text
+--------------------------------------------------+
| [Footer Logo]                                      |
| Texto do rodape                                    |
| [Link1] [Link2] [Link3]                           |
| [LinkedIn] [Twitter] [Instagram]                   |
+--------------------------------------------------+
```
- Fundo configuravel (`footer_bg_color` ou `gray-900`)
- Logo, texto, links e icones de redes sociais
- Fallback: se nada configurado, mostra footer minimo com "Powered by Journey"

### Tema Claro Forcado
- Wrapper raiz com classe `light`
- Todas as cores explicitas: `bg-white`, `text-gray-900`, `border-gray-200`, etc.
- Nenhuma referencia a `bg-background` ou `text-foreground`

## 4. Redesign das Paginas Publicas

### Home (`HelpPublicHome.tsx`)
- **Hero**: Se `hero_image_url` configurado, mostra como background-image com overlay semitransparente na cor primaria. Senao, gradiente suave como hoje
- Busca centralizada com sombra e cantos arredondados
- Grid de colecoes com cards elevados (shadow, hover com scale sutil)
- Artigos recentes com icone FileText e seta ChevronRight

### Collection (`HelpPublicCollection.tsx`)
- Usa `HelpPublicLayout` (header + footer)
- Breadcrumb com estilo polido (separadores chevron, hover underline)
- Cards de artigo com hover bg-gray-50 e seta indicando navegacao

### Article (`HelpPublicArticle.tsx`)
- Usa `HelpPublicLayout` (header + footer)
- Breadcrumb polido
- `prose` sem `dark:prose-invert` (sempre claro)
- Remover classe `dark:prose-invert` do `dangerouslySetInnerHTML`

## 5. CSS para Conteudo de Artigos (`index.css`)

Atualizar `.help-article-content` para usar cores fixas:
- Borders: `#e5e7eb` (gray-200)
- Code blocks bg: `#f9fafb` (gray-50)
- Blockquote border: cor primaria
- Links: cor primaria do tenant
- Sem heranca de dark mode

## 6. Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Adicionar colunas de hero, header, footer, favicon |
| `src/pages/HelpSettings.tsx` | Novas secoes: Hero, Header, Rodape, Avancado |
| `src/components/help/HelpPublicLayout.tsx` | **NOVO** - Layout compartilhado (header + footer + tema claro) |
| `src/pages/HelpPublicHome.tsx` | Usar layout, hero com imagem, tema claro |
| `src/pages/HelpPublicCollection.tsx` | Usar layout, tema claro |
| `src/pages/HelpPublicArticle.tsx` | Usar layout, prose sem dark, tema claro |
| `src/index.css` | Estilos `.help-article-content` com cores fixas |
| `src/locales/pt-BR.ts` | Labels das novas secoes de config |
| `src/locales/en.ts` | Labels das novas secoes de config |

