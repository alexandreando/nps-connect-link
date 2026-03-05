

# Plan: Help Center Redesign (Customizable) + Article Count Fix + Widget Pending UX + Reopen Auto-Assignment

## 1. Help Center UI/UX Redesign — Using Existing Customizable Settings

All visual changes will leverage the existing `help_site_settings` fields so administrators can control the look via HelpSettings. No new database columns needed — the current schema already supports: `brand_primary_color`, `brand_secondary_color`, `hero_image_url`, `hero_overlay_opacity`, `header_bg_color`, `header_links_json`, `footer_bg_color`, `footer_logo_url`, `footer_text`, `footer_links_json`, `footer_social_json`, `favicon_url`, `brand_logo_url`.

### 1a. `HelpPublicLayout.tsx` — Modern header/footer
- Header: Add `backdrop-blur-lg` effect, subtle bottom shadow, smoother transitions. Use `brand_primary_color` for active link accent. Better mobile responsiveness.
- Footer: Cleaner grid layout, better spacing, use `brand_secondary_color` for subtle accents where configured. Social icons with hover color transitions using `brand_primary_color`.

### 1b. `HelpPublicHome.tsx` — Hero + collections redesign
- Hero: Use `brand_primary_color` for gradient (already done, but refine to be more subtle and modern). Larger, pill-shaped search bar with brand-colored focus ring. Better hero image overlay blending.
- Collection cards: Add left accent border using `brand_primary_color` on hover. Subtle shadow elevation effect. Better icon sizing and spacing. Article count badge uses `brand_primary_color`.
- Recent articles: Add subtle left border accent on hover using `brand_primary_color`. Better typography spacing.

### 1c. `HelpPublicCollection.tsx` — Collection page
- Refined breadcrumb with pill background
- Collection header with gradient accent strip using `brand_primary_color`
- Article list with hover accent and better spacing

### 1d. `HelpPublicArticle.tsx` — Article page
- Better breadcrumb styling
- Improved article typography (larger title, refined subtitle)
- Better `prose` styling for content area
- Add last-updated / reading time metadata display

All colors derive from the existing `brand_primary_color` and `brand_secondary_color` settings, meaning admins control the entire look from HelpSettings without code changes.

---

## 2. Article Count Bug Fix

### `HelpPublicHome.tsx`
**Problem:** Article count is derived from the `limit(10)` recent articles query. Collections with articles beyond the top 10 show 0.
**Fix:** Add a separate query for counting — fetch only `collection_id` from ALL published articles (no limit), then build `countMap` from that. Keep the limit-10 query only for the recent articles display.

### `HelpCollections.tsx`
**Problem:** Admin count query at line 47 doesn't filter by `status = 'published'`, so drafts and archived articles inflate the count.
**Fix:** Add `.eq("status", "published")` to the article count query.

---

## 3. Widget Pending State — Show Reopen Buttons

**Problem:** When a chat moves to `pending`, the widget stays on the `chat` phase (correct), but the UI still shows the chat input instead of reopen/back buttons. The user has no actionable controls.

**Fix in `ChatWidget.tsx` line 486:** When `resolution_status === "pending"`, instead of doing nothing:
- Set `viewTranscriptResolutionStatus` to `"pending"`
- Switch to `phase: "viewTranscript"` — this phase already renders the "Retomar conversa" and "Voltar ao histórico" buttons
- Call `fetchMessages(roomId)` to refresh the message list

---

## 4. Client Reopen Auto-Assigns to Original Attendant

**Problem:** `handleReopenChat` sets room to `status: "waiting"` and calls `checkRoomAssignment`. The attendant must manually click "Atender". Expected: if the original attendant is available, assign directly.

**Fix in `handleReopenChat` (line 731-753):**
1. Before reopening, fetch the room's current `attendant_id`
2. If `attendant_id` exists, check their `attendant_profiles` status and capacity
3. If online and under capacity: update room to `status: "active"` (keeping `attendant_id`), increment `active_conversations`, set phase to "chat", call `fetchMessages`, and trigger welcome via `assign-chat-room`
4. If unavailable: fall back to current behavior (`status: "waiting"`, `attendant_id: null`, `checkRoomAssignment`)

---

## Files Impacted

1. `src/components/help/HelpPublicLayout.tsx` — Modern header/footer using existing brand settings
2. `src/pages/HelpPublicHome.tsx` — Redesigned hero + collections + fix article count query
3. `src/pages/HelpPublicCollection.tsx` — Redesigned collection page
4. `src/pages/HelpPublicArticle.tsx` — Redesigned article page
5. `src/pages/HelpCollections.tsx` — Fix article count filter (published only)
6. `src/pages/ChatWidget.tsx` — Pending shows viewTranscript phase + client reopen auto-assigns

