import { THEMES } from '../data/themes';
import type { StudyTheme, ThemeId } from '../types/study';

interface ThemeSelectorProps {
  theme: StudyTheme;
  selectedThemeId: ThemeId;
  className?: string;
  onSelectTheme: (id: ThemeId) => void;
}

export function ThemeSelector({
  theme,
  selectedThemeId,
  className = '',
  onSelectTheme,
}: ThemeSelectorProps) {
  const { tokens } = theme;

  return (
    <section
      aria-label="Room atmosphere themes"
      className={`glass-panel flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
    >
      <div>
        <h3 className="font-display text-base font-semibold" style={{ color: tokens.textPrimary }}>
          Room Atmosphere
        </h3>
        <p className="text-xs" style={{ color: tokens.textSecondary }}>
          Switch lighting, photographic room environment, and ambient palette
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {THEMES.map((item, idx) => {
          const active = item.id === selectedThemeId;
          const isLastOdd = idx === THEMES.length - 1;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTheme(item.id)}
              aria-pressed={active}
              className={`glass-tile group flex flex-col items-stretch gap-2 overflow-hidden rounded-xl border p-2 text-left transition-all hover:brightness-105 ${
                isLastOdd ? 'col-span-2 sm:col-span-1' : ''
              }`}
              style={{
                backgroundColor: active ? tokens.accentSoftBg : tokens.surfaceMutedBg,
                borderColor: active ? tokens.accentBg : tokens.borderColor,
              }}
            >
              <div className="relative h-14 w-full shrink-0 overflow-hidden rounded-lg border border-white/25 sm:h-12">
                <img
                  src={item.tokens.backgroundImageUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/45 px-1 py-0.5 backdrop-blur-xs">
                  {item.swatchColors.map((hex, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full border border-white/25"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="min-w-0 px-0.5">
                <div className="truncate text-xs font-semibold" style={{ color: tokens.textPrimary }}>
                  {item.name}
                </div>
                <div className="truncate text-[11px]" style={{ color: tokens.textSecondary }}>
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
