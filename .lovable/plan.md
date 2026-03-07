

# Plan: Performance Optimizations + Dashboard Load-on-Demand

## Status: Pending Approval

---

## 1. Dashboard Load-on-Demand (No Auto-Refresh)

**Problem**: `useDashboardStats` runs a heavy fetch every 30 seconds via `setInterval` (line 382), even when dashboard is idle. Both `AdminDashboard` and `AdminDashboardGerencial` use this hook.

**Changes in `src/hooks/useDashboardStats.ts`**:
- Remove the `setInterval(fetchStats, 30000)` auto-refresh (line 382)
- Keep `fetchStats()` on mount and on filter change only
- Return a new `realtimeEnabled` state + `toggleRealtime` function
- When realtime is enabled, subscribe to `chat_rooms` changes via Supabase Realtime with a 5-second debounce (not polling)

**Changes in `src/pages/AdminDashboard.tsx` and `src/pages/AdminDashboardGerencial.tsx`**:
- Add a toggle button in the header: "Tempo real: Ligado/Desligado" (default: off)
- Wire toggle to `toggleRealtime()` from the hook
- Add a manual "Atualizar" refresh button always visible
- Remove the `useAttendantQueues` call from `AdminDashboard` since it does a full refetch on every `chat_rooms` change (line 538-539 of useChatRealtime) — this is extremely heavy when dashboard is open. Instead, use the attendant data already fetched by `useDashboardStats`

## 2. Reports: Default to Short Periods

**Changes in `src/pages/AdminDashboardGerencial.tsx`**:
- Change default period from `"month"` to `"week"` (line 23)
- Remove `"all"` option from the period selector entirely for this page

**Changes in `src/hooks/useCSATReport.ts`**:
- Already defaults to `"month"` — keep as is
- Add a warning text when `"all"` period is selected: "Períodos longos podem demorar"

**Changes in `src/pages/AdminCSATReport.tsx`**:
- Show a subtle info text when loading with `period: "all"`: "Carregando todos os dados pode ser lento com alto volume"

## 3. Widget `fetchHistory` N+1 Fix

**Problem**: `fetchHistory` (line 240-257 of ChatWidget.tsx) runs `Promise.all` with one query per room to get the last message — N+1 pattern.

**Fix in `src/pages/ChatWidget.tsx`**:
- After fetching rooms, collect all room IDs
- Single batch query: fetch last message per room using `.in("room_id", roomIds)` + `.order("created_at", { ascending: false })` + deduplicate client-side (first seen per room_id wins)
- This reduces N+1 queries to 2 queries total per history page

## 4. Sidebar Active Counts: Use `active_conversations` Column

**Problem**: `SidebarDataContext` (line 123-142) fetches ALL active/waiting rooms just to count per-attendant. The `attendant_profiles.active_conversations` column is already maintained by triggers.

**Fix in `src/contexts/SidebarDataContext.tsx`**:
- Replace the `chat_rooms` query (lines 123-142) with reading `active_conversations` directly from `attendant_profiles` (already fetched at lines 47-50, 103-106)
- For `unassignedCount`, use a single `select("id", { count: "exact", head: true })` query with `.is("attendant_id", null).in("status", ["active", "waiting"])`
- This eliminates scanning all active rooms

## 5. `useAttendantQueues` Efficiency

**Problem**: `useAttendantQueues` (line 468-553) refetches ALL profiles + ALL active rooms on every single `chat_rooms` or `attendant_profiles` change. When 10 chats are active, every message-triggered room update fires a full refetch.

**Fix in `src/hooks/useChatRealtime.ts`** (`useAttendantQueues`):
- Use `active_conversations` from `attendant_profiles` instead of counting rooms
- For `waiting_count`, count rooms where `status = 'waiting'` per attendant (lighter query)
- Add a 3-second debounce to the Realtime callback to batch rapid changes
- Only refetch `attendant_profiles` on profile changes; only refetch room counts on room changes

---

## Safety Review: What Must NOT Break

| Feature | Status | Reasoning |
|---|---|---|
| Widget realtime messages (visitor side) | Safe | No changes to widget message subscriptions or Realtime channels |
| Widget history loading | Safe | Only optimizing the N+1 query pattern, same data returned |
| Workspace realtime (new messages, new rooms) | Safe | `useChatMessages` and `useChatRooms` Realtime channels untouched |
| Workspace unread counts | Safe | No changes to unread logic in `useChatRooms` |
| Sidebar attendant counts | Safe | Switching data source from room scan to `active_conversations` column, which is already maintained by `decrement_attendant_active_conversations` and `assign_chat_room` triggers |
| Proactive chat detection | Safe | Widget init flow unchanged |
| Dashboard data accuracy | Safe | Same queries, just no auto-polling. Manual refresh + optional realtime toggle |
| CSAT report | Safe | Only adding informational text for heavy periods |

**Key constraint**: The `useChatRooms` hook (workspace room list with messages, unread, realtime) is NOT modified. All workspace chat functionality remains identical.

---

## Files to Change

1. `src/hooks/useDashboardStats.ts` — Remove 30s polling, add optional Realtime toggle
2. `src/pages/AdminDashboard.tsx` — Add realtime toggle + refresh button, remove `useAttendantQueues`
3. `src/pages/AdminDashboardGerencial.tsx` — Default to "week", remove "all" option, add refresh button
4. `src/pages/AdminCSATReport.tsx` — Add info text for heavy periods
5. `src/pages/ChatWidget.tsx` — Fix N+1 history query
6. `src/contexts/SidebarDataContext.tsx` — Use `active_conversations` column instead of room scan
7. `src/hooks/useChatRealtime.ts` — Debounce `useAttendantQueues` refetches, use `active_conversations`

