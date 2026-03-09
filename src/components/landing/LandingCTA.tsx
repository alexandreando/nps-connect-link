import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

type CTATexts = {
  formLabel: string;
  formH2: string;
  formSub: string;
  fieldName: string;
  fieldEmail: string;
  fieldPhone: string;
  formCta: string;
  formFootnote: string;
  successTitle: string;
  successSub: string;
};

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(8).max(20),
});

const LandingInput = ({ placeholder, type = "text", value, onChange }: { placeholder: string; type?: string; value: string; onChange: (v: string) => void }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-150"
    style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F4F8" }}
    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,122,89,0.4)")}
    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
  />
);

const LandingCTA = ({ t }: { t: CTATexts }) => {
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = leadSchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fe[err.path[0] as string] = err.message; });
      setErrors(fe);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const { error } = await supabase.from("leads").insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        company: null,
        role: null,
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
        utm_content: params.get("utm_content") || "",
        utm_term: params.get("utm_term") || "",
        referrer: document.referrer || "",
        landing_page: window.location.pathname + window.location.search,
        user_agent: navigator.userAgent || "",
      });
      if (error) throw error;
      setShowPopup(true);
      setForm({ name: "", email: "", phone: "" });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="early-access" className="py-16 px-4 relative overflow-hidden" style={{ background: "#0F1115" }}>
      <div className="absolute pointer-events-none" style={{ bottom: 0, left: "50%", transform: "translateX(-50%)", width: 700, height: 280, background: "radial-gradient(ellipse, rgba(61,165,244,0.04) 0%, transparent 70%)" }} />
      <div className="relative z-10 max-w-lg mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-medium uppercase tracking-widest mb-3" style={{ color: "#3DA5F4" }}>{t.formLabel}</p>
          <h2 className="text-[26px] font-medium text-white mb-3" style={{ lineHeight: 1.25, letterSpacing: "-0.02em" }}>{t.formH2}</h2>
          <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.45)" }}>{t.formSub}</p>
        </div>
        <div className="rounded-xl p-8" style={{ background: "#131722", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <LandingInput placeholder={t.fieldName} value={form.name} onChange={(v) => handleChange("name", v)} />
              {errors.name && <p className="text-xs mt-1" style={{ color: "#FF5C5C" }}>{errors.name}</p>}
            </div>
            <div>
              <LandingInput placeholder={t.fieldEmail} type="email" value={form.email} onChange={(v) => handleChange("email", v)} />
              {errors.email && <p className="text-xs mt-1" style={{ color: "#FF5C5C" }}>{errors.email}</p>}
            </div>
            <div>
              <LandingInput placeholder={t.fieldPhone} type="tel" value={form.phone} onChange={(v) => handleChange("phone", v)} />
              {errors.phone && <p className="text-xs mt-1" style={{ color: "#FF5C5C" }}>{errors.phone}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg font-medium text-sm mt-1 transition-all duration-150 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "#FF7A59", color: "#fff" }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</> : <><ArrowRight className="w-4 h-4" /> {t.formCta}</>}
            </button>
            <p className="text-center text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.28)" }}>{t.formFootnote}</p>
          </form>
        </div>
      </div>

      {/* Thank you popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div
            className="relative rounded-2xl p-8 text-center max-w-sm mx-4"
            style={{ background: "#131722", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <X className="w-4 h-4" />
            </button>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: "#2ED47A" }} />
            <h3 className="text-xl font-semibold text-white mb-2">{t.successTitle}</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{t.successSub}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#FF7A59", color: "#fff" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default LandingCTA;
