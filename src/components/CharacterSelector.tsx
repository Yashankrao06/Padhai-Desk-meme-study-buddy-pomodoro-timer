import { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import type {
  CharacterId,
  CharacterOrigin,
  CharacterProfile,
  CustomBuddyMedia,
  StudyTheme,
} from '../types/study';

interface CharacterSelectorProps {
  theme: StudyTheme;
  selectedId: CharacterId;
  customMediaMap: Partial<Record<CharacterId, CustomBuddyMedia>>;
  className?: string;
  onSelect: (id: CharacterId) => void;
}

function MiniAvatar({
  char,
  customMedia,
}: {
  char: CharacterProfile;
  customMedia?: CustomBuddyMedia;
}) {
  const [failed, setFailed] = useState(false);
  const imgSrc = customMedia?.focusUrl || char.avatarUrl;

  if (!failed && imgSrc) {
    return (
      <img
        src={imgSrc}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-full border border-white/30 object-cover object-top bg-black/10 shadow-xs"
      />
    );
  }

  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/15 text-xs font-bold"
      style={{ backgroundColor: char.palette.shirt, color: '#241C18' }}
      aria-hidden="true"
    >
      {char.defaultName.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CharacterSelector({
  theme,
  selectedId,
  customMediaMap,
  className = '',
  onSelect,
}: CharacterSelectorProps) {
  const [filter, setFilter] = useState<'all' | CharacterOrigin>('all');
  const { tokens } = theme;

  const filtered =
    filter === 'all' ? CHARACTERS : CHARACTERS.filter((c) => c.origin === filter);

  return (
    <section
      id="buddies"
      aria-label="Choose your study buddy"
      className={`glass-panel flex flex-col gap-3.5 rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold" style={{ color: tokens.textPrimary }}>
            Study Buddies
          </h3>
          <p className="text-xs" style={{ color: tokens.textSecondary }}>
            Pick a companion to wait and study alongside you
          </p>
        </div>

        <div
          className="glass-tile inline-flex rounded-xl border p-1"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
          }}
          role="group"
          aria-label="Filter buddies by origin"
        >
          {(
            [
              { id: 'all', label: 'All (8)' },
              { id: 'indian', label: 'Indian' },
              { id: 'international', label: 'Global' },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: active ? tokens.accentBg : 'transparent',
                  color: active ? tokens.accentText : tokens.textSecondary,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {filtered.map((char) => {
          const active = char.id === selectedId;
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => onSelect(char.id)}
              aria-pressed={active}
              className="glass-tile flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all hover:brightness-105"
              style={{
                backgroundColor: active ? tokens.accentSoftBg : tokens.surfaceMutedBg,
                borderColor: active ? tokens.accentBg : tokens.borderColor,
              }}
            >
              <MiniAvatar char={char} customMedia={customMediaMap[char.id]} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                    {char.defaultName}
                  </span>
                </div>
                <p className="truncate text-xs" style={{ color: tokens.textSecondary }}>
                  {char.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
