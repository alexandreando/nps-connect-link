

# Fix: Welcome Message Rules + Inactivity Chain Reset

## Problems

1. **Duplicate welcome messages**: Two sources send welcome messages — `process-chat-auto-rules` (for waiting rooms, via polling) and `assign-chat-room` edge function (on assignment). Both can fire, causing duplicates.

2. **Welcome message timing wrong**: The welcome message should be sent when the chat becomes **active** (attendant assigned, widget shows chat view), not when it's still "waiting". Currently `process-chat-auto-rules` sends it for waiting rooms, which is incorrect per the desired behavior.

3. **No welcome on reopen**: When a room is reopened from pending/closed back to active (via `AdminWorkspace.tsx` or `AdminChatHistory.tsx`), no welcome message is sent. The rule should fire every time the room transitions to `active`.

4. **Inactivity chain not reset on workspace reopen**: `AdminWorkspace.tsx` `handleReopenRoom` inserts a system message with `is_internal: true` but WITHOUT `{ auto_rule: "chain_reset" }` metadata. The chain engine ignores it and continues the old chain. `AdminChatHistory.tsx` already does this correctly.

5. **Chain doesn't restart after `chain_reset`**: When `chain_reset` is the latest chain message, the engine does `continue` (skips the room entirely). Even after the attendant sends a new message, the chain never restarts because `chain_reset` is still the most recent auto_rule. It should be treated as a boundary, not a permanent skip.

## Solution

### 1. Remove welcome message from `process-chat-auto-rules`

**File:** `supabase/functions/process-chat-auto-rules/index.ts`

Remove the entire "WELCOME MESSAGE" section (lines 88-141). Remove `"welcome_message"` from the `.in("rule_type", [...])` query. Welcome messages will only be sent by `assign-chat-room`.

### 2. Fix `assign-chat-room` welcome to allow re-send after reopen

**File:** `supabase/functions/assign-chat-room/index.ts`

Update `sendWelcomeMessage` to check for welcome messages sent AFTER the latest `chain_reset`, not across the entire room history. This way, when a room is reopened (chain_reset inserted), the next call triggers a new welcome.

### 3. Fix workspace reopen to include `chain_reset` + trigger welcome

**File:** `src/pages/AdminWorkspace.tsx` — `handleReopenRoom` (line 252-263)

- Add `metadata: { auto_rule: "chain_reset" }` to the system message
- Set `is_internal: false` so visitor sees it
- After reopening, call `assign-chat-room` edge function to trigger welcome message

### 4. Fix chain engine to restart after `chain_reset`

**File:** `supabase/functions/process-chat-auto-rules/index.ts`

Replace the `continue` on `chain_reset` (line 238-240) with boundary logic: find the latest `chain_reset` in `chainSystemMsgs`, then only consider chain messages and visitor/attendant messages AFTER that reset timestamp. If `chain_reset` is the latest, treat it as if no chain has been sent yet (fresh room).

### 5. AdminChatHistory reopen — trigger welcome after chain_reset

**File:** `src/pages/AdminChatHistory.tsx` — `handleReopenChat` (after line 165)

Add a call to `assign-chat-room` edge function after inserting the chain_reset message, so the welcome message is sent immediately on reopen.

## Files impacted

1. `supabase/functions/process-chat-auto-rules/index.ts` — Remove welcome section, fix chain_reset boundary logic
2. `supabase/functions/assign-chat-room/index.ts` — Welcome respects chain_reset boundary
3. `src/pages/AdminWorkspace.tsx` — Add chain_reset metadata + call assign-chat-room on reopen
4. `src/pages/AdminChatHistory.tsx` — Call assign-chat-room after reopen to trigger welcome

