interface ArticlePreviewProps {
  title: string;
  subtitle: string;
  htmlContent: string;
}

export function ArticlePreview({ title, subtitle, htmlContent }: ArticlePreviewProps) {
  const estimateReadingTime = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <div className="light bg-white min-h-full overflow-y-auto">
      <div className="max-w-none px-6 py-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight leading-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base font-light leading-relaxed text-slate-500 mt-2">
                {subtitle}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {estimateReadingTime(htmlContent)} min de leitura
              </span>
            </div>
          </div>
        )}

        {htmlContent ? (
          <div
            className="prose prose-slate max-w-none
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
              prose-p:leading-relaxed prose-p:text-slate-700
              prose-a:font-medium prose-a:text-blue-600
              prose-img:rounded-lg prose-img:shadow-sm
              prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-800 prose-pre:rounded-lg"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <p className="text-sm text-slate-400 italic">
            O preview aparecerá aqui conforme você escreve...
          </p>
        )}
      </div>
    </div>
  );
}
