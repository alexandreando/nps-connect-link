import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Loader2, Settings2, Database, FileText } from "lucide-react";

interface FieldRule {
  id: string;
  category_id: string;
  field_key: string;
  field_value: string;
  field_source: string;
  operator: string;
}

interface FieldDef {
  key: string;
  label: string;
}

const NATIVE_FIELDS: { key: string; labelKey: string; numeric?: boolean }[] = [
  { key: "name", labelKey: "chat.categories.nativeField.name" },
  { key: "email", labelKey: "chat.categories.nativeField.email" },
  { key: "company_document", labelKey: "chat.categories.nativeField.company_document" },
  { key: "company_sector", labelKey: "chat.categories.nativeField.company_sector" },
  { key: "city", labelKey: "chat.categories.nativeField.city" },
  { key: "state", labelKey: "chat.categories.nativeField.state" },
  { key: "external_id", labelKey: "chat.categories.nativeField.external_id" },
  { key: "service_priority", labelKey: "chat.categories.nativeField.service_priority" },
  { key: "cs_status", labelKey: "chat.categories.nativeField.cs_status" },
  { key: "mrr", labelKey: "chat.categories.nativeField.mrr", numeric: true },
  { key: "contract_value", labelKey: "chat.categories.nativeField.contract_value", numeric: true },
  { key: "health_score", labelKey: "chat.categories.nativeField.health_score", numeric: true },
];

const OPERATORS = [
  { value: "equals", label: "=" },
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "greater_or_equal", label: "≥" },
  { value: "less_or_equal", label: "≤" },
];

const OPERATOR_LABELS: Record<string, string> = {
  equals: "=",
  greater_than: ">",
  less_than: "<",
  greater_or_equal: "≥",
  less_or_equal: "≤",
};

interface Props {
  categoryId: string;
  rules: FieldRule[];
  fieldDefs: FieldDef[];
  onChanged: () => void;
}

