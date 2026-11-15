import { useEffect, useState } from 'react';
import type {
  CharacterProfile,
  CustomBuddyMedia,
  MicroAction,
  ReactionKind,
  StudyTheme,
  TimerMode,
  TimerStatus,
} from '../types/study';
import { AtmosphereLayer } from './AtmosphereLayer';

interface BuddyArtworkProps {
  character: CharacterProfile;
  customMedia?: CustomBuddyMedia;
  theme: StudyTheme;
  timerMode: TimerMode;
  timerStatus: TimerStatus;
  microAction: MicroAction;
  reactionKind: ReactionKind | null;
  reactionNonce?: number;
  activeTaskTitle?: string;
}

function getReactionBadgeText(kind: ReactionKind, drinkLabel: string): string {
  switch (kind) {
    case 'chai':
      return `+1 ${drinkLabel}`;
    case 'highfive':
      return 'High-Five!';
    case 'cheer':
      return 'Hype Boost!';
    case 'hydrate':
      return 'Stay Hydrated!';
    case 'stretch':
      return 'Quick Stretch!';
  }
}

export function BuddyArtwork({
  character,
  customMedia,
  theme,
  timerMode,
  timerStatus,
  microAction,
  reactionKind,
  reactionNonce = 0,
  activeTaskTitle,
}: BuddyArtworkProps) {
  const [imgError, setImgError] = useState(false);
  const isBreakMode = timerMode !== 'focus';
  const isFocusRunning = timerMode === 'focus' && timerStatus === 'running';
  const isWriting = isFocusRunning && (microAction === 'writing' || microAction === 'sketching');
  const isSipping = microAction === 'sipping' || microAction === 'chai-chill';
  const isThinking = microAction === 'thinking' || microAction === 'turning-page';
  const isBobbing = microAction === 'head-bob' || microAction === 'vibing';
  const isSnoozing = isBreakMode && microAction === 'snoozing';

  // When timer is running in focus mode: show studying pose (*-study.png).
  // When timer is idle/paused or on break: show standing still looking at you (*-idle.png).
  const activeImageUrl = isFocusRunning
    ? customMedia?.focusUrl || character.imageUrl
    : isBreakMode
      ? customMedia?.restUrl || character.idleImageUrl
      : customMedia?.restUrl || character.idleImageUrl;

  useEffect(() => {
    setImgError(false);
  }, [activeImageUrl]);

  const isTransparent = Boolean(
    character.imageIsTransparent &&
      (isFocusRunning ? !customMedia?.focusUrl : !customMedia?.restUrl),
  );
  const isIndian = character.origin === 'indian';

  const { tokens } = theme;
  const { palette, id } = character;

  const characterAnimClass =
    reactionKind === 'stretch'
      ? 'anim-stretch-sway'
      : reactionKind
        ? 'anim-reaction-bounce'
        : isSnoozing
          ? 'anim-head-snooze'
          : isBobbing
            ? 'anim-head-bob'
            : isSipping
              ? 'anim-sip-sway'
              : isThinking && isFocusRunning
                ? 'anim-head-think'
                : isWriting || isFocusRunning
                  ? 'anim-study-focus'
                  : 'anim-breathe';

  return (
    <div
      className="relative aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden rounded-xl border select-none"
      style={{
        borderColor: tokens.borderColor,
        backgroundColor: tokens.pageBg,
      }}
      data-testid="buddy-stage-canvas"
      data-character={character.id}
      data-action={microAction}
      data-pose={isFocusRunning ? 'studying' : 'idle'}
      data-resting={isBreakMode ? 'true' : 'false'}
    >
      {/* Photographic Room Environment Backdrop inside Stage */}
      <img
        src={tokens.backgroundImageUrl}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
          isBreakMode ? 'scale-[1.03] brightness-75 saturate-90' : 'scale-[1.03] brightness-95'
        }`}
        style={{ filter: isBreakMode ? 'blur(1.5px) brightness(0.76)' : 'blur(1px) brightness(0.92)' }}
      />

      {/* Atmospheric Depth Tint + Warm Desk Lamp Radial Halo */}
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-500"
        style={{
          background: `${tokens.stageBackdropTint}, radial-gradient(circle at 50% 56%, ${tokens.lampGlow} 0%, rgba(0,0,0,0) 62%)`,
        }}
      />

      {/* Floating Weather / Room Atmosphere Particles */}
      <AtmosphereLayer theme={theme} />

      {/* Enlarged Background-Free Character Cutout (Idle Standing vs Studying) */}
      {!imgError && activeImageUrl && (
        <div
          className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 flex items-end justify-center ${
            isTransparent
              ? 'bottom-[11.5%] sm:bottom-[15.2%] w-[78%] sm:w-[68%] h-[84%] sm:h-[82%]'
              : 'bottom-[11.5%] sm:bottom-[15%] w-[56%] sm:w-[46%] h-[70%] sm:h-[68%]'
          }`}
        >
          <div
            key={reactionKind ? `${reactionKind}-${reactionNonce}` : isFocusRunning ? 'study' : 'idle'}
            className={`${characterAnimClass} relative flex h-full w-full items-end justify-center ${
              isTransparent
                ? ''
                : 'overflow-hidden rounded-t-[28px] border shadow-2xl'
            }`}
            style={
              isTransparent
                ? undefined
                : {
                    borderColor: tokens.borderColor,
                    backgroundColor: tokens.surfaceMutedBg,
                  }
            }
          >
            <img
              src={activeImageUrl}
              alt={
                isFocusRunning
                  ? `${character.defaultName} studying at the desk`
                  : `${character.defaultName} waiting and looking at you`
              }
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className={`h-full w-full transition-all duration-500 ${
                isTransparent ? 'object-contain object-bottom' : 'object-cover object-top'
              } ${isBreakMode ? 'brightness-[0.88] saturate-[0.9]' : 'brightness-105'}`}
              style={
                isTransparent
                  ? {
                      filter: isBreakMode
                        ? 'drop-shadow(0 18px 28px rgba(0,0,0,0.52)) brightness(0.88) saturate(0.9)'
                        : 'drop-shadow(0 18px 30px rgba(0,0,0,0.48))',
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Graceful fallback if user supplies an invalid external URL */}
      {imgError && (
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 flex items-center justify-center rounded-t-2xl border px-4 text-center text-xs font-semibold backdrop-blur-md"
          style={{
            bottom: '16%',
            width: '40%',
            height: '52%',
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          {character.defaultName}
        </div>
      )}

      {/* Sleek Low Wooden Foreground Desk Strip + Character Props + Chai + Sticky Note */}
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMax meet"
        className="pointer-events-none absolute inset-0 z-20 block h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="deskSurface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tokens.deskTop} />
            <stop offset="100%" stopColor={tokens.deskFront} />
          </linearGradient>
          <linearGradient id="deskLipShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
          </linearGradient>
        </defs>

        {/* Floating Zzzs when in Break / Snooze mode */}
        {isBreakMode && (
          <g fill="#FFF7E8" fontFamily="var(--font-display)" fontWeight="700" opacity="0.95">
            <text x="412" y="108" fontSize="18" className="anim-zzz-1">z</text>
            <text x="428" y="88" fontSize="22" className="anim-zzz-2">z</text>
            <text x="446" y="68" fontSize="27" className="anim-zzz-3">Z</text>
          </g>
        )}

        {/* Ambient shadow cast onto top of desk */}
        <rect x="0" y="290" width="640" height="16" fill="url(#deskLipShadow)" />

        {/* SLEEK WOODEN DESK LEDGE */}
        <rect
          x="0"
          y="302"
          width="640"
          height="16"
          fill="url(#deskSurface)"
          stroke="#221710"
          strokeWidth="2"
        />
        <line x1="0" y1="305" x2="640" y2="305" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.24" />
        <rect x="0" y="318" width="640" height="42" fill={tokens.deskFront} />
        <line x1="0" y1="319" x2="640" y2="319" stroke="#1E130D" strokeWidth="2" opacity="0.45" />
        <line x1="48" y1="336" x2="188" y2="336" stroke="#1E130D" strokeWidth="1.4" opacity="0.16" />
        <line x1="280" y1="344" x2="430" y2="344" stroke="#1E130D" strokeWidth="1.4" opacity="0.16" />

        {/* CHARACTER-SPECIFIC SIGNATURE PROP ON FAR LEFT OF DESK */}
        {id === 'baburao' && (
          <g transform="translate(22, 266)">
            <rect x="4" y="18" width="48" height="18" rx="4" fill="#2A2B30" stroke="#141518" strokeWidth="1.8" />
            <path d="M0,13 C14,2 42,2 56,13 L50,20 C40,12 16,12 6,20 Z" fill="#1D1E22" />
            <circle cx="28" cy="27" r="6.5" fill="#EAE4D7" />
          </g>
        )}

        {id === 'sachiv' && (
          <g transform="translate(18, 224)">
            <rect x="16" y="70" width="32" height="8" rx="3" fill="#DCE2E6" stroke="#241C18" strokeWidth="1.8" />
            <rect x="29" y="45" width="6" height="25" fill="#C7D0D6" stroke="#241C18" strokeWidth="1.4" />
            <circle cx="32" cy="30" r="23" fill="none" stroke="#8C99A2" strokeWidth="2.2" />
            <g className={timerStatus === 'running' || !isSnoozing ? 'anim-fan-spin' : ''} style={{ transformOrigin: '32px 30px' }}>
              <ellipse cx="32" cy="19" rx="4" ry="10.5" fill="#A5B4BF" />
              <ellipse cx="41" cy="35" rx="10.5" ry="4" transform="rotate(30 41 35)" fill="#A5B4BF" />
              <ellipse cx="23" cy="35" rx="10.5" ry="4" transform="rotate(-30 23 35)" fill="#A5B4BF" />
            </g>
            <circle cx="32" cy="30" r="4.5" fill="#52616B" />
            <ellipse cx="80" cy="70" rx="16" ry="5.5" fill="#77A35B" stroke="#241C18" strokeWidth="1.6" />
          </g>
        )}

        {id === 'jethalal' && (
          <g transform="translate(22, 266)">
            <ellipse cx="30" cy="31" rx="26" ry="7.5" fill="#F4F1EA" stroke="#241C18" strokeWidth="1.8" />
            <path d="M18,29 Q24,21 29,29 Q35,22 40,29" fill="none" stroke="#E07A2E" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="66" y="14" width="32" height="23" rx="3.5" fill="#3A424D" stroke="#1E2329" strokeWidth="1.8" />
            <rect x="70" y="17" width="24" height="7" rx="1.2" fill="#9EB39C" />
          </g>
        )}

        {id === 'majnu' && (
          <g transform="translate(22, 218)">
            <line x1="18" y1="84" x2="36" y2="10" stroke="#7A5236" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="60" y1="84" x2="42" y2="10" stroke="#7A5236" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="12" y="18" width="54" height="48" rx="3" fill="#F6EFE2" stroke="#5A3921" strokeWidth="2.5" />
            <rect x="23" y="45" width="24" height="9" rx="3.5" fill="#8C837A" />
            <line x1="26" y1="54" x2="26" y2="61" stroke="#8C837A" strokeWidth="2.5" />
            <line x1="44" y1="54" x2="44" y2="61" stroke="#8C837A" strokeWidth="2.5" />
            <rect x="28" y="31" width="19" height="9" rx="3" fill="#4A3228" />
            <line x1="31" y1="39" x2="31" y2="46" stroke="#4A3228" strokeWidth="2.2" />
            <line x1="44" y1="39" x2="44" y2="46" stroke="#4A3228" strokeWidth="2.2" />
          </g>
        )}

        {id === 'cheems' && (
          <g transform="translate(26, 266)">
            <rect x="6" y="25" width="34" height="6" rx="2.5" fill="#C49A6C" stroke="#241C18" strokeWidth="1.6" />
            <rect x="33" y="14" width="14" height="22" rx="2.5" fill="#8C6239" stroke="#241C18" strokeWidth="1.8" />
          </g>
        )}

        {id === 'lofigirl' && (
          <g transform="translate(24, 264)">
            <ellipse cx="36" cy="30" rx="24" ry="12" fill="#D48C4E" stroke="#241C18" strokeWidth="1.8" />
            <circle cx="20" cy="24" r="10.5" fill="#D48C4E" stroke="#241C18" strokeWidth="1.8" />
            <polygon points="12,17 15,8 20,15" fill="#D48C4E" stroke="#241C18" strokeWidth="1.6" />
            <polygon points="20,15 26,8 28,17" fill="#D48C4E" stroke="#241C18" strokeWidth="1.6" />
            <path d="M48,32 Q64,30 62,37" fill="none" stroke="#B87137" strokeWidth="4.2" strokeLinecap="round" />
          </g>
        )}

        {id === 'cryingcat' && (
          <g transform="translate(26, 264)">
            <rect x="6" y="18" width="54" height="10" rx="2.5" fill="#6F8FAF" stroke="#241C18" strokeWidth="1.8" />
            <rect x="10" y="28" width="50" height="10" rx="2.5" fill="#D4897B" stroke="#241C18" strokeWidth="1.8" />
          </g>
        )}

        {id === 'vibecat' && (
          <g transform="translate(26, 268)">
            <rect x="6" y="10" width="66" height="23" rx="3.5" fill="#2A303C" stroke="#15181E" strokeWidth="1.8" />
            <rect x="13" y="15" width="10" height="8.5" rx="1.5" fill="#81A1C1" />
            <rect x="27" y="15" width="10" height="8.5" rx="1.5" fill="#A3BE8C" />
            <rect x="41" y="15" width="10" height="8.5" rx="1.5" fill="#EBCB8B" />
            <rect x="55" y="15" width="10" height="8.5" rx="1.5" fill="#BF616A" />
          </g>
        )}

        {/* STEAMING CUTTING CHAI GLASS (INDIAN) OR CERAMIC MUG (INTERNATIONAL) ON RIGHT */}
        <g transform="translate(556, 262)">
          <g className={isSipping ? 'anim-sip-cup' : ''}>
            <path d="M12,0 Q8,-8 14,-16" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" className="anim-steam-1" />
            <path d="M22,2 Q26,-8 20,-16" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.58" className="anim-steam-2" />
            {isIndian ? (
              <>
                <path d="M7,10 L27,10 L24,40 L10,40 Z" fill="#F2DEC2" fillOpacity="0.45" stroke="#241C18" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8,16 L26,16 L24,38 L10,38 Z" fill="#B56A36" opacity="0.92" />
                <line x1="14" y1="12" x2="14" y2="38" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.45" />
                <line x1="20" y1="12" x2="20" y2="38" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.3" />
                <ellipse cx="17" cy="10" rx="10" ry="3" fill="#D59254" stroke="#241C18" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <path d="M6,10 L28,10 L25,40 L9,40 Z" fill={palette.prop} stroke="#241C18" strokeWidth="2" strokeLinejoin="round" />
                <path d="M27,15 C34,15 34,27 26,27" fill="none" stroke="#241C18" strokeWidth="2.5" />
                <ellipse cx="17" cy="10" rx="11" ry="3.5" fill="#7A4B2A" />
              </>
            )}
          </g>
        </g>

        {/* SUBTLE WRITING INDICATOR PEN SCRIBBLE ON DESK CORNER WHEN FOCUSING */}
        {isWriting && (
          <g transform="translate(132, 304)">
            <rect x="0" y="0" width="38" height="10" rx="2" fill="#FFFDF8" opacity="0.88" />
            <path
              d="M5,5 Q14,2 22,6 T34,4"
              fill="none"
              stroke={tokens.accentBg}
              strokeWidth="1.8"
              strokeLinecap="round"
              className="anim-ink-scribble"
            />
          </g>
        )}

        {/* ACTIVE TASK STICKY NOTE PINNED ON DESK FRONT */}
        {activeTaskTitle && (
          <g transform="translate(494, 309)">
            <rect
              x="0"
              y="0"
              width="128"
              height="44"
              rx="4"
              fill="#F7E396"
              stroke="#C9B25D"
              strokeWidth="1.5"
              transform="rotate(-1.5)"
            />
            <text
              x="10"
              y="16"
              fontSize="9"
              fontWeight="600"
              fill="#5D4D1A"
              fontFamily="var(--font-sans)"
            >
              ACTIVE FOCUS
            </text>
            <text
              x="10"
              y="32"
              fontSize="11"
              fontWeight="600"
              fill="#2B230A"
              fontFamily="var(--font-sans)"
            >
              {activeTaskTitle.length > 17
                ? `${activeTaskTitle.slice(0, 16)}…`
                : activeTaskTitle}
            </text>
          </g>
        )}
      </svg>

      {/* Reaction Pop Overlay */}
      {reactionKind && (
        <div
          key={`${reactionKind}-${reactionNonce}`}
          className="anim-reaction-pop pointer-events-none absolute left-1/2 top-12 z-30 -translate-x-1/2 rounded-xl border px-4 py-1.5 text-sm font-semibold shadow-lg backdrop-blur-xl"
          style={{
            backgroundColor: tokens.surfaceBg,
            color: tokens.textPrimary,
            borderColor: tokens.accentBg,
            boxShadow: tokens.glassShadow,
          }}
        >
          {getReactionBadgeText(reactionKind, character.drinkLabel)}
        </div>
      )}
    </div>
  );
}
