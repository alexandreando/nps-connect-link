

# Fix: Client Reopen Always Assigns to Original Attendant

## Problem

Current `handleReopenChat` (lines 745-778) checks if the original attendant is online and under capacity. If not, it falls back to `status: "waiting"` with `attendant_id: null`, causing the chat to appear as unassigned.

**Required behavior:** When a client reopens a pending chat in the widget, it must ALWAYS go directly to the original attendant regardless of their current capacity or status. Only when an attendant reopens from the admin side should the reopener get the chat assigned to themselves.

## Fix in `ChatWidget.tsx` (lines 736-796)

Remove the availability check entirely. Simplify to:

1. Fetch the room's current `attendant_id`
2. Update room to `status: "active"`, `closed_at: null`, `resolution_status: null` — keeping the existing `attendant_id` (no change needed since it's already set)
3. Increment the attendant's `active_conversations`
4. Set phase to `"chat"` directly
5. Remove the `!directAssigned` fallback path entirely — client reopens never go to waiting queue

The attendant-side reopen logic (in AdminWorkspace/AdminChatHistory) already correctly self-assigns, so no changes needed there.

## File

- `src/pages/ChatWidget.tsx` — `handleReopenChat` function, lines 736-796

