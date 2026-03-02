import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeamAttendant {
  id: string;
  display_name: string;
  active_count: number;
  user_id: string;
  status: string | null;
}

interface SidebarDataContextType {
  teamAttendants: TeamAttendant[];
  otherTeamAttendants: TeamAttendant[];
  totalActiveChats: number;
  otherTeamsTotalChats: number;
  unassignedCount: number;
  initialized: boolean;
}

const SidebarDataContext = createContext<SidebarDataContextType | undefined>(undefined);

export function SidebarDataProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isMaster, isImpersonating, tenantId } = useAuth();
  const [teamAttendants, setTeamAttendants] = useState<TeamAttendant[]>([]);
  const [otherTeamAttendants, setOtherTeamAttendants] = useState<TeamAttendant[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const initializedForRef = useRef<string | null>(null);

  const totalActiveChats = teamAttendants.reduce((sum, a) => sum + a.active_count, 0) + unassignedCount;
  const otherTeamsTotalChats = otherTeamAttendants.reduce((sum, a) => sum + a.active_count, 0);

  const initializeData = useCallback(async (userId: string, adminStatus: boolean, currentTenantId?: string | null, masterImpersonating?: boolean) => {
    const { data: myProfile } = await supabase
      .from("attendant_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let attendants: any[] = [];
    let myTeamAttendantIds: string[] = [];

    if (masterImpersonating && currentTenantId) {
      const { data } = await supabase
        .from("attendant_profiles")
        .select("id, display_name, user_id, status")
        .eq("tenant_id", currentTenantId);
      attendants = data ?? [];
    } else if (adminStatus) {
      const { data } = await supabase
        .from("attendant_profiles")
        .select("id, display_name, user_id, status");
      attendants = data ?? [];
    } else if (myProfile) {
      const { data: myTeams } = await supabase
        .from("chat_team_members")
        .select("team_id")
        .eq("attendant_id", myProfile.id);
      if (myTeams && myTeams.length > 0) {
        const teamIds = myTeams.map((t: any) => t.team_id);
        const { data: teamMembers } = await supabase
          .from("chat_team_members")
          .select("attendant_id")
          .in("team_id", teamIds);
        const uniqueIds = [...new Set((teamMembers ?? []).map((m: any) => m.attendant_id))];
        myTeamAttendantIds = uniqueIds;
        if (uniqueIds.length > 0) {
          const { data } = await supabase
            .from("attendant_profiles")
            .select("id, display_name, user_id, status")
            .in("id", uniqueIds);
          attendants = data ?? [];
        }
      } else {
        const { data } = await supabase
          .from("attendant_profiles")
          .select("id, display_name, user_id, status")
          .eq("user_id", userId);
        attendants = data ?? [];
        myTeamAttendantIds = (data ?? []).map((a: any) => a.id);
      }
    }

    // Fetch other team attendants for non-admin users with a tenant
    let otherAttendants: any[] = [];
    if (!adminStatus && !masterImpersonating && currentTenantId && myProfile) {
      const { data: allTenant } = await supabase
        .from("attendant_profiles")
        .select("id, display_name, user_id, status")
        .eq("tenant_id", currentTenantId);
      const myIds = new Set(myTeamAttendantIds);
      otherAttendants = (allTenant ?? []).filter((a: any) => !myIds.has(a.id));
    }

    // Fetch active room counts
    let roomsQuery = supabase
      .from("chat_rooms")
      .select("attendant_id")
      .in("status", ["active", "waiting"]);

    if (masterImpersonating && currentTenantId) {
      roomsQuery = roomsQuery.eq("tenant_id", currentTenantId);
    }

    const { data: allActiveRooms } = await roomsQuery;

    let counts: Record<string, number> = {};
    let unassigned = 0;
    (allActiveRooms ?? []).forEach((r: any) => {
      if (r.attendant_id) {
        counts[r.attendant_id] = (counts[r.attendant_id] || 0) + 1;
      } else {
        unassigned++;
      }
    });
    setUnassignedCount(unassigned);

    const sorted = attendants
      .map((a: any) => ({
        id: a.id,
        display_name: a.display_name,
        user_id: a.user_id,
        active_count: counts[a.id] || 0,
        status: a.status ?? null,
      }))
      .sort((a, b) => {
        if (a.user_id === userId) return -1;
        if (b.user_id === userId) return 1;
        return a.display_name.localeCompare(b.display_name);
      });

    setTeamAttendants(sorted);

    const sortedOther = otherAttendants
      .map((a: any) => ({
        id: a.id,
        display_name: a.display_name,
        user_id: a.user_id,
        active_count: counts[a.id] || 0,
        status: a.status ?? null,
      }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

    setOtherTeamAttendants(sortedOther);
    setInitialized(true);
    initializedForRef.current = userId + (currentTenantId ?? '');
  }, []);

  const handleRoomChange = useCallback((payload: any) => {
    const { eventType, new: newRoom, old: oldRoom } = payload;

    const patchAttendants = (setter: React.Dispatch<React.SetStateAction<TeamAttendant[]>>, id: string, delta: number) => {
      setter(prev => prev.map(a =>
        a.id === id ? { ...a, active_count: Math.max(0, a.active_count + delta) } : a
      ));
    };

    const patchBoth = (id: string, delta: number) => {
      patchAttendants(setTeamAttendants, id, delta);
      patchAttendants(setOtherTeamAttendants, id, delta);
    };

    if (eventType === "INSERT") {
      if (newRoom.status === "active" || newRoom.status === "waiting") {
        if (newRoom.attendant_id) {
          patchBoth(newRoom.attendant_id, 1);
        } else {
          setUnassignedCount(prev => prev + 1);
        }
      }
    }

    if (eventType === "UPDATE") {
      const oldStatus = oldRoom.status ?? undefined;
      const oldAttendant = oldRoom.attendant_id ?? undefined;

      if (newRoom.status === "closed" && oldStatus !== "closed") {
        const decrementId = oldAttendant || newRoom.attendant_id;
        if (decrementId) {
          patchBoth(decrementId, -1);
        } else if (oldStatus === undefined || oldStatus === "waiting") {
          setUnassignedCount(prev => Math.max(0, prev - 1));
        }
      } else if (newRoom.attendant_id !== oldAttendant && newRoom.status !== "closed") {
        if (oldAttendant) {
          patchBoth(oldAttendant, -1);
        } else if (oldStatus !== "closed" && oldStatus !== undefined) {
          setUnassignedCount(prev => Math.max(0, prev - 1));
        }
        if (newRoom.attendant_id) {
          patchBoth(newRoom.attendant_id, 1);
        } else {
          setUnassignedCount(prev => prev + 1);
        }
      }
    }

    if (eventType === "DELETE") {
      const oldStatus = oldRoom.status ?? "active";
      const oldAttendant = oldRoom.attendant_id ?? undefined;
      if (oldStatus !== "closed") {
        if (oldAttendant) {
          patchBoth(oldAttendant, -1);
        } else {
          setUnassignedCount(prev => Math.max(0, prev - 1));
        }
      }
    }
  }, []);

  const handleAttendantChange = useCallback((payload: any) => {
    const updated = payload.new as any;
    if (!updated) return;

    const applyToSetter = (setter: React.Dispatch<React.SetStateAction<TeamAttendant[]>>) => {
      if (payload.eventType === "UPDATE") {
        setter(prev => prev.map(a =>
          a.id === updated.id
            ? { ...a, status: updated.status, display_name: updated.display_name }
            : a
        ));
      } else if (payload.eventType === "DELETE") {
        setter(prev => prev.filter(a => a.id !== payload.old?.id));
      }
    };

    if (payload.eventType === "INSERT") {
      // For inserts, we add to teamAttendants if not present (existing behavior)
      setTeamAttendants(prev => {
        if (prev.find(a => a.id === updated.id)) return prev;
        return [...prev, {
          id: updated.id,
          display_name: updated.display_name,
          user_id: updated.user_id,
          active_count: 0,
          status: updated.status ?? null,
        }];
      });
    }

    applyToSetter(setTeamAttendants);
    applyToSetter(setOtherTeamAttendants);
  }, []);

  const resyncCounts = useCallback(async () => {
    const { data: allActiveRooms } = await supabase
      .from("chat_rooms")
      .select("attendant_id")
      .in("status", ["active", "waiting"]);

    let counts: Record<string, number> = {};
    let unassigned = 0;
    (allActiveRooms ?? []).forEach((r: any) => {
      if (r.attendant_id) {
        counts[r.attendant_id] = (counts[r.attendant_id] || 0) + 1;
      } else {
        unassigned++;
      }
    });
    setUnassignedCount(unassigned);
    setTeamAttendants(prev => prev.map(a => ({
      ...a,
      active_count: counts[a.id] || 0,
    })));
    setOtherTeamAttendants(prev => prev.map(a => ({
      ...a,
      active_count: counts[a.id] || 0,
    })));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setTeamAttendants([]);
      setOtherTeamAttendants([]);
      setInitialized(false);
      initializedForRef.current = null;
      return;
    }

    const cacheKey = user.id + (tenantId ?? '');

    if (initializedForRef.current !== cacheKey) {
      setInitialized(false);
      initializeData(user.id, isAdmin, tenantId, isMaster && isImpersonating);
    }

    const roomsChannel = supabase
      .channel("global-sidebar-chat-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_rooms" },
        handleRoomChange
      )
      .subscribe();

    const attendantsChannel = supabase
      .channel("global-sidebar-attendants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendant_profiles" },
        handleAttendantChange
      )
      .subscribe();

    const resyncInterval = setInterval(resyncCounts, 60_000);

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(attendantsChannel);
      clearInterval(resyncInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin, tenantId, isImpersonating]);

  return (
    <SidebarDataContext.Provider value={{ teamAttendants, otherTeamAttendants, totalActiveChats, otherTeamsTotalChats, unassignedCount, initialized }}>
      {children}
    </SidebarDataContext.Provider>
  );
}

export function useSidebarData(): SidebarDataContextType {
  const context = useContext(SidebarDataContext);
  if (!context) {
    throw new Error("useSidebarData must be used within SidebarDataProvider");
  }
  return context;
}
