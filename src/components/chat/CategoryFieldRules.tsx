import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Loader2 } from "lucide-react";

interface FieldRule {
  id: string;
  category_id: string;
  field_key: string;
  field_value: string;
}

interface FieldDef {
  key: string;
  label: string;
}

interface Props {
  categoryId: string;
  rules: FieldRule[];
  fieldDefs: FieldDef[];
  onChanged: () => void;
}

export function CategoryFieldRules({ categoryId, rules, fieldDefs, onChanged }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState("");
  const [value, setValue] = useState("");
  const [syncing, setSyncing] = useState(false);

  const addRule = async () => {
    if (!selectedKey || !value.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get tenant_id from category
    const { data: catData } = await supabase
      .from("chat_service_categories")
      .select("tenant_id")
      .eq("id", categoryId)
      .single();

    await supabase.from("chat_category_field_rules" as any).insert({
      category_id: categoryId,
      tenant_id: (catData as any)?.tenant_id,
      field_key: selectedKey,
      field_value: value.trim(),
    });

    setValue("");
    toast({ title: t("chat.settings.saved") });
    await syncCompanies(categoryId);
    onChanged();
  };

  const removeRule = async (ruleId: string) => {
    await supabase.from("chat_category_field_rules" as any).delete().eq("id", ruleId);
    toast({ title: t("chat.settings.saved") });
    await syncCompanies(categoryId);
    onChanged();
  };

  const syncCompanies = async (catId: string) => {
    setSyncing(true);
    try {
      // Fetch ALL rules for the tenant (not just this category)
      const { data: allRules } = await supabase
        .from("chat_category_field_rules" as any)
        .select("id, category_id, field_key, field_value");

      // Fetch all companies
      const { data: companies } = await supabase
        .from("contacts")
        .select("id, custom_fields, service_category_id")
        .eq("is_company", true);

      if (!companies) { setSyncing(false); return; }

      const rulesList = ((allRules as unknown) as FieldRule[]) || [];

      for (const company of companies) {
        const cf = (company.custom_fields as Record<string, any>) || {};

        // Find matching category
        let matchedCatId: string | null = null;
        for (const rule of rulesList) {
          const fieldVal = cf[rule.field_key];
          if (fieldVal !== undefined && String(fieldVal) === rule.field_value) {
            matchedCatId = rule.category_id;
            break;
          }
        }

        // Update if changed
        if (matchedCatId && company.service_category_id !== matchedCatId) {
          await supabase
            .from("contacts")
            .update({ service_category_id: matchedCatId } as any)
            .eq("id", company.id);
        } else if (!matchedCatId && company.service_category_id === catId) {
          // Company was in this category via rules but no longer matches — only clear if it was THIS category
          // Check if any rule still targets this company for this category
          const stillMatches = rulesList
            .filter(r => r.category_id === catId)
            .some(r => cf[r.field_key] !== undefined && String(cf[r.field_key]) === r.field_value);
          if (!stillMatches) {
            await supabase
              .from("contacts")
              .update({ service_category_id: null } as any)
              .eq("id", company.id);
          }
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  // Group rules by field_key for display
  const catRules = rules.filter(r => r.category_id === categoryId);
  const defLabel = (key: string) => fieldDefs.find(d => d.key === key)?.label || key;

  return (
    <div>
      <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
        {t("chat.categories.autoRules")}
        {syncing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </p>

      {/* Existing rules */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {catRules.map(rule => (
          <Badge key={rule.id} variant="outline" className="text-xs gap-1">
            {defLabel(rule.field_key)}: "{rule.field_value}"
            <button onClick={() => removeRule(rule.id)} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add rule inline form */}
      {fieldDefs.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("chat.categories.noFieldDefs")}</p>
      ) : (
        <div className="flex items-center gap-1.5">
          <select
            className="text-xs border rounded px-1.5 py-1 bg-background min-w-[120px]"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <option value="">{t("chat.categories.selectField")}</option>
            {fieldDefs.map(d => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
          <Input
            className="h-7 text-xs w-32"
            placeholder={t("chat.categories.fieldValue")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addRule(); }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={addRule}
            disabled={!selectedKey || !value.trim() || syncing}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            {t("chat.categories.addRule")}
          </Button>
        </div>
      )}
    </div>
  );
}
