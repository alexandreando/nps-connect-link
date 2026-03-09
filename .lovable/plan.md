

## Fix: Contadores de chat descasados — Trigger COUNT-based + Frontend resync

### Analise de performance

Dados atuais do banco:
- **403 salas totais**, apenas **6 ativas** — COUNT filtrado é trivial
- Indice existente em `chat_rooms(status)` — ajuda no filtro
- **Falta** indice em `chat_rooms(attendant_id)` — precisa criar
- 8 triggers já existem em `chat_rooms` — adicionar 1 trigger COUNT-based não impacta

**Veredicto**: A abordagem COUNT-based é a melhor solução. Com ~6 salas ativas, o COUNT executa em < 1ms. Mesmo com 10x crescimento (60 salas ativas), continua irrelevante. A alternativa incremental é mais rápida em teoria mas falha na prática (drift comprovado).

### Mudanças

**1. Migration SQL**

- Criar indice composto `(attendant_id, status)` para otimizar o COUNT
- Substituir trigger `decrement_attendant_active_conversations` por `resync_attendant_counter_on_room_change` que faz COUNT real
- Resync one-time para corrigir valores atuais

```sql
-- Index for fast COUNT
CREATE INDEX IF NOT EXISTS idx_chat_rooms_attendant_status 
ON chat_rooms(attendant_id, status) WHERE status IN ('active', 'waiting');

-- Replace incremental trigger with COUNT-based
CREATE OR REPLACE FUNCTION resync_attendant_counter_on_room_change() ...
-- Does COUNT(*) for OLD.attendant_id and NEW.attendant_id

-- Drop old trigger, create new one
-- One-time resync all counters
```

**2. Frontend: `SidebarDataContext.tsx`**

- Simplificar `handleRoomChange`: chamar `resyncCounts()` com debounce 1s (em vez de patches incrementais)
- Simplificar `handleAttendantChange`: manter patch de `status`/`display_name`, usar `active_conversations` do evento Realtime diretamente (agora confiável pois o trigger é COUNT-based)
- Reduzir intervalo de resync fallback de 60s para 30s

### Por que é a melhor opção

| Critério | Incremental (atual) | COUNT-based (proposto) |
|----------|---------------------|----------------------|
| Precisão | Drift comprovado | Impossível driftar |
| Performance trigger | ~0.1ms | ~0.3ms (6 rows) |
| Performance frontend | Patches falham | Resync 2 queries leves |
| Complexidade | Alta (edge cases) | Baixa (sempre correto) |

