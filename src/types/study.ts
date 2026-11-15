export type CharacterId =
  | 'baburao'
  | 'sachiv'
  | 'jethalal'
  | 'majnu'
  | 'cheems'
  | 'lofigirl'
  | 'cryingcat'
  | 'vibecat';

export type CharacterOrigin = 'indian' | 'international';

export type ThemeId =
  | 'peach-hour'
  | 'monsoon-chai'
  | 'after-hours'
  | 'secret-garden'
  | 'hostel-night';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export type FocusMicroAction =
  | 'writing'
  | 'sipping'
  | 'thinking'
  | 'typing'
  | 'turning-page'
  | 'sketching'
  | 'head-bob';

export type RestMicroAction =
  | 'snoozing'
  | 'chai-chill'
  | 'stargazing'
  | 'vibing';

export type MicroAction = FocusMicroAction | RestMicroAction;

export type ReactionKind = 'chai' | 'highfive' | 'cheer' | 'hydrate' | 'stretch';

export interface CustomBuddyMedia {
  focusUrl?: string;
  restUrl?: string;
}

export interface CharacterProfile {
  id: CharacterId;
  defaultName: string;
  origin: CharacterOrigin;
  tagline: string;
  deskSetup: string;
  drinkLabel: string;
  avatarUrl: string;
  imageUrl: string;
  idleImageUrl: string;
  imageIsTransparent?: boolean;
  palette: {
    shirt: string;
    shirtAccent: string;
    skin: string;
    hair: string;
    prop: string;
  };
  focusActions: FocusMicroAction[];
  restActions: RestMicroAction[];
  focusQuotes: string[];
  restQuotes: string[];
  chaiQuotes: string[];
  highFiveQuotes: string[];
  cheerQuotes: string[];
  hydrateQuotes: string[];
  stretchQuotes: string[];
}

export interface StudyTheme {
  id: ThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  atmosphere: 'sunbeams' | 'rain' | 'motes' | 'fireflies' | 'fairy-lights';
  swatchColors: [string, string, string];
  tokens: {
    pageBg: string;
    backgroundImageUrl: string;
    backdropScrim: string;
    stageBackdropTint: string;
    surfaceBg: string;
    surfaceMutedBg: string;
    borderColor: string;
    glassShadow: string;
    glassHighlight: string;
    textPrimary: string;
    textSecondary: string;
    accentBg: string;
    accentHoverBg: string;
    accentText: string;
    accentSoftBg: string;
    accentInk: string;
    stageWallTop: string;
    stageWallBottom: string;
    windowSkyTop: string;
    windowSkyBottom: string;
    windowFrame: string;
    deskTop: string;
    deskFront: string;
    lampGlow: string;
  };
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartNext: boolean;
  autoFullscreenOnStart: boolean;
}

export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface DailyProgress {
  date: string;
  focusMinutes: number;
  sessionsCompleted: number;
  historyDates: string[];
}

export type SoundChannelId =
  | 'rain'
  | 'brown'
  | 'lofi'
  | 'fireplace'
  | 'vinyl'
  | 'breeze';

export interface SoundChannelSetting {
  enabled: boolean;
  volume: number;
}

export type SoundChannelsState = Record<SoundChannelId, SoundChannelSetting>;
