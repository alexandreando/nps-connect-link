

# Fix: Bad Request on Contacts/People Pages for Large Tenants

## Root Cause

The tenant `aloco@aloco.com` has 668 companies and 777 contacts. Both pages build a `.in()` filter with hundreds of UUIDs, generating a request URL that exceeds PostgREST's maximum URL length (~8KB), resulting in a 400 Bad Request.

**Affected code:**

- `Contacts.tsx` line 131-134: `.in("company_id", companyIds)` with up to 668 UUIDs
- `People.tsx` line 80-83: `.in("id", companyIds)` with up to 668 UUIDs

## Fix

Batch the `.in()` calls into chunks of 100 IDs each, then merge results.

### `src/pages/Contacts.tsx`

Replace the single `.in("company_id", companyIds)` call (lines 131-137) with a batched approach:
```typescript
const BATCH_SIZE = 100;
let contactsData: any[] = [];
if (companyIds.length > 0) {
  for (let i = 0; i < companyIds.length; i += BATCH_SIZE) {
    const batch = companyIds.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("company_contacts")
      .select("*")
      .in("company_id", batch);
    if (error) throw error;
    contactsData.push(...(data || []));
  }
}
```

### `src/pages/People.tsx`

Replace the single `.in("id", companyIds)` call (lines 80-83) with the same batched pattern:
```typescript
const BATCH_SIZE = 100;
let companies: any[] = [];
for (let i = 0; i < companyIds.length; i += BATCH_SIZE) {
  const batch = companyIds.slice(i, i + BATCH_SIZE);
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, trade_name")
    .in("id", batch);
  if (error) throw error;
  companies.push(...(data || []));
}
```

### `src/components/chat/CategoryFieldRules.tsx`

The `syncCompanies` function (line 138-141) also queries contacts with `.eq("is_company", true)` and fetches all companies -- this is fine since it doesn't use `.in()`, but the sync iterates and updates one-by-one. No URL-length issue here.

## Files

1. `src/pages/Contacts.tsx` -- batch the company_contacts `.in()` query
2. `src/pages/People.tsx` -- batch the contacts `.in()` query

