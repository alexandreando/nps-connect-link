

# Plan: Enhanced Auto-Assignment Rules — Native Fields, Comparison Operators, Dedicated UI

## Current State
- Rules only support custom fields (`custom_fields` JSONB keys) with exact match
- Rules are shown inline per category card — no dedicated management flow

## Changes

### 1. Database Migration: Add `field_source` and `operator` columns

Add two columns to `chat_category_field_rules`:
- `field_source text NOT NULL DEFAULT 'custom'` — values: `'custom'` (custom_fields JSONB) or `'native'` (direct column on contacts table)
- `operator text NOT NULL DEFAULT 'equals'` — values: `'equals'`, `'greater_than'`, `'less_than'`, `'greater_or_equal'`, `'less_or_equal'`

### 2. UI Redesign: `CategoryFieldRules.tsx`

Replace the current inline form with a button-triggered dialog flow:

- **Category card** shows a summary button: "Regras automáticas (N)" that opens a dialog
- **Dialog** shows:
  - List of existing rules as rows: `[source icon] field_label operator value [X remove]`
  - "Add rule" form at bottom:
    1. **Source selector**: "Campo customizado" / "Campo nativo" (radio or select)
    2. **Field selector**: 
       - If custom: dropdown from `chat_custom_field_definitions` (existing)
       - If native: dropdown with relevant native fields: `name`, `email`, `company_document`, `company_sector`, `city`, `state`, `external_id`, `service_priority`, `cs_status`, `mrr`, `contract_value`, `health_score`
    3. **Operator selector**: `=`, `>`, `<`, `>=`, `<=`
    4. **Value input**: text field
    5. **Add button**
  - Rules display grouped by field for readability
  - Sync runs on dialog close if changes were made

### 3. Sync Logic Update: `syncCompanies` in `CategoryFieldRules.tsx`

Update the matching logic to:
- For `field_source === 'custom'`: read from `company.custom_fields[field_key]`
- For `field_source === 'native'`: read from `company[field_key]` (direct column)
- Apply the operator:
  - `equals`: string comparison `String(val) === rule.field_value`
  - `greater_than/less_than/etc`: numeric comparison `Number(val) > Number(rule.field_value)`

The contacts query will need to fetch the native fields used in rules.

### 4. Edge Function Update: `resolve-chat-visitor/index.ts`

Update `applyCategoryFieldRules` to handle `field_source` and `operator` columns with the same logic.

### 5. Translations

Add new keys for: source labels, operator labels, dialog title, native field labels.

## Files

1. **Migration** — `ALTER TABLE chat_category_field_rules ADD COLUMN field_source, ADD COLUMN operator`
2. **`src/components/chat/CategoryFieldRules.tsx`** — Full rewrite: button + dialog, source/operator selectors, updated sync
3. **`src/components/chat/CategoriesTab.tsx`** — Pass additional native field data to `CategoryFieldRules`, update contacts query to include native fields
4. **`supabase/functions/resolve-chat-visitor/index.ts`** — Handle new columns in rule matching
5. **`src/locales/pt-BR.ts`** and **`src/locales/en.ts`** — New translation keys

