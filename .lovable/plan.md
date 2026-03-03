
# Fix: Resolver Tenant-Aware + NPSChat.update() Resilience

## Problem Identified

The edge function `resolve-chat-visitor` is working correctly at the code level. I verified by calling it with the correct API key (`chat_a3293c4` from tenant `bd0d9374`) and confirmed the data was saved:
- mrr: 66.97 (was 0)
- employee_in_contract: 39 (was 0)
- perfil_company: "E" (was empty)
- tickets: full array with 3 objects (was empty)

The failure is caused by a **tenant/API key mismatch**:
- The company_contact `marco@mamlabs.com.br` is in tenant `bd0d9374` (user `b2c2a60d`, API key `chat_a3293c4`)
- The widget embed uses API key `chat_b6a0eff` which belongs to tenant `9d0baccf` (user `9338bdb8`)
- The resolver filters by `user_id` from the API key, so it can't find the contact, returns `visitor_token: null`
- `NPSChat.update()` checks `resolvedToken && apiKey` before sending -- since token is null, the POST silently never fires

## Fixes Required

### 1. Edge function: Use tenant_id instead of user_id for CRM lookups

Currently, `resolve-chat-visitor` filters company_contacts and contacts by `user_id` (the API key owner). This breaks in multi-user tenants where one user creates the API key and another imports the contacts. Both tables already have a `tenant_id` column.

**Changes in `supabase/functions/resolve-chat-visitor/index.ts`:**
- After getting `userId` from the API key and `tenantId` from `user_profiles`, use `tenant_id` for all lookups:
  - `company_contacts` lookup by email: `.eq("tenant_id", tenantId)` instead of `.eq("user_id", userId)`
  - `company_contacts` lookup by external_id: `.eq("tenant_id", tenantId)` instead of `.eq("user_id", userId)`
  - `contacts` lookup by external_id in `upsertCompany`: `.eq("tenant_id", tenantId)` instead of `.eq("user_id", userId)`
- When creating new records (company_contacts, contacts), include `tenant_id` alongside `user_id`
- Pass `tenantId` to all helper functions (`findOrCreateVisitor`, `upsertCompany`)

### 2. Edge function: Handle company_id/company_name in the no-external_id branch

Currently, when `external_id` is empty but `company_id` and `company_name` are provided, the code at lines 99-124 only calls `applyCustomData` if `existingCC.company_id` already exists. It never calls `upsertCompany` to create/link a company.

**Fix:**
- In the `!external_id` + `name && email` + `existingCC` branch (line 99), add company upsert logic:
  - If `company_id || company_name` are provided, call `upsertCompany` to create or find the company
  - If the company_contact doesn't have `company_id`, link it
  - Then apply `custom_data` to the resolved company

### 3. NPSChat.update() resilience in embed script

Currently, `update()` silently does nothing when `resolvedToken` is null (line 327). This means if the initial resolve failed for any reason, all subsequent data updates are lost.

**Fix in `public/nps-chat-embed.js`:**
- Remove the `resolvedToken` check from the update condition -- always send to the resolver if `apiKey` exists
- The resolver already handles creating contacts/visitors when they don't exist, so this is safe
- Add console.warn logging when the update call fails for debugging

### 4. Deploy and verify

- Deploy the updated `resolve-chat-visitor` edge function
- Verify the NPSChat.update() flow works end-to-end

---

## Technical Details

### File: `supabase/functions/resolve-chat-visitor/index.ts`

Key changes:
- All helper functions receive `tenantId` parameter
- `company_contacts` queries use `.eq("tenant_id", tenantId)` instead of `.eq("user_id", userId)`
- `contacts` queries use `.eq("tenant_id", tenantId)` instead of `.eq("user_id", userId)`
- New record inserts include `tenant_id: tenantId`
- The `!external_id` branch now calls `upsertCompany` when `company_id`/`company_name` are present

### File: `public/nps-chat-embed.js`

Key change in the `update()` function:
```text
// Before:
if (resolvedToken && apiKey) { ... }

// After:
if (apiKey) { ... }
```
This ensures data updates are always sent even if the initial identity resolution didn't produce a token.
