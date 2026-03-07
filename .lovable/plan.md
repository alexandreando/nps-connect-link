

# Plan: 6 Fixes — Draft Persistence, Popover Dismiss, Searchable Proactive Chat, Tags on All Close Types, Widget Realtime Delete, Custom Fields Display

## 1. Per-Room Draft Messages in Workspace

**Problem**: Switching between chats carries the typed text to the next chat.

**Fix in `src/components/chat/ChatInput.tsx`**:
- Accept `roomId` (already does) and maintain a `useRef<Map<string, string>>` to store draft text per room
- On `roomId` change: save current `value` to the map for the previous roomId, then restore the draft for the new roomId (or empty string)
- This is in-memory only (lost on F5, preserved on navigation)

## 2. Close Articles/Macros Popover When Clicking Outside

**Problem**: The articles and macros popups in `ChatInput.tsx` don't close when clicking outside.

**Fix in `src/components/chat/ChatInput.tsx`**:
- Wrap the macros and articles popup divs with a click-outside detection (use a `useEffect` with `mousedown` listener on `document` that checks if click target is outside the popup ref)
- Add an X close button in the top-right corner of both popups

## 3. Searchable Company/Contact in ProactiveChatDialog

**Problem**: Company and Contact selectors are plain `<Select>` lists with no search.

**Fix in `src/components/chat/ProactiveChatDialog.tsx`**:
- Replace `<Select>` for company with a `<Popover>` + `<Command>` (combobox pattern) with a search input that filters companies by name
- Same for contacts: replace with searchable combobox
- Fetch all on open, filter client-side via the command input

## 4. Tags on All Close Types (Not Just "Resolved")

**Problem**: Only "Resolvido" shows the tag selector form. "Pendente" and "Arquivar" close immediately without tags.

**Fix in `src/components/chat/CloseRoomDialog.tsx`**:
- Remove the two-step flow. Instead, show a single form with: resolution status selection (radio or button group at top), optional note textarea, tag selector, and confirm button
- All three statuses show the tag selector
- The note field remains optional for all types

## 5. Widget Realtime Message Deletion

**Problem**: When an attendant deletes a message, the widget only removes it after a page refresh.

**Fix in `src/pages/ChatWidget.tsx`** (around line 390):
- Add a second `.on("postgres_changes", { event: "UPDATE", ... })` handler on the same channel
- On UPDATE, check if `payload.new.deleted_at` is set; if so, remove the message from state

## 6. Custom Fields Display Fix (from previous plan)

**Problem**: "Tickets" custom field renders `[object Object]` character-by-character.

**Fix in `src/components/CustomFieldsDisplay.tsx`**:
- In `ObjectList`: guard `typeof obj === "object" && obj !== null` before `Object.entries(obj)`, fallback to `String(obj)`
- In `JsonDisplay`: same guard
- In `formatComplexValue` auto-detect (line 147): verify `typeof resolved[0] === "object" && resolved[0] !== null && typeof resolved[0] !== "string"` before routing to `ObjectList`

## Files to Change

1. `src/components/chat/ChatInput.tsx` — Draft per room + click-outside dismiss for popups
2. `src/components/chat/ProactiveChatDialog.tsx` — Searchable combobox for company/contact
3. `src/components/chat/CloseRoomDialog.tsx` — Tags available for all resolution types
4. `src/pages/ChatWidget.tsx` — Realtime UPDATE listener for deleted messages
5. `src/components/CustomFieldsDisplay.tsx` — Type guards for non-object values

