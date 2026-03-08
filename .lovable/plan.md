
# Plan: Performance Optimizations + Dashboard Load-on-Demand

## Status: ✅ Implemented

---

## 1. Dashboard Load-on-Demand — DONE
- Removed 30s `setInterval` auto-polling from `useDashboardStats`
- Added optional Realtime toggle (default: off) with 5s debounce on `chat_rooms` changes
- Added manual "Atualizar" refresh button to both `AdminDashboard` and `AdminDashboardGerencial`

## 2. Reports: Default to Short Periods — DONE
- Changed `AdminDashboardGerencial` default period from "month" to "week"
- Removed "all" option from Gerencial period selector
- Added warning text in `AdminCSATReport` when "all" period is selected

## 3. Widget `fetchHistory` N+1 Fix — DONE
- Replaced `Promise.all` with per-room queries with a single batch `.in("room_id", roomIds)` query
- Reduced from N+1 to 2 queries per history page load

## 4. Sidebar Active Counts — DONE
- Replaced scanning all active rooms with reading `active_conversations` from `attendant_profiles`
- Unassigned count uses lightweight `head: true` count query
- Realtime patches update `active_count` from `attendant_profiles` changes

## 5. `useAttendantQueues` Efficiency — DONE
- Uses `active_conversations` from `attendant_profiles` instead of counting rooms
- Only fetches unassigned rooms + waiting counts (lighter queries)
- Added 3s debounce to Realtime callbacks to batch rapid changes
