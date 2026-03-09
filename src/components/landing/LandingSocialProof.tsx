import { TrendingDown, Clock, ThumbsUp, BarChart3 } from "lucide-react";

type SocialProofTexts = {
  socialTitle: string;
  socialSub: string;
  metrics: { value: string; label: string }[];
};

const icons = [TrendingDown, Clock, ThumbsUp, BarChart3];
const colors = ["#FF7A59", "#3498DB", "#2ECC71", "#F5B546"];

const LandingSocialProof = ({ t }: { t: SocialProofTexts }) => (
  <section className="py-16 px-4" style={{ background: "#0F1115" }}>
    <div className="max-w-5xl mx-auto text-center">
      <h2 className="text-xl font-medium text-white mb-2">{t.socialTitle}</h2>
      <p className="text-[14px] mb-12" style={{ color: "rgba(255,255,255,0.4)" }}>{t.socialSub}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {t.metrics.map(({ value, label }, i) => {
          const Icon = icons[i % icons.length];
          const color = colors[i % colors.length];
          return (
            <div
              key={label}
              className="rounded-xl p-6 flex flex-col items-center gap-3"
              style={{ background: "#131722", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}14` }}>
                <Icon style={{ color }} className="w-5 h-5" />
              </div>
              <div className="text-2xl font-semibold text-white">{value}</div>
              <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default LandingSocialProof;
