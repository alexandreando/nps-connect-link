

# Adicionar botao "Reabrir" no painel lateral de leitura do chat

## Contexto

Ao clicar em um chat no historico, abre um painel lateral direito (`ReadOnlyChatDialog` - Sheet). Hoje esse painel so permite ver mensagens e adicionar notas internas. O botao "Reabrir" existe apenas no dropdown da tabela do historico.

## Mudancas

### 1. ReadOnlyChatDialog.tsx

- Adicionar props opcionais: `resolutionStatus`, `onReopen`, `allowReopen`
- Quando `resolutionStatus === "pending"` (ou `"resolved"` se `allowReopen` estiver habilitado), exibir um botao "Reabrir" no header do painel, ao lado do nome do visitante
- Ao clicar, chamar `onReopen(roomId)` e fechar o painel

### 2. AdminChatHistory.tsx

- Passar as novas props para o `ReadOnlyChatDialog`:
  - `resolutionStatus` do room selecionado
  - `onReopen` apontando para o `handleReopenChat` existente (seguido de fechar o painel)
  - `allowReopen` baseado na config `allow_reopen_resolved` (ja carregada ou a carregar)

### 3. AdminDashboard.tsx e AdminCSATReport.tsx

- Esses arquivos tambem usam `ReadOnlyChatDialog` mas nao precisam de reabrir. As props novas sao opcionais, entao nenhuma mudanca e necessaria nesses arquivos.

## Detalhes tecnicos

**Props adicionadas ao ReadOnlyChatDialog:**
```typescript
interface ReadOnlyChatDialogProps {
  roomId: string | null;
  visitorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolutionStatus?: string | null;
  onReopen?: (roomId: string) => void;
}
```

**Botao no header do Sheet:**
Um botao com icone `RotateCcw` exibido condicionalmente quando `onReopen` existe e o status permite reabertura.

