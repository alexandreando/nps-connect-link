

# Plan: Auto-Assignment Rules for Categories Based on Custom Fields

## Overview

Add editable rules per category that automatically assign companies based on their custom field values. Rules are fully editable (add/remove fields and values, combine multiple field+value pairs). Changes take effect for new chats opened after the rule is saved.

## 1. Database: New Table `chat_category_field_rules`

```sql
CREATE TABLE public.chat_category_field_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.chat_service_categories(id) ON DELETE CASCADE,
  tenant_id uuid,
  field_key text NOT NULL,
  field_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_category_field_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members manage category field rules"
  ON public.chat_category_field_rules FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
```

Each row = one field+value pair linked to a category. Multiple rows for same category = OR logic (any match assigns the company).

## 2. UI: `CategoriesTab.tsx` — Editable Rules Section

Add a new section per category card: **"Regras automáticas"**

- Display existing rules as editable badges: `campo: valor` with X to remove
- Inline form to add a rule:
  - **Dropdown**: select field key from `chat_custom_field_definitions` (where `target = 'company'`)
  - **Input**: type the value to match
  - **Add button**: saves the rule immediately
- On any add/remove, run a sync that scans all tenant companies and updates their `service_category_id` if they match the updated ruleset
- Rules are fully mutable: users can add new field keys, add new values for existing keys, remove individual rules, or combine different fields for the same category

## 3. Sync Logic (Client-Side in CategoriesTab)

When a rule is added or removed:
1. Fetch all `chat_category_field_rules` for the tenant
2. Fetch all companies (`contacts` where `is_company = true`)
3. For each company, check if `custom_fields->>field_key` matches any rule's `field_value`
4. If matched, update `service_category_id` to that category
5. If a company no longer matches any rule (rule was removed), clear its `service_category_id`

This ensures existing companies are updated when rules change.

## 4. Real-Time for New Chats: `resolve-chat-visitor` Edge Function

After the edge function updates a company's `custom_fields`, add a step:
1. Query `chat_category_field_rules` for the tenant
2. Check if the company's custom fields match any rule
3. If matched, update the company's `service_category_id`

This makes rules effective for new chats immediately — the company gets categorized before the assignment trigger fires.

## Files

1. **Migration** — Create `chat_category_field_rules` table + RLS
2. **`src/components/chat/CategoriesTab.tsx`** — Add editable rules UI, sync on change
3. **`supabase/functions/resolve-chat-visitor/index.ts`** — Auto-categorize on visitor resolution

