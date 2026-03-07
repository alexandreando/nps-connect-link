

# Plan: Category Rules UX Rework + Widget Performance Optimization

## 1. CategoryFieldRules UX Rework

**Problem**: Clicking the eye icon immediately triggers validation/save. There's no "add rule to a staging list, then save all at once" flow.

**New UX flow**:
- The dialog shows existing (persisted) rules at the top
- Below, a form to compose a new rule (field, operator, value) with an **"Adicionar"** button that adds it to a **local staging list** (not saved yet)
- Staged rules appear in a separate "pending" section with a different visual (e.g. dashed border, yellow tint) and can be removed
- When the user clicks "Adicionar", the preview logic runs: fetch companies, run `matchValue`, show count + list of matches inline. User can still remove the staged rule if results are wrong
- Removing an existing (persisted) rule also goes to staging: it gets visually struck-through but is only deleted on save
- A global **"Salvar alterações"** button at the bottom of the dialog persists all changes (inserts new rules, deletes removed rules) and then runs `syncCompanies()`
- If no changes were made, the save button is disabled

**File**: `src/components/chat/CategoryFieldRules.tsx` — full rewrite of dialog internals

## 2. Widget Lazy Loading (Performance)

**Problem**: On embed init, the widget fetches all history rooms + last message per room immediately, even before the user opens the widget. This causes N+1 queries for each room.

**Fix in `src/pages/ChatWidget.tsx`**:
- **On init (before widget open)**: Only resolve visitor identity + check for active/waiting room + count of unread proactive messages. No history fetch
- **On widget open (isOpen becomes true)**: Only then call `fetchHistory()` if phase is "history"
- Move the `fetchHistory` call from the `init()` useEffect into a new effect that triggers when `isOpen` transitions to `true` AND phase would be "history"
- Keep realtime subscriptions for proactive chat detection (INSERT on chat_rooms) — these are lightweight and must stay

**Fix in `public/nps-chat-embed.js`**:
- No changes needed — the embed already just creates the iframe. The optimization is inside the widget component

## 3. History Pagination

**Problem**: `fetchHistory` loads ALL rooms at once. At scale this is inefficient.

**Fix in `src/pages/ChatWidget.tsx`**:
- Add pagination to `fetchHistory`: load first 10 rooms, show "Carregar mais" button at the bottom
- Add state: `historyPage`, `hasMoreHistory`
- Query with `.range(0, PAGE_SIZE)` and check count
- "Carregar mais" appends next page

## 4. Archived → Encerrado in Widget

**Problem**: Widget shows "Arquivado" for archived chats. Should show "Encerrado" (only workspace uses "Arquivado").

**Fix in `src/pages/ChatWidget.tsx`** (line 1089):
- Change `statusLabel` to return "Encerrado" instead of "Arquivado" for `resolution_status === "archived"`

## Files to Change

1. `src/components/chat/CategoryFieldRules.tsx` — Staging-based add/remove flow with global save button
2. `src/pages/ChatWidget.tsx` — Lazy history loading, history pagination, archived label fix

## Safety

All changes are additive or UX-only. Realtime subscriptions, proactive chat detection, message sending, and CSAT flows remain untouched. The widget init still resolves the visitor and detects active rooms — it just defers history fetching until the user actually opens the widget.

