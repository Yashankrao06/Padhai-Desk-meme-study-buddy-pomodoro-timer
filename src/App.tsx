import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Coffee,
  Droplets,
  Github,
  Hand,
  Linkedin,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getCharacterById } from './data/characters';
import { getThemeById } from './data/themes';
import { STUDY_QUOTES } from './data/studyQuotes';
import {
  DEFAULT_POMODORO_SETTINGS,
  calculateStreakDays,
  formatTime,
  getLocalDateKey,
  getModeDurationSeconds,
  getNextTimerStateOnComplete,
  pickRandomAction,
  pickRandomQuote,
} from './utils/pomodoro';
import { soundEngine } from './utils/soundEngine';
import type {
  CharacterId,
  CustomBuddyMedia,
  DailyProgress,
  MicroAction,
  PomodoroSettings,
  ReactionKind,
  SoundChannelId,
  SoundChannelsState,
  StudyTask,
  ThemeId,
  TimerMode,
  TimerStatus,
} from './types/study';
import { BuddyStage } from './components/BuddyStage';
import { BuddyArtwork } from './components/BuddyArtwork';
import { TimerPanel } from './components/TimerPanel';
import { TaskTracker } from './components/TaskTracker';
import { SoundMixer } from './components/SoundMixer';
import { CharacterSelector } from './components/CharacterSelector';
import { ThemeSelector } from './components/ThemeSelector';
import { StudyQuoteCard } from './components/StudyQuoteCard';

const STORAGE_KEYS = {
  character: 'padhaidesk.character',
  theme: 'padhaidesk.theme',
  customNames: 'padhaidesk.customNames',
  customMedia: 'padhaidesk.customMedia',
  tasks: 'padhaidesk.tasks',
  activeTaskId: 'padhaidesk.activeTaskId',
  settings: 'padhaidesk.settings',
  progress: 'padhaidesk.progress',
};

