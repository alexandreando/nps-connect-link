
## Plan Atualizado: Workspace Responsiveness + Bubble Color + Room State + Internal Note Contrast

### Issue 1: Internal Note Text Contrast in Dark Theme
**Problem**: Internal notes (notas internas) use `bg-yellow-100 border border-yellow-300` (linha 126), que é um tom claro de amarelo. Em dark mode, o fundo da nota fica claro (yellow-100) mas o texto permanece com a cor padrão do tema escuro (text-foreground), resultando em muito contraste e dificuldade de leitura. O rótulo "(Nota interna)" usa `text-yellow-600` que também perde contraste em dark.

**Fix**: 
- Adicionar estilos diferenciados para dark mode nas notas internas
- Mudar a nota interna para um tom mais escuro em dark: `bg-yellow-900/30 border border-yellow-700/50` com `text-yellow-100`
- O rótulo "(Nota interna)" também precisa ajuste: `text-yellow-500` para melhor contraste
- Em light mode, manter amarelo claro: `bg-yellow-100 border border-yellow-300 text-yellow-900` e rótulo `text-yellow-700`

### Issue 2: Attendant Message Bubble Color Change (Orange → Light Blue)
Replace `bg-primary text-primary-foreground` (coral/orange) com light blue para melhorar conforto visual prolongado.

**Fix**: 
- Replace attendant bubbles com `bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100`
- Ajustar quotes internas para attendant: `dark:bg-sky-950/50 dark:border-sky-700/50 dark:text-sky-100`

### Issue 3: Room State Reset on Queue/Attendant Switch
When clicking different attendants or "my queue", selectedRoomId persists.

**Fix**:
- Add useEffect in `AdminWorkspace.tsx` to reset `selectedRoomId` when `viewingAttendantId` or `viewingUnassigned` changes
- Add useEffect to clear `selectedRoomId` when it's not in `filteredRooms` list

### Issue 4: Responsiveness & Horizontal Scroll Prevention
Prevent horizontal scrolling on mobile and tablet sizes.

**Fix**:
- Group mobile action buttons (Transfer, Tags, Close) into single dropdown menu
- Add `overflow-hidden` to outer workspace container
- Ensure all panels use internal vertical scrolling only
- Info panel: already collapses at <1280px

## Files to Change

### `src/components/chat/ChatMessageList.tsx`
- Line 125-130: Update internal note styling with dark mode support
  - `bg-yellow-100 border border-yellow-300` → `bg-yellow-100 border border-yellow-300 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-100`
- Line 137: Update "(Nota interna)" text color: `text-yellow-600` → `text-yellow-700 dark:text-yellow-500`
- Line 129: Change attendant message color: `bg-primary text-primary-foreground` → `bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100`
- Line 147-148: Update attendant quote styling for new bubble color

### `src/pages/AdminWorkspace.tsx`
- Add useEffect to reset selectedRoomId when viewingAttendantId or viewingUnassigned changes
- Add useEffect to clear selectedRoomId if not in filteredRooms
- Add mobile action dropdown menu to prevent horizontal overflow
- Add `overflow-hidden` to root container

