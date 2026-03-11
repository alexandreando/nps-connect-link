

## Plano: Page como imagem com upload + link clicável + modal elegante

### Problema atual
O tipo "Página" usa um textarea de HTML bruto. Deve ser simplificado para: upload de 1 imagem + campo de link de redirecionamento. No embed, exibe a imagem centralizada como modal light/elegante sem bordas, clicável para o link.

### Alterações

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminBanners.tsx` | Trocar textarea HTML por `ImageUploadField` (bucket `help-images`) + campo de link (`link_url`). Salvar URL da imagem no `page_html`. Instruções: "Recomendado: 600×800px, máx 2MB, PNG/JPG/GIF". Mostrar campo de link abaixo do upload. |
| `public/nps-chat-embed.js` | Reescrever `renderPageModal`: overlay escuro sutil (`rgba(0,0,0,0.45)`), imagem centralizada sem container branco (sem padding/bordas), `max-width:600px;max-height:80vh;object-fit:contain;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.25)`. Imagem inteira clicável (`cursor:pointer`) abrindo `link_url` em nova aba. Botão X semi-transparente no canto superior direito sobre a imagem. |

### Detalhes do admin form (Page)

```jsx
{form.outbound_type === "page" && (
  <div className="rounded-lg bg-muted/30 p-4 space-y-3">
    <ImageUploadField
      value={form.page_html}
      onChange={(url) => setForm({ ...form, page_html: url, content: form.title })}
      label="Imagem da página"
      bucket="help-images"
      folder="outbound-pages"
      dimensions="Recomendado: 600×800px"
      maxSizeMB={2}
      accept=".png,.jpg,.jpeg,.gif,.webp"
      hint="Esta imagem será exibida centralizada na tela do visitante"
      previewHeight="h-40"
    />
    <div className="space-y-1.5">
      <Label>Link de redirecionamento (opcional)</Label>
      <Input
        value={form.link_url || ""}
        onChange={e => setForm({ ...form, link_url: e.target.value })}
        placeholder="https://exemplo.com/oferta"
      />
      <p className="text-[10px] text-muted-foreground">Ao clicar na imagem, o visitante será redirecionado para este link</p>
    </div>
  </div>
)}
```

### Detalhes do embed (renderPageModal)

Reescrever para renderizar apenas a imagem como elemento central:
- Overlay: `rgba(0,0,0,0.45)`, clique no overlay fecha
- Imagem: `page_html` como `src`, sem container branco, `border-radius:12px`, `box-shadow:0 8px 32px rgba(0,0,0,0.25)`, `cursor:pointer` se houver `link_url`
- Click na imagem: `window.open(banner.link_url, '_blank')` + dismiss
- Botão X: posição absoluta sobre o canto da imagem, fundo semi-transparente (`rgba(0,0,0,0.5)`), cor branca, `border-radius:50%`

