

# Plano de Redesign Completo da Landing Page

## Problemas Atuais

1. **Hero sobrecarregado**: Formulario inline com 3 campos + mockup com tabs lado a lado fica apertado, especialmente em mobile
2. **Mockups duplicados**: Os mesmos mockups aparecem no Hero (tabs) E nas product sections abaixo — redundancia visual
3. **Hierarquia visual fraca**: Todas as secoes tem o mesmo peso visual (fundo #0F1115, mesma tipografia), nao ha ritmo nem respiro
4. **Formulario duplicado**: HeroForm e LandingCTA sao basicamente o mesmo componente duplicado
5. **Social Proof genérico**: Metricas inventadas sem contexto ("NPS 72", "-40%") nao geram confianca
6. **FAQ sem personalidade**: Accordion basico sem conexao visual com o resto
7. **Textos longos demais**: O subtitulo do hero tem 2 linhas densas, as descricoes das features sao genericas
8. **Navbar links "Plataforma"**: Aponta para /journey mas nao fica claro o que e

---

## Redesign Proposto

### 1. Hero — Simplificar e Focar na Conversao

**Mudancas:**
- Remover as tabs de mockup do hero. Manter apenas copy + formulario
- Titulo mais curto e impactante, subtitulo em 1 linha
- Formulario inline (nome, email, telefone) com CTA — manter mas melhorar layout: empilhar verticalmente em 1 coluna com labels mais claros
- Abaixo do form: 3 mini-badges horizontais ("Chat · NPS · Help Center") como prova rapida dos modulos
- Adicionar um visual sutil ao lado direito (gradiente ou icones flutuantes dos 3 modulos) em vez de mockup completo

**Textos revisados (pt-BR):**
- H1: "Atendimento, NPS e Help Center em um so lugar"
- Sub: "Tudo que seu time de CS precisa para reter clientes e escalar suporte."
- CTA: "Quero Conhecer"

### 2. Product Sections — Melhorar Narrativa e Visual

**Mudancas:**
- Manter os 3 modulos (Chat, NPS, Help Center) com mockup + features
- Adicionar um "label de dor" antes do titulo (ex: "Seu time responde sem contexto?") em vermelho/laranja
- Reduzir features para 6 por modulo (as mais impactantes)
- Alternar fundo entre secoes: #0F1115 e #0D0F13 para criar ritmo visual
- Mockups maiores, ocupando mais espaco

**Textos revisados Chat (pt-BR):**
- Dor: "Seu time responde sem saber quem e o cliente?"
- Titulo: "Atendimento com contexto que retém"
- Sub: "Plano, MRR, health score e historico — tudo ao lado da conversa."
- Features (6): Atribuicao automatica, 1 linha de codigo, campos customizaveis, contexto do cliente, historico completo, busca de artigos no chat

**Textos revisados NPS (pt-BR):**
- Dor: "Voce so descobre a insatisfacao quando o cliente cancela?"
- Titulo: "NPS automatizado com alerta de risco"
- Sub: "Campanhas automaticas que surfaceiam detratores com impacto em receita."
- Features (5): Campanhas auto/manuais, email + in-app, segmentacao, dashboard detratores, lembretes

**Textos revisados Help Center (pt-BR):**
- Dor: "Tickets repetitivos que consomem seu time?"
- Titulo: "Base de conhecimento que resolve antes do ticket"
- Sub: "Portal customizavel integrado ao chat que desvia tickets automaticamente."
- Features (6): Portal customizavel, editor com preview, colecoes com icones, busca no chat, feedback com metricas, importacao em massa

### 3. Social Proof — Reposicionar

**Mudancas:**
- Mover para logo apos o hero (antes das product sections)
- Simplificar: 4 metricas em 1 linha, sem cards pesados — apenas numero + label inline
- Adicionar texto "Resultados medios de times em early access"

### 4. FAQ — Melhorar

**Mudancas:**
- Adicionar mais 2 perguntas: "Qual a diferenca para Intercom/Zendesk?" e "Tem API?"
- Manter accordion, adicionar borda laranja sutil no item aberto

### 5. CTA Final — Unificar com HeroForm

**Mudancas:**
- Extrair logica do formulario para um componente compartilhado `LeadForm`
- CTA final usa o mesmo `LeadForm` mas com layout vertical e texto motivacional diferente
- Remover duplicacao de codigo entre HeroForm e LandingCTA

### 6. Footer — Pequenos ajustes

- Trocar link "Plataforma" por "Plataforma Completa" apontando para /journey
- Adicionar link "Blog" (placeholder #)

### 7. Navbar — Simplificar

- Remover link "Plataforma" da navbar principal (fica so no footer)
- Manter: Atendimento, NPS, Help Center como anchor links
- CTA "Quero Conhecer" no lugar de "Clique e Conheca"

---

## Arquivos Afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/landing/LandingHero.tsx` | Remover mockup tabs, simplificar para copy + form + badges dos modulos |
| `src/components/landing/LandingHeroForm.tsx` | Extrair para componente `LeadForm` compartilhado, melhorar layout vertical |
| `src/components/landing/LandingProductSections.tsx` | Adicionar "label de dor", reduzir features, alternar fundos |
| `src/components/landing/LandingSocialProof.tsx` | Layout inline simplificado, mover posicao na page |
| `src/components/landing/LandingFAQ.tsx` | Adicionar 2 perguntas, borda no item ativo |
| `src/components/landing/LandingCTA.tsx` | Reutilizar LeadForm, simplificar |
| `src/components/landing/LandingNavbar.tsx` | Remover link Plataforma, atualizar CTA text |
| `src/components/landing/LandingFooter.tsx` | Ajustar links |
| `src/pages/LandingPage.tsx` | Reordenar secoes (Hero → Social Proof → Products → FAQ → CTA → Footer), atualizar todos os textos pt-BR e en |

