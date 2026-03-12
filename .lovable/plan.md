

## Plano: Corrigir exibição de Page + preview no admin

### Alterações

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/get-visitor-banners/index.ts` | Manter a lógica atual na linha 195-198: `auto_assign_by_rules` sem regras **não** auto-atribui. Isso está correto — só exibe para todos se `target_all=true`. Sem regras e sem `target_all`, o banner só aparece para contacts com assignment manual. **Nenhuma mudança necessária aqui.** |
| `src/pages/AdminBanners.tsx` | Adicionar preview visual do tipo Page: quando `outbound_type === "page"` e `page_html` tem URL, mostrar mini-preview simulando o modal (fundo escuro, imagem centralizada com rounded corners e shadow leve). |

### Lógica de exibição (confirmação)

A regra atual já está correta e alinhada com o pedido:

- `target_all = true` → exibe para **todos** os visitantes
- `auto_assign_by_rules = true` + regras definidas → exibe apenas para quem passa nas regras
- `auto_assign_by_rules = true` + **sem regras** → **não exibe para ninguém** (linha 198, já implementado)
- Nem `target_all` nem `auto_assign_by_rules` → exibe apenas para contacts com assignment manual

Não há mudança na edge function. O plano anterior sugeria remover essa condição, mas o pedido do usuário confirma que o comportamento atual está correto.

### Preview do Page no admin

Abaixo do `ImageUploadField`, quando há imagem carregada, adicionar:

```jsx
{form.page_html && (
  <div className="relative bg-black/60 rounded-lg p-6 flex items-center justify-center">
    <img src={form.page_html} className="max-h-48 rounded-xl shadow-lg object-contain" />
    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white text-xs">✕</div>
    <p className="absolute bottom-1 text-[9px] text-white/60">Preview do modal</p>
  </div>
)}
```

