import { useState } from "react";
import { MessageSquare, Target, BookOpen, Send, X, User } from "lucide-react";
import LandingHeroForm from "./LandingHeroForm";

type HeroFormTexts = {
  fieldName: string;
  fieldEmail: string;
  fieldPhone: string;
  formCta: string;
  successTitle: string;
  successSub: string;
};

type HeroTexts = {
  heroBadge: string;
  heroH1a: string;
  heroH1b: string;
  heroSub: string;
  heroCta: string;
  heroSubCta: string;
  heroTabChat: string;
  heroTabNPS: string;
  heroTabHelp: string;
};

/* ─── Chat Widget Mockup ────────────────────────── */
const ChatMockup = () => (
  <div className="relative w-full" style={{ minHeight: 380 }}>
    <div className="rounded-2xl p-5 w-full h-full" style={{ background: "#131722", border: "1px solid rgba(255,255,255,0.07)", minHeight: 380 }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ background: "#FF5F57" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#FEBC2E" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#28C840" }} />
        <div className="ml-3 h-3 w-40 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 rounded w-3/4" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-3 rounded w-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-3 rounded w-5/6" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-16 rounded mt-3" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>

      {/* Context badge */}
      <div
        className="absolute top-6 right-4 rounded-xl px-3 py-2 flex flex-col gap-1"
        style={{ background: "#1A2B48", border: "1px solid rgba(52,152,219,0.3)", boxShadow: "0 8px 24px rgba(52,152,219,0.15)", minWidth: 140 }}
      >
        <div className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "#3498DB" }}>User Context</div>
        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>Plan: <span className="text-white font-medium">Pro</span></div>
        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>MRR: <span style={{ color: "#2ECC71" }} className="font-medium">$2.4k</span></div>
        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>Health: <span style={{ color: "#FF7A59" }} className="font-medium">⚠ At risk</span></div>
      </div>

      {/* Chat widget */}
      <div
        className="absolute bottom-4 right-4 rounded-2xl flex flex-col overflow-hidden"
        style={{ width: 220, height: 260, background: "#0F1115", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#FF7A59" }}>
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><User className="w-3 h-3 text-white" /></div>
          <div>
            <div className="text-[10px] font-semibold text-white">Sarah — Support</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-300" /><div className="text-[8px] text-white/70">Online</div></div>
          </div>
          <X className="w-3 h-3 text-white/60 ml-auto" />
        </div>
        <div className="flex-1 p-2 space-y-2 overflow-hidden">
          <div className="flex gap-1.5 items-end">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "#FF7A59" }} />
            <div className="rounded-xl rounded-bl-sm px-2 py-1.5 text-[9px] max-w-[75%]" style={{ background: "#171C28", color: "rgba(255,255,255,0.75)" }}>Vi que você está no plano Pro. Como posso ajudar?</div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-xl rounded-br-sm px-2 py-1.5 text-[9px] max-w-[75%]" style={{ background: "rgba(255,122,89,0.15)", color: "rgba(255,255,255,0.8)" }}>Preciso exportar os dados</div>
          </div>
          <div className="flex gap-1.5 items-end">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "#FF7A59" }} />
            <div className="rounded-xl rounded-bl-sm px-3 py-2" style={{ background: "#171C28" }}>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 rounded-lg px-2 py-1.5 text-[9px]" style={{ background: "#171C28", color: "rgba(255,255,255,0.3)" }}>Mensagem...</div>
          <button className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#FF7A59" }}><Send className="w-3 h-3 text-white" /></button>
        </div>
      </div>
    </div>
  </div>
);

