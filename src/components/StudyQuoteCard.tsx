import { Quote, RefreshCw } from 'lucide-react';
import type { StudyQuoteItem } from '../data/studyQuotes';
import type { StudyTheme } from '../types/study';

interface StudyQuoteCardProps {
  theme: StudyTheme;
  studyQuote: StudyQuoteItem;
  className?: string;
  onNextQuote: () => void;
}

export function StudyQuoteCard({
  theme,
  studyQuote,
  className = '',
  onNextQuote,
}: StudyQuoteCardProps) {
  const { tokens } = theme;

  return (
    <section
      aria-label="Study quote inspiration"
      className={`glass-panel flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
      data-testid="study-quote-card"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 shrink-0" style={{ color: tokens.accentInk }} />
          <span className="font-display text-sm font-semibold" style={{ color: tokens.textPrimary }}>
            Study Quote
          </span>
          <span className="text-xs" style={{ color: tokens.textSecondary }}>
            · {studyQuote.theme}
          </span>
        </div>

        <button
          type="button"
          onClick={onNextQuote}
          aria-label="Next study quote"
          className="glass-tile inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap transition-all hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          <RefreshCw className="h-3 w-3" />
          <span>New Quote</span>
        </button>
      </div>

      <blockquote
        className="font-quote text-base italic leading-relaxed sm:text-[17px]"
        style={{ color: tokens.textPrimary }}
      >
        “{studyQuote.text}”
      </blockquote>

      <p className="text-xs font-medium" style={{ color: tokens.textSecondary }}>
        — {studyQuote.author}
      </p>
    </section>
  );
}
