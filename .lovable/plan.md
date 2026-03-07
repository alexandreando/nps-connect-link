
# Plan: Category Rules UX Rework + Widget Performance Optimization

## Status: ✅ Implemented

## 1. CategoryFieldRules UX Rework — DONE
- Replaced immediate-save flow with staging-based UX
- "Adicionar" button adds rules to local staging list with match preview (not saved yet)
- Existing rules can be marked for removal (struck-through, not deleted yet)
- Global "Salvar alterações" button persists all changes at once and syncs companies

## 2. Widget Lazy Loading — DONE
- Init only resolves visitor + checks for active room (no history fetch)
- History is fetched lazily when widget opens AND phase is "history"
- Realtime subscriptions and proactive chat detection remain untouched

## 3. History Pagination — DONE
- fetchHistory uses `.range()` with page size of 10
- "Carregar mais" button appends next page

## 4. Archived → Encerrado in Widget — DONE
- Widget now shows "Encerrado" instead of "Arquivado" for archived chats
