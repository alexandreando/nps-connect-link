import { ThumbsUp, ThumbsDown, ExternalLink, X, MessageSquare, Info, AlertTriangle, CheckCircle, Megaphone, Sparkles, Hammer, ShieldAlert } from "lucide-react";
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

export type BannerVariant = "warning" | "destructive" | "success" | "neutral" | "brand" | "custom";

const VARIANT_STYLES: Record<Exclude<BannerVariant, "custom">, {bg: string;border: string;text: string;icon: typeof Info;}> = {
  warning: {
    bg: "bg-amber-50/70 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-100",
    icon: Hammer
  },
  destructive: {
    bg: "bg-red-50/70 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-100",
    icon: ShieldAlert
  },
  success: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-900 dark:text-emerald-100",
    icon: CheckCircle
  },
  neutral: {
    bg: "bg-slate-50/70 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-900 dark:text-slate-100",
    icon: Info
  },
  brand: {
    bg: "bg-indigo-50/70 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    text: "text-indigo-900 dark:text-indigo-100",
    icon: Megaphone
  }
};

// Map legacy banner_type to variant
const TYPE_TO_VARIANT: Record<string, BannerVariant> = {
  info: "neutral",
  warning: "warning",
  success: "success",
  promo: "brand",
  update: "brand"
};

const BANNER_TYPE_ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  promo: Megaphone,
  update: Sparkles
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
  const TypeIcon = variantStyle?.icon ?? BANNER_TYPE_ICONS[bannerType] ?? Info;

  const getScheduleBadge = () => {
    if (!startsAt && !expiresAt) return null;
    const now = new Date();
    if (startsAt && new Date(startsAt) > now) {
      return (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-current opacity-70", variantStyle?.text)} style={isCustom ? { color: textColor } : undefined}>
          Agendado
        </Badge>);

    }
    if (expiresAt) {
      const diff = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0 && diff <= 7) {
        return (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-current opacity-70", variantStyle?.text)} style={isCustom ? { color: textColor } : undefined}>
            Expira em {diff}d
          </Badge>);

      }
    }
    return null;
  };

  const floatingMode = isFloating || borderStyle === "pill";

  return (
    <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-lg border bg-background">
      {/* Banner */}
      <div
        className={cn(
          "py-3 px-5 text-sm leading-relaxed relative flex flex-col items-center justify-center gap-3",
          "font-medium tracking-[0.01em] backdrop-blur-md transition-all",
          floatingMode && "mx-4 mt-2 rounded-2xl",
          !floatingMode && "rounded-none",
          isCustom ?
          "border-b shadow-sm" :
          cn(
            variantStyle?.bg,
            "border",
            variantStyle?.border,
            variantStyle?.text,
            "shadow-sm"
          )
        )}
        style={isCustom ? {
          ...(bgColor.startsWith("linear-gradient") ? { background: bgColor } : { backgroundColor: bgColor }),
          color: textColor
        } : undefined}>
        
        {/* Close button */}
        {canClose &&
        <button
          className={cn(
            "absolute top-2.5 right-3 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity",
            variantStyle?.text
          )}
          style={isCustom ? { color: textColor } : undefined}>
          
            <X className="h-3.5 w-3.5" />
          </button>
        }

        {/* Main content */}
        <div className="flex items-center justify-center gap-3 w-full pr-8" style={{ textAlign: textAlign as any }}>
          <TypeIcon className="h-4 w-4 flex-shrink-0 opacity-80" />
          {contentHtml ?
          <span
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            className="flex-1 min-w-0 overflow-hidden line-clamp-3 [&_a]:break-all"
            style={{ lineHeight: "1.5", wordBreak: "break-word", overflowWrap: "break-word" }} /> :


          <span className="flex-1 min-w-0 overflow-hidden">{content || "Texto do banner aqui..."}</span>
          }
          {getScheduleBadge()}
        </div>

        {/* Actions */}
        {(linkUrl || hasVoting) &&
        <div className="flex items-center justify-center gap-3">
            {linkUrl &&
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-70 cursor-pointer transition-opacity",
              variantStyle?.text
            )}
            style={isCustom ? { color: textColor } : undefined}>
            
                {linkLabel || "Saiba mais"}
                <ExternalLink className="h-3 w-3" />
              </span>
          }
            {hasVoting &&
          <div className="flex items-center gap-1">
                <span className={cn("p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer", variantStyle?.text)} style={isCustom ? { color: textColor } : undefined}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </span>
                <span className={cn("p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer", variantStyle?.text)} style={isCustom ? { color: textColor } : undefined}>
                  <ThumbsDown className="h-3.5 w-3.5" />
                </span>
              </div>
          }
          </div>
        }
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
      





















      
    </div>);

};

export default BannerPreview;
export { VARIANT_STYLES, TYPE_TO_VARIANT };