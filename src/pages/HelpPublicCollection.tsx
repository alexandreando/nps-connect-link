import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, FileText } from "lucide-react";
import HelpPublicLayout from "@/components/help/HelpPublicLayout";

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
}

interface CollectionInfo {
  name: string;
  description: string | null;
  icon: string | null;
}

export default function HelpPublicCollection() {
  const { tenantSlug, collectionSlug } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(tenantSlug || null);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const helpBase = resolvedSlug ? `/${resolvedSlug}/help` : "/help";

  useEffect(() => { if (collectionSlug) loadData(); }, [tenantSlug, collectionSlug]);

  const loadData = async () => {
    let tenantIdResolved: string | null = null;

    if (tenantSlug) {
      const { data: tenant } = await supabase.from("tenants").select("id, slug").eq("slug", tenantSlug).maybeSingle();
      if (!tenant) { setLoading(false); return; }
      tenantIdResolved = tenant.id;
      setResolvedSlug(tenant.slug);
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
        if (t?.slug) { navigate(`/${t.slug}/help/c/${collectionSlug}`, { replace: true }); return; }
      }
      setLoading(false);
      return;
    }

    if (!tenantIdResolved) { setLoading(false); return; }

    // Load settings
    const { data: settings } = await supabase.from("help_site_settings").select("*").eq("tenant_id", tenantIdResolved).maybeSingle();
    setSiteSettings(settings);

    // Find collection
    const { data: col } = await supabase.from("help_collections")
      .select("id, name, description, icon")
      .eq("tenant_id", tenantIdResolved)
      .eq("slug", collectionSlug!)
      .eq("status", "active")
      .maybeSingle();
    if (!col) { setLoading(false); return; }
    setCollection(col);

    // Get articles
    const { data: arts } = await supabase.from("help_articles")
      .select("id, title, subtitle, slug")
      .eq("tenant_id", tenantIdResolved)
      .eq("collection_id", col.id)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    setArticles(arts ?? []);
    setLoading(false);
  };

  if (loading) return (
    <div className="light flex items-center justify-center min-h-screen" style={{ background: "#fff" }}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }} />
    </div>
  );
  if (!collection) return (
    <div className="light flex items-center justify-center min-h-screen" style={{ background: "#fff", color: "#6b7280" }}>Coleção não encontrada</div>
  );

  return (
    <HelpPublicLayout settings={siteSettings} helpBase={helpBase}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-8 flex-wrap">
          <Link to={helpBase} className="hover:underline transition-colors" style={{ color: "#6b7280" }}>Help Center</Link>
          <ChevronRight className="h-3.5 w-3.5" style={{ color: "#d1d5db" }} />
          <span className="font-medium" style={{ color: "#111827" }}>{collection.name}</span>
        </nav>

        <div className="mb-10 p-6 rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
          <span className="text-4xl mb-3 block">{collection.icon || "📚"}</span>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>{collection.name}</h1>
          {collection.description && <p className="text-base" style={{ color: "#6b7280" }}>{collection.description}</p>}
        </div>

        {articles.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Nenhum artigo nesta coleção.</p>
        ) : (
          <div className="space-y-2">
            {articles.map(art => (
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
                    <p className="font-medium" style={{ color: "#111827" }}>{art.title}</p>
                    {art.subtitle && <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{art.subtitle}</p>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9ca3af" }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </HelpPublicLayout>
  );
}
