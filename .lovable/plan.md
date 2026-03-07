
# Plan: Fix Auto-Rules Chain + Improve Categories UI + Rule Preview Validation

## Status: ✅ Implemented

## 1. Fix auto-rules chain — DONE
- Expanded room query in `process-chat-auto-rules` to include `closed+pending` rooms
- Chain now continues: `inactivity_warning` → `inactivity_warning_2` → `auto_close`
- First step triggers only on `active` rooms where attendant sent last unanswered message

## 2. Compact company list UI — DONE
- Replaced inline badge list with count + "Gerenciar empresas" button
- Manage dialog shows assigned (pre-checked) and unassigned companies with search

## 3. Rule preview validation — DONE
- Clicking "+" now shows a preview of matching companies before saving
- Removing a rule shows which companies will lose their category
- Both actions require explicit confirmation
