

# Plano: Reposicionar SidebarTrigger + Responsividade do Workspace

## 1. Mover SidebarTrigger para ao lado do logo

**Arquivo:** `src/components/SidebarLayout.tsx`

Atualmente existe um `<header>` dedicado (linha 234-236) com altura fixa de `h-14` apenas para o `SidebarTrigger`. Isso desperdiça espaço vertical em todas as páginas.

**Solução:** Remover o `<header>` inteiro e mover o `SidebarTrigger` para dentro do `SidebarHeader` do `AppSidebar.tsx`, posicionado ao lado do logo.

**Arquivo:** `src/components/AppSidebar.tsx` (linha 136-158)

No `SidebarHeader`, adicionar o `SidebarTrigger` ao lado do logo. Quando a sidebar está expandida, mostrar logo + trigger lado a lado. Quando colapsada, o trigger fica abaixo do ícone (ou substitui o ícone como toggle).

```
<SidebarHeader className="border-b border-sidebar-border px-2 py-3">
  <div className="flex items-center justify-between w-full">
    <button onClick={...} className="flex items-center ...">
      {collapsed ? <img icon /> : <img logo />}
    </button>
    <SidebarTrigger className="..." />
  </div>
</SidebarHeader>
```

**Arquivo:** `src/components/SidebarLayout.tsx`
- Remover linhas 234-236 (`<header>...</header>`)
- Atualizar o `h-[calc(100vh-3.5rem)]` no workspace para `h-screen` (ou `100vh`) já que não há mais header

## 2. Responsividade do Workspace

**Problemas atuais:**
- `minSize={15}` no painel de lista (15% de tela pequena pode ser ~150px, apertado)
- `minSize={30}` no painel de chat central — em tela de 1024px com 3 painéis, isso pode não caber
- O header do chat com múltiplos botões (Transferir, Tags, Encerrar, painel toggle) estoura em telas menores
- O `isMobile` só ativa abaixo de 768px — tablets de 768-1024px ficam no layout desktop com painéis apertados

**Melhorias propostas:**

**a) Breakpoint intermediário (tablet):** Criar um check para telas entre 768-1024px. Nesse range, esconder o painel de info por padrão e usar `minSize` menores nos painéis.

**b) Botões do header do chat responsivos:** Em telas menores, agrupar ações em um dropdown menu (⋯) em vez de mostrar todos os botões inline. Manter apenas o botão principal visível (Atender/Encerrar) e colocar Transferir, Tags no dropdown.

**c) Ajustar minSize dos painéis:**
- Lista: `minSize={18}` (garante ~200px em 1024)
- Chat: `minSize={35}` (garante espaço para mensagens)
- Info: `minSize={22}` (mais compacto)

**d) Auto-collapse info panel** em telas < 1280px de largura.

## Arquivos impactados

1. `src/components/AppSidebar.tsx` — Adicionar SidebarTrigger no header da sidebar
2. `src/components/SidebarLayout.tsx` — Remover header dedicado, ajustar calc de altura
3. `src/pages/AdminWorkspace.tsx` — Responsividade dos painéis e botões do header do chat