/* ─── NPS Mockup ────────────────────────── */
const NPSMockup = () => (
  <div className="w-full rounded-2xl p-5 space-y-4" style={{ background: "#131722", border: "1px solid rgba(255,255,255,0.07)", minHeight: 380 }}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-wider font-medium mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>NPS Score</div>
        <div className="text-5xl font-semibold" style={{ color: "#3498DB" }}>72</div>
      </div>
      <div className="text-right">
        <div className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Responses</div>
        <div className="text-lg font-medium text-white">1,247</div>
      </div>
    </div>
    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
      <div className="rounded-l-full" style={{ width: "15%", background: "#FF5C5C88" }} />
      <div style={{ width: "20%", background: "#F5B54688" }} />
      <div className="rounded-r-full" style={{ width: "65%", background: "#2ECC7188" }} />
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[["Detractors", "15%", "#FF5C5C"], ["Passives", "20%", "#F5B546"], ["Promoters", "65%", "#2ECC71"]].map(([label, pct, color]) => (
        <div key={label} className="text-center rounded-lg py-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-sm font-semibold" style={{ color }}>{pct}</div>
          <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>{label}</div>
        </div>
      ))}
    </div>
    {/* Detractor alert row */}
    <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.15)" }}>
      <div className="text-lg">⚠️</div>
      <div>
        <div className="text-[11px] font-medium text-white">3 detractors need attention</div>
        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>High MRR impact · $12k at risk</div>
      </div>
    </div>
    {/* Mini campaign list */}
    <div className="space-y-2">
      {[["Q1 Campaign", "Sent", "#2ECC71"], ["Onboarding NPS", "Scheduled", "#3498DB"]].map(([name, status, color]) => (
        <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span className="text-[11px] text-white/70">{name}</span>
          <span className="text-[10px] font-medium" style={{ color }}>{status}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Help Center Mockup ────────────────────────── */
const HelpMockup = () => (
  <div className="w-full rounded-2xl p-5 space-y-4" style={{ background: "#131722", border: "1px solid rgba(255,255,255,0.07)", minHeight: 380 }}>
    {/* Search bar */}
    <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-white/30 text-sm">🔍</span>
      <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>Search articles...</span>
    </div>
    {/* Collections grid */}
    <div className="grid grid-cols-2 gap-2">
      {[
        ["🚀", "Getting Started", "12 articles"],
        ["⚙️", "Configuration", "8 articles"],
        ["💬", "Chat Widget", "6 articles"],
        ["📊", "Reports", "4 articles"],
      ].map(([emoji, title, count]) => (
        <div key={title} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-lg mb-1">{emoji}</div>
          <div className="text-[11px] font-medium text-white">{title}</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{count}</div>
        </div>
      ))}
    </div>
    {/* Article preview */}
    <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="text-[11px] font-medium text-white">How to install the chat widget</div>
      <div className="h-2 rounded w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="h-2 rounded w-4/5" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[9px]" style={{ color: "#2ECC71" }}>👍 92% found helpful</span>
      </div>
    </div>
  </div>
);

const LandingHero = ({ t, onCtaClick, formTexts }: { t: HeroTexts; onCtaClick: () => void; formTexts: HeroFormTexts }) => {
  const [activeTab, setActiveTab] = useState<"chat" | "nps" | "help">("chat");

  const tabs = [
    { key: "chat" as const, label: t.heroTabChat, icon: MessageSquare, color: "#FF7A59" },
    { key: "nps" as const, label: t.heroTabNPS, icon: Target, color: "#3498DB" },
    { key: "help" as const, label: t.heroTabHelp, icon: BookOpen, color: "#2ECC71" },
  ];

  return (
    <section className="relative py-16 px-4 overflow-hidden" style={{ minHeight: "80vh", display: "flex", alignItems: "center", background: "#0F1115" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 500, height: 400, background: "radial-gradient(ellipse, rgba(26,43,72,0.5) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", right: "10%", width: 400, height: 300, background: "radial-gradient(ellipse, rgba(255,122,89,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-14 items-center">
        {/* Left: Copy */}
        <div className="flex flex-col items-start text-left">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest mb-8"
            style={{ background: "rgba(255,122,89,0.08)", border: "1px solid rgba(255,122,89,0.18)", color: "rgba(255,122,89,0.85)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {t.heroBadge}
          </div>
          <h1
            className="font-medium text-white mb-6"
            style={{ fontSize: "clamp(28px, 3.8vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.025em" }}
          >
            {t.heroH1a}<br />
            <span style={{ color: "rgba(255,122,89,0.85)" }}>{t.heroH1b}</span>
          </h1>
          <p className="mb-10" style={{ fontSize: "clamp(14px, 1.5vw, 16px)", lineHeight: 1.75, color: "rgba(255,255,255,0.5)", maxWidth: 500 }}>
            {t.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base transition-all duration-150 hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "#FF7A59", color: "#fff", boxShadow: "0 8px 32px rgba(255,122,89,0.3)" }}
            >
              {t.heroCta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.28)" }}>{t.heroSubCta}</p>
        </div>

        {/* Right: Mockup with tabs */}
        <div className="w-full">
          <div className="flex gap-1 mb-4">
            {tabs.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                style={{
                  background: activeTab === key ? `${color}18` : "transparent",
                  color: activeTab === key ? color : "rgba(255,255,255,0.4)",
                  border: activeTab === key ? `1px solid ${color}30` : "1px solid transparent",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          {activeTab === "chat" && <ChatMockup />}
          {activeTab === "nps" && <NPSMockup />}
          {activeTab === "help" && <HelpMockup />}
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
