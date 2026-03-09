

## Plano: Mover CSAT para Chat, remover Relatórios e Customer Success

### 1. Mover CSAT para dentro do menu Chat

**Arquivo**: `src/components/AppSidebar.tsx`

Adicionar item CSAT no grupo Chat (após Broadcasts, antes de Configurações — entre linhas ~429 e ~431):

```tsx
{hasPermission("chat.reports", "view") && (
  <SidebarMenuItem>
    <SidebarMenuButton onClick={() => navigate("/admin/csat")} isActive={isActive("/admin/csat")} tooltip="CSAT" className={cn("pl-6", isActive("/admin/csat") ? activeItemCls : "hover:bg-sidebar-accent")}>
      <Star className="h-4 w-4" /><span>CSAT</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
)}
```

### 2. Remover seção Relatórios inteira

**Arquivo**: `src/components/AppSidebar.tsx`
- Deletar todo o bloco `{/* Reports */}` (linhas 445-497)
- Remover variáveis `showCSReports`, `showChatReports`, `showReports` (linhas 98-100)
- Remover state `reportsOpen` / `handleReportsOpen`

### 3. Remover seção Customer Success inteira

**Arquivo**: `src/components/AppSidebar.tsx`
- Deletar todo o bloco `{/* Customer Success */}` (linhas 226-270 aprox.)
- Remover variável `showCS` (linha 97), `csItems` (linhas 117-120), `csOpen`/`handleCsOpen`
- Atualizar lógica do logo click (linhas 142-146, 158-162): remover fallback para `cs-dashboard`

**Arquivo**: `src/App.tsx`
- Remover rotas `/cs-dashboard`, `/cs-trails`, `/cs-health`, `/cs-churn`, `/cs-financial`
- Remover imports lazy de `CSDashboard`, `CSTrailsPage`, `CSHealthPage`, `CSChurnPage`, `CSFinancialPage`

### 4. Limpeza de imports não utilizados

Remover imports de ícones que ficarem órfãos (ex: `Heart`, `TrendingDown`, `DollarSign`, `Route`) do AppSidebar.

