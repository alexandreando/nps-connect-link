
Objetivo: corrigir 2 regressões sem mexer em fluxo de envio, mensagens automáticas ou backend pesado.

1) Corrigir persistência de rascunho no ChatInput (caixa de mensagem)
- Causa provável: hoje o rascunho depende de troca de sala/unmount e leitura de `textareaRef`; em blur/navegação rápida isso pode ficar stale ou `null`, apagando o draft.
- Ajuste no `src/components/chat/ChatInput.tsx`:
  - Criar helpers locais:
    - `persistDraft(roomId, text)` (salva/remove no `draftsMap` por `trim`).
    - `restoreDraft(roomId)` (retorna texto salvo).
  - Adicionar `valueRef` sincronizado com `value` para nunca depender de DOM ref em cleanup.
  - Persistir rascunho em 3 pontos:
    - `onChange` (salvamento imediato por sala atual, zero I/O externo).
    - `onBlur` da `Textarea` (garantia ao “clicar fora”).
    - `useEffect` de troca de `roomId` e cleanup de unmount usando `valueRef`.
  - Manter comportamento atual:
    - `clearDraft(roomId)` continua limpando no encerramento.
    - após `handleSend`, remover draft da sala.
- Resultado esperado: texto permanece ao clicar fora, trocar conversa, navegar entre páginas internas e voltar (até F5/reload).

2) Corrigir layout quebrado no popup “encerrar conversa”
- Causa: 4 botões de status em linha única com `whitespace-nowrap` no Button base + largura fixa do modal => overflow (como no print).
- Ajuste no `src/components/chat/CloseRoomDialog.tsx`:
  - Trocar container de status de `flex` para grid responsivo (`grid-cols-2` e `sm:grid-cols-4`) para não estourar.
  - Nos botões, aplicar `min-w-0` + ajuste de padding/tamanho de fonte para caber sem deslocar.
  - Se necessário, ampliar levemente largura do modal (`sm:max-w-lg`) apenas neste diálogo.
- Resultado esperado: nenhum botão “vaza” para fora; layout íntegro em desktop/tablet.

3) Garantias de não regressão
- Não altera regras automáticas, envio de mensagem, macros, realtime ou banco.
- Rascunho afeta somente estado temporário da caixa de texto por `roomId`.
- Sem chamadas pesadas nem persistência em banco.

4) Validação pós-implementação (manual, rápida)
- Digitar em sala A → clicar fora → trocar para B → voltar para A: rascunho deve permanecer.
- Digitar em sala A → navegar para outra tela interna → voltar ao workspace e à sala A: rascunho deve permanecer.
- Enviar mensagem em A: draft de A deve limpar.
- Encerrar conversa: popup com 4 status deve ficar alinhado, sem overflow, em larguras diferentes.
