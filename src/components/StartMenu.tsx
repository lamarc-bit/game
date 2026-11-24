import { useState } from 'react';
import {
  ArrowLeft,
  Compass,
  DoorOpen,
  Flame,
  Gem,
  HelpCircle,
  KeyRound,
  Keyboard,
  Play,
  ToggleRight,
} from 'lucide-react';

interface StartMenuProps {
  onStartGame: () => void;
}

export function StartMenu({ onStartGame }: StartMenuProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#09140E]/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#13291E] border border-[#2A533E] shadow-2xl p-7 text-[#F5EFE2]">
        {!showHowToPlay ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#1D4331] border border-[#2E664B] flex items-center justify-center mb-4">
              <Compass className="w-6 h-6 text-[#34D399]" aria-hidden="true" />
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#FAF6EE] text-balance">
              MazeQuest Mini
            </h1>

            <p className="mt-2.5 text-sm leading-relaxed text-[#C7D3CC] max-w-sm">
              Explore the stone labyrinth, solve environmental puzzles, gather hidden
              crystals, and reach the exit portal.
            </p>

            <div className="mt-7 w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={onStartGame}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#052318] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Start Game</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B382A] hover:bg-[#234836] border border-[#2E5D46] text-[#E8E2D5] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#34D399]"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                <span>How to Play</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-[#254A37] pb-3.5 mb-4">
              <h2 className="font-display text-xl font-bold text-[#FAF6EE]">
                How to Play
              </h2>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9EC2B0] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>
            </div>

            <ul className="space-y-3 text-sm text-[#DCE5DF]">
              <li className="flex items-start gap-3">
                <Keyboard className="w-4 h-4 text-[#60A5FA] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-white font-semibold">WASD / Arrow Keys</strong>{' '}
                  = Move around the maze
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ToggleRight className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-white font-semibold">Activate switches</strong>{' '}
                  to slide open emerald gates
                </span>
              </li>
              <li className="flex items-start gap-3">
                <KeyRound className="w-4 h-4 text-[#FBBF24] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-white font-semibold">Find the key</strong> to
                  unlock the golden door
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Flame className="w-4 h-4 text-[#F87171] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-white font-semibold">Avoid traps</strong> — wait
                  for spike plates to recess before crossing
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Gem className="w-4 h-4 text-[#A78BFA] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-white font-semibold">Collect crystals</strong>{' '}
                  along main routes and side paths (5 total)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <DoorOpen className="w-4 h-4 text-[#2DD4BF] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-white font-semibold">Reach the exit</strong>{' '}
                  portal to complete the level
                </span>
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={onStartGame}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#052318] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Start Game</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
