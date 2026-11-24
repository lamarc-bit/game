import {
  CrystalItem,
  FloatingToast,
  GRID_COLS,
  GRID_ROWS,
  GridCoord,
  Particle,
  TileKind,
  getTrapPhase,
} from './levelData';

export interface RenderState {
  grid: TileKind[][];
  playerX: number; // in tile units (e.g. 1.5 = center of col 1)
  playerY: number;
  facingX: number;
  facingY: number;
  isMoving: boolean;
  walkCycle: number;
  invulnTimer: number;
  damageFlash: number;
  elapsed: number;
  hasKey: boolean;
  keyCollected: boolean;
  keyPos: GridCoord;
  switchActivated: boolean;
  switchPos: GridCoord;
  gatePos: GridCoord;
  gateOpenProgress: number; // 0 = closed, 1 = open
  gateHighlightTimer: number;
  doorUnlocked: boolean;
  doorPos: GridCoord;
  doorOpenProgress: number; // 0 = closed, 1 = open
  doorShakeTimer: number;
  checkpointReached: boolean;
  checkpointPos: GridCoord;
  startPos: GridCoord;
  exitPos: GridCoord;
  traps: GridCoord[];
  crystals: CrystalItem[];
  particles: Particle[];
  toasts: FloatingToast[];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function renderMaze(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderState,
) {
  ctx.clearRect(0, 0, width, height);

  // Compute tile size to fit nicely inside canvas with subtle padding
  const pad = 12;
  const availW = Math.max(100, width - pad * 2);
  const availH = Math.max(100, height - pad * 2);
  const tile = Math.floor(Math.min(availW / GRID_COLS, availH / GRID_ROWS));
  const boardW = tile * GRID_COLS;
  const boardH = tile * GRID_ROWS;
  const ox = Math.floor((width - boardW) / 2);
  const oy = Math.floor((height - boardH) / 2);

  // Outer board frame shadow & border
  ctx.save();
  drawRoundedRect(ctx, ox - 6, oy - 6, boardW + 12, boardH + 12, 14);
  ctx.fillStyle = '#09140E';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#264E3B';
  ctx.stroke();
  ctx.restore();

  // Clip inside maze board
  ctx.save();
  drawRoundedRect(ctx, ox, oy, boardW, boardH, 8);
  ctx.clip();

  // 1. Floor tiles pass
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const kind = state.grid[row][col];
      const tx = ox + col * tile;
      const ty = oy + row * tile;

      if (kind !== 'WALL') {
        // Warm stone path with subtle checkerboard texture
        const alt = (row + col) % 2 === 0;
        ctx.fillStyle = alt ? '#F1E8D5' : '#EAE0CA';
        ctx.fillRect(tx, ty, tile, tile);

        // Subtle cobblestone inner border
        ctx.strokeStyle = 'rgba(138, 120, 92, 0.14)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, tile - 1, tile - 1);
      }
    }
  }

  // 2. Wall ambient drop shadows onto floor tiles immediately below walls
  for (let row = 0; row < GRID_ROWS - 1; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (state.grid[row][col] === 'WALL' && state.grid[row + 1][col] !== 'WALL') {
        const tx = ox + col * tile;
        const ty = oy + (row + 1) * tile;
        const grad = ctx.createLinearGradient(0, ty, 0, ty + tile * 0.24);
        grad.addColorStop(0, 'rgba(12, 29, 20, 0.26)');
        grad.addColorStop(1, 'rgba(12, 29, 20, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(tx, ty, tile, tile * 0.24);
      }
    }
  }

  // 3. Floor conduit connecting Switch (7,3) -> (8,3) -> Gate (9,3)
  {
    const sx = ox + (state.switchPos.col + 0.5) * tile;
    const sy = oy + (state.switchPos.row + 0.5) * tile;
    const gx = ox + (state.gatePos.col + 0.5) * tile;
    const gy = oy + (state.gatePos.row + 0.5) * tile;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(gx, gy);
    ctx.lineWidth = Math.max(3, tile * 0.1);
    ctx.strokeStyle = state.switchActivated
      ? 'rgba(16, 185, 129, 0.55)'
      : 'rgba(100, 116, 139, 0.22)';
    ctx.stroke();

    if (state.switchActivated) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(gx, gy);
      ctx.lineWidth = Math.max(1.5, tile * 0.04);
      ctx.strokeStyle = '#6EE7B7';
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Special floor tiles (Start, Checkpoint, Switch, Traps, Exit)
  // Start tile
  {
    const cx = ox + (state.startPos.col + 0.5) * tile;
    const cy = oy + (state.startPos.row + 0.5) * tile;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, tile * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
    ctx.stroke();

    ctx.fillStyle = '#1D4ED8';
    ctx.font = `700 ${Math.max(8, Math.floor(tile * 0.19))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', cx, cy);
    ctx.restore();
  }

  // Checkpoint Pad
  {
    const cx = ox + (state.checkpointPos.col + 0.5) * tile;
    const cy = oy + (state.checkpointPos.row + 0.5) * tile;
    const active = state.checkpointReached;
    ctx.save();
    drawRoundedRect(
      ctx,
      cx - tile * 0.36,
      cy - tile * 0.36,
      tile * 0.72,
      tile * 0.72,
      tile * 0.14,
    );
    ctx.fillStyle = active ? '#D1FAE5' : '#E2E8F0';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = active ? '#10B981' : '#94A3B8';
    ctx.stroke();

    // Flag / shield emblem
    ctx.beginPath();
    ctx.arc(cx, cy, tile * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = active ? '#059669' : '#64748B';
    ctx.fill();

    ctx.fillStyle = active ? '#065F46' : '#475569';
    ctx.font = `700 ${Math.max(7, Math.floor(tile * 0.15))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SAFE', cx, cy + tile * 0.33);
    ctx.restore();
  }

  // Floor Switch
  {
    const cx = ox + (state.switchPos.col + 0.5) * tile;
    const cy = oy + (state.switchPos.row + 0.5) * tile;
    const tx = ox + state.switchPos.col * tile;
    const ty = oy + state.switchPos.row * tile;
    ctx.save();

    // Base stone socket
    drawRoundedRect(
      ctx,
      tx + tile * 0.15,
      ty + tile * 0.15,
      tile * 0.7,
      tile * 0.7,
      tile * 0.14,
    );
    ctx.fillStyle = '#475569';
    ctx.fill();

    // Switch pad
    const offset = state.switchActivated ? tile * 0.03 : 0;
    drawRoundedRect(
      ctx,
      tx + tile * 0.22,
      ty + tile * 0.22 + offset,
      tile * 0.56,
      tile * 0.56,
      tile * 0.1,
    );
    ctx.fillStyle = state.switchActivated ? '#34D399' : '#10B981';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.switchActivated ? '#A7F3D0' : '#047857';
    ctx.stroke();

    // Center symbol
    ctx.beginPath();
    ctx.arc(cx, cy + offset, tile * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = state.switchActivated ? '#064E3B' : '#ECFDF5';
    ctx.fill();
    ctx.restore();
  }

  // Timed Spike Traps
  state.traps.forEach((trap, idx) => {
    const tx = ox + trap.col * tile;
    const ty = oy + trap.row * tile;
    const phase = getTrapPhase(state.elapsed, idx);

    ctx.save();
    // Metal plate
    drawRoundedRect(
      ctx,
      tx + tile * 0.1,
      ty + tile * 0.1,
      tile * 0.8,
      tile * 0.8,
      tile * 0.1,
    );
    ctx.fillStyle =
      phase === 'ACTIVE'
        ? '#451A1A'
        : phase === 'WARNING'
          ? '#4A2C12'
          : '#334155';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle =
      phase === 'ACTIVE'
        ? '#EF4444'
        : phase === 'WARNING'
          ? '#F59E0B'
          : '#1E293B';
    ctx.stroke();

    // 4 Spike positions in 2x2 grid
    const offsets = [
      [0.32, 0.32],
      [0.68, 0.32],
      [0.32, 0.68],
      [0.68, 0.68],
    ];
    for (const [oxRatio, oyRatio] of offsets) {
      const sx = tx + tile * oxRatio;
      const sy = ty + tile * oyRatio;

      // Hole socket
      ctx.beginPath();
      ctx.arc(sx, sy, tile * 0.085, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();

      if (phase === 'WARNING') {
        const pulse = 0.5 + 0.5 * Math.sin(state.elapsed * 22);
        ctx.beginPath();
        ctx.arc(sx, sy, tile * 0.065, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 146, 60, ${0.65 + pulse * 0.35})`;
        ctx.fill();
      } else if (phase === 'ACTIVE') {
        // Sharp gleaming spike triangle
        const r = tile * 0.13;
        ctx.beginPath();
        ctx.moveTo(sx, sy - r * 1.35);
        ctx.lineTo(sx + r * 0.85, sy + r * 0.65);
        ctx.lineTo(sx - r * 0.85, sy + r * 0.65);
        ctx.closePath();
        ctx.fillStyle = '#E2E8F0';
        ctx.fill();

        // Crimson warning tip
        ctx.beginPath();
        ctx.moveTo(sx, sy - r * 1.35);
        ctx.lineTo(sx + r * 0.38, sy - r * 0.45);
        ctx.lineTo(sx - r * 0.38, sy - r * 0.45);
        ctx.closePath();
        ctx.fillStyle = '#EF4444';
        ctx.fill();
      }
    }
    ctx.restore();
  });

  // Exit Portal
  {
    const cx = ox + (state.exitPos.col + 0.5) * tile;
    const cy = oy + (state.exitPos.row + 0.5) * tile;
    ctx.save();

    // Outer arcane glow
    const glow = ctx.createRadialGradient(cx, cy, tile * 0.08, cx, cy, tile * 0.48);
    glow.addColorStop(0, 'rgba(20, 184, 166, 0.85)');
    glow.addColorStop(0.6, 'rgba(16, 185, 129, 0.35)');
    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, tile * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Rotating portal ring
    ctx.translate(cx, cy);
    ctx.rotate(state.elapsed * 1.8);
    ctx.beginPath();
    ctx.arc(0, 0, tile * 0.31, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2.5, tile * 0.07);
    ctx.strokeStyle = '#14B8A6';
    ctx.setLineDash([tile * 0.18, tile * 0.1]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner bright core
    ctx.rotate(-state.elapsed * 3.1);
    const coreScale = 1 + 0.08 * Math.sin(state.elapsed * 4.5);
    ctx.beginPath();
    ctx.arc(0, 0, tile * 0.2 * coreScale, 0, Math.PI * 2);
    ctx.fillStyle = '#99F6E4';
    ctx.fill();

    ctx.restore();

    // Crisp EXIT label below/above core
    ctx.save();
    ctx.fillStyle = '#064E3B';
    ctx.font = `800 ${Math.max(8, Math.floor(tile * 0.17))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', cx, cy);
    ctx.restore();
  }

  // 5. Switch Gate (G)
  {
    const tx = ox + state.gatePos.col * tile;
    const ty = oy + state.gatePos.row * tile;
    const open = state.gateOpenProgress;

    ctx.save();
    if (open < 0.99) {
      // Two sliding gate leaves splitting vertically
      const halfH = (tile / 2) * (1 - open);
      ctx.fillStyle = '#065F46';
      ctx.fillRect(tx + tile * 0.18, ty, tile * 0.64, halfH);
      ctx.fillRect(tx + tile * 0.18, ty + tile - halfH, tile * 0.64, halfH);

      // Gate bars detail
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx + tile * 0.2, ty + 1, tile * 0.6, Math.max(0, halfH - 2));
      ctx.strokeRect(
        tx + tile * 0.2,
        ty + tile - halfH + 1,
        tile * 0.6,
        Math.max(0, halfH - 2),
      );

      if (open < 0.2) {
        // Lock glyph in center
        ctx.beginPath();
        ctx.arc(tx + tile * 0.5, ty + tile * 0.5, tile * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();
      }
    } else {
      // Open threshold rails
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(tx + tile * 0.15, ty + 2, tile * 0.7, 4);
      ctx.fillRect(tx + tile * 0.15, ty + tile - 6, tile * 0.7, 4);
    }

    // Highlight beacon when switch was just pressed
    if (state.gateHighlightTimer > 0) {
      const p = 1 - state.gateHighlightTimer / 1.8;
      ctx.beginPath();
      ctx.arc(
        tx + tile * 0.5,
        ty + tile * 0.5,
        tile * (0.35 + p * 0.75),
        0,
        Math.PI * 2,
      );
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - p) * 0.9})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. Locked Door (D)
  {
    const shakeX =
      state.doorShakeTimer > 0
        ? Math.sin(state.doorShakeTimer * 55) * (tile * 0.06)
        : 0;
    const tx = ox + state.doorPos.col * tile + shakeX;
    const ty = oy + state.doorPos.row * tile;
    const open = state.doorOpenProgress;

    ctx.save();
    if (open < 0.99) {
      const doorW = tile * 0.72;
      const doorH = tile * (1 - open * 0.9);
      const dx = tx + (tile - doorW) / 2;
      const dy = ty + (tile - doorH) / 2;

      drawRoundedRect(ctx, dx, dy, doorW, doorH, 4);
      ctx.fillStyle = '#92400E';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();

      // Keyhole emblem
      if (open < 0.25) {
        const cx = tx + tile * 0.5;
        const cy = ty + tile * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy - tile * 0.04, tile * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = '#FDE68A';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - tile * 0.04, cy);
        ctx.lineTo(cx + tile * 0.04, cy);
        ctx.lineTo(cx + tile * 0.06, cy + tile * 0.13);
        ctx.lineTo(cx - tile * 0.06, cy + tile * 0.13);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Unlocked open frame markers
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(tx + tile * 0.15, ty + 2, tile * 0.7, 4);
      ctx.fillRect(tx + tile * 0.15, ty + tile - 6, tile * 0.7, 4);
    }
    ctx.restore();
  }

  // 7. Walls pass (drawn over floor edges for crisp overlap)
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (state.grid[row][col] !== 'WALL') continue;
      const tx = ox + col * tile;
      const ty = oy + row * tile;

      // Dark green base wall
      ctx.fillStyle = '#133A27';
      ctx.fillRect(tx, ty, tile, tile);

      // Raised mossy hedge top bevel
      const inset = Math.max(2, Math.floor(tile * 0.08));
      drawRoundedRect(
        ctx,
        tx + inset * 0.5,
        ty + inset * 0.4,
        tile - inset,
        tile - inset * 1.1,
        Math.max(3, tile * 0.1),
      );
      ctx.fillStyle = '#1D5439';
      ctx.fill();

      // Subtle foliage highlight on top-left corner
      ctx.fillStyle = 'rgba(110, 231, 183, 0.08)';
      ctx.fillRect(tx + inset, ty + inset * 0.6, tile - inset * 2, Math.max(2, tile * 0.08));
    }
  }

  // 8. Collectibles: Purple Crystals
  for (const crystal of state.crystals) {
    if (crystal.collected) continue;
    const cx = ox + (crystal.col + 0.5) * tile;
    const bob = Math.sin(state.elapsed * 3.4 + crystal.col) * (tile * 0.055);
    const cy = oy + (crystal.row + 0.5) * tile + bob;

    // Ground shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      cx,
      oy + (crystal.row + 0.78) * tile,
      tile * 0.18,
      tile * 0.07,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fill();

    // Glow behind gem
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, tile * 0.36);
    g.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    g.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, tile * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // Faceted diamond
    const rx = tile * 0.2;
    const ry = tile * 0.28;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy);
    ctx.closePath();
    ctx.fillStyle = '#8B5CF6';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#DDD6FE';
    ctx.stroke();

    // Top-left bright facet
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx * 0.25, cy - ry * 0.1);
    ctx.lineTo(cx - rx * 0.75, cy);
    ctx.closePath();
    ctx.fillStyle = '#C4B5FD';
    ctx.fill();
    ctx.restore();
  }

  // 9. Gold Key (if not collected)
  if (!state.keyCollected) {
    const cx = ox + (state.keyPos.col + 0.5) * tile;
    const bob = Math.sin(state.elapsed * 3.8) * (tile * 0.06);
    const cy = oy + (state.keyPos.row + 0.5) * tile + bob;

    ctx.save();
    // Shadow
    ctx.beginPath();
    ctx.ellipse(
      cx,
      oy + (state.keyPos.row + 0.78) * tile,
      tile * 0.2,
      tile * 0.07,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fill();

    // Warm golden aura
    const aura = ctx.createRadialGradient(cx, cy, 2, cx, cy, tile * 0.4);
    aura.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, tile * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Key bow + shaft + teeth
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);

    // Shaft
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = Math.max(4, tile * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-tile * 0.1, 0);
    ctx.lineTo(tile * 0.24, 0);
    ctx.stroke();

    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = Math.max(2.5, tile * 0.07);
    ctx.beginPath();
    ctx.moveTo(-tile * 0.1, 0);
    ctx.lineTo(tile * 0.24, 0);
    ctx.moveTo(tile * 0.14, 0);
    ctx.lineTo(tile * 0.14, tile * 0.1);
    ctx.moveTo(tile * 0.23, 0);
    ctx.lineTo(tile * 0.23, tile * 0.12);
    ctx.stroke();

    // Ring head
    ctx.beginPath();
    ctx.arc(-tile * 0.14, 0, tile * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FEF08A';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-tile * 0.14, 0, tile * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = '#EFE6D3';
    ctx.fill();

    ctx.restore();
  }

  // 10. Player Character (Blue Explorer)
  {
    const px = ox + state.playerX * tile;
    const py = oy + state.playerY * tile;
    const blinkHide =
      state.invulnTimer > 0 && Math.floor(state.invulnTimer * 18) % 2 === 0;

    if (!blinkHide) {
      ctx.save();
      const stride = state.isMoving ? Math.sin(state.walkCycle * 14) : 0;
      const bob = state.isMoving ? Math.abs(Math.sin(state.walkCycle * 14)) * (tile * 0.06) : 0;

      // Ground shadow
      ctx.beginPath();
      ctx.ellipse(
        px,
        py + tile * 0.26,
        tile * 0.24,
        tile * 0.1,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fill();

      // Little boots animated on walk
      ctx.fillStyle = '#1E3A8A';
      ctx.beginPath();
      ctx.arc(px - tile * 0.1, py + tile * 0.2 + stride * tile * 0.06, tile * 0.075, 0, Math.PI * 2);
      ctx.arc(px + tile * 0.1, py + tile * 0.2 - stride * tile * 0.06, tile * 0.075, 0, Math.PI * 2);
      ctx.fill();

      // Body / Cloak
      const bodyY = py - bob;
      ctx.beginPath();
      ctx.arc(px, bodyY, tile * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = '#2563EB';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1D4ED8';
      ctx.stroke();

      // Highlight cap/hood
      ctx.beginPath();
      ctx.arc(px - tile * 0.05, bodyY - tile * 0.05, tile * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#60A5FA';
      ctx.fill();

      // Eyes oriented toward facing direction
      const eyeOffsetX = state.facingX * tile * 0.09;
      const eyeOffsetY = state.facingY * tile * 0.09;
      const perpX = -state.facingY * tile * 0.075;
      const perpY = state.facingX * tile * 0.075;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(px + eyeOffsetX + perpX, bodyY + eyeOffsetY + perpY, tile * 0.055, 0, Math.PI * 2);
      ctx.arc(px + eyeOffsetX - perpX, bodyY + eyeOffsetY - perpY, tile * 0.055, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(
        px + eyeOffsetX * 1.2 + perpX,
        bodyY + eyeOffsetY * 1.2 + perpY,
        tile * 0.03,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        px + eyeOffsetX * 1.2 - perpX,
        bodyY + eyeOffsetY * 1.2 - perpY,
        tile * 0.03,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Key badge hovering lightly beside player if carrying key
      if (state.hasKey && !state.doorUnlocked) {
        ctx.beginPath();
        ctx.arc(px + tile * 0.22, bodyY - tile * 0.22, tile * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FEF3C7';
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // 11. Particles
  for (const p of state.particles) {
    const t = p.age / p.duration;
    const alpha = Math.max(0, 1 - t);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(ox + p.x * tile, oy + p.y * tile, p.radius * (1 - t * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  // 12. Damage crimson screen flash
  if (state.damageFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(220, 38, 38, ${state.damageFlash * 0.35})`;
    ctx.fillRect(ox, oy, boardW, boardH);
    ctx.restore();
  }

  // 13. Floating canvas feedback toasts
  for (const toast of state.toasts) {
    const t = toast.age / toast.duration;
    const alpha = t < 0.7 ? 1 : Math.max(0, (1 - t) / 0.3);
    const tx = Math.min(Math.max(ox + 70, ox + toast.x * tile), ox + boardW - 70);
    const ty = Math.max(oy + 24, oy + toast.y * tile - t * tile * 0.65);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.max(12, Math.floor(tile * 0.28))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textW = ctx.measureText(toast.text).width;
    drawRoundedRect(ctx, tx - textW / 2 - 10, ty - 12, textW + 20, 24, 6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fill();
    ctx.strokeStyle = toast.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(toast.text, tx, ty);
    ctx.restore();
  }

  ctx.restore();
}