const INITIAL_SOUND_CHANNELS: SoundChannelsState = {
  rain: { enabled: false, volume: 0.55 },
  lofi: { enabled: false, volume: 0.5 },
  fireplace: { enabled: false, volume: 0.45 },
  brown: { enabled: false, volume: 0.45 },
  vinyl: { enabled: false, volume: 0.35 },
  breeze: { enabled: false, volume: 0.4 },
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [characterId, setCharacterId] = useState<CharacterId>(() =>
    readJson<CharacterId>(STORAGE_KEYS.character, 'baburao'),
  );
  const [themeId, setThemeId] = useState<ThemeId>(() =>
    readJson<ThemeId>(STORAGE_KEYS.theme, 'peach-hour'),
  );
  const [customNames, setCustomNames] = useState<Partial<Record<CharacterId, string>>>(() =>
    readJson<Partial<Record<CharacterId, string>>>(STORAGE_KEYS.customNames, {}),
  );
  const [customMediaMap, setCustomMediaMap] = useState<Partial<Record<CharacterId, CustomBuddyMedia>>>(() =>
    readJson<Partial<Record<CharacterId, CustomBuddyMedia>>>(STORAGE_KEYS.customMedia, {}),
  );
  const [settings, setSettings] = useState<PomodoroSettings>(() => ({
    ...DEFAULT_POMODORO_SETTINGS,
    ...readJson<Partial<PomodoroSettings>>(STORAGE_KEYS.settings, {}),
  }));

  const [tasks, setTasks] = useState<StudyTask[]>(() =>
    readJson<StudyTask[]>(STORAGE_KEYS.tasks, [
      { id: 'seed-1', title: 'Review core notes (25m block)', completed: false, createdAt: 1 },
    ]),
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() =>
    readJson<string | null>(STORAGE_KEYS.activeTaskId, 'seed-1'),
  );

  const todayKey = getLocalDateKey();
  const [progress, setProgress] = useState<DailyProgress>(() => {
    const saved = readJson<DailyProgress>(STORAGE_KEYS.progress, {
      date: todayKey,
      focusMinutes: 0,
      sessionsCompleted: 0,
      historyDates: [],
    });
    if (saved.date !== todayKey) {
      return {
        date: todayKey,
        focusMinutes: 0,
        sessionsCompleted: 0,
        historyDates: saved.historyDates ?? [],
      };
    }
    return saved;
  });

  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    getModeDurationSeconds('focus', settings),
  );

  const character = useMemo(() => getCharacterById(characterId), [characterId]);
  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  const [microAction, setMicroAction] = useState<MicroAction>(character.focusActions[0]);
  const [quote, setQuote] = useState<string>(character.focusQuotes[0]);
  const [reactionKind, setReactionKind] = useState<ReactionKind | null>(null);
  const [reactionNonce, setReactionNonce] = useState(0);
  const reactionTimeoutRef = useRef<number | null>(null);
  const [studyQuoteIndex, setStudyQuoteIndex] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const nativeFullscreenRef = useRef(false);

  const [soundChannels, setSoundChannels] = useState<SoundChannelsState>(INITIAL_SOUND_CHANNELS);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    const docEl = document.documentElement;
    if (typeof docEl.requestFullscreen === 'function' && !document.fullscreenElement) {
      void docEl
        .requestFullscreen()
        .then(() => {
          nativeFullscreenRef.current = true;
        })
        .catch(() => {
          nativeFullscreenRef.current = false;
        });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    nativeFullscreenRef.current = false;
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Persist user preferences and data
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.character, JSON.stringify(characterId));
  }, [characterId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(themeId));
  }, [themeId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.customNames, JSON.stringify(customNames));
  }, [customNames]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.customMedia, JSON.stringify(customMediaMap));
    } catch {
      // Ignore quota exceeded on large images
    }
  }, [customMediaMap]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.activeTaskId, JSON.stringify(activeTaskId));
  }, [activeTaskId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
  }, [progress]);

  // Sync procedural audio engine
  useEffect(() => {
    soundEngine.syncChannels(soundChannels, muted, masterVolume);
  }, [soundChannels, muted, masterVolume]);

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) {
        window.clearTimeout(reactionTimeoutRef.current);
      }
      soundEngine.dispose();
    };
  }, []);

  // Update document title with live timer when running
  useEffect(() => {
    if (timerStatus === 'running') {
      const label = timerMode === 'focus' ? 'Focus' : 'Break';
      document.title = `${formatTime(remainingSeconds)} · ${label} — PadhaiDesk`;
    } else {
      document.title = 'PadhaiDesk — Cozy Study Buddy & Focus Sanctuary';
    }
  }, [remainingSeconds, timerStatus, timerMode]);

  // Handle pure countdown ticks
  useEffect(() => {
    if (timerStatus !== 'running') return undefined;

    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerStatus]);

  // Handle phase completion safely outside of state updaters
  useEffect(() => {
    if (timerStatus !== 'running' || remainingSeconds > 0) return;

    soundEngine.playChime('complete');
    const completion = getNextTimerStateOnComplete(
      timerMode,
      progress.sessionsCompleted,
      settings,
    );

    if (completion.addedFocusMinutes > 0) {
      const currentDay = getLocalDateKey();
      setProgress((p) => {
        const historySet = new Set(p.historyDates);
        historySet.add(currentDay);
        return {
          date: currentDay,
          focusMinutes: (p.date === currentDay ? p.focusMinutes : 0) + completion.addedFocusMinutes,
          sessionsCompleted: completion.updatedSessionsCompleted,
          historyDates: Array.from(historySet),
        };
      });
    }

    setTimerMode(completion.nextMode);
    setTimerStatus(settings.autoStartNext ? 'running' : 'idle');
    setRemainingSeconds(completion.nextRemainingSeconds);

    if (completion.nextMode === 'focus') {
      setMicroAction(character.focusActions[0]);
      setQuote(pickRandomQuote(character.focusQuotes));
      setStudyQuoteIndex((i) => (i + 1) % STUDY_QUOTES.length);
    } else {
      setMicroAction(character.restActions[0]);
      setQuote(pickRandomQuote(character.restQuotes));
    }
  }, [remainingSeconds, timerStatus, timerMode, progress.sessionsCompleted, settings, character]);

  // Subtle periodic random micro-actions while focus timer is running
  useEffect(() => {
    if (timerStatus !== 'running' || timerMode !== 'focus') return undefined;
    const interval = window.setInterval(() => {
      setMicroAction((curr) =>
        pickRandomAction(
          character.focusActions,
          character.focusActions.includes(curr as never) ? (curr as never) : undefined,
        ),
      );
    }, 9500);
    return () => window.clearInterval(interval);
  }, [timerStatus, timerMode, character]);

  // Sync character pose & quote cleanly when switching characters or timer mode
  useEffect(() => {
    const isFocusing = timerMode === 'focus' && timerStatus === 'running';
    if (isFocusing) {
      setMicroAction(character.focusActions[0]);
      setQuote(character.focusQuotes[0]);
    } else if (timerMode === 'focus') {
      setMicroAction(character.focusActions.includes('thinking') ? 'thinking' : 'sipping');
      setQuote(character.focusQuotes[0]);
    } else {
      setMicroAction(character.restActions[0]);
      setQuote(character.restQuotes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, timerMode]);

  // Sync Escape key and native browser fullscreenchange events
  useEffect(() => {
    if (!isFullscreen) return undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullscreen();
      }
    };

    const onNativeFullscreenChange = () => {
      if (nativeFullscreenRef.current && !document.fullscreenElement) {
        nativeFullscreenRef.current = false;
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onNativeFullscreenChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onNativeFullscreenChange);
    };
  }, [isFullscreen, exitFullscreen]);

  const triggerReaction = useCallback(
    (kind: ReactionKind) => {
      if (reactionTimeoutRef.current) {
        window.clearTimeout(reactionTimeoutRef.current);
      }
      setReactionKind(kind);
      setReactionNonce((n) => n + 1);
      soundEngine.playChime(kind);

      if (kind === 'chai') {
        setMicroAction('sipping');
        setQuote((q) => pickRandomQuote(character.chaiQuotes, q));
      } else if (kind === 'highfive') {
        setQuote((q) => pickRandomQuote(character.highFiveQuotes, q));
      } else if (kind === 'cheer') {
        setQuote((q) => pickRandomQuote(character.cheerQuotes, q));
      } else if (kind === 'hydrate') {
        setMicroAction('sipping');
        setQuote((q) => pickRandomQuote(character.hydrateQuotes, q));
      } else if (kind === 'stretch') {
        setQuote((q) => pickRandomQuote(character.stretchQuotes, q));
      }

      reactionTimeoutRef.current = window.setTimeout(() => {
        setReactionKind(null);
      }, 1900);
    },
    [character],
  );

  const handleRandomAction = useCallback(() => {
    const isFocus = timerMode === 'focus' && timerStatus === 'running';
    if (isFocus) {
      setMicroAction((curr) =>
        pickRandomAction(
          character.focusActions,
          character.focusActions.includes(curr as never) ? (curr as never) : undefined,
        ),
      );
      setQuote((q) => pickRandomQuote(character.focusQuotes, q));
    } else {
      setMicroAction((curr) =>
        pickRandomAction(
          character.restActions,
          character.restActions.includes(curr as never) ? (curr as never) : undefined,
        ),
      );
      setQuote((q) => pickRandomQuote(character.restQuotes, q));
    }
  }, [character, timerMode, timerStatus]);

  const handleSelectMode = (nextMode: TimerMode) => {
    setTimerMode(nextMode);
    setTimerStatus('idle');
    setRemainingSeconds(getModeDurationSeconds(nextMode, settings));
    if (nextMode === 'focus') {
      setMicroAction(character.focusActions[0]);
      setQuote(character.focusQuotes[0]);
    } else {
      setMicroAction(character.restActions[0]);
      setQuote(character.restQuotes[0]);
    }
  };

  const handleToggleStartPause = () => {
    if (timerStatus === 'running') {
      setTimerStatus('paused');
      setMicroAction(character.restActions[0]);
      return;
    }

    if (timerMode === 'focus') {
      setMicroAction(character.focusActions[0]);
      setQuote((q) => pickRandomQuote(character.focusQuotes, q));
    }
    setTimerStatus('running');

    if (settings.autoFullscreenOnStart) {
      enterFullscreen();
    }
  };

  const handleResetTimer = () => {
    setTimerStatus('idle');
    setRemainingSeconds(getModeDurationSeconds(timerMode, settings));
    setMicroAction(
      timerMode === 'focus' ? character.focusActions[0] : character.restActions[0],
    );
  };

  const handleSkipPhase = () => {
    const nextMode: TimerMode = timerMode === 'focus' ? 'shortBreak' : 'focus';
    handleSelectMode(nextMode);
  };

  const handleUpdateSettings = (next: PomodoroSettings) => {
    setSettings(next);
    if (timerStatus === 'idle') {
      setRemainingSeconds(getModeDurationSeconds(timerMode, next));
    }
  };

  const handleAddTask = (title: string) => {
    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const handleToggleSoundChannel = (id: SoundChannelId) => {
    setSoundChannels((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const handleChangeVolume = (id: SoundChannelId, volume: number) => {
    setSoundChannels((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume },
    }));
  };

  const handleApplySoundPreset = (preset: Partial<Record<SoundChannelId, number>>) => {
    setSoundChannels((prev) => {
      const next = { ...prev };
      (Object.keys(next) as SoundChannelId[]).forEach((key) => {
        const vol = preset[key];
        next[key] = {
          enabled: typeof vol === 'number',
          volume: typeof vol === 'number' ? vol : next[key].volume,
        };
      });
      return next;
    });
  };

  const customBuddyName = customNames[characterId] || character.defaultName;
  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.completed);
  const streakDays = calculateStreakDays(progress.historyDates, todayKey);
  const currentStudyQuote = STUDY_QUOTES[studyQuoteIndex % STUDY_QUOTES.length];
  const { tokens } = theme;

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: tokens.pageBg,
        color: tokens.textPrimary,
      }}
      data-theme={theme.id}
    >
      {/* Full-Bleed Photographic Environment Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img
          src={tokens.backgroundImageUrl}
          alt=""
          className="h-full w-full object-cover scale-[1.02] transition-opacity duration-500"
        />
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ background: tokens.backdropScrim }}
        />
      </div>

      {/* Floating Focus Trigger Only */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1280px] items-center justify-end gap-2 px-3 pt-3 sm:px-8 sm:pt-5">
        <button
          type="button"
          onClick={handleToggleStartPause}
          className="glass-panel inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-transform hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: tokens.accentBg,
            borderColor: tokens.borderColor,
            color: tokens.accentText,
            boxShadow: tokens.glassShadow,
          }}
          data-testid="floating-start-focus-btn"
        >
          {timerStatus === 'running' ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              <span>Pause Session</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              <span>Start Focus</span>
            </>
          )}
        </button>
      </div>

      {/* Main 2-Column Glassmorphic Workspace (Mobile-Ordered for Ergonomic Study Flow) */}
      <main className="relative z-10 mx-auto w-full max-w-[1280px] flex-1 px-3 py-3 sm:px-8 sm:py-4 sm:pb-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start">
          {/* Primary Stage Column on Desktop; dissolves on mobile for ergonomic card order */}
          <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-6 xl:col-span-8">
            <BuddyStage
              className="order-1 lg:order-none"
              character={character}
              customName={customBuddyName}
              customMedia={customMediaMap[characterId]}
              onRenameBuddy={(name) =>
                setCustomNames((prev) => ({ ...prev, [characterId]: name }))
              }
              onUpdateCustomMedia={(media) =>
                setCustomMediaMap((prev) => {
                  const next = { ...prev };
                  if (media === null) delete next[characterId];
                  else next[characterId] = media;
                  return next;
                })
              }
              theme={theme}
              timerMode={timerMode}
              timerStatus={timerStatus}
              microAction={microAction}
              quote={quote}
              reactionKind={reactionKind}
              reactionNonce={reactionNonce}
              activeTaskTitle={activeTask?.title}
              isFullscreen={isFullscreen}
              onTriggerReaction={triggerReaction}
              onRandomAction={handleRandomAction}
              onToggleFullscreen={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
            />

            <StudyQuoteCard
              className="order-3 lg:order-none"
              theme={theme}
              studyQuote={currentStudyQuote}
              onNextQuote={() => setStudyQuoteIndex((i) => (i + 1) % STUDY_QUOTES.length)}
            />

            <ThemeSelector
              className="order-7 lg:order-none"
              theme={theme}
              selectedThemeId={themeId}
              onSelectTheme={setThemeId}
            />

            <CharacterSelector
              className="order-6 lg:order-none"
              theme={theme}
              selectedId={characterId}
              customMediaMap={customMediaMap}
              onSelect={setCharacterId}
            />
          </div>

          {/* Focused Utility Column on Desktop; Timer placed 2nd on mobile right below BuddyStage */}
          <aside className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-6 xl:col-span-4">
            <TimerPanel
              className="order-2 lg:order-none"
              theme={theme}
              mode={timerMode}
              status={timerStatus}
              remainingSeconds={remainingSeconds}
              settings={settings}
              sessionsCompleted={progress.sessionsCompleted}
              onSelectMode={handleSelectMode}
              onToggleStartPause={handleToggleStartPause}
              onReset={handleResetTimer}
              onSkip={handleSkipPhase}
              onUpdateSettings={handleUpdateSettings}
            />

            <TaskTracker
              className="order-4 lg:order-none"
              theme={theme}
              tasks={tasks}
              activeTaskId={activeTaskId}
              progress={progress}
              streakDays={streakDays}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onSetActiveTask={setActiveTaskId}
            />

            <SoundMixer
              className="order-5 lg:order-none"
              theme={theme}
              channels={soundChannels}
              muted={muted}
              masterVolume={masterVolume}
              onToggleChannel={handleToggleSoundChannel}
              onChangeVolume={handleChangeVolume}
              onChangeMasterVolume={setMasterVolume}
              onApplyPreset={handleApplySoundPreset}
              onToggleMute={() => setMuted((m) => !m)}
            />
          </aside>
        </div>
      </main>

      {/* Creator Footer Watermark */}
      <footer className="relative z-10 mx-auto w-full max-w-[1280px] px-3 pb-5 pt-2 sm:px-8 sm:pb-8">
        <div
          className="glass-panel flex flex-col items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:flex-row sm:px-5"
          style={{
            backgroundColor: tokens.surfaceBg,
            backgroundImage: tokens.glassHighlight,
            borderColor: tokens.borderColor,
            boxShadow: tokens.glassShadow,
            color: tokens.textSecondary,
          }}
        >
          <p className="font-medium" style={{ color: tokens.textPrimary }}>
            Made by <span className="font-display font-semibold">Yashank Rao</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href="https://github.com/Yashankrao06"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-tile inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all hover:brightness-110"
              style={{
                backgroundColor: tokens.surfaceMutedBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            >
              <Github className="h-3.5 w-3.5 shrink-0" />
              <span>GitHub</span>
            </a>

            <a
              href="https://www.linkedin.com/in/yashank-rao-ben-61761533b/"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-tile inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all hover:brightness-110"
              style={{
                backgroundColor: tokens.surfaceMutedBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            >
              <Linkedin className="h-3.5 w-3.5 shrink-0" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Fullscreen Distraction-Free Focus Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col justify-between overflow-y-auto p-3 sm:p-8"
          style={{ backgroundColor: tokens.pageBg }}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen focus mode"
          data-testid="fullscreen-focus-overlay"
        >
          {/* Photographic backdrop inside fullscreen */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <img
              src={tokens.backgroundImageUrl}
              alt=""
              className="h-full w-full object-cover scale-[1.03]"
            />
            <div
              className="absolute inset-0"
              style={{ background: tokens.backdropScrim }}
            />
          </div>

          {/* Minimal Top Strip */}
          <div className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-2 sm:gap-4">
            <div
              className="glass-panel flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 sm:gap-3 sm:px-4"
              style={{
                backgroundColor: tokens.surfaceBg,
                backgroundImage: tokens.glassHighlight,
                borderColor: tokens.borderColor,
                boxShadow: tokens.glassShadow,
              }}
            >
              <span className="font-display truncate text-sm sm:text-base font-bold" style={{ color: tokens.textPrimary }}>
                {customBuddyName}
              </span>
              <span className="shrink-0 text-[11px] sm:text-xs" style={{ color: tokens.textSecondary }}>
                · {timerMode === 'focus' ? 'Focus' : 'Break'}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                className="glass-panel inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: tokens.surfaceBg,
                  backgroundImage: tokens.glassHighlight,
                  borderColor: tokens.borderColor,
                  boxShadow: tokens.glassShadow,
                  color: tokens.textPrimary,
                }}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={exitFullscreen}
                className="glass-panel inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 sm:px-3.5 text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: tokens.surfaceBg,
                  backgroundImage: tokens.glassHighlight,
                  borderColor: tokens.borderColor,
                  boxShadow: tokens.glassShadow,
                  color: tokens.textPrimary,
                }}
                data-testid="exit-fullscreen-btn"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Center Stage + Timer */}
          <div className="relative z-10 mx-auto my-auto flex w-full max-w-4xl flex-col gap-3.5 sm:gap-5 py-3 sm:py-4">
            <BuddyArtwork
              character={character}
              customMedia={customMediaMap[characterId]}
              theme={theme}
              timerMode={timerMode}
              timerStatus={timerStatus}
              microAction={microAction}
              reactionKind={reactionKind}
              reactionNonce={reactionNonce}
              activeTaskTitle={activeTask?.title}
            />

            <div
              className="glass-panel flex flex-col gap-3.5 rounded-2xl border px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4"
              style={{
                backgroundColor: tokens.surfaceBg,
                backgroundImage: tokens.glassHighlight,
                borderColor: tokens.borderColor,
                boxShadow: tokens.glassShadow,
              }}
            >
              <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                <span
                  className="font-mono-tabular text-3xl sm:text-4xl font-semibold"
                  style={{ color: tokens.textPrimary }}
                  data-testid="fullscreen-timer-display"
                >
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-xs sm:text-sm" style={{ color: tokens.textSecondary }}>
                  “{quote}”
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => triggerReaction('chai')}
                  className="glass-tile inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.accentSoftBg,
                    borderColor: tokens.borderColor,
                    color: tokens.accentInk,
                  }}
                >
                  <Coffee className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{character.drinkLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerReaction('highfive')}
                  className="glass-tile inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.surfaceMutedBg,
                    borderColor: tokens.borderColor,
                    color: tokens.textPrimary,
                  }}
                >
                  <Hand className="h-3.5 w-3.5 shrink-0" />
                  <span>High-Five</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerReaction('cheer')}
                  className="glass-tile inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.surfaceMutedBg,
                    borderColor: tokens.borderColor,
                    color: tokens.textPrimary,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>Hype Up</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerReaction('hydrate')}
                  className="glass-tile inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.surfaceMutedBg,
                    borderColor: tokens.borderColor,
                    color: tokens.textPrimary,
                  }}
                >
                  <Droplets className="h-3.5 w-3.5 shrink-0" />
                  <span>Hydrate</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerReaction('stretch')}
                  className="glass-tile inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.surfaceMutedBg,
                    borderColor: tokens.borderColor,
                    color: tokens.textPrimary,
                  }}
                >
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  <span>Stretch</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleStartPause}
                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.accentBg,
                    color: tokens.accentText,
                  }}
                >
                  {timerStatus === 'running' ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>Start</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden sm:flex justify-center">
            <span
              className="glass-tile rounded-full border px-3.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: tokens.surfaceBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            >
              Press Esc to return to full workspace
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
