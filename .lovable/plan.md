
# Plan: Performance Optimizations + Realtime Counters

## Status: ✅ Fully Implemented

---

## 1. Dashboard Load-on-Demand — DONE
- Removed 30s `setInterval` auto-polling from `useDashboardStats`
- Added optional Realtime toggle (default: off) with 5s debounce on `chat_rooms` changes
- Added manual "Atualizar" refresh button to `AdminDashboard` and `AdminDashboardGerencial`

## 2. Reports: Default to Short Periods — DONE
- Changed `AdminDashboardGerencial` default period from "month" to "week"
- Removed "all" option from Gerencial period selector
- Added warning text in `AdminCSATReport` when "all" period is selected

## 3. Widget `fetchHistory` N+1 Fix — DONE
- Replaced `Promise.all` per-room queries with single batch `.in("room_id", roomIds)` query
- Reduced from N+1 to 2 queries per history page load

## 4. Sidebar Active Counts — DONE (v2: COUNT-based trigger)
- **v1 (replaced)**: Incremental patches via Realtime events — caused drift
- **v2 (current)**: COUNT-based database trigger `resync_attendant_counter_on_room_change`
  - Trigger fires AFTER INSERT/UPDATE/DELETE on `chat_rooms`
  - Recalculates `active_conversations` via real `COUNT(*)` for affected attendants
  - Composite index `idx_chat_rooms_attendant_status` ensures COUNT < 1ms
  - Frontend `handleRoomChange` simplified to debounced `resyncCounts()` (1s)
  - `handleAttendantChange` trusts `active_conversations` from Realtime (now always accurate)
  - Fallback resync interval reduced from 60s to 30s

## 5. `useAttendantQueues` Efficiency — DONE
- Uses `active_conversations` from `attendant_profiles` instead of counting rooms
- Only fetches unassigned rooms + waiting counts (lighter queries)
- Added 3s debounce to Realtime callbacks to batch rapid changes

## 6. Realtime Publication for `attendant_profiles` — DONE
- Added `ALTER PUBLICATION supabase_realtime ADD TABLE public.attendant_profiles`
- Enables live updates for sidebar counters and status changes