export function CategoryFieldRules({ categoryId, rules, fieldDefs, onChanged }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [changed, setChanged] = useState(false);

  // Add rule form state
  const [source, setSource] = useState<"custom" | "native">("custom");
  const [selectedKey, setSelectedKey] = useState("");
  const [operator, setOperator] = useState("equals");
  const [value, setValue] = useState("");

  const catRules = rules.filter(r => r.category_id === categoryId);

  const getFieldLabel = (rule: FieldRule) => {
    if (rule.field_source === "native") {
      const nf = NATIVE_FIELDS.find(f => f.key === rule.field_key);
      return nf ? t(nf.labelKey) : rule.field_key;
    }
    return fieldDefs.find(d => d.key === rule.field_key)?.label || rule.field_key;
  };

  const addRule = async () => {
    if (!selectedKey || !value.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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
      field_source: source,
      operator,
    });

    setValue("");
    setSelectedKey("");
    setOperator("equals");
    setChanged(true);
    toast({ title: t("chat.settings.saved") });
    onChanged();
  };

  const removeRule = async (ruleId: string) => {
    await supabase.from("chat_category_field_rules" as any).delete().eq("id", ruleId);
    setChanged(true);
    toast({ title: t("chat.settings.saved") });
    onChanged();
  };

  const handleCloseDialog = async (open: boolean) => {
    if (!open && changed) {
      await syncCompanies();
      setChanged(false);
    }
    setDialogOpen(open);
  };

  const syncCompanies = async () => {
    setSyncing(true);
    try {
      const { data: allRules } = await supabase
        .from("chat_category_field_rules" as any)
        .select("id, category_id, field_key, field_value, field_source, operator");

      const { data: companies } = await supabase
        .from("contacts")
        .select("id, custom_fields, service_category_id, name, email, company_document, company_sector, city, state, external_id, service_priority, cs_status, mrr, contract_value, health_score")
        .eq("is_company", true);

      if (!companies) { setSyncing(false); return; }
      const rulesList = ((allRules as unknown) as FieldRule[]) || [];

      for (const company of companies) {
        const cf = (company.custom_fields as Record<string, any>) || {};
        let matchedCatId: string | null = null;

        for (const rule of rulesList) {
          const rawVal = rule.field_source === "native"
            ? (company as any)[rule.field_key]
            : cf[rule.field_key];

          if (rawVal === undefined || rawVal === null) continue;

          if (matchValue(rawVal, rule.field_value, rule.operator)) {
            matchedCatId = rule.category_id;
            break;
          }
        }

        if (matchedCatId && company.service_category_id !== matchedCatId) {
          await supabase.from("contacts").update({ service_category_id: matchedCatId } as any).eq("id", company.id);
        } else if (!matchedCatId && company.service_category_id === categoryId) {
          const stillMatches = rulesList
            .filter(r => r.category_id === categoryId)
            .some(r => {
              const rv = r.field_source === "native" ? (company as any)[r.field_key] : cf[r.field_key];
              return rv !== undefined && rv !== null && matchValue(rv, r.field_value, r.operator);
            });
          if (!stillMatches) {
            await supabase.from("contacts").update({ service_category_id: null } as any).eq("id", company.id);
          }
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  const fieldOptions = source === "native"
    ? NATIVE_FIELDS.map(f => ({ key: f.key, label: t(f.labelKey) }))
    : fieldDefs;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7 gap-1.5"
        onClick={() => setDialogOpen(true)}
      >
        <Settings2 className="h-3 w-3" />
        {t("chat.categories.autoRules")} ({catRules.length})
        {syncing && <Loader2 className="h-3 w-3 animate-spin" />}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("chat.categories.rulesDialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing rules */}
            {catRules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("chat.categories.noRulesYet")}</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {catRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2 text-sm bg-secondary/50 rounded-md px-3 py-1.5">
                    {rule.field_source === "native" ? (
                      <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium">{getFieldLabel(rule)}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {OPERATOR_LABELS[rule.operator] || "="}
                    </Badge>
                    <span className="text-muted-foreground">"{rule.field_value}"</span>
                    <button onClick={() => removeRule(rule.id)} className="ml-auto hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add rule form */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-medium">{t("chat.categories.addNewRule")}</p>

              {/* Source selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("chat.categories.fieldSource")}</Label>
                <RadioGroup
                  value={source}
                  onValueChange={(v) => { setSource(v as "custom" | "native"); setSelectedKey(""); }}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="custom" id="src-custom" />
                    <Label htmlFor="src-custom" className="text-xs cursor-pointer">{t("chat.categories.sourceCustom")}</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="native" id="src-native" />
                    <Label htmlFor="src-native" className="text-xs cursor-pointer">{t("chat.categories.sourceNative")}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Field + Operator + Value */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t("chat.categories.selectField")}</Label>
                  <select
                    className="w-full text-xs border rounded-md px-2 py-1.5 bg-background"
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                  >
                    <option value="">{t("chat.categories.selectField")}</option>
                    {fieldOptions.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="w-16 space-y-1">
                  <Label className="text-xs">{t("chat.categories.operator")}</Label>
                  <select
                    className="w-full text-xs border rounded-md px-2 py-1.5 bg-background"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t("chat.categories.fieldValue")}</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder={t("chat.categories.fieldValue")}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addRule(); }}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5"
                  onClick={addRule}
                  disabled={!selectedKey || !value.trim() || syncing}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function matchValue(rawVal: any, ruleValue: string, operator: string): boolean {
  if (operator === "equals") {
    return String(rawVal) === ruleValue;
  }
  const numA = Number(rawVal);
  const numB = Number(ruleValue);
  if (isNaN(numA) || isNaN(numB)) return false;
  switch (operator) {
    case "greater_than": return numA > numB;
    case "less_than": return numA < numB;
    case "greater_or_equal": return numA >= numB;
    case "less_or_equal": return numA <= numB;
    default: return String(rawVal) === ruleValue;
  }
}
