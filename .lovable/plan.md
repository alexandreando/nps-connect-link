

# Componente Universal de Upload de Imagens

## Problema

Varios locais do sistema usam inputs de texto para URLs de imagens (HelpSettings, TenantManagement), enquanto outros (BrandSettingsTab, MyProfile, TeamSettingsTab) tem upload funcional mas com codigo duplicado. Nao ha um componente padrao reutilizavel.

## Solucao

Criar um componente `ImageUploadField` reutilizavel e substituir todos os inputs de URL de imagem por ele em todo o sistema.

### Componente `ImageUploadField`

Props:
- `value` - URL atual da imagem
- `onChange` - callback com nova URL
- `label` - nome do campo
- `bucket` - bucket do storage (default: `help-images`)
- `folder` - subpasta (ex: `hero`, `logo`, `favicon`)
- `dimensions` - texto descritivo (ex: "1920x400px recomendado")
- `maxSizeMB` - limite de tamanho (default: 2)
- `accept` - tipos aceitos (default: `.png,.jpg,.webp,.svg`)
- `hint` - texto adicional
- `previewMode` - `contain` (logos) ou `cover` (hero/banners)
- `previewHeight` - altura do preview (default: `h-20`)

Layout:

```text
[Label]
[Requisitos: 1920x400px | Max: 2MB | PNG, JPG, WebP, SVG]
+---------------------------------------------+
| [Preview da imagem se existir]              |
|                                             |
| [Botao Upload]  [Input URL manual]          |
| [Botao Remover]                             |
+---------------------------------------------+
```

Funcionalidades:
- Drag-and-drop de arquivo na area
- Click para abrir file picker
- Input de URL manual como alternativa (toggle)
- Preview inline da imagem
- Validacao de tipo e tamanho no client
- Spinner durante upload
- Botao de remover (limpa o valor)
- Exibicao dos requisitos (dimensoes, tamanho, formatos)

### Locais de Substituicao

| Local | Campo | Bucket | Folder | Dimensoes | Max |
|-------|-------|--------|--------|-----------|-----|
| HelpSettings | Logo | `help-images` | `logo` | 200x60px, fundo transparente | 1MB |
| HelpSettings | Hero image | `help-images` | `hero` | 1920x400px | 5MB |
| HelpSettings | Favicon | `help-images` | `favicon` | 32x32 ou 64x64px | 500KB |
| HelpSettings | Footer logo | `help-images` | `footer-logo` | 200x60px | 1MB |
| BrandSettingsTab | Logo NPS | `logos` | (manter path atual) | 400x120px | 2MB |
| TeamSettingsTab | Avatar | `logos` | (manter path atual) | 200x200px, quadrado | 1MB |
| MyProfile | Avatar | `logos` | (manter path atual) | 200x200px, quadrado | 1MB |
| TenantManagement | Logo tenant | `logos` | `tenants` | 200x60px | 1MB |

### Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/components/ui/image-upload-field.tsx` | **NOVO** - Componente reutilizavel |
| `src/pages/HelpSettings.tsx` | Substituir 4 inputs por ImageUploadField |
| `src/components/BrandSettingsTab.tsx` | Substituir upload inline por ImageUploadField |
| `src/components/TeamSettingsTab.tsx` | Substituir upload inline por ImageUploadField |
| `src/pages/MyProfile.tsx` | Substituir upload inline por ImageUploadField |
| `src/components/backoffice/TenantManagement.tsx` | Substituir input URL por ImageUploadField |
| `src/locales/pt-BR.ts` | Labels: upload, arrastar, requisitos, remover |
| `src/locales/en.ts` | Labels em ingles |

### Detalhes Tecnicos

- Upload usa `supabase.storage.from(bucket).upload(path, file)`
- Path gerado: `{folder}/{timestamp}-{random}.{ext}` (ou path customizado via prop)
- Validacao client-side: verifica `file.type` contra lista de aceitos e `file.size` contra `maxSizeMB`
- O componente fica em `src/components/ui/` para ser acessivel globalmente
- Sem migration de banco - usa buckets existentes (`logos`, `help-images`)

