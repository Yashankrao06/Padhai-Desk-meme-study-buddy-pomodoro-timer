import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Check,
  Coffee,
  Droplets,
  Hand,
  ImagePlus,
  Maximize2,
  Minimize2,
  Pencil,
  RotateCcw,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import type {
  CharacterProfile,
  CustomBuddyMedia,
  MicroAction,
  ReactionKind,
  StudyTheme,
  TimerMode,
  TimerStatus,
} from '../types/study';
import { BuddyArtwork } from './BuddyArtwork';

interface BuddyStageProps {
  character: CharacterProfile;
  customName: string;
  customMedia?: CustomBuddyMedia;
  onRenameBuddy: (nextName: string) => void;
  onUpdateCustomMedia: (media: CustomBuddyMedia | null) => void;
  theme: StudyTheme;
  timerMode: TimerMode;
  timerStatus: TimerStatus;
  microAction: MicroAction;
  quote: string;
  reactionKind: ReactionKind | null;
  reactionNonce: number;
  activeTaskTitle?: string;
  isFullscreen: boolean;
  className?: string;
  onTriggerReaction: (kind: ReactionKind) => void;
  onRandomAction: () => void;
  onToggleFullscreen: () => void;
}

const ACTION_LABELS: Record<MicroAction, string> = {
  writing: 'Writing notes',
  sipping: 'Sipping warm drink',
  thinking: 'Reviewing concepts',
  typing: 'Typing summary',
  'turning-page': 'Flipping pages',
  sketching: 'Sketching diagrams',
  'head-bob': 'Locked into rhythm',
  snoozing: 'Resting eyes',
  'chai-chill': 'Chai break',
  stargazing: 'Window break',
  vibing: 'Chilling out',
};

