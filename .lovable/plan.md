

# Plan: 3 Fixes — Realtime Delete, Tags Layout, Company Sheet In-Place

## 1. Deleted messages update in realtime (no F5)

**Root cause**: `useChatMessages` in `src/hooks/useChatRealtime.ts` (line 122-136) only subscribes to `INSERT` events on `chat_messages`. When a message is soft-deleted (UPDATE with `deleted_at`), the workspace doesn't see the change.

**Fix in `src/hooks/useChatRealtime.ts`**:
- Add a second `.on("postgres_changes", { event: "UPDATE" ... })` handler on the same channel
- On UPDATE, replace the matching message in state with the new payload (which includes `deleted_at`)
- The `ChatMessageList` already renders the "Mensagem apagada" placeholder when `deleted_at` is set, so no further UI changes needed

## 2. Fix tags layout in chat history table

**Root cause**: The tags in `AdminChatHistory.tsx` (lines 468-490) use `Badge variant="outline"` which looks correct, but based on the screenshot the circles suggest the badges may be rendering with excessive padding/border-radius. 

**Fix in `src/pages/AdminChatHistory.tsx`**:
- Ensure tags use compact inline badges: add `py-0 px-1.5 rounded` classes to tag badges (remove any circular styling)
- Constrain the tags container with `flex-nowrap max-w-[180px] overflow-hidden` to prevent layout breakage
- Match the workspace style: small, tight, horizontal badges

## 3. Company links open CompanyDetailsSheet in-place

**Current behavior**: In `ReadOnlyChatDialog` (line 174), clicking company name navigates to `/contacts` and closes the dialog.

**Fix in `src/components/chat/ReadOnlyChatDialog.tsx`**:
- Import `CompanyDetailsSheet` from `@/components/CompanyDetailsSheet`
- Add state `selectedCompanyId: string | null`
- Instead of `navigate("/contacts")`, set `selectedCompanyId` to `roomInfo.contact_id`
- Render `<CompanyDetailsSheet companyId={selectedCompanyId} onClose={() => setSelectedCompanyId(null)} canEdit={false} canDelete={false} />` inside the component
- This opens the company details as a Sheet overlay without leaving the current page

## Files to Change

1. **`src/hooks/useChatRealtime.ts`** — Add UPDATE listener to `useChatMessages`
2. **`src/pages/AdminChatHistory.tsx`** — Fix tag badge styling
3. **`src/components/chat/ReadOnlyChatDialog.tsx`** — Open CompanyDetailsSheet in-place instead of navigating

