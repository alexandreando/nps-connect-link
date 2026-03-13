import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock, Star, Users, TrendingUp, Timer, Eye, ChevronDown, ChevronRight as ChevronRightIcon, ArrowUp, ArrowDown, AlertTriangle, Zap, TrendingDown, RefreshCw, Radio, Save, Trash2, Plus, X, ChevronLeft, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats, DashboardFilters } from "@/hooks/useDashboardStats";
import { useAttendantQueues } from "@/hooks/useChatRealtime";
import { ReadOnlyChatDialog } from "@/components/chat/ReadOnlyChatDialog";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionLabel } from "@/components/ui/section-label";
import { FilterBar } from "@/components/ui/filter-bar";
import { ChartCard } from "@/components/ui/chart-card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Tag } from "lucide-react";
import { format } from "date-fns";

// Saved views
interface SavedView {
  id: string;
  name: string;
  filters: DashboardFilters;
}

const SAVED_VIEWS_KEY = "dashboard-saved-views";
const MAX_VIEWS = 5;

function loadSavedViews(): SavedView[] {
  try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) ?? "[]"); } catch { return []; }
}
function persistViews(views: SavedView[]) {
  localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
}

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<DashboardFilters>({ period: "today" });
  const [attendantOptions, setAttendantOptions] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [companyOptions, setCompanyOptions] = useState<{ id: string; name: string }[]>([]);
  const [contactOptions, setContactOptions] = useState<{ id: string; name: string; companyId: string }[]>([]);
  const { stats, loading, refetch, realtimeEnabled, toggleRealtime } = useDashboardStats(filters);
  const { attendants, unassignedRooms, loading: queuesLoading } = useAttendantQueues();

  const [teams, setTeams] = useState<{ id: string; name: string; memberIds: string[] }[]>([]);
  const [prevStats, setPrevStats] = useState<{ totalChats: number; avgCsat: number | null; resolutionRate: number | null } | null>(null);
  const [readOnlyRoom, setReadOnlyRoom] = useState<{ id: string; name: string } | null>(null);
  const [currentAttendantId, setCurrentAttendantId] = useState<string | null>(null);
  const [expandedAttendant, setExpandedAttendant] = useState<string | null>(null);
  const [attendantRooms, setAttendantRooms] = useState<Record<string, { id: string; visitor_name: string; status: string; created_at: string }[]>>({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Saved views state
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  // Paginated conversations
  const [convPage, setConvPage] = useState(0);
  const [convRooms, setConvRooms] = useState<any[]>([]);
  const [convTotal, setConvTotal] = useState(0);
  const [convLoading, setConvLoading] = useState(false);
  const CONV_PAGE_SIZE = 20;

  useEffect(() => { setLastRefresh(new Date()); }, [stats]);

  useEffect(() => {
    const fetchMeta = async () => {
      const [attRes, catRes, tagRes, teamRes, memberRes, compRes, ccRes] = await Promise.all([
        supabase.from("attendant_profiles").select("id, display_name, user_id"),
        supabase.from("chat_service_categories").select("id, name").order("name"),
        supabase.from("chat_tags").select("id, name").order("name"),
        supabase.from("chat_teams").select("id, name").order("name"),
        supabase.from("chat_team_members").select("team_id, attendant_id"),
        supabase.from("contacts").select("id, name").eq("is_company", true).order("name"),
        supabase.from("company_contacts").select("id, name, company_id").order("name"),
      ]);
      if (attRes.data) {
        setAttendantOptions(attRes.data.map(a => ({ id: a.id, name: a.display_name })));
        const mine = attRes.data.find(a => a.user_id === user?.id);
        if (mine) setCurrentAttendantId(mine.id);
      }
      setCategories(catRes.data ?? []);
      setTags(tagRes.data ?? []);
      setCompanyOptions((compRes.data ?? []).map(c => ({ id: c.id, name: c.name })));
      setContactOptions((ccRes.data ?? []).map(c => ({ id: c.id, name: c.name, companyId: c.company_id })));
      const teamData = teamRes.data ?? [];
      const memberData = memberRes.data ?? [];
      setTeams(teamData.map(team => ({
        id: team.id, name: team.name,
        memberIds: memberData.filter(m => m.team_id === team.id).map(m => m.attendant_id),
      })));
    };
    fetchMeta();
  }, [user?.id]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    setConvLoading(true);
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;
    if (filters.dateFrom) startDate = new Date(filters.dateFrom).toISOString();
    else {
      switch (filters.period) {
        case "today": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); break;
        case "week": { const w = new Date(now); w.setDate(w.getDate() - 7); startDate = w.toISOString(); break; }
        case "month": { const m = new Date(now); m.setDate(m.getDate() - 30); startDate = m.toISOString(); break; }
      }
    }
    if (filters.dateTo) { const d = new Date(filters.dateTo); d.setDate(d.getDate() + 1); endDate = d.toISOString(); }

    const from = convPage * CONV_PAGE_SIZE;
    const to = from + CONV_PAGE_SIZE - 1;

    let query = supabase.from("chat_rooms")
      .select("id, status, resolution_status, created_at, closed_at, csat_score, visitor_id, attendant_id, chat_visitors!visitor_id(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lt("created_at", endDate);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.attendantIds && filters.attendantIds.length > 0) query = query.in("attendant_id", filters.attendantIds);
    if (filters.contactId) query = query.eq("contact_id", filters.contactId);
    if (filters.companyContactId) query = query.eq("company_contact_id", filters.companyContactId);

    const { data, count } = await query;
    if (data) {
      const attIds = [...new Set(data.filter(r => r.attendant_id).map(r => r.attendant_id!))];
      let attMap = new Map<string, string>();
      if (attIds.length > 0) {
        const { data: atts } = await supabase.from("attendant_profiles").select("id, display_name").in("id", attIds);
        attMap = new Map(atts?.map(a => [a.id, a.display_name]) ?? []);
      }
      setConvRooms(data.map((r: any) => ({
        ...r,
        visitor_name: r.chat_visitors?.name ?? "Visitante",
        attendant_name: r.attendant_id ? (attMap.get(r.attendant_id) ?? "—") : "—",
      })));
    }
    setConvTotal(count ?? 0);
    setConvLoading(false);
  }, [filters, convPage]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { setConvPage(0); }, [filters]);

  useEffect(() => {
    const fetchPrevStats = async () => {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      switch (filters.period) {
        case "today":
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate = new Date(endDate); startDate.setDate(startDate.getDate() - 1); break;
        case "week":
          endDate = new Date(now); endDate.setDate(endDate.getDate() - 7);
          startDate = new Date(endDate); startDate.setDate(startDate.getDate() - 7); break;
        case "month":
          endDate = new Date(now); endDate.setDate(endDate.getDate() - 30);
          startDate = new Date(endDate); startDate.setDate(startDate.getDate() - 30); break;
        default: setPrevStats(null); return;
      }
      let query = supabase.from("chat_rooms").select("id, status, csat_score, resolution_status");
      if (startDate) query = query.gte("created_at", startDate.toISOString());
      if (endDate) query = query.lt("created_at", endDate.toISOString());
      const { data } = await query;
      if (!data || data.length === 0) { setPrevStats({ totalChats: 0, avgCsat: null, resolutionRate: null }); return; }
      const withCsat = data.filter(r => r.csat_score != null);
      const avgCsat = withCsat.length > 0 ? Number((withCsat.reduce((s, r) => s + (r.csat_score ?? 0), 0) / withCsat.length).toFixed(1)) : null;
      const closed = data.filter(r => r.status === "closed");
      const resolved = closed.filter(r => r.resolution_status === "resolved").length;
      const resolutionRate = closed.length > 0 ? Math.round((resolved / closed.length) * 100) : null;
      setPrevStats({ totalChats: data.length, avgCsat, resolutionRate });
    };
    fetchPrevStats();
  }, [filters.period]);

  const handleExpandAttendant = async (attendantId: string) => {
    if (expandedAttendant === attendantId) { setExpandedAttendant(null); return; }
    setExpandedAttendant(attendantId);
    if (!attendantRooms[attendantId]) {
      const { data } = await supabase.from("chat_rooms")
        .select("id, status, created_at, visitor_id, chat_visitors!visitor_id(name)")
        .eq("attendant_id", attendantId).in("status", ["active", "waiting"])
        .order("created_at", { ascending: false });
      if (data) {
        const rooms = data.map((r: any) => ({ id: r.id, visitor_name: r.chat_visitors?.name ?? "Visitante", status: r.status, created_at: r.created_at }));
        setAttendantRooms(prev => ({ ...prev, [attendantId]: rooms }));
      }
    }
  };

  const getDelta = (current: number, prev: number | null | undefined) => {
    if (prev == null || prev === 0) return null;
    return Math.round(((current - prev) / prev) * 100);
  };

  const handleRoomClick = (roomId: string, attendantId: string | null, visitorName: string) => {
    if (attendantId === currentAttendantId) navigate(`/admin/workspace/${roomId}`);
    else setReadOnlyRoom({ id: roomId, name: visitorName });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "<1min";
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h`;
  };

  const lastRefreshLabel = () => {
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diff < 10) return "agora";
    if (diff < 60) return `${diff}s atrás`;
    return `${Math.floor(diff / 60)}min atrás`;
  };

  const capacityPercent = (active: number, max: number) => max === 0 ? 0 : Math.round((active / max) * 100);

  // Saved views
  const handleSaveView = () => {
    if (!newViewName.trim() || savedViews.length >= MAX_VIEWS) return;
    const view: SavedView = { id: crypto.randomUUID(), name: newViewName.trim(), filters: { ...filters } };
    const updated = [...savedViews, view];
    setSavedViews(updated);
    persistViews(updated);
    setShowSaveDialog(false);
    setNewViewName("");
  };

  const handleDeleteView = (id: string) => {
    const updated = savedViews.filter(v => v.id !== id);
    setSavedViews(updated);
    persistViews(updated);
  };

  const handleApplyView = (view: SavedView) => {
    setFilters({ ...view.filters });
  };

  const hasActiveFilters = (filters.attendantIds?.length ?? 0) > 0 || (filters.teamIds?.length ?? 0) > 0 || (filters.tagIds?.length ?? 0) > 0 || !!filters.categoryId || !!filters.contactId || !!filters.companyContactId || !!filters.dateFrom || !!filters.dateTo || !!filters.search || !!filters.status || !!filters.priority;

  const clearFilters = () => setFilters({ period: filters.period });

  const getTeamGroups = () => {
    const assignedIds = new Set<string>();
    const groups: { teamName: string; teamId: string | null; members: typeof attendants; summary: { online: number; activeTotal: number; avgCapacity: number } }[] = [];
    teams.forEach(team => {
      const members = attendants.filter(a => team.memberIds.includes(a.id));
      if (members.length === 0) return;
      members.forEach(m => assignedIds.add(m.id));
      const online = members.filter(m => m.status === "online" || m.status === "available").length;
      const activeTotal = members.reduce((s, m) => s + m.active_count, 0);
      const totalCap = members.reduce((s, m) => s + m.max_conversations, 0);
      groups.push({ teamName: team.name, teamId: team.id, members, summary: { online, activeTotal, avgCapacity: totalCap > 0 ? Math.round((activeTotal / totalCap) * 100) : 0 } });
    });
    const unassigned = attendants.filter(a => !assignedIds.has(a.id));
    if (unassigned.length > 0) {
      const online = unassigned.filter(m => m.status === "online" || m.status === "available").length;
      const activeTotal = unassigned.reduce((s, m) => s + m.active_count, 0);
      const totalCap = unassigned.reduce((s, m) => s + m.max_conversations, 0);
      groups.push({ teamName: t("chat.dashboard.no_team"), teamId: null, members: unassigned, summary: { online, activeTotal, avgCapacity: totalCap > 0 ? Math.round((activeTotal / totalCap) * 100) : 0 } });
    }
    return groups;
  };

  const resolutionColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800";
      case "pending": return "bg-orange-100 text-orange-800";
      case "escalated": return "bg-red-100 text-red-800";
      case "inactive": return "bg-muted text-muted-foreground";
      case "archived": return "bg-blue-100 text-blue-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const skillBadge = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "senior": return <Badge className="text-[9px] bg-purple-100 text-purple-700 border-purple-200">Senior</Badge>;
      case "pleno": return <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200">Pleno</Badge>;
      default: return <Badge className="text-[9px] bg-gray-100 text-gray-600 border-gray-200">Junior</Badge>;
    }
  };

  const metricCards = [
    { title: t("chat.dashboard.active_chats"), value: stats.activeChats, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", delta: null as number | null },
    { title: t("chat.dashboard.waiting"), value: stats.waitingChats, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", delta: null as number | null },
    { title: t("chat.dashboard.closed_today"), value: stats.chatsToday, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", delta: getDelta(stats.totalChats, prevStats?.totalChats) },
    { title: t("chat.dashboard.online_attendants"), value: stats.onlineAttendants, icon: Users, color: "text-green-500", bg: "bg-green-500/10", delta: null as number | null },
    { title: t("chat.dashboard.csat_avg"), value: stats.avgCsat != null ? `${stats.avgCsat}/5` : "—", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10", delta: prevStats && stats.avgCsat != null && prevStats.avgCsat != null ? getDelta(stats.avgCsat, prevStats.avgCsat) : null },
    { title: t("chat.gerencial.resolution_rate"), value: stats.resolutionRate != null ? `${stats.resolutionRate}%` : "—", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", delta: prevStats && stats.resolutionRate != null && prevStats.resolutionRate != null ? getDelta(stats.resolutionRate, prevStats.resolutionRate) : null },
    { title: t("chat.dashboard.avg_wait_time"), value: stats.avgWaitMinutes != null ? `${stats.avgWaitMinutes}min` : "—", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-500/10", delta: null as number | null },
    { title: t("chat.gerencial.avg_first_response"), value: stats.avgFirstResponseMinutes != null ? `${stats.avgFirstResponseMinutes}min` : "—", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10", delta: null as number | null },
    { title: t("chat.gerencial.unresolved_chats"), value: stats.unresolvedChats, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", delta: null as number | null },
    { title: t("chat.gerencial.avg_resolution"), value: stats.avgResolutionMinutes != null ? `${stats.avgResolutionMinutes}min` : "—", icon: Timer, color: "text-indigo-500", bg: "bg-indigo-500/10", delta: null as number | null },
    { title: t("chat.dashboard.abandonment_rate"), value: stats.abandonmentRate != null ? `${stats.abandonmentRate}%` : "—", icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", delta: null as number | null },
  ];

  const teamGroups = getTeamGroups();
  const convTotalPages = Math.ceil(convTotal / CONV_PAGE_SIZE);

  const renderAttendantRow = (att: typeof attendants[0]) => {
    const pct = capacityPercent(att.active_count, att.max_conversations);
    const isExpanded = expandedAttendant === att.id;
    return (
      <Collapsible key={att.id} open={isExpanded} onOpenChange={() => handleExpandAttendant(att.id)} asChild>
        <>
          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => handleExpandAttendant(att.id)}>
            <TableCell className="text-[13px] font-medium">
              <div className="flex items-center gap-1.5">
                <CollapsibleTrigger asChild>
                  <span className="shrink-0">{isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}</span>
                </CollapsibleTrigger>
                <span className={`h-2 w-2 rounded-full shrink-0 ${att.status === "online" ? "bg-green-500" : att.status === "busy" ? "bg-amber-500" : "bg-gray-400"}`} />
                {att.display_name}
                {att.user_id === user?.id && <span className="text-[11px] text-muted-foreground ml-1">(você)</span>}
              </div>
            </TableCell>
            <TableCell>{skillBadge((att as any).skill_level)}</TableCell>
            <TableCell>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${att.status === "online" || att.status === "available" ? "bg-green-100 text-green-700" : att.status === "busy" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                {att.status}
              </span>
            </TableCell>
            <TableCell className="text-center text-[13px]">{att.waiting_count}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Progress value={pct} className="h-1.5" style={{ ['--progress-color' as string]: pct < 60 ? 'hsl(142 71% 45%)' : pct < 80 ? 'hsl(48 96% 53%)' : 'hsl(0 84% 60%)' }} />
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">{att.active_count}/{att.max_conversations}</span>
              </div>
            </TableCell>
          </TableRow>
          <CollapsibleContent asChild>
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <div className="bg-muted/30 p-3 space-y-1">
                  {(attendantRooms[att.id] ?? []).length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Nenhuma conversa ativa</p>
                  ) : (
                    (attendantRooms[att.id] ?? []).map(room => (
                      <div key={room.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); handleRoomClick(room.id, att.id, room.visitor_name); }}>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[13px]">{room.visitor_name}</span>
                          <Badge variant={room.status === "active" ? "default" : "secondary"} className="text-[10px]">{room.status}</Badge>
                          <span className="text-[11px] text-muted-foreground">{timeAgo(room.created_at)}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1"><Eye className="h-3 w-3" />Ver</Button>
                      </div>
                    ))
                  )}
                </div>
              </TableCell>
            </TableRow>
          </CollapsibleContent>
        </>
      </Collapsible>
    );
  };

  // Top Tags total for percentages
  const tagTotal = stats.topTags.reduce((s, t) => s + t.count, 0);
  const remainingTags = stats.topTags.length > 10 ? stats.topTags.length - 10 : 0;
  const displayTags = stats.topTags.slice(0, 10);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader title={t("chat.dashboard.title")} subtitle={t("chat.dashboard.subtitle")} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />Atualizar
            </Button>
            <Button
              variant={realtimeEnabled ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-[11px]"
              onClick={toggleRealtime}
            >
              <Radio className={`h-3.5 w-3.5 ${realtimeEnabled ? "animate-pulse" : ""}`} />
              Tempo real: {realtimeEnabled ? "Ligado" : "Desligado"}
            </Button>
            <span className="text-[10px] text-muted-foreground/60">Atualizado {lastRefreshLabel()}</span>
          </div>
        </div>

        {/* Filters */}
        <FilterBar>
          <Select value={filters.period} onValueChange={(v) => setFilters(f => ({ ...f, period: v as DashboardFilters["period"] }))}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("chat.gerencial.today")}</SelectItem>
              <SelectItem value="week">{t("chat.gerencial.week")}</SelectItem>
              <SelectItem value="month">{t("chat.gerencial.month_period")}</SelectItem>
              <SelectItem value="all">{t("chat.gerencial.all_time")}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" className="w-[140px] h-9" value={filters.dateFrom ?? ""} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value || null }))} placeholder="De" />
          <Input type="date" className="w-[140px] h-9" value={filters.dateTo ?? ""} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value || null }))} placeholder="Até" />
          <SearchableMultiSelect
            label={t("chat.gerencial.filter_by_attendant")}
            options={attendantOptions.map(a => ({ value: a.id, label: a.name }))}
            selected={filters.attendantIds ?? []}
            onChange={(v) => setFilters(f => ({ ...f, attendantIds: v }))}
            placeholder={t("chat.gerencial.filter_by_attendant")}
          />
          {teams.length > 0 && (
            <SearchableMultiSelect
              label="Time"
              options={teams.map(t => ({ value: t.id, label: t.name }))}
              selected={filters.teamIds ?? []}
              onChange={(v) => setFilters(f => ({ ...f, teamIds: v }))}
              placeholder="Time"
            />
          )}
          <Select value={filters.status ?? "all"} onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? null : v }))}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.all_status")}</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="waiting">Na Fila</SelectItem>
              <SelectItem value="closed">Encerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.priority ?? "all"} onValueChange={(v) => setFilters(f => ({ ...f, priority: v === "all" ? null : v }))}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.all_categories")}</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <SearchableMultiSelect
              label={t("chat.gerencial.filter_by_category")}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              selected={filters.categoryId ? [filters.categoryId] : []}
              onChange={(v) => setFilters(f => ({ ...f, categoryId: v[0] ?? null }))}
              placeholder={t("chat.gerencial.filter_by_category")}
            />
          )}
          {tags.length > 0 && (
            <SearchableMultiSelect
              label="Tag"
              options={tags.map(tag => ({ value: tag.id, label: tag.name }))}
              selected={filters.tagIds ?? []}
              onChange={(v) => setFilters(f => ({ ...f, tagIds: v }))}
              placeholder="Tag"
            />
          )}
          {companyOptions.length > 0 && (
            <SearchableMultiSelect
              label="Empresa"
              options={companyOptions.map(c => ({ value: c.id, label: c.name }))}
              selected={filters.contactId ? [filters.contactId] : []}
              onChange={(v) => setFilters(f => ({ ...f, contactId: v[0] ?? null, companyContactId: null }))}
              placeholder="Empresa"
            />
          )}
          {contactOptions.length > 0 && (
            <SearchableMultiSelect
              label="Contato"
              options={(filters.contactId ? contactOptions.filter(c => c.companyId === filters.contactId) : contactOptions).map(c => ({ value: c.id, label: c.name }))}
              selected={filters.companyContactId ? [filters.companyContactId] : []}
              onChange={(v) => setFilters(f => ({ ...f, companyContactId: v[0] ?? null }))}
              placeholder="Contato"
            />
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-[11px] text-muted-foreground" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />Limpar
            </Button>
          )}
        </FilterBar>

        {/* Saved Views */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium">Visões salvas:</span>
          {savedViews.map(view => (
            <div key={view.id} className="group relative">
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 pr-7" onClick={() => handleApplyView(view)}>
                <Save className="h-3 w-3" />{view.name}
              </Button>
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDeleteView(view.id); }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={savedViews.length >= MAX_VIEWS}
                >
                  <Plus className="h-3 w-3" />Salvar visão
                </Button>
              </TooltipTrigger>
              {savedViews.length >= MAX_VIEWS && (
                <TooltipContent><p>Máximo de {MAX_VIEWS} visões</p></TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div>
              <SectionLabel>Métricas do Período</SectionLabel>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {metricCards.map(card => (
                  <MetricCard key={card.title} title={card.title} value={card.value} icon={card.icon} iconColor={card.color} iconBgColor={card.bg} delta={card.delta} />
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t("chat.gerencial.conversations_per_day")} isEmpty={stats.chartData.length === 0} emptyText={t("chat.gerencial.no_data")}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="total" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t("chat.gerencial.csat_evolution")} isEmpty={stats.csatByDay.length === 0} emptyText={t("chat.gerencial.no_data")}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.csatByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t("chat.gerencial.peak_hours")} isEmpty={!stats.chatsByHour.some(h => h.count > 0)} emptyText={t("chat.gerencial.no_data")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chatsByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip labelFormatter={(h) => `${h}:00`} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t("chat.gerencial.resolution_distribution")} isEmpty={stats.resolutionDistribution.length === 0} emptyText={t("chat.gerencial.no_data")}>
                <div className="flex flex-wrap gap-4 h-full items-center justify-center">
                  {stats.resolutionDistribution.map(item => (
                    <div key={item.status} className="flex items-center gap-2">
                      <Badge className={resolutionColor(item.status)}>
                        {item.status === "resolved" ? t("chat.history.resolved") : item.status === "escalated" ? t("chat.history.escalated") : t("chat.history.pending_status")}
                      </Badge>
                      <span className="text-2xl font-semibold tabular-nums">{item.count}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Redesigned Top Tags */}
              <ChartCard title="Top Tags" isEmpty={stats.topTags.length === 0} emptyText={t("chat.gerencial.no_data")}>
                <div className="space-y-1.5 overflow-y-auto h-full py-1">
                  {displayTags.map((tag, i) => {
                    const maxCount = displayTags[0]?.count ?? 1;
                    const pct = tagTotal > 0 ? Math.round((tag.count / tagTotal) * 100) : 0;
                    return (
                      <TooltipProvider key={tag.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2.5 group cursor-default px-1 py-1 rounded-md hover:bg-muted/50 transition-colors">
                              <span className="text-[11px] text-muted-foreground w-5 text-right tabular-nums font-medium">#{i + 1}</span>
                              <div className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: tag.color }} />
                              <span className="text-[13px] font-medium truncate min-w-0 flex-shrink" style={{ maxWidth: 120 }}>{tag.name}</span>
                              {i === 0 && <Badge className="text-[8px] h-4 px-1 bg-amber-100 text-amber-700 border-amber-200 shrink-0"><Award className="h-2.5 w-2.5 mr-0.5" />Top</Badge>}
                              <div className="flex-1 min-w-[60px]">
                                <div className="h-3 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(tag.count / maxCount) * 100}%`, background: `linear-gradient(90deg, ${tag.color}CC, ${tag.color})` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[13px] font-bold tabular-nums w-8 text-right">{tag.count}</span>
                              <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{pct}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">{tag.name} — {tag.count} conversas — {pct}% do total</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                  {remainingTags > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-1">+{remainingTags} outras tags</p>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* Attendant Performance Table */}
            {stats.attendantPerformance.length > 0 && (
              <div>
                <SectionLabel>{t("chat.gerencial.attendant_performance")}</SectionLabel>
                <Card className="rounded-xl border border-white/[0.06] bg-card shadow-sm">
                  <CardContent className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("chat.gerencial.attendant")}</TableHead>
                          <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("chat.dashboard.team_col")}</TableHead>
                          <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">{t("chat.gerencial.chats_col")}</TableHead>
                          <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">{t("chat.gerencial.csat_col")}</TableHead>
                          <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">{t("chat.gerencial.resolution_col")}</TableHead>
                          <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">{t("chat.gerencial.avg_time_col")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.attendantPerformance.map(att => {
                          const attId = attendantOptions.find(a => a.name === att.name)?.id;
                          const teamName = teams.find(t => attId && t.memberIds.includes(attId))?.name ?? "—";
                          return (
                            <TableRow key={att.name}>
                              <TableCell className="text-[13px] font-medium">{att.name}</TableCell>
                              <TableCell className="text-[13px] text-muted-foreground">{teamName}</TableCell>
                              <TableCell className="text-[13px] text-right tabular-nums font-medium">{att.chats}</TableCell>
                              <TableCell className="text-[13px] text-right tabular-nums font-medium">{att.csat != null ? `${att.csat}/5` : "—"}</TableCell>
                              <TableCell className="text-[13px] text-right tabular-nums font-medium">{att.resolutionRate != null ? `${att.resolutionRate}%` : "—"}</TableCell>
                              <TableCell className="text-[13px] text-right tabular-nums font-medium">{att.avgResolution != null ? `${att.avgResolution}min` : "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Paginated Conversations List */}
            <div>
              <SectionLabel>Conversas do Período ({convTotal})</SectionLabel>
              <Card className="rounded-xl border border-white/[0.06] bg-card shadow-sm">
                <CardContent className="p-4">
                  {convLoading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
                  ) : convRooms.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground text-center py-8">Nenhuma conversa encontrada</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Atendente</TableHead>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Resolução</TableHead>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-center">CSAT</TableHead>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Duração</TableHead>
                              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {convRooms.map((room: any) => {
                              const dur = room.closed_at && room.created_at ? Math.floor((new Date(room.closed_at).getTime() - new Date(room.created_at).getTime()) / 60000) : null;
                              return (
                                <TableRow key={room.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setReadOnlyRoom({ id: room.id, name: room.visitor_name })}>
                                  <TableCell className="text-[13px] font-medium">{room.visitor_name}</TableCell>
                                  <TableCell className="text-[13px]">{room.attendant_name}</TableCell>
                                  <TableCell>
                                    <Badge variant={room.status === "active" ? "default" : room.status === "closed" ? "secondary" : "outline"} className="text-[10px]">{room.status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={resolutionColor(room.resolution_status ?? "pending")} >{room.resolution_status ?? "pending"}</Badge>
                                  </TableCell>
                                  <TableCell className="text-center text-[13px] tabular-nums">
                                    {room.csat_score != null ? <span className="flex items-center justify-center gap-0.5"><Star className="h-3 w-3 fill-current text-yellow-500" />{room.csat_score}</span> : "—"}
                                  </TableCell>
                                  <TableCell className="text-[13px] tabular-nums">
                                    {dur != null ? (dur < 60 ? `${dur}min` : `${Math.floor(dur / 60)}h${dur % 60}min`) : "—"}
                                  </TableCell>
                                  <TableCell className="text-[13px] tabular-nums whitespace-nowrap">{room.created_at ? format(new Date(room.created_at), "dd/MM HH:mm") : "—"}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      {convTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[11px] text-muted-foreground">Página {convPage + 1} de {convTotalPages}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={convPage === 0} onClick={() => setConvPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" disabled={convPage >= convTotalPages - 1} onClick={() => setConvPage(p => p + 1)}><ChevronRightIcon className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Real-time Status by Team */}
            <div>
              <SectionLabel>Status em Tempo Real</SectionLabel>
              {queuesLoading ? (
                <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
              ) : (
                <div className="space-y-4">
                  {teamGroups.length === 0 ? (
                    <Card className="rounded-xl border border-white/[0.06] bg-card shadow-sm">
                      <CardContent className="py-6 text-center text-[13px] text-muted-foreground">Nenhum atendente cadastrado</CardContent>
                    </Card>
                  ) : (
                    teamGroups.map(group => (
                      <Card key={group.teamId ?? "none"} className="rounded-xl border border-white/[0.06] bg-card shadow-sm">
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                          <p className="text-sm font-medium">{group.teamName}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />{group.summary.online} online</span>
                            <span>·</span>
                            <span>{group.summary.activeTotal} {t("chat.dashboard.active_conversations")}</span>
                            <span>·</span>
                            <span>{t("chat.dashboard.capacity")}: {group.summary.avgCapacity}%</span>
                          </div>
                        </div>
                        <CardContent className="px-4 pb-4 pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("chat.gerencial.attendant")}</TableHead>
                                <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("chat.dashboard.skill_level")}</TableHead>
                                <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-center">{t("chat.dashboard.in_queue")}</TableHead>
                                <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground w-[200px]">{t("chat.dashboard.capacity")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.members.map(att => renderAttendantRow(att))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {unassignedRooms.length > 0 && (
                    <Card className="rounded-xl border border-white/[0.06] bg-card shadow-sm">
                      <div className="px-4 pt-4 pb-2"><p className="text-sm font-medium">{t("chat.dashboard.unassigned_queue")}</p></div>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="space-y-1">
                          {unassignedRooms.map(room => (
                            <div key={room.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleRoomClick(room.id, null, room.visitor_name)}>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[13px]">{room.visitor_name}</span>
                                <span className="text-[11px] text-muted-foreground">{timeAgo(room.created_at)} atrás</span>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1"><Eye className="h-3 w-3" />Ver</Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ReadOnlyChatDialog roomId={readOnlyRoom?.id ?? null} visitorName={readOnlyRoom?.name ?? ""} open={!!readOnlyRoom} onOpenChange={(open) => !open && setReadOnlyRoom(null)} />

      {/* Save View Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Salvar Visão</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Nome da visão (ex: Hoje + Time A)"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              maxLength={40}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">{savedViews.length}/{MAX_VIEWS} visões salvas</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSaveView} disabled={!newViewName.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
