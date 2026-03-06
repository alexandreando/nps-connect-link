

# Plan: 4 Improvements — Delete Messages, Multi-Filter, Tags Overflow, ReadOnly Dialog Info

## 1. Message Deletion by Attendant (Soft Delete)

Add a `deleted_at` column to `chat_messages`. When an attendant deletes a message, set `deleted_at = now()`. The widget filters out messages where `deleted_at IS NOT NULL`, while the workspace shows them with a "Mensagem apagada" placeholder.

### Database Migration
- Add `deleted_at timestamptz` column to `chat_messages` (nullable, default null)

### `src/components/chat/ChatMessageList.tsx`
- Add an `onDelete` callback prop
- On attendant messages (`sender_type !== "visitor"`), show a small trash icon on hover (similar to reply button) that calls `onDelete(msg.id)`
- If `msg.deleted_at` is set (new field in interface), render a muted "Mensagem apagada" placeholder instead of the content

### `src/pages/AdminWorkspace.tsx`
- Implement `handleDeleteMessage(msgId)` that calls `supabase.from("chat_messages").update({ deleted_at: new Date().toISOString() }).eq("id", msgId)`
- Pass it to `ChatMessageList` as `onDelete`

### `src/pages/ChatWidget.tsx`
- Filter out messages where `deleted_at` is not null in the messages fetch query (add `.is("deleted_at", null)` to the query)
- Also filter in the realtime handler

## 2. Multi-Value Filters in Chat History

Replace single-value `Select` dropdowns for Resolution Status, Attendant, CSAT, and Tag with multi-select using checkboxes in a `Popover`.

### `src/pages/AdminChatHistory.tsx`
- Change state from `resolutionStatus: string | null` to `resolutionStatuses: string[]` (array)
- Same for `attendantIds: string[]`, `csatFilters: string[]`, `tagIds: string[]`
- Replace each `<Select>` with a `<Popover>` containing checkboxes for each option + a count badge showing how many are selected
- Display selected values as small badges or a "+N" indicator

### `src/hooks/useChatHistory.ts`
- Update `HistoryFilter` interface to accept arrays: `resolutionStatuses?: string[]`, `attendantIds?: string[]`, `tagIds?: string[]`, `csatFilters?: string[]`
- Update query builder to use `.in()` for arrays instead of `.eq()`

## 3. Tags Overflow with "+N" in History Table

### `src/pages/AdminChatHistory.tsx` (line 442-448)
- Show max 2 tags, then render a `+N` badge with a tooltip listing the remaining tags
- Use `Tooltip` or `HoverCard` for the overflow list

## 4. Enriched ReadOnlyChatDialog with Room Info

### `src/components/chat/ReadOnlyChatDialog.tsx`
- Accept additional props: `roomId`, plus fetch room metadata on open (attendant name, company name, contact info, resolution status, CSAT, duration, tags)
- Add an info header section below the title showing: attendant name, company name (as clickable link to `/contacts/{contactId}`), duration, CSAT score, resolution badge, tags
- Use compact layout with small badges and icons

## Files to Change

1. **Database migration** — Add `deleted_at` to `chat_messages`
2. **`src/components/chat/ChatMessageList.tsx`** — Add delete button, deleted placeholder, `onDelete` prop
3. **`src/pages/AdminWorkspace.tsx`** — Implement `handleDeleteMessage`, pass to ChatMessageList
4. **`src/pages/ChatWidget.tsx`** — Filter deleted messages
5. **`src/pages/AdminChatHistory.tsx`** — Multi-select filters, tags "+N" overflow
6. **`src/hooks/useChatHistory.ts`** — Support array filters
7. **`src/components/chat/ReadOnlyChatDialog.tsx`** — Add room info header with links

