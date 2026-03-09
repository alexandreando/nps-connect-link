

## Plano: Corrigir maiúsculas indevidas nos textos em pt-BR da Landing Page

Após revisar os textos em `src/pages/LandingPage.tsx` (objeto `texts["pt-BR"]`), identifiquei palavras com letra maiúscula no meio de frases/labels que não são nomes próprios, siglas ou início de frase.

### Correções no objeto `texts["pt-BR"]` (LandingPage.tsx)

| Linha | Atual | Correto |
|-------|-------|---------|
| 146 | `"Quero Conhecer"` | `"Quero conhecer"` |
| 149 | `"Acesso Antecipado · Vagas Limitadas"` | `"Acesso antecipado · Vagas limitadas"` |
| 158 | `"Seu Nome *"` | `"Seu nome *"` |
| 159 | `"Email Corporativo *"` | `"Email corporativo *"` |
| 161 | `"Quero Conhecer"` | `"Quero conhecer"` |
| 212 | `"Tempo de Resposta"` | `"Tempo de resposta"` |
| 213 | `"Score Médio"` | `"Score médio"` |
| 214 | `"Artigos Úteis"` | `"Artigos úteis"` |
| 215 | `"Volume de Tickets"` | `"Volume de tickets"` |
| 218 | `"Perguntas Frequentes"` | `"Perguntas frequentes"` |
| 230 | `"Acesso Antecipado"` | `"Acesso antecipado"` |
| 231 | `"Seja um dos Primeiros a Usar o Journey"` | `"Seja um dos primeiros a usar o Journey"` |
| 245 | `"Plataforma Completa"` | `"Plataforma completa"` |
| 248 | `"Acesso Antecipado"` | `"Acesso antecipado"` |
| 252 | `"Política de Privacidade"` | `"Política de privacidade"` |
| 253 | `"Termos de Uso"` | `"Termos de uso"` |

**Nota:** Siglas (NPS, CS, CRM, CSAT, LGPD, MRR) e nomes próprios (Journey, Help Center, Round Robin) permanecem em maiúscula.

### Escopo
- **1 arquivo editado:** `src/pages/LandingPage.tsx`
- Apenas alterações de texto, sem mudanças de layout ou lógica

