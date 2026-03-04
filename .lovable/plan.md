

# Fix: Welcome message not sent for auto-assigned chats

## Problem

When the DB trigger `trg_assign_chat_room` auto-assigns an attendant during room creation, the room is returned with `status=active` and `attendant_id` already set. The widget code (line 701) detects this and enters "chat" phase directly, **skipping** `checkRoomAssignment()` — which is the only place that calls the `sendWelcomeMessage` function in the edge function.

The same issue exists in the init flow (line ~880-891) and the `handleStartChat` flow (line ~940-948).

## Solution

Call `checkRoomAssignment` in all cases where the room is already assigned, not just when it's "waiting". This ensures the edge function runs and sends the welcome message.

**File:** `src/pages/ChatWidget.tsx`

In `handleNewChat` (line 701-712): After detecting `newRoom.status === "active"`, still call `checkRoomAssignment(newRoom.id)` to trigger the welcome message. The function already handles the "already assigned" case correctly and returns the attendant name.

Same fix in:
- Init flow (~line 880-891): when resuming an active room on widget load
- `handleStartChat` (~line 940-948): when starting chat after form submission

The change is simple — move `checkRoomAssignment` call to happen in **both** branches (assigned and waiting), not just the waiting branch. When already assigned, it sends the welcome message and returns the attendant name with fallback resolution.

## Files impacted

1. **`src/pages/ChatWidget.tsx`** — Add `checkRoomAssignment` call in the "already assigned" branches of `handleNewChat`, init flow, and `handleStartChat`

