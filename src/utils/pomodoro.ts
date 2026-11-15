import type { MicroAction, PomodoroSettings, TimerMode } from '../types/study';

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartNext: false,
  autoFullscreenOnStart: true,
};

export function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getModeDurationSeconds(mode: TimerMode, settings: PomodoroSettings): number {
  switch (mode) {
    case 'focus':
      return Math.max(1, settings.focusMinutes) * 60;
    case 'shortBreak':
      return Math.max(1, settings.shortBreakMinutes) * 60;
    case 'longBreak':
      return Math.max(1, settings.longBreakMinutes) * 60;
  }
}

export function calculateProgress(remainingSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  const elapsed = totalSeconds - Math.max(0, remainingSeconds);
  const ratio = elapsed / totalSeconds;
  return Math.min(1, Math.max(0, ratio));
}

export interface TimerCompletionResult {
  nextMode: TimerMode;
  nextRemainingSeconds: number;
  updatedSessionsCompleted: number;
  addedFocusMinutes: number;
}

export function getNextTimerStateOnComplete(
  currentMode: TimerMode,
  sessionsCompleted: number,
  settings: PomodoroSettings,
): TimerCompletionResult {
  if (currentMode === 'focus') {
    const updatedSessions = sessionsCompleted + 1;
    const isLongBreakTurn =
      settings.sessionsBeforeLongBreak > 0 &&
      updatedSessions % settings.sessionsBeforeLongBreak === 0;
    const nextMode: TimerMode = isLongBreakTurn ? 'longBreak' : 'shortBreak';
    return {
      nextMode,
      nextRemainingSeconds: getModeDurationSeconds(nextMode, settings),
      updatedSessionsCompleted: updatedSessions,
      addedFocusMinutes: settings.focusMinutes,
    };
  }

  return {
    nextMode: 'focus',
    nextRemainingSeconds: getModeDurationSeconds('focus', settings),
    updatedSessionsCompleted: sessionsCompleted,
    addedFocusMinutes: 0,
  };
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreakDays(historyDates: string[], todayKey: string): number {
  const uniqueSet = new Set(historyDates);
  if (uniqueSet.size === 0) return 0;

  // Determine anchor: count consecutive days ending today if today has progress,
  // otherwise ending yesterday if yesterday had progress.
  const parseDate = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const todayDate = parseDate(todayKey);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterdayDate);

  let cursor: Date | null = null;
  if (uniqueSet.has(todayKey)) {
    cursor = todayDate;
  } else if (uniqueSet.has(yesterdayKey)) {
    cursor = yesterdayDate;
  } else {
    return 0;
  }

  let streak = 0;
  while (cursor) {
    const key = getLocalDateKey(cursor);
    if (!uniqueSet.has(key)) break;
    streak += 1;
    const prev: Date = new Date(cursor);
    prev.setDate(cursor.getDate() - 1);
    cursor = prev;
  }
  return streak;
}

export function pickRandomAction<T extends MicroAction>(
  actions: readonly T[],
  currentAction?: T,
): T {
  if (actions.length === 0) {
    throw new Error('Actions list cannot be empty');
  }
  if (actions.length === 1) return actions[0];
  const candidates = currentAction
    ? actions.filter((action) => action !== currentAction)
    : [...actions];
  const pool = candidates.length > 0 ? candidates : actions;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function pickRandomQuote(quotes: readonly string[], lastQuote?: string): string {
  if (quotes.length === 0) return '';
  if (quotes.length === 1) return quotes[0];
  const candidates = lastQuote ? quotes.filter((q) => q !== lastQuote) : [...quotes];
  const pool = candidates.length > 0 ? candidates : quotes;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
