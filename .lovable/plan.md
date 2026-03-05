

# Plan: Fix Internal Note Realtime + Clickable History Rows

## Issue 1: Internal notes don't appear without refresh

The `ReadOnlyChatDialog` uses `useChatMessages(open ? roomId : null)`. This hook subscribes to realtime INSERT events on `chat_messages` filtered by `room_id` — so new messages should appear. However, the realtime channel name is `chat-messages-${roomId}`, which may conflict with another subscription in the active workspace using the same channel name for the same room.

The real problem: the `useChatMessages` hook only subscribes when `roomId` is truthy. When the dialog opens, `open` becomes true and `roomId` is set, triggering the subscription. The subscription IS set up correctly. Let me re-check...

Actually, looking more carefully: the `handleSendNote` inserts with `sender_type: "attendant"` and `is_internal: true`. The realtime subscription in `useChatMessages` listens for ALL inserts on `chat_messages` with `room_id=eq.${roomId}` — so it should pick it up.

The issue is likely that the realtime publication for `chat_messages` may not be enabled, OR there's a channel name collision. But since other messages work in the workspace, the publication is enabled.

More likely root cause: the `ReadOnlyChatDialog` opens from `AdminChatHistory`, which is a different page from `AdminWorkspace`. The `useChatMessages` hook creates a channel `chat-messages-${roomId}`. If the room is closed, there may be RLS policies preventing the realtime subscription from receiving the INSERT event for the newly inserted message.

Simplest fix: after the insert succeeds, optimistically append the message to the local state. Since `useChatMessages` manages state internally and doesn't expose a setter, we need to either refetch or add an optimistic update.

**Fix**: After successful insert in `handleSendNote`, call `refetch()` from `useChatMessages` — but the hook doesn't currently expose a way to append. It does expose `refetch: fetchMessages`. So we can call refetch after insert.

Actually `useChatMessages` returns `{ messages, loading, hasMore, loadingMore, loadMore, refetch: fetchMessages }`. The `ReadOnlyChatDialog` only destructures `{ messages, loading }`. We just need to also destructure `refetch` and call it after the insert.

## Issue 2: History table rows should be fully clickable + hover effect

Currently only the Eye icon cell (line 429) opens the ReadOnlyChatDialog. The entire row should be clickable, and it should have a hover cursor.

**Fix**: Move the `onClick` handler to the `TableRow` itself, add `cursor-pointer`, and keep `e.stopPropagation()` on the Checkbox and Actions cells.

## Files to Change

### `src/components/chat/ReadOnlyChatDialog.tsx`
- Destructure `refetch` from `useChatMessages`
- Call `refetch()` after successful insert in `handleSendNote`

### `src/pages/AdminChatHistory.tsx`
- Move `onClick={() => setReadOnlyRoom(...)}` from the Eye cell to the `TableRow`
- Add `cursor-pointer` to row className
- Keep `stopPropagation` on Checkbox and Actions cells
- Remove the dedicated Eye icon cell (or keep it as visual indicator without its own click handler)

