import { useEffect, useRef } from 'react';
import {
  CrystalItem,
  FloatingToast,
  GRID_COLS,
  GRID_ROWS,
  GridCoord,
  Particle,
  getTrapPhase,
  parseLevel,
} from '../game/levelData';
import { RenderState, renderMaze } from '../game/renderer';
import { sound } from '../game/sound';

export interface HudProgress {
  crystalsFound: number;
  totalCrystals: number;
  hasKey: boolean;
  doorUnlocked: boolean;
  switchActivated: boolean;
}

export interface VictorySummary {
  crystalsFound: number;
  totalCrystals: number;
  elapsedSeconds: number;
  trapHits: number;
}

interface MazeCanvasProps {
  runId: number;
  paused: boolean;
  frozen: boolean; // true on title menu or victory screen
  onProgressChange: (progress: HudProgress) => void;
  onVictory: (summary: VictorySummary) => void;
  onTogglePause: () => void;
  onRestart: () => void;
}

const PLAYER_SPEED = 4.75; // tiles per second
const PLAYER_RADIUS = 0.29;

export function MazeCanvas({
  runId,
  paused,
  frozen,
  onProgressChange,
  onVictory,
  onTogglePause,
  onRestart,
}: MazeCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const callbacksRef = useRef({
    onProgressChange,
    onVictory,
    onTogglePause,
    onRestart,
  });
  callbacksRef.current = {
    onProgressChange,
    onVictory,
    onTogglePause,
    onRestart,
  };

  const pausedRef = useRef(paused);
  const frozenRef = useRef(frozen);
  pausedRef.current = paused;
  frozenRef.current = frozen;

  const keysPressedRef = useRef<Set<string>>(new Set());
  const stateRef = useRef<{
    level: ReturnType<typeof parseLevel>;
    render: RenderState;
    safePos: GridCoord;
    trapHits: number;
    bumpCooldown: number;
    toastSeq: number;
    won: boolean;
  } | null>(null);

  // Initialize or reset level state when runId changes
  useEffect(() => {
    const level = parseLevel();
    const crystals: CrystalItem[] = level.crystals.map((c) => ({ ...c }));

    stateRef.current = {
      level,
      safePos: { ...level.start },
      trapHits: 0,
      bumpCooldown: 0,
      toastSeq: 1,
      won: false,
      render: {
        grid: level.grid,
        playerX: level.start.col + 0.5,
        playerY: level.start.row + 0.5,
        facingX: 1,
        facingY: 0,
        isMoving: false,
        walkCycle: 0,
        invulnTimer: 0,
        damageFlash: 0,
        elapsed: 0,
        hasKey: false,
        keyCollected: false,
        keyPos: level.keyPos,
        switchActivated: false,
        switchPos: level.switchPos,
        gatePos: level.gatePos,
        gateOpenProgress: 0,
        gateHighlightTimer: 0,
        doorUnlocked: false,
        doorPos: level.doorPos,
        doorOpenProgress: 0,
        doorShakeTimer: 0,
        checkpointReached: false,
        checkpointPos: level.checkpointPos,
        startPos: level.start,
        exitPos: level.exit,
        traps: level.traps,
        crystals,
        particles: [],
        toasts: [],
      },
    };

    keysPressedRef.current.clear();
    callbacksRef.current.onProgressChange({
      crystalsFound: 0,
      totalCrystals: crystals.length,
      hasKey: false,
      doorUnlocked: false,
      switchActivated: false,
    });
  }, [runId]);

  // Keyboard bindings (WASD, Arrow keys, R for restart, P/Escape for pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const movementCodes = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
      ];
      if (movementCodes.includes(code)) {
        e.preventDefault();
        keysPressedRef.current.add(code);
        return;
      }

      if (!frozenRef.current && (code === 'Escape' || code === 'KeyP')) {
        e.preventDefault();
        callbacksRef.current.onTogglePause();
        return;
      }

      if (!frozenRef.current && code === 'KeyR') {
        e.preventDefault();
        callbacksRef.current.onRestart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
    };

    const handleBlur = () => {
      keysPressedRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main 60fps simulation & HiDPI render loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const spawnParticles = (
      particles: Particle[],
      x: number,
      y: number,
      color: string,
      count = 14,
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 1.2 + Math.random() * 2.4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.5 + Math.random() * 2.5,
          color,
          age: 0,
          duration: 0.45 + Math.random() * 0.25,
        });
      }
    };

    const pushToast = (
      toasts: FloatingToast[],
      seqRef: { toastSeq: number },
      text: string,
      x: number,
      y: number,
      color: string,
    ) => {
      toasts.push({
        id: seqRef.toastSeq++,
        text,
        x,
        y,
        color,
        age: 0,
        duration: 1.5,
      });
    };

    const isSolidTile = (col: number, row: number, r: RenderState): boolean => {
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
        return true;
      }
      const tile = r.grid[row][col];
      if (tile === 'WALL') return true;
      if (tile === 'GATE' && !r.switchActivated) return true;
      if (tile === 'DOOR' && !r.doorUnlocked) return true;
      return false;
    };

    const collidesCircleWithSolid = (
      cx: number,
      cy: number,
      radius: number,
      r: RenderState,
    ): { hit: boolean; hitTile?: { col: number; row: number; kind: string } } => {
      const minCol = Math.floor(cx - radius);
      const maxCol = Math.floor(cx + radius);
      const minRow = Math.floor(cy - radius);
      const maxRow = Math.floor(cy + radius);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (!isSolidTile(col, row, r)) continue;
          const closestX = Math.max(col, Math.min(cx, col + 1));
          const closestY = Math.max(row, Math.min(cy, row + 1));
          const dx = cx - closestX;
          const dy = cy - closestY;
          if (dx * dx + dy * dy < radius * radius) {
            const kind =
              row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS
                ? r.grid[row][col]
                : 'WALL';
            return { hit: true, hitTile: { col, row, kind } };
          }
        }
      }
      return { hit: false };
    };

    const syncHud = (r: RenderState) => {
      callbacksRef.current.onProgressChange({
        crystalsFound: r.crystals.filter((c) => c.collected).length,
        totalCrystals: r.crystals.length,
        hasKey: r.hasKey,
        doorUnlocked: r.doorUnlocked,
        switchActivated: r.switchActivated,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      const game = stateRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (game && canvas && container) {
        const r = game.render;

        // Resize canvas cleanly to container DPI
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.max(300, Math.floor(rect.width));
        const targetH = Math.max(240, Math.floor(rect.height));
        if (
          canvas.width !== Math.floor(targetW * dpr) ||
          canvas.height !== Math.floor(targetH * dpr)
        ) {
          canvas.width = Math.floor(targetW * dpr);
          canvas.height = Math.floor(targetH * dpr);
        }

        // Update simulation when actively playing
        if (!pausedRef.current && !frozenRef.current && !game.won) {
          r.elapsed += dt;
          if (r.invulnTimer > 0) r.invulnTimer = Math.max(0, r.invulnTimer - dt);
          if (r.damageFlash > 0) r.damageFlash = Math.max(0, r.damageFlash - dt * 2.5);
          if (r.gateHighlightTimer > 0)
            r.gateHighlightTimer = Math.max(0, r.gateHighlightTimer - dt);
          if (r.doorShakeTimer > 0)
            r.doorShakeTimer = Math.max(0, r.doorShakeTimer - dt);
          if (game.bumpCooldown > 0)
            game.bumpCooldown = Math.max(0, game.bumpCooldown - dt);

          // Animate gate & door opening progress
          if (r.switchActivated && r.gateOpenProgress < 1) {
            r.gateOpenProgress = Math.min(1, r.gateOpenProgress + dt * 4.5);
          }
          if (r.doorUnlocked && r.doorOpenProgress < 1) {
            r.doorOpenProgress = Math.min(1, r.doorOpenProgress + dt * 4.5);
          }

          // Input vector
          const keys = keysPressedRef.current;
          let ix = 0;
          let iy = 0;
          if (keys.has('ArrowLeft') || keys.has('KeyA')) ix -= 1;
          if (keys.has('ArrowRight') || keys.has('KeyD')) ix += 1;
          if (keys.has('ArrowUp') || keys.has('KeyW')) iy -= 1;
          if (keys.has('ArrowDown') || keys.has('KeyS')) iy += 1;

          if (ix !== 0 && iy !== 0) {
            const inv = 1 / Math.SQRT2;
            ix *= inv;
            iy *= inv;
          }

          r.isMoving = ix !== 0 || iy !== 0;
          if (r.isMoving) {
            r.facingX = ix;
            r.facingY = iy;
            r.walkCycle += dt;

            const stepX = ix * PLAYER_SPEED * dt;
            const stepY = iy * PLAYER_SPEED * dt;

            // Handle horizontal movement + corner-assist + door/gate interaction
            if (stepX !== 0) {
              const nextX = r.playerX + stepX;
              const colRes = collidesCircleWithSolid(nextX, r.playerY, PLAYER_RADIUS, r);
              if (!colRes.hit) {
                r.playerX = nextX;
              } else {
                // Interactive door unlock on walk-into!
                if (colRes.hitTile?.kind === 'DOOR') {
                  if (r.hasKey && !r.doorUnlocked) {
                    r.doorUnlocked = true;
                    sound.playUnlock();
                    spawnParticles(
                      r.particles,
                      r.doorPos.col + 0.5,
                      r.doorPos.row + 0.5,
                      '#FBBF24',
                      18,
                    );
                    pushToast(
                      r.toasts,
                      game,
                      'Door Unlocked!',
                      r.doorPos.col + 0.5,
                      r.doorPos.row + 0.2,
                      '#F59E0B',
                    );
                    syncHud(r);
                  } else if (!r.hasKey && game.bumpCooldown <= 0) {
                    game.bumpCooldown = 0.75;
                    r.doorShakeTimer = 0.32;
                    sound.playBump();
                    pushToast(
                      r.toasts,
                      game,
                      'Locked — Find the Gold Key',
                      r.doorPos.col + 0.5,
                      r.doorPos.row + 0.2,
                      '#F59E0B',
                    );
                  }
                } else if (colRes.hitTile?.kind === 'GATE' && game.bumpCooldown <= 0) {
                  game.bumpCooldown = 0.75;
                  sound.playBump();
                  pushToast(
                    r.toasts,
                    game,
                    'Gate Closed — Activate the Switch',
                    r.gatePos.col + 0.5,
                    r.gatePos.row + 0.2,
                    '#10B981',
                  );
                } else {
                  // Gentle corner assist toward open corridor center vertically
                  const tileCenterY = Math.floor(r.playerY) + 0.5;
                  const diffY = tileCenterY - r.playerY;
                  if (Math.abs(diffY) > 0.02 && Math.abs(diffY) < 0.38) {
                    const nudge = Math.sign(diffY) * Math.min(Math.abs(diffY), PLAYER_SPEED * dt * 0.85);
                    if (
                      !collidesCircleWithSolid(r.playerX, r.playerY + nudge, PLAYER_RADIUS, r)
                        .hit
                    ) {
                      r.playerY += nudge;
                    }
                  }
                }
              }
            }

            // Handle vertical movement + corner-assist + door/gate interaction
            if (stepY !== 0) {
              const nextY = r.playerY + stepY;
              const colRes = collidesCircleWithSolid(r.playerX, nextY, PLAYER_RADIUS, r);
              if (!colRes.hit) {
                r.playerY = nextY;
              } else {
                if (colRes.hitTile?.kind === 'DOOR') {
                  if (r.hasKey && !r.doorUnlocked) {
                    r.doorUnlocked = true;
                    sound.playUnlock();
                    spawnParticles(
                      r.particles,
                      r.doorPos.col + 0.5,
                      r.doorPos.row + 0.5,
                      '#FBBF24',
                      18,
                    );
                    pushToast(
                      r.toasts,
                      game,
                      'Door Unlocked!',
                      r.doorPos.col + 0.5,
                      r.doorPos.row + 0.2,
                      '#F59E0B',
                    );
                    syncHud(r);
                  } else if (!r.hasKey && game.bumpCooldown <= 0) {
                    game.bumpCooldown = 0.75;
                    r.doorShakeTimer = 0.32;
                    sound.playBump();
                    pushToast(
                      r.toasts,
                      game,
                      'Locked — Find the Gold Key',
                      r.doorPos.col + 0.5,
                      r.doorPos.row + 0.2,
                      '#F59E0B',
                    );
                  }
                } else if (colRes.hitTile?.kind === 'GATE' && game.bumpCooldown <= 0) {
                  game.bumpCooldown = 0.75;
                  sound.playBump();
                  pushToast(
                    r.toasts,
                    game,
                    'Gate Closed — Activate the Switch',
                    r.gatePos.col + 0.5,
                    r.gatePos.row + 0.2,
                    '#10B981',
                  );
                } else {
                  const tileCenterX = Math.floor(r.playerX) + 0.5;
                  const diffX = tileCenterX - r.playerX;
                  if (Math.abs(diffX) > 0.02 && Math.abs(diffX) < 0.38) {
                    const nudge = Math.sign(diffX) * Math.min(Math.abs(diffX), PLAYER_SPEED * dt * 0.85);
                    if (
                      !collidesCircleWithSolid(r.playerX + nudge, r.playerY, PLAYER_RADIUS, r)
                        .hit
                    ) {
                      r.playerX += nudge;
                    }
                  }
                }
              }
            }
          }

          // Check Crystal pickups
          for (const crystal of r.crystals) {
            if (crystal.collected) continue;
            const dx = r.playerX - (crystal.col + 0.5);
            const dy = r.playerY - (crystal.row + 0.5);
            if (dx * dx + dy * dy < 0.45 * 0.45) {
              crystal.collected = true;
              sound.playCrystal();
              spawnParticles(
                r.particles,
                crystal.col + 0.5,
                crystal.row + 0.5,
                '#A855F7',
                16,
              );
              const count = r.crystals.filter((c) => c.collected).length;
              pushToast(
                r.toasts,
                game,
                `Crystal ${count}/${r.crystals.length}`,
                crystal.col + 0.5,
                crystal.row + 0.2,
                '#A855F7',
              );
              syncHud(r);
            }
          }

          // Check Gold Key pickup
          if (!r.keyCollected) {
            const dx = r.playerX - (r.keyPos.col + 0.5);
            const dy = r.playerY - (r.keyPos.row + 0.5);
            if (dx * dx + dy * dy < 0.45 * 0.45) {
              r.keyCollected = true;
              r.hasKey = true;
              sound.playKey();
              spawnParticles(
                r.particles,
                r.keyPos.col + 0.5,
                r.keyPos.row + 0.5,
                '#FBBF24',
                20,
              );
              pushToast(
                r.toasts,
                game,
                'Gold Key Found!',
                r.keyPos.col + 0.5,
                r.keyPos.row + 0.2,
                '#F59E0B',
              );
              syncHud(r);
            }
          }

          // Check Floor Switch
          if (!r.switchActivated) {
            const dx = r.playerX - (r.switchPos.col + 0.5);
            const dy = r.playerY - (r.switchPos.row + 0.5);
            if (dx * dx + dy * dy < 0.42 * 0.42) {
              r.switchActivated = true;
              r.gateHighlightTimer = 1.8;
              sound.playSwitch();
              spawnParticles(
                r.particles,
                r.switchPos.col + 0.5,
                r.switchPos.row + 0.5,
                '#10B981',
                16,
              );
              spawnParticles(
                r.particles,
                r.gatePos.col + 0.5,
                r.gatePos.row + 0.5,
                '#34D399',
                18,
              );
              pushToast(
                r.toasts,
                game,
                'Switch Activated — Gate Opened!',
                r.gatePos.col + 0.5,
                r.gatePos.row + 0.1,
                '#10B981',
              );
              syncHud(r);
            }
          }

          // Check Checkpoint Pad
          if (!r.checkpointReached) {
            const dx = r.playerX - (r.checkpointPos.col + 0.5);
            const dy = r.playerY - (r.checkpointPos.row + 0.5);
            if (dx * dx + dy * dy < 0.44 * 0.44) {
              r.checkpointReached = true;
              game.safePos = { ...r.checkpointPos };
              sound.playCheckpoint();
              spawnParticles(
                r.particles,
                r.checkpointPos.col + 0.5,
                r.checkpointPos.row + 0.5,
                '#10B981',
                12,
              );
              pushToast(
                r.toasts,
                game,
                'Safe Checkpoint Reached',
                r.checkpointPos.col + 0.5,
                r.checkpointPos.row + 0.2,
                '#10B981',
              );
            }
          }

          // Check Timed Spike Traps
          if (r.invulnTimer <= 0) {
            for (let i = 0; i < r.traps.length; i++) {
              const trap = r.traps[i];
              const phase = getTrapPhase(r.elapsed, i);
              if (phase !== 'ACTIVE') continue;

              const dx = Math.abs(r.playerX - (trap.col + 0.5));
              const dy = Math.abs(r.playerY - (trap.row + 0.5));
              if (dx < 0.34 && dy < 0.34) {
                sound.playHit();
                game.trapHits += 1;
                r.damageFlash = 1.0;
                r.invulnTimer = 1.35;
                spawnParticles(
                  r.particles,
                  r.playerX,
                  r.playerY,
                  '#EF4444',
                  18,
                );
                r.playerX = game.safePos.col + 0.5;
                r.playerY = game.safePos.row + 0.5;
                pushToast(
                  r.toasts,
                  game,
                  r.checkpointReached ? 'Spikes! Returned to Checkpoint' : 'Spikes! Returned to Start',
                  r.playerX,
                  r.playerY - 0.3,
                  '#EF4444',
                );
                break;
              }
            }
          }

          // Check Exit Portal
          {
            const dx = r.playerX - (r.exitPos.col + 0.5);
            const dy = r.playerY - (r.exitPos.row + 0.5);
            if (dx * dx + dy * dy < 0.42 * 0.42) {
              game.won = true;
              sound.playVictory();
              spawnParticles(
                r.particles,
                r.exitPos.col + 0.5,
                r.exitPos.row + 0.5,
                '#14B8A6',
                28,
              );
              callbacksRef.current.onVictory({
                crystalsFound: r.crystals.filter((c) => c.collected).length,
                totalCrystals: r.crystals.length,
                elapsedSeconds: r.elapsed,
                trapHits: game.trapHits,
              });
            }
          }

          // Update particles & toasts
          for (let i = r.particles.length - 1; i >= 0; i--) {
            const p = r.particles[i];
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.94;
            p.vy *= 0.94;
            if (p.age >= p.duration) {
              r.particles.splice(i, 1);
            }
          }

          for (let i = r.toasts.length - 1; i >= 0; i--) {
            const t = r.toasts[i];
            t.age += dt;
            if (t.age >= t.duration) {
              r.toasts.splice(i, 1);
            }
          }
        } else if (frozenRef.current) {
          // Gentle ambient animation for portal/crystals behind title screen
          r.elapsed += dt * 0.7;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          renderMaze(ctx, targetW, targetH, r);
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="MazeQuest Mini game board"
      />
    </div>
  );
}
