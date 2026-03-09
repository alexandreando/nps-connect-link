

# Plano: Landing Page Unificada de Conversao

## Estrutura Narrativa

A LP unificada segue uma hierarquia de scroll em 2 blocos:

**Bloco 1 (topo — foco em produto):** Chat de Atendimento, NPS, Help Center — cada modulo com narrativa problema → solucao e destaque de funcionalidades reais.

**Bloco 2 (mais abaixo — plataforma completa):** Journey como sistema de CS completo — Timeline, Kanban, Dashboard executivo, formulario de early access.

---

## Estrutura de Secoes (ordem de scroll)

1. **Navbar** — unificada com anchor links (Atendimento, NPS, Help Center, Plataforma, Contato) + hamburger mobile
2. **Hero** — titulo focado em resultado, mockup com tabs alternando Chat/NPS/Help Center
3. **Secao Chat (Atendimento)** — narrativa de dor + solucao + lista de funcionalidades reais
4. **Secao NPS** — problema → solucao + mockup
5. **Secao Help Center** — problema → solucao + mockup
6. **Divisor "Plataforma Completa"** — transicao visual para o bloco 2
7. **Timeline + Kanban** — conteudo existente (LandingTimeline, LandingKanban)
8. **Social Proof / Metricas de Impacto**
9. **FAQ Accordion**
10. **CTA Final + Formulario Early Access**
11. **Footer completo**

---

## Detalhes por Secao

### Secao Chat — Atendimento ao Cliente

**Titulo:** "Atendimento organizado que retém clientes" / "Organized support that retains customers"

**Subtitulo:** Foco em resposta rapida, organizacao e retencao.

**Lista de funcionalidades reais destacadas (checkmarks):**
- Atribuicao automatica (Round Robin / Least Busy)
- Campos customizaveis no formulario do visitante
- Instalacao com 1 linha de codigo (facil implementacao)
- Contexto do cliente ao lado da conversa (plano, MRR, health)
- Times e filas organizadas por categoria
- Historico completo de conversas
- Notas internas entre atendentes
- Macros / respostas rapidas
- Busca de artigos do Help Center dentro do chat
- Banners e broadcasts proativos

**Mockup:** Reutilizar o ChatWidgetMockup existente (da ChatLandingPage) com o context badge.

### Secao NPS

**Titulo:** "Feedback automatizado conectado a acao" / "Automated feedback connected to action"

**Funcionalidades destacadas:**
- Campanhas automaticas e manuais
- NPS por email e embed in-app
- Segmentacao por empresa, plano, health
- Dashboard com detratores destacados
- Lembretes automaticos

**Mockup:** NPSMockup existente.

### Secao Help Center

**Titulo:** "Base de conhecimento que reduz tickets" / "Knowledge base that reduces tickets"

**Funcionalidades:**
- Portal publico customizavel (cores, logo, dominio)
- Editor rico com preview ao vivo
- Colecoes organizadas com icones
- Busca integrada no chat widget
- Feedback "Foi util?" com metricas
- Importacao em massa de artigos

**Mockup:** Novo HelpCenterMockup (portal publico estilizado).

---

## Arquivos Afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/LandingPage.tsx` | Refatorar como LP unica: navbar com anchors + hamburger, hero com tabs, 3 secoes de modulo (Chat/NPS/Help), divisor, secoes existentes (Timeline/Kanban), social proof, FAQ, CTA, footer |
| `src/pages/ChatLandingPage.tsx` | Manter arquivo mas redirecionar para `/` (ou remover e atualizar rota) |
| `src/App.tsx` | Remover rota `/journey`, manter `/` como LP unica |
| `src/components/landing/LandingFeatures.tsx` | Refatorar: secoes individuais com funcionalidades em checkmarks, mockups maiores, narrativa problema→solucao. Adicionar HelpCenterMockup |
| `src/components/landing/LandingFAQ.tsx` | Novo: accordion com 6-8 perguntas |
| `src/components/landing/LandingFooter.tsx` | Novo: footer 4 colunas |
| `src/components/landing/LandingSocialProof.tsx` | Novo: metricas de impacto (sem logos falsos) |

Componentes existentes preservados sem alteracao: `LandingTimeline.tsx`, `LandingKanban.tsx`, `LandingDifferentials.tsx`.

---

## Textos Bilingues (pt-BR / en)

Todos os textos serao mantidos no sistema de `texts` existente com chaves para ambos os idiomas.

