import { ThumbsUp, ThumbsDown, ExternalLink, X, Info, AlertTriangle, CheckCircle, Megaphone, Sparkles, Hammer, ShieldAlert, Zap, Moon, Flame, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BannerPreviewProps {
  content: string;
  contentHtml?: string;
  textAlign?: string;
  bgColor: string;
  textColor: string;
  linkUrl?: string;
  linkLabel?: string;
  hasVoting: boolean;
  bannerType?: string;
  startsAt?: string;
  expiresAt?: string;
  position?: string;
  borderStyle?: string;
  shadowStyle?: string;
  variant?: BannerVariant;
  isFloating?: boolean;
  canClose?: boolean;
}

export type BannerVariant = "warning" | "urgent" | "success" | "neutral" | "premium" | "ocean" | "sunset" | "midnight" | "neon" | "custom";

interface VariantStyle {
  inlineStyle: React.CSSProperties;
  icon: typeof Info;
}

const VARIANT_STYLES: Record<Exclude<BannerVariant, "custom">, VariantStyle> = {
  warning: {
    inlineStyle: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", color: "#78350F" },
    icon: Hammer
  },
  urgent: {
    inlineStyle: { backgroundColor: "#DC2626", borderColor: "#B91C1C", color: "#FFFFFF" },
    icon: ShieldAlert
  },
  success: {
    inlineStyle: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0", color: "#064E3B" },
    icon: CheckCircle
  },
  neutral: {
    inlineStyle: { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0", color: "#0F172A" },
    icon: Info
  },
  premium: {
    inlineStyle: { backgroundColor: "#4F46E5", borderColor: "#4338CA", color: "#FFFFFF" },
    icon: Megaphone
  },
  ocean: {
    inlineStyle: { background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", borderColor: "transparent", color: "#FFFFFF" },
    icon: Droplets
  },
  sunset: {
    inlineStyle: { background: "linear-gradient(135deg, #F97316, #EF4444)", borderColor: "transparent", color: "#FFFFFF" },
    icon: Flame
  },
  midnight: {
    inlineStyle: { backgroundColor: "#0F172A", borderColor: "#334155", color: "#F1F5F9" },
    icon: Moon
  },
  neon: {
    inlineStyle: { background: "linear-gradient(135deg, #EC4899, #06B6D4)", borderColor: "transparent", color: "#FFFFFF" },
    icon: Zap
  }
};

const TYPE_TO_VARIANT: Record<string, BannerVariant> = {
  info: "neutral",
  warning: "warning",
  success: "success",
  promo: "premium",
  update: "premium"
};

const BannerPreview = ({
  content,
  contentHtml,
  textAlign = "center",
  bgColor,
  textColor,
  linkUrl,
  linkLabel,
  hasVoting,
  bannerType = "info",
  startsAt,
  expiresAt,
  position = "top",
  borderStyle = "none",
  shadowStyle = "none",
  variant,
  isFloating = false,
  canClose = true
}: BannerPreviewProps) => {
  const resolvedVariant = variant ?? TYPE_TO_VARIANT[bannerType] ?? "neutral";
  const isCustom = resolvedVariant === "custom";
  const variantStyle = !isCustom ? VARIANT_STYLES[resolvedVariant] : null;
  const TypeIcon = variantStyle?.icon ?? Info;
  // Always use props as source of truth for colors (they come from form.bg_color/text_color)
  const bannerColor = textColor || (isCustom ? "#FFFFFF" : (variantStyle?.inlineStyle.color as string ?? "#0F172A"));

  const getScheduleBadge = () => {
    if (!startsAt && !expiresAt) return null;
    const now = new Date();
    if (startsAt && new Date(startsAt) > now) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 opacity-70 bg-transparent" style={{ color: bannerColor, borderColor: bannerColor }}>
          Agendado
        </Badge>
      );
    }
    if (expiresAt) {
      const diff = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0 && diff <= 7) {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 opacity-70 bg-transparent" style={{ color: bannerColor, borderColor: bannerColor }}>
            Expira em {diff}d
          </Badge>
        );
      }
    }
    return null;
  };

  const floatingMode = isFloating || borderStyle === "pill";

  // Always use bgColor/textColor props as the source of truth
  const bannerInlineStyle: React.CSSProperties = {
    ...(bgColor.startsWith("linear-gradient") ? { background: bgColor } : { backgroundColor: bgColor }),
    color: textColor || variantStyle?.inlineStyle.color as string || "#0F172A",
    borderColor: variantStyle?.inlineStyle.borderColor as string || "transparent"
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-xl shadow-lg border bg-background">
      {/* Banner */}
      <div
        className={cn(
          "py-3 px-5 text-sm leading-relaxed relative flex flex-col items-center justify-center gap-3",
          "font-medium tracking-[0.01em] backdrop-blur-md transition-all border",
          floatingMode && "mx-4 mt-2 rounded-2xl",
          !floatingMode && "rounded-none",
          "shadow-sm"
        )}
        style={bannerInlineStyle}
      >
        {/* Close button */}
        {canClose && (
          <button
            className="absolute top-2.5 right-3 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: bannerColor }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Main content */}
        <div className="flex items-center justify-center gap-3 w-full pr-8" style={{ textAlign: textAlign as any, color: bannerColor }}>
          <TypeIcon className="h-4 w-4 flex-shrink-0 opacity-80" />
          {contentHtml ? (
            <span
              dangerouslySetInnerHTML={{ __html: contentHtml }}
              className="flex-1 min-w-0 overflow-hidden line-clamp-3 [&_a]:break-all"
              style={{ lineHeight: "1.5", wordBreak: "break-word", overflowWrap: "break-word" }}
            />
          ) : (
            <span className="flex-1 min-w-0 overflow-hidden">{content || "Texto do banner aqui..."}</span>
          )}
          {getScheduleBadge()}
        </div>

        {/* Actions */}
        {(linkUrl || hasVoting) && (
          <div className="flex items-center justify-center gap-3">
            {linkUrl && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-70 cursor-pointer transition-opacity"
                style={{ color: bannerColor }}
              >
                {linkLabel || "Saiba mais"}
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
            {hasVoting && (
              <div className="flex items-center gap-1">
                <span className="p-1 rounded cursor-pointer hover:opacity-70" style={{ color: bannerColor }}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </span>
                <span className="p-1 rounded cursor-pointer hover:opacity-70" style={{ color: bannerColor }}>
                  <ThumbsDown className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mock navbar */}
      <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-3">
        <div className="h-4 w-4 rounded bg-muted-foreground/20" />
        <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
        <div className="ml-auto flex gap-2">
          <div className="h-3 w-12 bg-muted-foreground/15 rounded" />
          <div className="h-3 w-12 bg-muted-foreground/15 rounded" />
          <div className="h-3 w-12 bg-muted-foreground/15 rounded" />
        </div>
      </div>

      {/* Mock page content */}
      <div className="px-6 py-4 space-y-3">
        <div className="h-3 w-3/4 bg-muted-foreground/10 rounded" />
        <div className="h-3 w-full bg-muted-foreground/10 rounded" />
        <div className="h-3 w-5/6 bg-muted-foreground/10 rounded" />
      </div>
    </div>
  );
};

export default BannerPreview;
export { VARIANT_STYLES, TYPE_TO_VARIANT };
