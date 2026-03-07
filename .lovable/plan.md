

# Plan: Fix Auto-Rules Chain + Improve Categories UI + Rule Preview Validation

## 1. Fix auto-rules chain not firing after first warning

**Root cause**: When `inactivity_warning` fires (line 240-249), room status changes to `closed` with `resolution_status: "pending"`. The room query (line 89) only fetches `status IN ('active', 'waiting')`, so closed-pending rooms are never picked up for `inactivity_warning_2` or `auto_close`.

**Fix in `supabase/functions/process-chat-auto-rules/index.ts`** (line 86-89):
- Change the query to also include closed-pending rooms using `.or('status.in.(active,waiting),and(status.eq.closed,resolution_status.eq.pending)')`
- The chain logic already handles subsequent steps correctly — `inactivity_warning` only fires for `room.status === "active"` (line 200), while steps 2 and 3 fire based on the previous chain message regardless of status

**First step trigger clarification**: The existing code at lines 200-208 already correctly requires `room.status === "active"` AND the last non-system message being from the attendant. This covers both new chats and reopened chats (any room that becomes active where the attendant sent the last message without visitor reply). No logic change needed here — only the query expansion.

## 2. Improve company list UI in CategoriesTab

**Problem**: All assigned companies render as inline badges inside category cards, creating massive cluttered lists.

**Fix in `src/components/chat/CategoriesTab.tsx`** (lines 341-357):
- Replace the inline badge list with a compact summary: company count + "Gerenciar empresas" button
- The button opens the existing bulk dialog, repurposed to show both assigned companies (with unassign option) and unassigned companies (with assign option) in a single searchable list
- Remove per-company X buttons from the card view entirely

## 3. Rule preview validation on save

**Problem**: When saving a field rule, the user has no way to know which companies will be affected.

**Fix in `src/components/chat/CategoryFieldRules.tsx`**:
- When the user clicks the "+" button to add a rule, instead of saving immediately, run the `matchValue` logic client-side against the already-fetched contacts list to find matching companies
- Show a preview panel below the form listing matched companies (name + trade_name) with a count header like "12 empresas serão atribuídas a esta regra"
- Add a "Confirmar" button to actually persist the rule, and a "Cancelar" to discard
- For editing existing rules: same flow — when removing a rule, show which companies will be unassigned before confirming
- The preview fetches companies from `contacts` (is_company=true) and runs `matchValue` locally, so no new DB tables or edge functions needed
- This applies to both new rules and modifications (add/remove) to existing rules

## Files to Change

1. `supabase/functions/process-chat-auto-rules/index.ts` — Expand room query to include closed-pending rooms
2. `src/components/chat/CategoriesTab.tsx` — Replace inline company badges with compact count + manage button
3. `src/components/chat/CategoryFieldRules.tsx` — Add preview validation step before saving rules