export function BuddyStage({
  character,
  customName,
  customMedia,
  onRenameBuddy,
  onUpdateCustomMedia,
  theme,
  timerMode,
  timerStatus,
  microAction,
  quote,
  reactionKind,
  reactionNonce,
  activeTaskTitle,
  isFullscreen,
  className = '',
  onTriggerReaction,
  onRandomAction,
  onToggleFullscreen,
}: BuddyStageProps) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(customName);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const focusFileRef = useRef<HTMLInputElement | null>(null);
  const restFileRef = useRef<HTMLInputElement | null>(null);
  const { tokens } = theme;

  useEffect(() => {
    setEditingName(false);
    setDraftName(customName);
  }, [character.id, customName]);

  const isFocusRunning = timerMode === 'focus' && timerStatus === 'running';
  const statusText = isFocusRunning
    ? 'Studying'
    : timerMode === 'focus'
      ? 'Waiting for Focus'
      : timerMode === 'shortBreak'
        ? 'Short Break'
        : 'Long Break';

  const handleSaveName = () => {
    const trimmed = draftName.trim();
    onRenameBuddy(trimmed || character.defaultName);
    setEditingName(false);
  };

  const handleImageFile = (slot: 'focusUrl' | 'restUrl', file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateCustomMedia({
          ...customMedia,
          [slot]: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    onUpdateCustomMedia({
      ...customMedia,
      focusUrl: trimmed,
    });
    setUrlDraft('');
  };

  const hasCustomMedia = Boolean(customMedia?.focusUrl || customMedia?.restUrl);

  const actionItems: {
    kind: ReactionKind;
    label: string;
    Icon: typeof Coffee;
    accent?: boolean;
  }[] = [
    { kind: 'chai', label: `Offer ${character.drinkLabel}`, Icon: Coffee, accent: true },
    { kind: 'highfive', label: 'High-Five', Icon: Hand },
    { kind: 'cheer', label: 'Hype Up', Icon: Sparkles },
    { kind: 'hydrate', label: 'Water Break', Icon: Droplets },
    { kind: 'stretch', label: 'Quick Stretch', Icon: Activity },
  ];

  return (
    <section
      id="stage"
      aria-label="Study buddy stage"
      className={`glass-panel flex flex-col gap-3.5 sm:gap-4 rounded-2xl border p-3.5 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
    >
      {/* Top stage header: Editable buddy nameplate & unboxed metadata */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveName();
              }}
            >
              <label htmlFor="buddy-name-input" className="sr-only">
                Custom buddy name
              </label>
              <input
                id="buddy-name-input"
                type="text"
                maxLength={28}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="glass-tile w-full max-w-[14rem] rounded-lg border px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: tokens.surfaceMutedBg,
                  borderColor: tokens.borderColor,
                  color: tokens.textPrimary,
                }}
                autoFocus
              />
              <button
                type="submit"
                aria-label="Save buddy name"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ backgroundColor: tokens.accentBg, color: tokens.accentText }}
              >
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2
                className="font-display truncate text-lg sm:text-xl font-semibold tracking-tight"
                style={{ color: tokens.textPrimary }}
                data-testid="buddy-display-name"
              >
                {customName}
              </h2>
              <button
                type="button"
                aria-label="Rename study buddy"
                onClick={() => {
                  setDraftName(customName);
                  setEditingName(true);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md opacity-75 transition-opacity hover:opacity-100"
                style={{ color: tokens.textSecondary }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Clean unboxed metadata row */}
          <div
            className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
            style={{ color: tokens.textSecondary }}
          >
            <span>{statusText}</span>
            <span aria-hidden="true">·</span>
            <span>{isFocusRunning ? ACTION_LABELS[microAction] : 'Looking at you'}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="hidden sm:inline truncate">{character.deskSetup}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPhotoEditor((v) => !v)}
            aria-expanded={showPhotoEditor}
            aria-label="Customize buddy photo or GIF"
            className="glass-tile inline-flex min-h-[40px] flex-1 sm:flex-initial shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: showPhotoEditor ? tokens.accentSoftBg : tokens.surfaceMutedBg,
              borderColor: showPhotoEditor ? tokens.accentBg : tokens.borderColor,
              color: tokens.textPrimary,
            }}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Photo / GIF</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen focus' : 'Enter fullscreen focus'}
            className="glass-tile inline-flex min-h-[40px] flex-1 sm:flex-initial shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: tokens.surfaceMutedBg,
              borderColor: tokens.borderColor,
              color: tokens.textPrimary,
            }}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Photo / GIF Uploader Panel */}
      {showPhotoEditor && (
        <div
          className="glass-tile flex flex-col gap-3 rounded-xl border p-3.5 text-xs"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">
                Set Real Photo / GIF for {customName}
              </p>
              <p style={{ color: tokens.textSecondary }}>
                Upload PNG, JPG, WebP, or animated GIF for studying and waiting states.
              </p>
            </div>
            {hasCustomMedia && (
              <button
                type="button"
                onClick={() => onUpdateCustomMedia(null)}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-medium whitespace-nowrap"
                style={{
                  backgroundColor: tokens.surfaceBg,
                  borderColor: tokens.borderColor,
                  color: tokens.textPrimary,
                }}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => focusFileRef.current?.click()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium whitespace-nowrap"
              style={{
                backgroundColor: tokens.surfaceBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>{customMedia?.focusUrl ? 'Change Studying Image' : 'Upload Studying Photo/GIF'}</span>
            </button>

            <button
              type="button"
              onClick={() => restFileRef.current?.click()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium whitespace-nowrap"
              style={{
                backgroundColor: tokens.surfaceBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>{customMedia?.restUrl ? 'Change Idle Image' : 'Upload Idle Photo/GIF (Optional)'}</span>
            </button>

            <input
              ref={focusFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFile('focusUrl', e.target.files?.[0])}
            />
            <input
              ref={restFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFile('restUrl', e.target.files?.[0])}
            />
          </div>

          <form onSubmit={handleApplyUrl} className="flex gap-2">
            <label htmlFor="buddy-image-url" className="sr-only">
              Paste image URL for buddy
            </label>
            <input
              id="buddy-image-url"
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="Or paste a direct image/GIF URL..."
              className="min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-xs"
              style={{
                backgroundColor: tokens.surfaceBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 font-semibold whitespace-nowrap"
              style={{
                backgroundColor: tokens.accentBg,
                color: tokens.accentText,
              }}
            >
              Use URL
            </button>
          </form>
        </div>
      )}

      {/* Speech Bubble */}
      <div
        className="glass-tile rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: tokens.surfaceMutedBg,
          borderColor: tokens.borderColor,
          color: tokens.textPrimary,
        }}
        data-testid="buddy-speech-bubble"
      >
        <span className="font-medium" style={{ color: tokens.accentInk }}>
          {customName}:
        </span>{' '}
        “{quote}”
      </div>

      {/* Enlarged Cutout & Photographic Room Stage */}
      <BuddyArtwork
        character={character}
        customMedia={customMedia}
        theme={theme}
        timerMode={timerMode}
        timerStatus={timerStatus}
        microAction={microAction}
        reactionKind={reactionKind}
        reactionNonce={reactionNonce}
        activeTaskTitle={activeTaskTitle}
      />

      {/* Interactive Buddy Actions Bar */}
      <div
        className="grid grid-cols-2 gap-2 pt-0.5 sm:flex sm:flex-wrap sm:items-center"
        role="group"
        aria-label="Buddy interactions"
      >
        {actionItems.map(({ kind, label, Icon, accent }) => {
          const isActive = reactionKind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onTriggerReaction(kind)}
              aria-pressed={isActive}
              className="glass-tile inline-flex min-h-[44px] sm:min-h-[40px] items-center justify-center sm:justify-start gap-1.5 rounded-xl border px-3 sm:px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: isActive || accent ? tokens.accentSoftBg : tokens.surfaceMutedBg,
                borderColor: isActive ? tokens.accentBg : tokens.borderColor,
                color: accent || isActive ? tokens.accentInk : tokens.textPrimary,
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onRandomAction}
          className="glass-tile inline-flex min-h-[44px] sm:min-h-[40px] items-center justify-center sm:justify-start gap-1.5 rounded-xl border px-3 sm:px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          <Shuffle className="h-3.5 w-3.5 shrink-0" />
          <span>Next Pose</span>
        </button>
      </div>
    </section>
  );
}
