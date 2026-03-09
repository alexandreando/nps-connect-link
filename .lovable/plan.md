

## Limpeza de CSAT — 28 salas identificadas

Encontrei **28 salas** com CSAT para limpar (incluindo "Ana Teste Cliente" que desta vez apareceu com 1 registro).

### Execução

Uma única operação `UPDATE` via insert tool para nullificar `csat_score` e `csat_comment` nos 28 IDs:

```sql
UPDATE chat_rooms 
SET csat_score = NULL, csat_comment = NULL, updated_at = now()
WHERE id IN (
  'e36a58e9-0c39-4e12-88bd-5fafbd09649d',
  '426ced67-198d-4992-8db2-d6b064f69acf',
  '6a752775-548e-4a01-9565-2cef54d5ea55',
  '9a79ecf6-9ab6-4c65-b070-466d23362972',
  '7ee36768-c702-42d2-b9d2-fc36c93fc05f',
  '400f9792-b042-4f28-99cd-029086139b81',
  'ee6c097e-b41c-4cfd-99e6-0c12cf2c6259',
  '03b2d41f-0801-4e6c-9f28-b9375f99b7cf',
  '92d61464-4bc7-4b44-aa3c-841d93fefb75',
  '4974671a-9075-4dfd-ae9c-f965b71a354c',
  'a4c09bd2-7887-4b0e-b047-e6ff6694aea7',
  'dae572a9-819c-4a95-8f7c-90d9dc5322b8',
  '05154e74-80bd-41a3-8f22-9d5e3e4f19dc',
  '9e6de1ed-5599-4122-8c82-62237c0df994',
  '5e8bcb8b-cf66-4a9b-830d-dc9aca7509cd',
  '3878a9a4-c89c-458b-976b-18da19acb690',
  '4897a58b-51ff-45bd-a9fb-f5b27657d418',
  'cdd0efbe-10f3-43ba-a82f-0ad84265c7a8',
  '8b373663-7324-40a2-9578-df41f9af9b3f',
  'd53d543e-3c9a-4244-b19e-0542ef7ffd27',
  'b38c1f96-4780-4c3a-9740-002e559c7716',
  'd13eece8-0aaf-4a19-b40d-4f7bae181acd',
  '7e386802-1e59-4213-b79a-6d75096f994e',
  'f4a9620e-2542-4594-ae19-6e06306d3f0e',
  '7118e045-cc01-44c3-94f2-a5f59483e051',
  'bacc385a-f778-46d1-8a68-11a6facde71e',
  'cfeb76be-dac3-4a88-a06a-dc7ec5b85bba',
  '759c7827-119d-4606-b4c3-a831983e45fc'
);
```

Nenhuma mudança de código — apenas limpeza de dados via insert tool.

