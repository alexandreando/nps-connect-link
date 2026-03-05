

# Fix: Widget Pending Behavior + Reopen History

## Problem 1: Chat sent to "pending" exits to list/closed screen

**Location:** `src/pages/ChatWidget.tsx` line 472-484

When the room status changes to `closed`, the widget checks `resolution_status`. For "pending" it currently navigates away (to history or closed phase). The correct behavior: only navigate away for "archived". For "pending", stay on the chat screen so the visitor can still see the conversation.

**Fix:** In the realtime room UPDATE handler, change the `else if (room.status === "closed")` block:
- If `resolution_status === "resolved"` → show CSAT (unchanged)
- If `resolution_status === "archived"` → navigate away (history or closed)
- If `resolution_status === "pending"` → stay on chat phase, keep displaying messages and input. No navigation.

## Problem 2: Reopened chats show empty message list

**Location:** `src/pages/ChatWidget.tsx` lines 509, 564, 746

When a chat is reopened (by client via `handleReopenChat`, or by attendant via realtime), the code calls `setMessages([])` which clears the history. The `fetchMessages` effect depends on `roomId` changing, but for reopens the `roomId` is the same room — so the effect doesn't re-trigger.

**Fix for `handleReopenChat` (line 746):** Remove `setMessages([])`. Instead, call `fetchMessages(reopenRoomId)` explicitly to load full history including new system messages.

**Fix for realtime reopen handlers (lines 509, 564):** Same approach — remove `setMessages([])` and call `fetchMessages(updatedRoom.id)` to load the full history.

**Fix for realtime INSERT handler (line 509):** For new proactive rooms, `setMessages([])` is correct (new room, no history). Keep it only for INSERT, not for reopen UPDATE.

## Files impacted

1. **`src/pages/ChatWidget.tsx`** — Room status handler (pending stays on chat), reopen handlers (load history instead of clearing)

