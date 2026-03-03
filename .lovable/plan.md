

# Fix: Resync Contadores Fantasma + Trigger de Reatribuição

## Situação Atual

| Atendente | `active_conversations` | Rooms reais (active/waiting) |
|-----------|----------------------|------------------------------|
| Ana       | 1                    | 0                            |
| Lucas     | 1                    | 0                            |
| Matheus   | 0                    | 0                            |
| Outros    | 0                    | 0                            |

Ana e Lucas têm contadores fantasma. O trigger `assign_chat_room` já usa corretamente o `capacity_limit` (5) da tabela `chat_assignment_configs` — **não** usa `max_conversations` do perfil. Confirmado, sem necessidade de alteração na UI.

## Causa Raiz

O trigger `decrement_attendant_active_conversations` usa `OLD.attendant_id`. Quando um chat é reatribuído (attendant_id muda de Ana → Matheus) e depois fechado, o decremento vai para Matheus, não para Ana. O incremento original na Ana nunca foi desfeito.

Não existe trigger para tratar mudança de `attendant_id` em salas ativas.

## Solução: Uma Migration SQL

### 1. Resync imediato de todos os contadores

UPDATE `attendant_profiles` SET `active_conversations` = contagem real de rooms em `active`/`waiting` para cada atendente do tenant.

### 2. Novo trigger para reatribuição

Quando `attendant_id` muda em `chat_rooms` e o status não é `closed`:
- Decrementar `active_conversations` do `OLD.attendant_id`
- Incrementar `active_conversations` do `NEW.attendant_id`

### 3. Corrigir trigger de close

O `decrement_attendant_active_conversations` deve usar `NEW.attendant_id` (o atendente no momento do close), não `OLD.attendant_id`.

## Arquivo Impactado

1. **Nova migration SQL** — resync + novo trigger reassignment + fix trigger close

Nenhuma alteração de UI.

