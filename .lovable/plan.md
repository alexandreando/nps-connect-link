

# Plan: Improve Workspace Responsiveness for Small PC Screens

## Problem

On smaller PC resolutions (1024px-1366px), the workspace can overflow horizontally due to fixed minimum panel sizes, wide header buttons, and the info panel competing for space. The `ResizablePanelGroup` enforces `minSize` percentages that, on narrow viewports, still demand too many pixels.

## Changes

### `src/pages/AdminWorkspace.tsx`

**1. Adjust ResizablePanel min/max sizes based on viewport width:**
- Room list panel: reduce `minSize` from 18 to 15 on compact screens
- Chat panel: reduce `minSize` from 35 to 30 on compact/tablet
- Info panel: reduce `minSize` from 22 to 18 on compact, and auto-close on screens < 1024px (tablet)

**2. Compact header actions for all small desktop screens:**
- When `isCompact` (< 1280px): already groups Transfer into dropdown — also group the Tags button into the same dropdown to save more horizontal space
- On very compact screens (< 1024px), hide text labels on "Reabrir" and "Resolvido" buttons (icon-only)

**3. Prevent horizontal overflow on outer container:**
- Ensure the root `div` uses `w-full max-w-full overflow-hidden` to hard-prevent any horizontal scroll
- Add `min-w-0` to the chat panel inner container to allow flex children to shrink properly

**4. Reduce padding on compact screens:**
- Reduce the `p-1.5 pl-3 pt-3 pb-3` padding on panel containers to `p-1` on compact screens to reclaim space

### `src/components/chat/ChatRoomList.tsx`

**5. Prevent internal horizontal overflow:**
- Add `overflow-hidden` and `min-w-0` to the root container
- The search input placeholder is very long ("Buscar por nome, email ou mensagem...") — truncate naturally via CSS (already should, but ensure the container constrains it)

### `src/components/chat/ChatInput.tsx`

**6. Ensure input area doesn't cause overflow:**
- Add `min-w-0` to the input wrapper to ensure it shrinks properly within flex layouts

### `src/components/AppSidebar.tsx`

**7. Auto-collapse sidebar on small PC resolutions:**
- Pass `defaultOpen={false}` to `SidebarProvider` when viewport width < 1024px, keeping the sidebar collapsed by default on small PCs
- This is handled in `SidebarLayout.tsx` where `SidebarProvider` is rendered

### `src/components/SidebarLayout.tsx`

**8. Default sidebar collapsed on small screens:**
- Initialize `sidebarOpen` state based on viewport width: `false` when `window.innerWidth < 1024`

## Files to Change

1. `src/pages/AdminWorkspace.tsx` — Panel sizes, header compaction, overflow prevention
2. `src/components/chat/ChatRoomList.tsx` — `min-w-0` and `overflow-hidden` on root
3. `src/components/SidebarLayout.tsx` — Default sidebar collapsed on < 1024px

