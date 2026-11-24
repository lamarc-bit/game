import { useCallback, useState } from 'react';
import { HudBar } from './components/HudBar';
import { HudProgress, MazeCanvas, VictorySummary } from './components/MazeCanvas';
import { PauseModal } from './components/PauseModal';
import { StartMenu } from './components/StartMenu';
import { VictoryModal } from './components/VictoryModal';
import { GameScreen } from './game/levelData';
import { sound } from './game/sound';

const INITIAL_PROGRESS: HudProgress = {
  crystalsFound: 0,
  totalCrystals: 5,
  hasKey: false,
  doorUnlocked: false,
  switchActivated: false,
};

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE_MENU');
  const [runId, setRunId] = useState(1);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState<HudProgress>(INITIAL_PROGRESS);
  const [victorySummary, setVictorySummary] = useState<VictorySummary>({
    crystalsFound: 0,
    totalCrystals: 5,
    elapsedSeconds: 0,
    trapHits: 0,
  });

  const handleStartGame = useCallback(() => {
    setRunId((id) => id + 1);
    setProgress(INITIAL_PROGRESS);
    setScreen('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    setRunId((id) => id + 1);
    setProgress(INITIAL_PROGRESS);
    setScreen('PLAYING');
  }, []);

  const handleTogglePause = useCallback(() => {
    setScreen((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleMainMenu = useCallback(() => {
    setRunId((id) => id + 1);
    setProgress(INITIAL_PROGRESS);
    setScreen('TITLE_MENU');
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sound.muted = next;
      return next;
    });
  }, []);

  const handleVictory = useCallback((summary: VictorySummary) => {
    setVictorySummary(summary);
    setScreen('VICTORY');
  }, []);

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-[#0E1B14]">
      <HudBar
        progress={progress}
        paused={screen === 'PAUSED'}
        muted={muted}
        isPlayingScreen={screen === 'PLAYING' || screen === 'PAUSED'}
        onTogglePause={handleTogglePause}
        onRestart={handleRestart}
        onToggleMute={handleToggleMute}
      />

      <main className="relative flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 p-2 sm:p-4">
          <MazeCanvas
            runId={runId}
            paused={screen === 'PAUSED'}
            frozen={screen === 'TITLE_MENU' || screen === 'VICTORY'}
            onProgressChange={setProgress}
            onVictory={handleVictory}
            onTogglePause={handleTogglePause}
            onRestart={handleRestart}
          />
        </div>

        <footer className="pb-2 px-4 text-center text-xs text-[#7E9B8C] shrink-0">
          <span>WASD / Arrow Keys to move</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>P or Esc to pause</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>R to restart</span>
        </footer>

        {screen === 'TITLE_MENU' && <StartMenu onStartGame={handleStartGame} />}

        {screen === 'PAUSED' && (
          <PauseModal
            onResume={() => setScreen('PLAYING')}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
          />
        )}

        {screen === 'VICTORY' && (
          <VictoryModal
            summary={victorySummary}
            onPlayAgain={handleStartGame}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
