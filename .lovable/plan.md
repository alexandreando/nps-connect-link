

# Fix: Embed Identity Persistence + Side Panel Realtime Refresh

## Problem

Two issues causing data to show incorrectly in the side panel:

### Issue 1: Embed loses identity on reload
On page reload, `visitorProps = {}`. The `resolveVisitor()` call returns `visitor_name`/`visitor_email`, but these are stored in separate variables (`resolvedName`/`resolvedEmail`) and never added back to `visitorProps`. When the customer later calls `NPSChat.update({ mrr: 66.97 })`, the payload has no name/email, so the resolver enters the "no name/email" branch and returns `needs_form: true` without saving `custom_data`.

### Issue 2: Side panel doesn't auto-refresh
The `VisitorInfoPanel` fetches data once on mount. If `NPSChat.update()` fires after the panel loaded, the attendant sees stale values until manually clicking the refresh button.

---

## Fix 1: Persist resolved identity in visitorProps (embed script)

**File: `public/nps-chat-embed.js`**

After `resolveVisitor()` succeeds (line 236-245), inject the resolved identity back into `visitorProps`:

```text
if (data.visitor_token) {
  resolvedToken = data.visitor_token;
  resolvedName = data.visitor_name || "";
  resolvedEmail = data.visitor_email || "";
  // NEW: Persist resolved identity for future update() calls
  if (resolvedName && !visitorProps.name) visitorProps.name = resolvedName;
  if (resolvedEmail && !visitorProps.email) visitorProps.email = resolvedEmail;
  ...
}
```

This ensures that when `NPSChat.update({ mrr: 66.97 })` is called later, `buildResolverPayload(visitorProps)` will include the name/email as reserved keys, allowing the resolver to find the contact and apply custom_data.

## Fix 2: Add realtime subscription to VisitorInfoPanel

**File: `src/components/chat/VisitorInfoPanel.tsx`**

Add a Supabase realtime subscription on the `contacts` table filtered by `contact_id`. When a change is detected (from `applyCustomData` updating mrr, custom_fields, etc.), auto-refresh the panel data.

Changes:
- Subscribe to `contacts` changes for the resolved `contactId` using `postgres_changes`
- Subscribe to `chat_visitors` changes for the `visitorId` (for metadata updates)
- On change event, call `fetchData(true)` to silently refresh
- Clean up subscriptions on unmount

This ensures that when `NPSChat.update()` fires and the resolver updates the `contacts` table, the attendant's panel refreshes automatically within seconds.

---

## Technical Details

### File: `public/nps-chat-embed.js` (lines ~236-245)
- After setting `resolvedName`/`resolvedEmail`, also set `visitorProps.name` and `visitorProps.email` if not already present
- This is the minimal change to fix the identity loss on reload

### File: `src/components/chat/VisitorInfoPanel.tsx`
- Add a `useEffect` that creates a realtime channel subscribing to:
  - `postgres_changes` on `contacts` table filtered by `id = resolvedContactId`
  - `postgres_changes` on `chat_visitors` table filtered by `id = visitorId`
- On any `UPDATE` event, call `fetchData(true)` (silent refresh)
- Return cleanup function to remove the channel on unmount
- Add a debounce (e.g., 2 seconds) to avoid multiple rapid refreshes

