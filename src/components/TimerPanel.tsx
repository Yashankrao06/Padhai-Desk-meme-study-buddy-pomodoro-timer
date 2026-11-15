import { useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward, SlidersHorizontal } from 'lucide-react';
import type { PomodoroSettings, StudyTheme, TimerMode, TimerStatus } from '../types/study';
import { calculateProgress, formatTime, getModeDurationSeconds } from '../utils/pomodoro';

interface TimerPanelProps {
  theme: StudyTheme;
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  settings: PomodoroSettings;
  sessionsCompleted: number;
  className?: string;
  onSelectMode: (mode: TimerMode) => void;
  onToggleStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onUpdateSettings: (next: PomodoroSettings) => void;
}

const MODE_LABELS: { id: TimerMode; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'shortBreak', label: 'Short Break' },
  { id: 'longBreak', label: 'Long Break' },
];

export function TimerPanel({
  theme,
  mode,
  status,
  remainingSeconds,
  settings,
  sessionsCompleted,
  className = '',
  onSelectMode,
  onToggleStartPause,
  onReset,
  onSkip,
  onUpdateSettings,
}: TimerPanelProps) {
  const [showRhythm, setShowRhythm] = useState(false);
  const { tokens } = theme;

  const totalSeconds = getModeDurationSeconds(mode, settings);
  const progressPct = Math.round(calculateProgress(remainingSeconds, totalSeconds) * 100);

  return (
    <section
      aria-label="Pomodoro timer"
      className={`glass-panel rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
      data-timer-status={status}
      data-timer-mode={mode}
    >
      {/* Mode selector */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="glass-tile inline-flex min-w-0 flex-1 rounded-xl border p-1 sm:flex-initial"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
          }}
          role="tablist"
          aria-label="Timer rhythm mode"
        >
          {MODE_LABELS.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectMode(item.id)}
                className="flex-1 sm:flex-initial rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: active ? tokens.accentBg : 'transparent',
                  color: active ? tokens.accentText : tokens.textSecondary,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Toggle timer rhythm settings"
          aria-expanded={showRhythm}
          onClick={() => setShowRhythm((prev) => !prev)}
          className="glass-tile inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
          style={{
            backgroundColor: showRhythm ? tokens.accentSoftBg : tokens.surfaceMutedBg,
            borderColor: showRhythm ? tokens.accentBg : tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Countdown Readout */}
      <div className="my-5 text-center">
        <div
          className="font-mono-tabular text-5xl font-semibold tracking-tight sm:text-6xl"
          style={{ color: tokens.textPrimary }}
          data-testid="timer-display"
        >
          {formatTime(remainingSeconds)}
        </div>
        <p className="mt-1.5 text-xs" style={{ color: tokens.textSecondary }}>
          {mode === 'focus'
            ? status === 'running'
              ? 'Buddy is studying with you'
              : 'Buddy is waiting — hit Start Focus'
            : 'Buddy is taking a breather'}
          <span aria-hidden="true"> · </span>
          <span className="font-mono-tabular">
            Session {sessionsCompleted + (mode === 'focus' ? 1 : 0)}
          </span>
        </p>
      </div>

      {/* Progress Bar */}
      <div
        className="mb-5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: tokens.surfaceMutedBg }}
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Session progress"
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progressPct}%`,
            backgroundColor: tokens.accentBg,
          }}
        />
      </div>

      {/* Primary Action Row */}
      <div className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onToggleStartPause}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-transform active:scale-[0.98]"
          style={{
            backgroundColor: tokens.accentBg,
            color: tokens.accentText,
          }}
          data-testid="timer-toggle-btn"
        >
          {status === 'running' ? (
            <>
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>{status === 'paused' ? 'Resume' : 'Start Focus'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset timer"
          className="glass-tile inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onSkip}
          aria-label="Skip to next phase"
          className="glass-tile inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Expandable Rhythm Settings */}
      {showRhythm && (
        <div
          className="mt-4 border-t pt-4"
          style={{ borderColor: tokens.borderColor }}
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold" style={{ color: tokens.textPrimary }}>
              Rhythm Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '25 / 5', f: 25, s: 5, l: 15 },
                { label: '50 / 10', f: 50, s: 10, l: 20 },
                { label: '15 / 3', f: 15, s: 3, l: 10 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      focusMinutes: preset.f,
                      shortBreakMinutes: preset.s,
                      longBreakMinutes: preset.l,
                    })
                  }
                  className="glass-tile rounded-lg border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: tokens.surfaceMutedBg,
                    borderColor: tokens.borderColor,
                    color: tokens.textPrimary,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-[11px]" style={{ color: tokens.textSecondary }}>
              <span>Focus (min)</span>
              <input
                type="number"
                min={1}
                max={120}
                value={settings.focusMinutes}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    focusMinutes: Math.max(1, Math.min(120, Number(e.target.value) || 25)),
                  })
                }
                className="font-mono-tabular rounded-lg border px-2 py-1.5 text-xs"
                style={{
                  backgroundColor: tokens.surfaceMutedBg,
                  borderColor: tokens.borderColor,
                  color: tokens.textPrimary,
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px]" style={{ color: tokens.textSecondary }}>
              <span>Short (min)</span>
              <input
                type="number"
                min={1}
                max={45}
                value={settings.shortBreakMinutes}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    shortBreakMinutes: Math.max(1, Math.min(45, Number(e.target.value) || 5)),
                  })
                }
                className="font-mono-tabular rounded-lg border px-2 py-1.5 text-xs"
                style={{
                  backgroundColor: tokens.surfaceMutedBg,
                  borderColor: tokens.borderColor,
                  color: tokens.textPrimary,
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px]" style={{ color: tokens.textSecondary }}>
              <span>Long (min)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.longBreakMinutes}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    longBreakMinutes: Math.max(1, Math.min(60, Number(e.target.value) || 15)),
                  })
                }
                className="font-mono-tabular rounded-lg border px-2 py-1.5 text-xs"
                style={{
                  backgroundColor: tokens.surfaceMutedBg,
                  borderColor: tokens.borderColor,
                  color: tokens.textPrimary,
                }}
              />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs" style={{ color: tokens.textSecondary }}>
              <input
                type="checkbox"
                checked={settings.autoFullscreenOnStart}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, autoFullscreenOnStart: e.target.checked })
                }
                className="h-4 w-4 rounded"
                data-testid="auto-fullscreen-checkbox"
              />
              <span>Auto-fullscreen when timer starts</span>
            </label>

            <label className="flex items-center gap-2 text-xs" style={{ color: tokens.textSecondary }}>
              <input
                type="checkbox"
                checked={settings.autoStartNext}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, autoStartNext: e.target.checked })
                }
                className="h-4 w-4 rounded"
              />
              <span>Auto-start next block when timer ends</span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
