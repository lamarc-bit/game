import { Gem, Play, RotateCcw, Trophy } from 'lucide-react';
import { VictorySummary } from './MazeCanvas';

interface VictoryModalProps {
  summary: VictorySummary;
  onPlayAgain: () => void;
  onRestart: () => void;
}

function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VictoryModal({
  summary,
  onPlayAgain,
  onRestart,
}: VictoryModalProps) {
  const allFound = summary.crystalsFound === summary.totalCrystals;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#09140E]/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#13291E] border border-[#2A533E] shadow-2xl p-7 text-center text-[#F5EFE2]">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#1C4734] border border-[#2E7555] flex items-center justify-center mb-4">
          <Trophy className="w-6 h-6 text-[#FBBF24]" aria-hidden="true" />
        </div>

        <h2
          id="victory-title"
          className="font-display text-3xl font-extrabold tracking-tight text-[#FAF6EE]"
        >
          Level Complete
        </h2>

        <p className="mt-2 text-sm text-[#C7D3CC]">
          {allFound
            ? 'Every hidden crystal discovered — a master labyrinth run.'
            : 'You solved the maze and reached the exit portal.'}
        </p>

        <div className="mt-6 border-t border-b border-[#254A37] py-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-[#9EC2B0]">Crystals Found</div>
            <div className="mt-1 inline-flex items-center justify-center gap-1.5 font-mono text-lg font-bold tabular-nums text-[#FAF6EE]">
              <Gem className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
              <span>
                {summary.crystalsFound} / {summary.totalCrystals}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9EC2B0]">Clear Time</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#FAF6EE]">
              {formatDuration(summary.elapsedSeconds)}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9EC2B0]">Trap Resets</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#FAF6EE]">
              {summary.trapHits}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#052318] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B382A] hover:bg-[#234836] border border-[#2E5D46] text-[#E8E2D5] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#34D399]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
