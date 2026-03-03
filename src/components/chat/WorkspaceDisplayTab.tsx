import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SectionLabel } from "@/components/ui/section-label";
import { Separator } from "@/components/ui/separator";

interface WorkspaceSettings {
  ws_sort_order: string;
  ws_show_metrics: boolean;
  ws_show_contact_data: boolean;
  ws_show_custom_fields: boolean;
  ws_show_timeline: boolean;
  ws_show_recent_chats: boolean;
  ws_show_company_external_id: boolean;
  ws_show_contact_external_id: boolean;
  ws_recent_chats_count: number;
}

const DEFAULTS: WorkspaceSettings = {
  ws_sort_order: "last_message",
  ws_show_metrics: true,
  ws_show_contact_data: true,
  ws_show_custom_fields: true,
  ws_show_timeline: true,
  ws_show_recent_chats: true,
  ws_show_company_external_id: true,
  ws_show_contact_external_id: true,
  ws_recent_chats_count: 5,
};

const WorkspaceDisplayTab = () => {
  const { toast } = useToast();
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [ws, setWs] = useState<WorkspaceSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_settings")
        .select("id, ws_sort_order, ws_show_metrics, ws_show_contact_data, ws_show_custom_fields, ws_show_timeline, ws_show_recent_chats, ws_show_company_external_id, ws_show_contact_external_id, ws_recent_chats_count")
        .maybeSingle();
      if (data) {
        const d = data as any;
        setSettingsId(d.id);
        setWs({
          ws_sort_order: d.ws_sort_order ?? DEFAULTS.ws_sort_order,
          ws_show_metrics: d.ws_show_metrics ?? DEFAULTS.ws_show_metrics,
          ws_show_contact_data: d.ws_show_contact_data ?? DEFAULTS.ws_show_contact_data,
          ws_show_custom_fields: d.ws_show_custom_fields ?? DEFAULTS.ws_show_custom_fields,
          ws_show_timeline: d.ws_show_timeline ?? DEFAULTS.ws_show_timeline,
          ws_show_recent_chats: d.ws_show_recent_chats ?? DEFAULTS.ws_show_recent_chats,
          ws_show_company_external_id: d.ws_show_company_external_id ?? DEFAULTS.ws_show_company_external_id,
          ws_show_contact_external_id: d.ws_show_contact_external_id ?? DEFAULTS.ws_show_contact_external_id,
          ws_recent_chats_count: d.ws_recent_chats_count ?? DEFAULTS.ws_recent_chats_count,
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (patch: Partial<WorkspaceSettings>) => {
    const updated = { ...ws, ...patch };
    setWs(updated);
    if (!settingsId) return;
    await supabase.from("chat_settings").update(patch as any).eq("id", settingsId);
    toast({ title: "Configurações salvas" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ordenação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordenação da Lista de Chats</CardTitle>
          <CardDescription>Defina como os chats devem ser ordenados na lista do workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={ws.ws_sort_order} onValueChange={(v) => save({ ws_sort_order: v })}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_message">Última mensagem (padrão)</SelectItem>
              <SelectItem value="wait_time">Tempo de espera</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Seções do Side Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seções do Painel Lateral</CardTitle>
          <CardDescription>Escolha quais seções exibir no painel de informações do visitante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-metrics">Métricas (Health Score, MRR, NPS)</Label>
            <Switch id="ws-metrics" checked={ws.ws_show_metrics} onCheckedChange={(v) => save({ ws_show_metrics: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-contact">Dados do Contato</Label>
            <Switch id="ws-contact" checked={ws.ws_show_contact_data} onCheckedChange={(v) => save({ ws_show_contact_data: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-custom">Campos Customizados</Label>
            <Switch id="ws-custom" checked={ws.ws_show_custom_fields} onCheckedChange={(v) => save({ ws_show_custom_fields: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-timeline">Timeline</Label>
            <Switch id="ws-timeline" checked={ws.ws_show_timeline} onCheckedChange={(v) => save({ ws_show_timeline: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-recent">Chats Recentes</Label>
            <Switch id="ws-recent" checked={ws.ws_show_recent_chats} onCheckedChange={(v) => save({ ws_show_recent_chats: v })} />
          </div>
        </CardContent>
      </Card>

      {/* IDs Externos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificadores Externos</CardTitle>
          <CardDescription>Controle a exibição de IDs externos no painel lateral.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-company-ext">External ID da Empresa</Label>
            <Switch id="ws-company-ext" checked={ws.ws_show_company_external_id} onCheckedChange={(v) => save({ ws_show_company_external_id: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-contact-ext">External ID do Contato</Label>
            <Switch id="ws-contact-ext" checked={ws.ws_show_contact_external_id} onCheckedChange={(v) => save({ ws_show_contact_external_id: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Chats recentes count */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quantidade de Chats Recentes</CardTitle>
          <CardDescription>Quantos chats recentes exibir no painel lateral por página.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={String(ws.ws_recent_chats_count)} onValueChange={(v) => save({ ws_recent_chats_count: Number(v) })}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 chats</SelectItem>
              <SelectItem value="10">10 chats</SelectItem>
              <SelectItem value="15">15 chats</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceDisplayTab;
