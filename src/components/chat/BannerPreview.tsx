import { ThumbsUp, ThumbsDown, ExternalLink, X, MessageSquare, Info, AlertTriangle, CheckCircle, Megaphone, Sparkles } from "lucide-react";
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
}

const BANNER_TYPE_ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  promo: Megaphone,
  update: Sparkles,
};

const BORDER_STYLES: Record<string, string> = {
  none: "",
  subtle: "border-b border-white/15",
  rounded: "rounded-b-xl",
  pill: "mx-4 mt-2 rounded-3xl",
};

const SHADOW_STYLES: Record<string, string> = {
  none: "",
  soft: "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
  medium: "shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
  strong: "shadow-[0_8px_32px_rgba(0,0,0,0.18)]",
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
}: BannerPreviewProps) => {
  const TypeIcon = BANNER_TYPE_ICONS[bannerType] ?? Info;

  const getScheduleBadge = () => {
    if (!startsAt && !expiresAt) return null;
    const now = new Date();
    if (startsAt && new Date(startsAt) > now) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current opacity-70" style={{ color: textColor }}>
          Agendado
        </Badge>
      );
    }
    if (expiresAt) {
      const diff = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0 && diff <= 7) {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current opacity-70" style={{ color: textColor }}>
            Expira em {diff}d
          </Badge>
        );
      }
    }
    return null;
  };

  const borderClass = BORDER_STYLES[borderStyle] || "";
  const shadowClass = SHADOW_STYLES[shadowStyle] || "";
  const isPill = borderStyle === "pill";

  return (
    <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-lg border bg-background">
      {/* Banner */}
      <div
        className={cn(
          "px-5 py-4 text-sm relative flex flex-col items-center justify-center gap-2",
          "font-medium tracking-[0.01em] leading-relaxed",
          borderClass,
          shadowClass
        )}
        style={{ ...(bgColor.startsWith("linear-gradient") ? { background: bgColor } : { backgroundColor: bgColor }), color: textColor }}
      >
        {/* Close button - absolute positioned */}
        <button
          className="absolute top-3 right-3 p-1 rounded opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: textColor }}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Main content - centered */}
        <div className="flex items-center justify-center gap-2.5 w-full pr-8 text-center">
          <TypeIcon className="h-4 w-4 flex-shrink-0 opacity-90" />
          {contentHtml ? (
            <span
              dangerouslySetInnerHTML={{ __html: contentHtml }}
              className="flex-1"
              style={{ maxHeight: "3em", overflow: "hidden", display: "block", lineHeight: "1.5", wordBreak: "break-word" }}
            />
          ) : (
            <span className="flex-1">{content || "Texto do banner aqui..."}</span>
          )}
          {getScheduleBadge()}
        </div>

        {/* Actions row - centered below content */}
        {(linkUrl || hasVoting) && (
          <div className="flex items-center justify-center gap-3 mt-1">
            {linkUrl && (
              <span
                className="inline-flex items-center gap-1 text-xs underline opacity-90 hover:opacity-100 cursor-pointer"
                style={{ color: textColor }}
              >
                {linkLabel || "Saiba mais"}
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
            {hasVoting && (
              <div className="flex items-center gap-1">
                <span className="p-1 rounded hover:bg-white/10 cursor-pointer" style={{ color: textColor }}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </span>
                <span className="p-1 rounded hover:bg-white/10 cursor-pointer" style={{ color: textColor }}>
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
      <div className="p-6 space-y-4 min-h-[160px] relative">
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="h-3 w-full bg-muted/60 rounded" />
        <div className="h-3 w-5/6 bg-muted/60 rounded" />
        <div className="flex gap-3 mt-4">
          <div className="h-16 w-1/3 bg-muted/40 rounded-lg" />
          <div className="h-16 w-1/3 bg-muted/40 rounded-lg" />
          <div className="h-16 w-1/3 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-3 w-2/3 bg-muted/60 rounded" />

        {/* Mock FAB chat widget */}
        <div className="absolute bottom-3 right-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: bgColor }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: textColor }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerPreview;
