import { Gem, KeyRound, Pause, Play, RotateCcw, ToggleRight, Volume2, VolumeX } from 'lucide-react';
import { HudProgress } from './MazeCanvas';

interface HudBarProps {
  progress: HudProgress;
  paused: boolean;
  muted: boolean;
  isPlayingScreen: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
}

export function HudBar({
  progress,
  paused,
  muted,
  isPlayingScreen,
  onTogglePause,
  onRestart,
  onToggleMute,
}: HudBarProps) {
  const keyLabel = progress.doorUnlocked
    ? 'Door Open'
    : progress.hasKey
      ? 'Key Found'
      : 'No Key';

  const switchLabel = progress.switchActivated ? 'Gate Open' : 'Gate Closed';

  return (
    <header className="w-full bg-[#102219] border-b border-[#234333] px-5 py-2.5 flex items-center justify-between gap-6 shrink-0">
      {/* Zone 1: Brand Title */}
      <span className="font-display text-lg font-bold tracking-tight text-[#F5EFE2] whitespace-nowrap shrink-0">
        MazeQuest Mini
      </span>

      {/* Zone 2: Compact Live Progress Readout (clean unboxed text + icons) */}
      <div
        className="flex items-center gap-5 text-sm font-medium text-[#D6D0C4] whitespace-nowrap overflow-x-auto"
        aria-live="polite"
      >
        <div className="flex items-center gap-1.5">
          <Gem className="w-4 h-4 text-[#A78BFA] shrink-0" aria-hidden="true" />
          <span>Crystals:</span>
          <span className="font-mono font-semibold tabular-nums text-[#F5EFE2]">
            {progress.crystalsFound} / {progress.totalCrystals}
          </span>
        </div>

        <span className="text-[#3C6450]" aria-hidden="true">
          ·
        </span>

        <div className="flex items-center gap-1.5">
          <KeyRound
            className={`w-4 h-4 shrink-0 ${
              progress.hasKey || progress.doorUnlocked
                ? 'text-[#FBBF24]'
                : 'text-[#84998E]'
            }`}
            aria-hidden="true"
          />
          <span
            className={
              progress.hasKey || progress.doorUnlocked
                ? 'text-[#FDE68A] font-semibold'
                : 'text-[#A8B8AF]'
            }
          >
            {keyLabel}
          </span>
        </div>

        <span className="hidden sm:inline text-[#3C6450]" aria-hidden="true">
          ·
        </span>

        <div className="hidden sm:flex items-center gap-1.5">
          <ToggleRight
            className={`w-4 h-4 shrink-0 ${
              progress.switchActivated ? 'text-[#34D399]' : 'text-[#84998E]'
            }`}
            aria-hidden="true"
          />
          <span
            className={
              progress.switchActivated
                ? 'text-[#6EE7B7] font-semibold'
                : 'text-[#A8B8AF]'
            }
          >
            {switchLabel}
          </span>
        </div>
      </div>

      {/* Zone 3: Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 rounded-lg text-[#C7D3CC] hover:text-white hover:bg-[#1A3528] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#34D399]"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {isPlayingScreen && (
          <>
            <button
              type="button"
              onClick={onTogglePause}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#E8E2D5] bg-[#183326] hover:bg-[#214534] border border-[#2C5843] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#34D399]"
            >
              {paused ? (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#E8E2D5] bg-[#183326] hover:bg-[#214534] border border-[#2C5843] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#34D399]"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restart</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
