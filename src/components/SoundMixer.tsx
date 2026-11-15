import { useEffect, useRef, useState } from 'react';
import {
  CloudRain,
  Disc3,
  Flame,
  Music,
  Pause,
  Play,
  Radio,
  Upload,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from 'lucide-react';
import type { SoundChannelId, SoundChannelsState, StudyTheme } from '../types/study';

interface SoundMixerProps {
  theme: StudyTheme;
  channels: SoundChannelsState;
  muted: boolean;
  masterVolume: number;
  className?: string;
  onToggleChannel: (id: SoundChannelId) => void;
  onChangeVolume: (id: SoundChannelId, volume: number) => void;
  onChangeMasterVolume: (volume: number) => void;
  onApplyPreset: (preset: Partial<Record<SoundChannelId, number>>) => void;
  onToggleMute: () => void;
}

const CHANNEL_META: {
  id: SoundChannelId;
  label: string;
  description: string;
  Icon: typeof CloudRain;
}[] = [
  { id: 'rain', label: 'Soft Rain', description: 'Window drizzle', Icon: CloudRain },
  { id: 'lofi', label: 'Lo-fi Keys', description: 'Electric chords', Icon: Radio },
  { id: 'fireplace', label: 'Hearth', description: 'Ember crackle', Icon: Flame },
  { id: 'brown', label: 'Brown Noise', description: 'Room masking', Icon: Waves },
  { id: 'vinyl', label: 'Vinyl Dust', description: 'Analog warmth', Icon: Disc3 },
  { id: 'breeze', label: 'Breeze', description: 'Soft airflow', Icon: Wind },
];

const SOUND_PRESETS: {
  id: string;
  label: string;
  mix: Partial<Record<SoundChannelId, number>>;
}[] = [
  { id: 'monsoon', label: 'Monsoon', mix: { rain: 0.6, lofi: 0.5, vinyl: 0.3 } },
  { id: 'deep', label: 'Deep Focus', mix: { brown: 0.55, fireplace: 0.45 } },
  { id: 'hostel', label: 'Hostel 2AM', mix: { lofi: 0.55, breeze: 0.4, vinyl: 0.25 } },
  { id: 'off', label: 'Silence', mix: {} },
];

export function SoundMixer({
  theme,
  channels,
  muted,
  masterVolume,
  className = '',
  onToggleChannel,
  onChangeVolume,
  onChangeMasterVolume,
  onApplyPreset,
  onToggleMute,
}: SoundMixerProps) {
  const { tokens } = theme;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localTrackUrl, setLocalTrackUrl] = useState<string | null>(null);
  const [localTrackName, setLocalTrackName] = useState<string>('');
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localVolume, setLocalVolume] = useState(0.65);

  useEffect(() => {
    return () => {
      if (localTrackUrl) {
        URL.revokeObjectURL(localTrackUrl);
      }
    };
  }, [localTrackUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : localVolume * masterVolume;
    }
  }, [localVolume, masterVolume, muted]);

  const activeCount = (Object.keys(channels) as SoundChannelId[]).filter(
    (k) => channels[k].enabled,
  ).length;
  const isAudioActive = !muted && (activeCount > 0 || localPlaying);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localTrackUrl) {
      URL.revokeObjectURL(localTrackUrl);
    }
    const url = URL.createObjectURL(file);
    setLocalTrackUrl(url);
    setLocalTrackName(file.name);
    setLocalPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        void audioRef.current.play().catch(() => setLocalPlaying(false));
      }
    }, 50);
  };

  const toggleLocalPlay = () => {
    if (!audioRef.current || !localTrackUrl) return;
    if (localPlaying) {
      audioRef.current.pause();
      setLocalPlaying(false);
    } else {
      void audioRef.current.play().then(() => setLocalPlaying(true)).catch(() => {});
    }
  };

  return (
    <section
      id="sounds"
      aria-label="Ambient soundscape and local music"
      className={`glass-panel flex flex-col gap-3.5 rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceBg,
        backgroundImage: tokens.glassHighlight,
        borderColor: tokens.borderColor,
        boxShadow: tokens.glassShadow,
      }}
    >
      {/* Header + Equalizer Bars + Mute Button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold" style={{ color: tokens.textPrimary }}>
              Soundscape
            </h3>
            {isAudioActive && (
              <span className="inline-flex h-3.5 items-end gap-0.5" aria-hidden="true">
                <span className="anim-eq-1 h-3 w-0.5 rounded-full" style={{ backgroundColor: tokens.accentBg }} />
                <span className="anim-eq-2 h-3.5 w-0.5 rounded-full" style={{ backgroundColor: tokens.accentBg }} />
                <span className="anim-eq-3 h-2.5 w-0.5 rounded-full" style={{ backgroundColor: tokens.accentBg }} />
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: tokens.textSecondary }}>
            {activeCount > 0 ? `${activeCount} ambient layers active` : 'Pick a mood mix or blend layers'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute all sounds' : 'Mute all sounds'}
          className="glass-tile inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: muted ? tokens.accentSoftBg : tokens.surfaceMutedBg,
            borderColor: muted ? tokens.accentBg : tokens.borderColor,
            color: muted ? tokens.accentInk : tokens.textPrimary,
          }}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          <span>{muted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Quick Soundscape Mood Presets */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-label="Ambient mood presets">
        {SOUND_PRESETS.map((preset) => {
          const presetKeys = Object.keys(preset.mix) as SoundChannelId[];
          const matchesPreset =
            presetKeys.length === 0
              ? activeCount === 0
              : activeCount === presetKeys.length &&
                presetKeys.every((k) => channels[k].enabled);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.mix)}
              className="glass-tile rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold whitespace-nowrap transition-all hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: matchesPreset ? tokens.accentBg : tokens.surfaceMutedBg,
                borderColor: matchesPreset ? tokens.accentBg : tokens.borderColor,
                color: matchesPreset ? tokens.accentText : tokens.textPrimary,
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Master Level Bar */}
      <div
        className="glass-tile flex items-center gap-3 rounded-xl border px-3 py-2"
        style={{
          backgroundColor: tokens.surfaceMutedBg,
          borderColor: tokens.borderColor,
        }}
      >
        <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: tokens.textSecondary }}>
          Master Level
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          aria-label="Master audio volume"
          value={masterVolume}
          onChange={(e) => onChangeMasterVolume(Number(e.target.value))}
          className="glass-slider min-w-0 flex-1"
          style={{
            color: tokens.accentBg,
            background: tokens.borderColor,
          }}
        />
        <span className="font-mono-tabular w-8 text-right text-[11px]" style={{ color: tokens.textPrimary }}>
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      {/* 6 Built-in Procedural Sound Channels in Compact 2-Column Glass Grid */}
      <div className="grid grid-cols-2 gap-2">
        {CHANNEL_META.map(({ id, label, description, Icon }) => {
          const ch = channels[id];
          return (
            <div
              key={id}
              className="glass-tile flex flex-col gap-2 rounded-xl border p-2.5 transition-all"
              style={{
                backgroundColor: ch.enabled ? tokens.accentSoftBg : tokens.surfaceMutedBg,
                borderColor: ch.enabled ? tokens.accentBg : tokens.borderColor,
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-pressed={ch.enabled}
                  aria-label={`Toggle ${label}`}
                  onClick={() => onToggleChannel(id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors"
                  style={{
                    backgroundColor: ch.enabled ? tokens.accentBg : tokens.surfaceBg,
                    borderColor: ch.enabled ? tokens.accentBg : tokens.borderColor,
                    color: ch.enabled ? tokens.accentText : tokens.textPrimary,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold" style={{ color: tokens.textPrimary }}>
                      {label}
                    </span>
                    <span className="font-mono-tabular text-[11px]" style={{ color: tokens.textSecondary }}>
                      {Math.round(ch.volume * 100)}%
                    </span>
                  </div>
                  <p className="truncate text-[10px]" style={{ color: tokens.textSecondary }}>
                    {description}
                  </p>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                aria-label={`${label} volume`}
                value={ch.volume}
                onChange={(e) => onChangeVolume(id, Number(e.target.value))}
                className="glass-slider w-full"
                style={{
                  color: tokens.accentBg,
                  background: tokens.borderColor,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Local Music Deck */}
      <div
        className="glass-tile rounded-xl border p-3"
        style={{
          backgroundColor: tokens.surfaceMutedBg,
          borderColor: tokens.borderColor,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Music className="h-4 w-4 shrink-0" style={{ color: tokens.accentInk }} />
            <span className="truncate text-xs font-medium" style={{ color: tokens.textPrimary }}>
              {localTrackName || 'Play your own MP3 / WAV study track'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {localTrackUrl && (
              <button
                type="button"
                onClick={toggleLocalPlay}
                aria-label={localPlaying ? 'Pause uploaded track' : 'Play uploaded track'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: tokens.accentBg,
                  borderColor: tokens.accentBg,
                  color: tokens.accentText,
                }}
              >
                {localPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: tokens.surfaceBg,
                borderColor: tokens.borderColor,
                color: tokens.textPrimary,
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{localTrackUrl ? 'Change' : 'Upload'}</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload local audio file"
        />

        {localTrackUrl && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] whitespace-nowrap" style={{ color: tokens.textSecondary }}>
              Looping · Vol
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              aria-label="Uploaded track volume"
              value={localVolume}
              onChange={(e) => setLocalVolume(Number(e.target.value))}
              className="glass-slider flex-1"
              style={{
                color: tokens.accentBg,
                background: tokens.borderColor,
              }}
            />
            <audio
              ref={audioRef}
              src={localTrackUrl}
              loop
              onEnded={() => setLocalPlaying(false)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
