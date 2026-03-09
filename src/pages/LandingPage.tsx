import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingProductSections from "@/components/landing/LandingProductSections";
import LandingTimeline from "@/components/landing/LandingTimeline";
import LandingKanban from "@/components/landing/LandingKanban";
import LandingSocialProof from "@/components/landing/LandingSocialProof";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

type Lang = "en" | "pt-BR";

const initLang = (): Lang => {
  const saved = localStorage.getItem("landing_lang");
  if (saved === "en" || saved === "pt-BR") return saved;
  return navigator.language.startsWith("pt") ? "pt-BR" : "en";
};

const texts = {
  en: {
    // Navbar
    navAtendimento: "Support Chat",
    navNPS: "NPS",
    navHelpCenter: "Help Center",
    navPlataforma: "Platform",
    navSignIn: "Sign In",
    navDashboard: "Dashboard",
    navCta: "Get Started",
    langToggle: "PT",
    // Hero
    heroBadge: "Early Access · Limited Spots",
    heroH1a: "Retain customers with",
    heroH1b: "real context and speed",
    heroSub: "In-app chat, automated NPS and self-service Help Center — the CX stack built for B2B SaaS teams that need to reduce churn and scale support.",
    heroCta: "Join Early Access",
    heroSubCta: "No credit card · Setup in minutes",
    heroTabChat: "Chat",
    heroTabNPS: "NPS",
    heroTabHelp: "Help Center",
    // Form fields (hero + CTA)
    fieldName: "Your Name *",
    fieldEmail: "Work Email *",
    fieldPhone: "Phone *",
    formCta: "Get Started",
    successTitle: "You're on the list!",
    successSub: "We'll reach out soon with your early access invite.",
    // Product sections — Chat
    chatTitle: "Organized support that retains customers",
    chatSub: "Your team responds with full context — plan, MRR, health score — right next to the conversation. Faster responses, better retention.",
    chatFeatures: [
      "Automatic assignment (Round Robin / Least Busy)",
      "Customizable visitor form fields",
      "Install with 1 line of code",
      "Customer context alongside every conversation",
      "Teams & queues organized by category",
      "Complete conversation history",
      "Internal notes between agents",
      "Quick replies & macros",
      "Help Center article search inside chat",
      "Proactive banners & broadcasts",
    ],
    // Product sections — NPS
    npsTitle: "Automated feedback connected to action",
    npsSub: "Automated NPS flows connected to health score and churn prediction. Detractors surface immediately with revenue impact.",
    npsFeatures: [
      "Automatic & manual campaigns",
      "NPS via email and in-app embed",
      "Segmentation by company, plan, health",
      "Dashboard with highlighted detractors",
      "Automatic reminders",
    ],
    // Product sections — Help Center
    helpTitle: "Knowledge base that reduces tickets",
    helpSub: "Let customers help themselves. A customizable portal integrated into your chat widget that deflects tickets before they're created.",
    helpFeatures: [
      "Customizable public portal (colors, logo, domain)",
      "Rich editor with live preview",
      "Organized collections with icons",
      "Integrated search inside chat widget",
      "\"Was this helpful?\" feedback with metrics",
      "Bulk article import",
    ],
    // Platform divider
    platformLabel: "Complete Platform",
    platformTitle: "The full CS operating system",
    platformSub: "Beyond chat, NPS and knowledge base — Journey gives you timeline, kanban, health scoring and executive dashboards.",
    // Timeline & Kanban
    timelineLabel: "CRM + Timeline",
    timelineH2: "Track every interaction.\nEvery signal.\nEvery opportunity.",
    timelineSub: "From first onboarding to renewal — every touchpoint, health change, and revenue signal captured in one unified timeline.",
    kanbanLabel: "Customer Journey",
    kanbanH2: "Visualize every customer journey stage.",
    kanbanSub: "Move accounts based on signals — not assumptions.",
    // Social proof
    socialTitle: "Measurable impact for your CS team",
    socialSub: "Average results from teams using Journey",
    socialMetrics: [
      { value: "-40%", label: "Response Time" },
      { value: "NPS 72", label: "Average Score" },
      { value: "85%", label: "Articles Helpful" },
      { value: "-25%", label: "Ticket Volume" },
    ],
    // FAQ
    faqTitle: "Frequently Asked Questions",
    faqItems: [
      { q: "How long does it take to install?", a: "The chat widget can be installed with a single line of JavaScript. Full setup including NPS and Help Center typically takes under 30 minutes." },
      { q: "Do I need a credit card?", a: "No. Early access is free and doesn't require payment information." },
      { q: "Does it work with my CRM?", a: "Journey has a built-in CRM with timeline and kanban. We also support integrations via API and webhooks." },
      { q: "How is the data protected?", a: "All data is encrypted at rest and in transit. We are LGPD compliant and follow industry-standard security practices." },
      { q: "Can I customize the chat widget?", a: "Yes — colors, position, form fields, business hours, welcome messages, and more are fully configurable." },
      { q: "How does automatic assignment work?", a: "You can configure Round Robin, Least Busy, or manual assignment. Rules can be set per category with team fallbacks." },
    ],
    // CTA / Form
    formLabel: "Early Access",
    formH2: "Be the First to Access Journey",
    formSub: "We are onboarding a limited group of CS and Revenue teams who want to build predictable growth from customer data.",
    fieldName: "Full Name *",
    fieldEmail: "Work Email *",
    fieldCompany: "Company Name *",
    fieldRole: "Role / Position",
    formCta: "Join Early Access",
    formFootnote: "Selected early users will have direct access to the founding team and influence the product roadmap.",
    successTitle: "You're on the list!",
    successSub: "We'll reach out soon with your early access invite.",
    successBtn: "Submit another",
    // Footer
    footerTagline: "The CX platform for revenue-driven CS teams.",
    footerRights: "All rights reserved.",
    footerProduct: "Product",
    footerCompany: "Company",
    footerLegal: "Legal",
    footerProductLinks: [
      { label: "Support Chat", href: "#chat" },
      { label: "NPS", href: "#nps" },
      { label: "Help Center", href: "#helpcenter" },
      { label: "Platform", href: "#plataforma" },
    ],
    footerCompanyLinks: [
      { label: "Early Access", href: "#early-access" },
    ],
    footerLegalLinks: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
  "pt-BR": {
    // Navbar
    navAtendimento: "Atendimento",
    navNPS: "NPS",
    navHelpCenter: "Help Center",
    navPlataforma: "Plataforma",
    navSignIn: "Entrar",
    navDashboard: "Dashboard",
    navCta: "Clique e Conheça",
    langToggle: "EN",
    // Hero
    heroBadge: "Acesso Antecipado · Vagas Limitadas",
    heroH1a: "Retenha clientes com",
    heroH1b: "contexto real e agilidade",
    heroSub: "Chat in-app, NPS automatizado e Help Center self-service — a stack de CX feita para times B2B SaaS que precisam reduzir churn e escalar atendimento.",
    heroCta: "Garantir Acesso Antecipado",
    heroSubCta: "Sem cartão de crédito · Setup em minutos",
    heroTabChat: "Chat",
    heroTabNPS: "NPS",
    heroTabHelp: "Help Center",
    // Product sections — Chat
    chatTitle: "Atendimento organizado que retém clientes",
    chatSub: "Seu time responde com contexto completo — plano, MRR, health score — ao lado de cada conversa. Respostas mais rápidas, retenção melhor.",
    chatFeatures: [
      "Atribuição automática (Round Robin / Least Busy)",
      "Campos customizáveis no formulário do visitante",
      "Instalação com 1 linha de código",
      "Contexto do cliente ao lado da conversa",
      "Times e filas organizadas por categoria",
      "Histórico completo de conversas",
      "Notas internas entre atendentes",
      "Macros e respostas rápidas",
      "Busca de artigos do Help Center dentro do chat",
      "Banners e broadcasts proativos",
    ],
    // Product sections — NPS
    npsTitle: "Feedback automatizado conectado à ação",
    npsSub: "Fluxos de NPS automatizados conectados ao health score e previsão de churn. Detratores surgem imediatamente com impacto na receita.",
    npsFeatures: [
      "Campanhas automáticas e manuais",
      "NPS por email e embed in-app",
      "Segmentação por empresa, plano, health",
      "Dashboard com detratores destacados",
      "Lembretes automáticos",
    ],
    // Product sections — Help Center
    helpTitle: "Base de conhecimento que reduz tickets",
    helpSub: "Permita que seus clientes se ajudem. Um portal customizável integrado ao chat que resolve dúvidas antes de virarem tickets.",
    helpFeatures: [
      "Portal público customizável (cores, logo, domínio)",
      "Editor rico com preview ao vivo",
      "Coleções organizadas com ícones",
      "Busca integrada no chat widget",
      "Feedback \"Foi útil?\" com métricas",
      "Importação em massa de artigos",
    ],
    // Platform divider
    platformLabel: "Plataforma Completa",
    platformTitle: "O sistema operacional de CS completo",
    platformSub: "Além de chat, NPS e base de conhecimento — o Journey entrega timeline, kanban, health score e dashboards executivos.",
    // Timeline & Kanban
    timelineLabel: "CRM + Timeline",
    timelineH2: "Rastreie cada interação.\nCada sinal.\nCada oportunidade.",
    timelineSub: "Do primeiro onboarding à renovação — cada touchpoint, mudança de health e sinal de receita capturado em uma timeline unificada.",
    kanbanLabel: "Jornada do Cliente",
    kanbanH2: "Visualize cada etapa da jornada do cliente.",
    kanbanSub: "Mova contas com base em sinais — não em suposições.",
    // Social proof
    socialTitle: "Impacto mensurável para seu time de CS",
    socialSub: "Resultados médios de times que usam o Journey",
    socialMetrics: [
      { value: "-40%", label: "Tempo de Resposta" },
      { value: "NPS 72", label: "Score Médio" },
      { value: "85%", label: "Artigos Úteis" },
      { value: "-25%", label: "Volume de Tickets" },
    ],
    // FAQ
    faqTitle: "Perguntas Frequentes",
    faqItems: [
      { q: "Quanto tempo leva para instalar?", a: "O widget de chat pode ser instalado com uma única linha de JavaScript. A configuração completa incluindo NPS e Help Center leva menos de 30 minutos." },
      { q: "Preciso de cartão de crédito?", a: "Não. O acesso antecipado é gratuito e não exige informações de pagamento." },
      { q: "Funciona com meu CRM?", a: "O Journey possui CRM integrado com timeline e kanban. Também suportamos integrações via API e webhooks." },
      { q: "Como os dados são protegidos?", a: "Todos os dados são criptografados em repouso e em trânsito. Somos compatíveis com a LGPD e seguimos as melhores práticas de segurança." },
      { q: "Posso personalizar o widget de chat?", a: "Sim — cores, posição, campos do formulário, horários de atendimento, mensagens de boas-vindas e mais são totalmente configuráveis." },
      { q: "Como funciona a atribuição automática?", a: "Você pode configurar Round Robin, Least Busy ou manual. Regras podem ser definidas por categoria com fallback por time." },
    ],
    // CTA / Form
    formLabel: "Acesso Antecipado",
    formH2: "Seja um dos Primeiros a Usar o Journey",
    formSub: "Estamos abrindo para um grupo limitado de times de CS e Receita que querem construir crescimento previsível a partir de dados de clientes.",
    fieldName: "Nome Completo *",
    fieldEmail: "Email Corporativo *",
    fieldCompany: "Nome da Empresa *",
    fieldRole: "Cargo / Função",
    formCta: "Entrar para o Acesso Antecipado",
    formFootnote: "Usuários selecionados terão acesso direto ao time fundador e influência no roadmap do produto.",
    successTitle: "Você está na lista!",
    successSub: "Entraremos em contato em breve com seu convite.",
    successBtn: "Enviar outro",
    // Footer
    footerTagline: "A plataforma de CX para times de CS orientados a receita.",
    footerRights: "Todos os direitos reservados.",
    footerProduct: "Produto",
    footerCompany: "Empresa",
    footerLegal: "Legal",
    footerProductLinks: [
      { label: "Atendimento", href: "#chat" },
      { label: "NPS", href: "#nps" },
      { label: "Help Center", href: "#helpcenter" },
      { label: "Plataforma", href: "#plataforma" },
    ],
    footerCompanyLinks: [
      { label: "Acesso Antecipado", href: "#early-access" },
    ],
    footerLegalLinks: [
      { label: "Política de Privacidade", href: "#" },
      { label: "Termos de Uso", href: "#" },
    ],
  },
};

const LandingPage = () => {
  const [lang, setLang] = useState<Lang>(initLang);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const t = texts[lang];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
  }, []);

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "pt-BR" : "en";
    setLang(next);
    localStorage.setItem("landing_lang", next);
  };

  const scrollToForm = () => document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F1115", fontFamily: "Manrope, sans-serif" }}>
      <LandingNavbar t={t} isLoggedIn={isLoggedIn} onToggleLang={toggleLang} onCtaClick={scrollToForm} />
      <LandingHero t={t} onCtaClick={scrollToForm} />
      <LandingProductSections t={t} />

      {/* ── Platform Divider ─── */}
      <section id="plataforma" className="py-16 px-4 text-center" style={{ background: "#0F1115" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-widest mb-3" style={{ color: "#FF7A59" }}>{t.platformLabel}</p>
          <h2 className="text-[26px] font-medium text-white mb-3" style={{ lineHeight: 1.28, letterSpacing: "-0.02em" }}>{t.platformTitle}</h2>
          <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.45)", maxWidth: 500, margin: "0 auto" }}>{t.platformSub}</p>
        </div>
      </section>

      <LandingTimeline t={t} />
      <LandingKanban t={t} />
      <LandingSocialProof t={{ socialTitle: t.socialTitle, socialSub: t.socialSub, metrics: t.socialMetrics }} />
      <LandingFAQ t={{ faqTitle: t.faqTitle, faqItems: t.faqItems }} />
      <LandingCTA t={t} />
      <LandingFooter t={t} />
    </div>
  );
};

export default LandingPage;
