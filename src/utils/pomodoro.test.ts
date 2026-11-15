import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_POMODORO_SETTINGS,
  calculateProgress,
  calculateStreakDays,
  formatTime,
  getModeDurationSeconds,
  getNextTimerStateOnComplete,
  pickRandomAction,
  pickRandomQuote,
} from './pomodoro';

test('formatTime formats seconds into MM:SS with zero padding', () => {
  assert.equal(formatTime(1500), '25:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(-10), '00:00');
});

test('getModeDurationSeconds returns configured seconds per mode', () => {
  const custom = {
    ...DEFAULT_POMODORO_SETTINGS,
    focusMinutes: 40,
    shortBreakMinutes: 8,
    longBreakMinutes: 20,
  };
  assert.equal(getModeDurationSeconds('focus', custom), 2400);
  assert.equal(getModeDurationSeconds('shortBreak', custom), 480);
  assert.equal(getModeDurationSeconds('longBreak', custom), 1200);
});

test('calculateProgress computes bounded elapsed ratio', () => {
  assert.equal(calculateProgress(1500, 1500), 0);
  assert.equal(calculateProgress(750, 1500), 0.5);
  assert.equal(calculateProgress(0, 1500), 1);
  assert.equal(calculateProgress(2000, 1500), 0);
});

test('getNextTimerStateOnComplete alternates focus to shortBreak and longBreak every N sessions', () => {
  const settings = { ...DEFAULT_POMODORO_SETTINGS, sessionsBeforeLongBreak: 4 };

  const after1 = getNextTimerStateOnComplete('focus', 0, settings);
  assert.equal(after1.nextMode, 'shortBreak');
  assert.equal(after1.updatedSessionsCompleted, 1);
  assert.equal(after1.addedFocusMinutes, 25);

  const after4 = getNextTimerStateOnComplete('focus', 3, settings);
  assert.equal(after4.nextMode, 'longBreak');
  assert.equal(after4.updatedSessionsCompleted, 4);

  const afterBreak = getNextTimerStateOnComplete('shortBreak', 4, settings);
  assert.equal(afterBreak.nextMode, 'focus');
  assert.equal(afterBreak.updatedSessionsCompleted, 4);
  assert.equal(afterBreak.addedFocusMinutes, 0);
});

test('calculateStreakDays counts consecutive days ending today or yesterday', () => {
  assert.equal(calculateStreakDays([], '2026-11-13'), 0);
  assert.equal(calculateStreakDays(['2026-11-13'], '2026-11-13'), 1);
  assert.equal(
    calculateStreakDays(['2026-11-11', '2026-11-12', '2026-11-13'], '2026-11-13'),
    3,
  );
  // Still active if yesterday was completed and today hasn't started yet
  assert.equal(
    calculateStreakDays(['2026-11-11', '2026-11-12'], '2026-11-13'),
    2,
  );
  // Broken streak if gap before yesterday
  assert.equal(
    calculateStreakDays(['2026-11-09', '2026-11-10'], '2026-11-13'),
    0,
  );
});

test('pickRandomAction avoids repeating the current action when alternatives exist', () => {
  const actions = ['writing', 'sipping', 'thinking'] as const;
  for (let i = 0; i < 15; i += 1) {
    const picked = pickRandomAction(actions, 'writing');
    assert.notEqual(picked, 'writing');
  }
});

test('pickRandomQuote avoids repeating last quote when multiple quotes exist', () => {
  const quotes = ['Quote A', 'Quote B', 'Quote C'];
  for (let i = 0; i < 15; i += 1) {
    assert.notEqual(pickRandomQuote(quotes, 'Quote A'), 'Quote A');
  }
});
