

# Plan: Fix Search Dropdown + Help Center UI/UX Improvements

## 1. Fix: Search dropdown clipped by hero overflow

**Root cause**: The hero section (`HelpPublicHome.tsx` line 135) has `overflow-hidden`, which clips the search results dropdown that extends below the hero boundary.

**Fix in `src/pages/HelpPublicHome.tsx`**:
- Remove `overflow-hidden` from the hero div
- Move the search bar + dropdown **outside** the hero section into its own `relative` container positioned between hero and collections, so the dropdown can expand freely without clipping
- Alternatively, restructure so the search container is `relative` with a high `z-index` and the hero does not clip it — simplest: remove `overflow-hidden` from the hero wrapper and add it only to the background image layer

## 2. Icon Picker for Collections

**Current state**: The collection form in `HelpCollections.tsx` has a simple text `<Input>` for the icon (line 141). Users must manually type/paste an emoji.

**Improvement in `src/pages/HelpCollections.tsx`**:
- Replace the text input with a visual icon grid picker
- Provide a curated set of ~40 icons organized in categories (e.g., General, Tech, Business, Education, Support, People)
- Icons will be emoji-based for maximum compatibility: 📚 📖 📝 💡 🔧 ⚙️ 🎯 📊 💬 🏠 🔒 🌐 📱 💻 🎨 📦 🚀 ✅ ❓ 📋 🔔 👥 🏢 📈 💰 🛒 📧 🎓 🔍 ⭐ 🏆 🤝 📅 🗂️ 📌 🧩 🛠️ 💎 🌟 🎉
- Display as a grid of clickable buttons, selected icon highlighted with primary color border
- Keep the text input as fallback for custom emoji entry

## 3. Public Help Center UI/UX Refresh

### `src/pages/HelpPublicHome.tsx`
- **Hero**: Softer gradient, slightly reduced vertical padding (py-20 instead of py-24), better subtitle color contrast
- **Search**: Slightly smaller border-radius (xl instead of 2xl) for a cleaner look; dropdown with subtle dividers and smooth animation on appear
- **Collections section**: Add a section title "Coleções" above the grid with a subtle separator; increase card padding slightly; use the collection icon more prominently (larger, with a subtle colored background circle)
- **Recent Articles section**: Add a subtle card wrapper around the list for better visual separation

### `src/components/help/HelpPublicLayout.tsx`
- No structural changes needed, layout is clean

### `src/pages/HelpPublicCollection.tsx`
- Minor: Increase contrast on article count text

### `src/pages/HelpPublicArticle.tsx`
- No changes needed, article page is well-structured

## Files to Change

1. **`src/pages/HelpPublicHome.tsx`** — Fix search overflow, UI polish (hero, collections section, search results)
2. **`src/pages/HelpCollections.tsx`** — Add emoji icon picker grid in the collection create/edit dialog

