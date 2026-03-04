

# Plano: Header com nome do atendente + status "Pendente" no widget

## Mudanca 1: Nome do atendente no titulo do header

**Arquivo:** `src/pages/ChatWidget.tsx`, linha 1195

Quando `phase === "chat"` e `attendantName` existe, o titulo principal (linha de cima) deve mostrar o nome do atendente em vez de `companyName`.

```
// Antes:
<p ...>{companyName}</p>

// Depois:
<p ...>{phase === "chat" && attendantName ? attendantName : companyName}</p>
```

## Mudanca 2: Status "Pendente" em vez de "Encerrado" no historico

**Arquivo:** `src/pages/ChatWidget.tsx`

Na funcao `statusLabel` (linha 1031), receber tambem o `resolution_status` para diferenciar:

Na linha 1318 onde `statusLabel(room.status)` e chamado, passar tambem o resolution_status. Quando `status === "closed"` e `resolution_status === "pending"`, retornar "Pendente" em vez de "Encerrado". Remover o badge separado "Pendente" (linha 1320-1322) ja que o label principal ja indicara isso.

```
// statusLabel atualizado:
const statusLabel = (status: string, resolutionStatus?: string) => {
  if (status === "closed" && resolutionStatus === "pending") return "Pendente";
  switch (status) {
    case "waiting": return "Aguardando";
    case "active": return "Em andamento";
    case "closed": return "Encerrado";
    default: return status;
  }
};
```

Atualizar chamada: `statusLabel(room.status, (room as any).resolution_status)`

Remover o badge laranja duplicado das linhas 1320-1322, pois o icone + label ja mostrarao "Pendente".

## Arquivos impactados

1. `src/pages/ChatWidget.tsx` — 3 pontos de edicao (header titulo, statusLabel, remocao badge duplicado)

