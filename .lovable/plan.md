

## Plano: Remover menções de "acesso antecipado" e aumentar logo na sidebar

### 1. Remover menções textuais de "early access" / "acesso antecipado"

**Arquivos:** `src/pages/LandingPage.tsx` e `src/pages/JourneyPage.tsx`

Substituições nos textos (ambos idiomas):

| Atual | Novo |
|-------|------|
| `heroBadge: "Early Access · Limited Spots"` | `heroBadge: "Support · NPS · Help Center"` |
| `heroBadge: "Acesso antecipado · Vagas limitadas"` | `heroBadge: "Atendimento · NPS · Help Center"` |
| `socialSub: "Average results from early access teams"` | `socialSub: "Average results from teams using Journey"` |
| `socialSub: "Resultados médios de times em early access"` | `socialSub: "Resultados médios de times que usam o Journey"` |
| FAQ "No. Early access is free..." | "No. Getting started is free and doesn't require payment information." |
| FAQ "Não. O acesso antecipado é gratuito..." | "Não. Começar é gratuito e não exige informações de pagamento." |
| `formLabel: "Early Access"` | `formLabel: "Get Started"` |
| `formLabel: "Acesso antecipado"` | `formLabel: "Comece agora"` |
| `formH2: "Be the First to Access Journey"` | `formH2: "Start using Journey today"` |
| `formH2: "Seja um dos primeiros a usar o Journey"` | `formH2: "Comece a usar o Journey hoje"` |
| `formSub` (both langs) | Trocar "limited group" / "grupo limitado" por texto genérico de onboarding |
| `formFootnote` (both langs) | Trocar "early users" / "usuários selecionados" por texto genérico |
| `successSub: "...early access invite"` | `"We'll reach out soon to get you started."` |
| `successSub: "...convite"` | `"Entraremos em contato em breve."` |
| `footerCompanyLinks: "Early Access"` | `"Começar"` / `"Get Started"` |
| JourneyPage: mesmas chaves equivalentes | Mesmas correções |

### 2. Aumentar logo na sidebar (área logada)

**Arquivo:** `src/components/AppSidebar.tsx`

No `SidebarHeader` (estado expandido, linha ~167):
- Logo atual: `h-7 w-auto max-w-[160px]`
- Novo: `h-9 w-auto max-w-[200px]` — ocupa mais espaço horizontal sem aumentar a altura do header (que tem `py-2.5`, totalizando ~52px — comporta `h-9` = 36px)
- Remover qualquer borda visual residual no botão do logo (já não tem, mas garantir `border-none`)

No estado colapsado (linha ~151):
- Ícone atual: `h-6 w-6`
- Novo: `h-7 w-7` — ligeiramente maior

### Escopo
- 3 arquivos editados: `LandingPage.tsx`, `JourneyPage.tsx`, `AppSidebar.tsx`
- Apenas texto e classes CSS, sem mudanças de lógica

