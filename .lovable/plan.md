

# Plan: Fix Auto-Categorization Bug + Add Pagination to Contacts/People Pages

## Issue 1: Auto-Categorization Not Working

**Root cause identified:** The company "Teste Gustavomarqponto" has `perfil_company: B` in `custom_fields` and a rule exists matching `perfil_company = B` → "Fila A, B e C". However, `service_category_id` is NULL.

The problem is that `applyCategoryFieldRules` in the edge function **only runs inside `applyCustomData`**, which only executes when `custom_data` is present in the widget payload. If the company already had the custom field value from a previous session and the widget doesn't re-send it, the categorization never fires.

Additionally, the client-side sync (`syncCompanies` in `CategoryFieldRules.tsx`) only runs when the rules dialog is closed with changes — if the sync failed silently or was never triggered after rule creation, existing companies won't be categorized.

**Fix:**
1. **Edge function (`resolve-chat-visitor`):** Call `applyCategoryFieldRules` independently after company identification, even when no `custom_data` is provided. Add this call in `upsertCompany` after the company is found/created (regardless of custom_data), and also after identifying an existing company via company_contact lookup.
2. **Immediate fix for existing data:** The sync logic already exists; the fix ensures the edge function always checks rules on every visitor resolution.

### Files changed:
- `supabase/functions/resolve-chat-visitor/index.ts` — Call `applyCategoryFieldRules` after every company identification, not just inside `applyCustomData`

---

## Issue 2: Pagination for Contacts and People Pages

Both pages currently load ALL records at once (668+ companies, 777+ contacts), causing slow load times.

### Contacts Page (`src/pages/Contacts.tsx`)
- Add server-side pagination with a page size of 50
- Move the `contacts` query to use `.range(from, to)` for offset-based pagination
- Add pagination controls at the bottom (Previous/Next + page indicator)
- Server-side search: use `.ilike()` filters on name/trade_name/company_document instead of client-side filtering
- Server-side filters: apply sector, state, city, cs_status, priority, health, NPS filters as query parameters
- Fetch filter options (unique sectors, states, etc.) with a separate lightweight query or keep them from the first page load
- Show total count using `.select('*', { count: 'exact', head: false })`

### People Page (`src/pages/People.tsx`)
- Add server-side pagination with `.range(from, to)`, page size of 50
- Already has debounced search — keep that, apply server-side
- Add pagination controls at the bottom
- Use `.select('*', { count: 'exact' })` for total count
- Batch company name lookups only for the current page's contacts (much smaller set)

### Files changed:
- `src/pages/Contacts.tsx` — Server-side pagination, search, and filters
- `src/pages/People.tsx` — Server-side pagination
- `src/locales/pt-BR.ts` and `src/locales/en.ts` — Pagination labels (e.g., "Página X de Y", "Anterior", "Próximo")

