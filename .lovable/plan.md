

# Plan: Assignment Works Outside Business Hours (Workspace Only)

## Current Behavior
The DB trigger `assign_chat_room()` skips assignment entirely when outside business hours. The edge function returns `outside_hours: true` to the widget. No attendant is assigned.

## Desired Behavior
Chats should be assigned to attendants via the routing queue even outside business hours, but:
- The **widget** should continue seeing the room as "waiting" with the outside-hours banner
- The **workspace** should show the assigned room in the attendant's queue

## Approach: Assign but Keep Status "waiting"

Modify the DB trigger `assign_chat_room()` to still run the routing logic outside business hours, but instead of setting `status = 'active'`, keep `status = 'waiting'` and only set `attendant_id` + `assigned_at`. This way:

1. **Widget** stays in "waiting" phase (it only transitions on `status === 'active'`)
2. **Edge function** still returns `outside_hours: true` + `assigned: false` to the widget
3. **Workspace** sees the room with an attendant assigned, appearing in their queue

### Database Migration
Modify the `assign_chat_room()` trigger function:
- Remove the early `RETURN NEW` statements in the business hours checks
- Instead, set a local variable `v_outside_hours := true`
- In the assignment block, when `v_outside_hours` is true: set `NEW.attendant_id` and `NEW.assigned_at` but do **not** change `NEW.status` to `'active'` — leave it as `'waiting'`
- When inside hours: keep current behavior (set status to `'active'`)

### Edge Function `assign-chat-room/index.ts`
- When room has `attendant_id` but `status = 'waiting'` and it's outside hours: return `{ assigned: false, outside_hours: true }` (current widget behavior preserved)
- The existing code already handles this correctly since it checks `room.status === "active" && room.attendant_id` before returning `assigned: true`

### Widget (`ChatWidget.tsx`)
- No changes needed. Widget already only transitions to chat when `status === 'active'`

### Workspace (`AdminWorkspace.tsx`)
- The workspace already shows rooms with `attendant_id` in the attendant's queue regardless of status (it queries rooms with status `active` or `waiting`). Rooms assigned outside hours will appear normally.

## Files to Change
1. **Database migration** — Update `assign_chat_room()` trigger function
2. **`supabase/functions/assign-chat-room/index.ts`** — Minor adjustment to handle assigned-but-waiting rooms correctly (ensure it doesn't return `assigned: true` for outside-hours rooms)

