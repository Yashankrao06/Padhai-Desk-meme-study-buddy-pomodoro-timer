import { useState } from 'react';
import { Check, Pin, Plus, Trash2 } from 'lucide-react';
import type { DailyProgress, StudyTask, StudyTheme } from '../types/study';

interface TaskTrackerProps {
  theme: StudyTheme;
  tasks: StudyTask[];
  activeTaskId: string | null;
  progress: DailyProgress;
  streakDays: number;
  className?: string;
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSetActiveTask: (id: string | null) => void;
}

export function TaskTracker({
  theme,
  tasks,
  activeTaskId,
  progress,
  streakDays,
  className = '',
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSetActiveTask,
}: TaskTrackerProps) {
  const [input, setInput] = useState('');
  const { tokens } = theme;

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onAddTask(trimmed);
    setInput('');
  };

  return (
    <section
      id="tasks"
      aria-label="Study tasks and daily focus tracker"
      className={`glass-panel flex flex-col gap-4 rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
    >
      {/* Daily Progress Strip */}
      <div
        className="glass-tile grid grid-cols-3 rounded-xl border py-2.5 text-center"
        style={{
          backgroundColor: tokens.surfaceMutedBg,
          borderColor: tokens.borderColor,
        }}
      >
        <div className="px-2">
          <div
            className="font-mono-tabular text-lg font-semibold"
            style={{ color: tokens.textPrimary }}
            data-testid="daily-focus-minutes"
          >
            {progress.focusMinutes}m
          </div>
          <div className="text-[11px]" style={{ color: tokens.textSecondary }}>
            Today
          </div>
        </div>
        <div className="border-l px-2" style={{ borderColor: tokens.borderColor }}>
          <div
            className="font-mono-tabular text-lg font-semibold"
            style={{ color: tokens.textPrimary }}
            data-testid="daily-sessions-count"
          >
            {progress.sessionsCompleted}
          </div>
          <div className="text-[11px]" style={{ color: tokens.textSecondary }}>
            Sessions
          </div>
        </div>
        <div className="border-l px-2" style={{ borderColor: tokens.borderColor }}>
          <div
            className="font-mono-tabular text-lg font-semibold"
            style={{ color: tokens.accentInk }}
            data-testid="daily-streak-days"
          >
            {streakDays}d
          </div>
          <div className="text-[11px]" style={{ color: tokens.textSecondary }}>
            Streak
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold" style={{ color: tokens.textPrimary }}>
          Study Tasks
        </h3>
        <span className="font-mono-tabular text-xs" style={{ color: tokens.textSecondary }}>
          {completedCount}/{tasks.length} done
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="new-study-task" className="sr-only">
          Add study task or subject
        </label>
        <input
          id="new-study-task"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add subject or task..."
          maxLength={64}
          className="glass-tile min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{
            backgroundColor: tokens.surfaceMutedBg,
            borderColor: tokens.borderColor,
            color: tokens.textPrimary,
          }}
        />
        <button
          type="submit"
          aria-label="Add task"
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: tokens.accentBg,
            color: tokens.accentText,
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div
          className="glass-tile rounded-xl border border-dashed px-4 py-6 text-center text-xs"
          style={{
            borderColor: tokens.borderColor,
            color: tokens.textSecondary,
          }}
        >
          No tasks queued yet. Add a subject above and pin it onto your buddy’s desk.
        </div>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="task-list">
          {tasks.map((task) => {
            const isPinned = activeTaskId === task.id;
            return (
              <li
                key={task.id}
                className="glass-tile flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: isPinned ? tokens.accentSoftBg : tokens.surfaceMutedBg,
                  borderColor: isPinned ? tokens.accentBg : tokens.borderColor,
                }}
              >
                <button
                  type="button"
                  aria-label={
                    task.completed
                      ? `Mark "${task.title}" incomplete`
                      : `Mark "${task.title}" complete`
                  }
                  onClick={() => onToggleTask(task.id)}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors"
                  style={{
                    backgroundColor: task.completed ? tokens.accentBg : 'transparent',
                    borderColor: task.completed ? tokens.accentBg : tokens.textSecondary,
                    color: tokens.accentText,
                  }}
                >
                  {task.completed && <Check className="h-3.5 w-3.5" />}
                </button>

                <span
                  className={`min-w-0 flex-1 truncate ${task.completed ? 'line-through opacity-60' : ''}`}
                  style={{ color: tokens.textPrimary }}
                >
                  {task.title}
                </span>

                <button
                  type="button"
                  aria-label={
                    isPinned
                      ? `Unpin "${task.title}" from desk`
                      : `Pin "${task.title}" to desk`
                  }
                  onClick={() => onSetActiveTask(isPinned ? null : task.id)}
                  title={isPinned ? 'Pinned on desk' : 'Pin to desk'}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                  style={{
                    color: isPinned ? tokens.accentInk : tokens.textSecondary,
                  }}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  aria-label={`Delete "${task.title}"`}
                  onClick={() => onDeleteTask(task.id)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100"
                  style={{ color: tokens.textSecondary }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
