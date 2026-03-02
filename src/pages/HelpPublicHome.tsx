import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, ChevronRight } from "lucide-react";
import HelpPublicLayout from "@/components/help/HelpPublicLayout";

interface SiteSettings {
  home_title: string;
  home_subtitle: string;
  theme: string;
  brand_logo_url: string | null;
  brand_primary_color: string;
  hero_image_url?: string | null;
  hero_overlay_opacity?: number | null;
  favicon_url?: string | null;
  header_bg_color?: string | null;
  header_links_json?: any;
  footer_logo_url?: string | null;
  footer_text?: string | null;
  footer_bg_color?: string | null;
  footer_links_json?: any;
  footer_social_json?: any;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  article_count: number;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
}

export default function HelpPublicHome() {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recentArticles, setRecentArticles] = useState<SearchResult[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(tenantSlug || null);

  const helpBase = resolvedSlug ? `/${resolvedSlug}/help` : "/help";

  useEffect(() => { loadTenant(); }, [tenantSlug]);

  const loadTenant = async () => {
    if (tenantSlug) {
      const { data: tenant } = await supabase.from("tenants").select("id, slug").eq("slug", tenantSlug).maybeSingle();
      if (tenant) { setTenantId(tenant.id); setResolvedSlug(tenant.slug); return; }
      const { data: t2 } = await supabase.from("tenants").select("id, slug").eq("id", tenantSlug).maybeSingle();
      if (t2) { setTenantId(t2.id); setResolvedSlug(t2.slug); return; }
      setLoading(false);
    } else {
      let resolvedTenantId: string | null = null;
      const { data: site } = await supabase.from("help_site_settings").select("tenant_id").limit(1).maybeSingle();
      if (site) resolvedTenantId = site.tenant_id;
      if (!resolvedTenantId) {
        const { data: art } = await supabase.from("help_articles").select("tenant_id").eq("status", "published").limit(1).maybeSingle();
        if (art) resolvedTenantId = art.tenant_id;
      }
      if (resolvedTenantId) {
        const { data: t } = await supabase.from("tenants").select("slug").eq("id", resolvedTenantId).single();
        if (t?.slug) { navigate(`/${t.slug}/help`, { replace: true }); return; }
      }
      setLoading(false);
    }
  };

  useEffect(() => { if (tenantId) loadData(); }, [tenantId]);

  const loadData = async () => {
    const [{ data: site }, { data: cols }, { data: arts }] = await Promise.all([
      supabase.from("help_site_settings").select("*").eq("tenant_id", tenantId!).maybeSingle(),
      supabase.from("help_collections").select("id, name, slug, description, icon").eq("tenant_id", tenantId!).eq("status", "active").order("order_index"),
      supabase.from("help_articles").select("id, title, subtitle, slug, collection_id").eq("tenant_id", tenantId!).eq("status", "published").order("published_at", { ascending: false }).limit(10),
    ]);

    if (site) setSettings(site as any);
    else setSettings({ home_title: "Central de Ajuda", home_subtitle: "Como podemos ajudar?", theme: "light", brand_logo_url: null, brand_primary_color: "#3B82F6" });

    const countMap: Record<string, number> = {};
    (arts ?? []).forEach(a => { if (a.collection_id) countMap[a.collection_id] = (countMap[a.collection_id] || 0) + 1; });
    setCollections((cols ?? []).map(c => ({ ...c, article_count: countMap[c.id] || 0 })));
    setRecentArticles((arts ?? []).map(a => ({ id: a.id, title: a.title, subtitle: a.subtitle, slug: a.slug })));
    setLoading(false);
  };

  useEffect(() => {
    if (!search.trim() || !tenantId) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("help_articles")
        .select("id, title, subtitle, slug")
        .eq("tenant_id", tenantId!)
        .eq("status", "published")
        .or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`)
        .limit(10);
      setSearchResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, tenantId]);

  if (loading) return (
    <div className="light flex items-center justify-center min-h-screen" style={{ background: "#fff" }}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }} />
    </div>
  );
  if (!tenantId) return (
    <div className="light flex items-center justify-center min-h-screen" style={{ background: "#fff", color: "#6b7280" }}>Help Center not found</div>
  );

  const primaryColor = settings?.brand_primary_color || "#3B82F6";
  const heroImage = settings?.hero_image_url;
  const overlayOpacity = settings?.hero_overlay_opacity ?? 50;

  return (
    <HelpPublicLayout settings={settings} helpBase={helpBase}>
      {/* Hero */}
      <div
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{
          background: heroImage
            ? undefined
            : `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05, #f9fafb)`,
        }}
      >
        {heroImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: primaryColor, opacity: overlayOpacity / 100 }}
            />
          </>
        )}

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-4xl font-bold mb-3 tracking-tight"
            style={{ color: heroImage ? "#ffffff" : "#111827" }}
          >
            {settings?.home_title || "Central de Ajuda"}
          </h1>
          <p
            className="text-lg mb-8"
            style={{ color: heroImage ? "rgba(255,255,255,0.85)" : "#6b7280" }}
          >
            {settings?.home_subtitle || "Como podemos ajudar?"}
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#9ca3af" }} />
            <input
              placeholder="Buscar na base de conhecimento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 h-13 text-base rounded-xl border shadow-lg focus:outline-none focus:ring-2 transition-shadow"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#e5e7eb",
                color: "#111827",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
              onFocus={e => { e.target.style.boxShadow = `0 4px 20px ${primaryColor}25`; e.target.style.borderColor = primaryColor; }}
              onBlur={e => { e.target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.target.style.borderColor = "#e5e7eb"; }}
            />
            {searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-10 max-h-72 overflow-auto border"
                style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
              >
                {searchResults.map(r => (
                  <Link
                    key={r.id}
                    to={`${helpBase}/a/${r.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors border-b last:border-0"
                    style={{ borderColor: "#f3f4f6" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#111827" }}>{r.title}</p>
                      {r.subtitle && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{r.subtitle}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Collections grid */}
        {collections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {collections.map(col => (
              <Link
                key={col.id}
                to={`${helpBase}/c/${col.slug}`}
                className="group block p-6 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
              >
                <span className="text-3xl mb-3 block">{col.icon || "📚"}</span>
                <h3 className="font-semibold text-base mb-1.5" style={{ color: "#111827" }}>{col.name}</h3>
                {col.description && (
                  <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "#6b7280" }}>{col.description}</p>
                )}
                <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                  {col.article_count} artigos
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Recent articles */}
        {recentArticles.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-5" style={{ color: "#111827" }}>Artigos Recentes</h2>
            <div className="space-y-2">
              {recentArticles.map(art => (
                <Link
                  key={art.id}
                  to={`${helpBase}/a/${art.slug}`}
                  className="flex items-center justify-between p-4 rounded-lg border transition-colors group"
                  style={{ borderColor: "#f3f4f6" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 flex-shrink-0" style={{ color: "#d1d5db" }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#111827" }}>{art.title}</p>
                      {art.subtitle && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{art.subtitle}</p>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9ca3af" }} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </HelpPublicLayout>
  );
}
