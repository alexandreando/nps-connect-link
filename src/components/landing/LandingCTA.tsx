import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type CTATexts = {
  formLabel: string;
  formH2: string;
  formSub: string;
  fieldName: string;
  fieldEmail: string;
  fieldCompany: string;
  fieldRole: string;
  formCta: string;
  formFootnote: string;
  successTitle: string;
  successSub: string;
  successBtn: string;
};

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().min(2).max(100),
  role: z.string().trim().max(100).optional(),
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "" });
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
        company: result.data.company,
        role: result.data.role || null,
        phone: null,
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
      setSubmitted(true);
      setForm({ name: "", email: "", company: "", role: "" });
    } catch {
      toast({ title: "Error", description: "Could not submit. Please try again.", variant: "destructive" });
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
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: "#2ED47A" }} />
              <h3 className="text-xl font-medium text-white mb-2">{t.successTitle}</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{t.successSub}</p>
              <button onClick={() => setSubmitted(false)} className="mt-5 text-sm px-4 py-2 rounded-lg" style={{ color: "#FF7A59", border: "1px solid rgba(255,122,89,0.25)", background: "transparent" }}>
                {t.successBtn}
              </button>
            </div>
          ) : (
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
                <LandingInput placeholder={t.fieldCompany} value={form.company} onChange={(v) => handleChange("company", v)} />
                {errors.company && <p className="text-xs mt-1" style={{ color: "#FF5C5C" }}>{errors.company}</p>}
              </div>
              <div>
                <LandingInput placeholder={t.fieldRole} value={form.role} onChange={(v) => handleChange("role", v)} />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg font-medium text-sm mt-1 transition-all duration-150 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "#FF7A59", color: "#fff" }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><ArrowRight className="w-4 h-4" /> {t.formCta}</>}
              </button>
              <p className="text-center text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.28)" }}>{t.formFootnote}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;
