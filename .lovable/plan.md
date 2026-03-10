

## Plano: Auto-inclusão de empresas em banners com regras de segmentação

### Problema

Atualmente, banners com regras de segmentação (field rules) só são exibidos para empresas que já possuem um `chat_banner_assignment` criado manualmente. Empresas que entram na base depois do banner ser publicado, ou que passam a atender os critérios depois, não veem o banner — a menos que o banner use `target_all`.

### Solução

Adicionar coluna `auto_assign_by_rules` na tabela `chat_banners`. Quando ativa, a edge function tratará banners com regras de segmentação como "auto-assign": avalia regras em tempo real e cria assignments automaticamente para qualquer empresa que corresponda, igual ao fluxo de `target_all`.

### Alterações

#### 1. Migration
```sql
ALTER TABLE public.chat_banners 
ADD COLUMN auto_assign_by_rules boolean NOT NULL DEFAULT false;
```

#### 2. Edge Function `get-visitor-banners/index.ts`

- Incluir `auto_assign_by_rules` no SELECT da query de banners
- Mudar a lógica de separação (linha 170-172):

```text
ANTES:
  target_all        → auto-create assignments (loop sequencial)
  !target_all       → só assignments existentes

DEPOIS (batch):
  autoAssignBanners = target_all OU (auto_assign_by_rules E tem regras que passam)
  individualBanners = restante

  1. SELECT ALL assignments WHERE banner_id IN [autoAssignIds] AND contact_id  ← 1 query
  2. INSERT batch para os que faltam                                            ← 1 query
  3. Montar resultado + UPDATE views em batch                                   ← 1 query
```

Isso elimina o loop N×3 queries e mantém O(3) constante.

#### 3. UI — `AdminBanners.tsx`

- Adicionar `auto_assign_by_rules` à interface `Banner`, `defaultForm`, form state, `openBannerDialog`, `duplicateBanner`, `saveBanner`
- Na seção de Segmentação, adicionar toggle (visível apenas quando `target_all` está desativado e existem regras):

```tsx
<div className="flex items-center gap-3">
  <Checkbox checked={form.auto_assign_by_rules} onCheckedChange={...} />
  <div>
    <Label>Incluir novas empresas automaticamente</Label>
    <p className="text-xs text-muted-foreground">
      Empresas que atenderem às regras de segmentação verão o banner automaticamente
    </p>
  </div>
</div>
```

#### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Nova coluna `auto_assign_by_rules` |
| `supabase/functions/get-visitor-banners/index.ts` | SELECT + lógica batch auto-assign |
| `src/pages/AdminBanners.tsx` | Interface, form state, toggle UI, save payload |

