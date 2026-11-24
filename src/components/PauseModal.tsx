import { Home, Play, RotateCcw } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseModal({ onResume, onRestart, onMainMenu }: PauseModalProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#09140E]/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#13291E] border border-[#2A533E] shadow-2xl p-6 text-center text-[#F5EFE2]">
        <h2 id="pause-title" className="font-display text-2xl font-bold text-[#FAF6EE]">
          Game Paused
        </h2>
        <p className="mt-1.5 text-sm text-[#B8C7BE]">
          Use WASD or Arrow Keys to explore · Press P or Esc to resume.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#052318] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B382A] hover:bg-[#234836] border border-[#2E5D46] text-[#E8E2D5] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Restart</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-[#A8B8AF] hover:text-white hover:bg-[#193326] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
