export type GameScreen = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';

export type TileKind =
  | 'WALL'
  | 'FLOOR'
  | 'START'
  | 'EXIT'
  | 'SWITCH'
  | 'GATE'
  | 'DOOR'
  | 'TRAP'
  | 'CHECKPOINT';

export interface Vec2 {
  x: number;
  y: number;
}

export interface GridCoord {
  col: number;
  row: number;
}

export interface CrystalItem {
  id: string;
  col: number;
  row: number;
  collected: boolean;
}

export interface FloatingToast {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  age: number;
  duration: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  age: number;
  duration: number;
}

export const GRID_COLS = 19;
export const GRID_ROWS = 13;

export const RAW_MAZE_LAYOUT: string[] = [
  '###################',
  '#S..#C...#P.T.T..K#',
  '#.#.#.##.#.######.#',
  '#.#...#W.G....#C..#',
  '#.###.#######.#####',
  '#...#....#C.......#',
  '###.###.##.######.#',
  '#C#...#..#........#',
  '#.###.##.####.#.###',
  '#........#....#.D.#',
  '#.####.###.######.#',
  '#......#C...###E..#',
  '###################',
];

export interface ParsedLevel {
  grid: TileKind[][];
  start: GridCoord;
  exit: GridCoord;
  keyPos: GridCoord;
  doorPos: GridCoord;
  switchPos: GridCoord;
  gatePos: GridCoord;
  checkpointPos: GridCoord;
  traps: GridCoord[];
  crystals: CrystalItem[];
}

export function parseLevel(): ParsedLevel {
  const grid: TileKind[][] = [];
  let start: GridCoord = { col: 1, row: 1 };
  let exit: GridCoord = { col: 15, row: 11 };
  let keyPos: GridCoord = { col: 17, row: 1 };
  let doorPos: GridCoord = { col: 16, row: 9 };
  let switchPos: GridCoord = { col: 7, row: 3 };
  let gatePos: GridCoord = { col: 9, row: 3 };
  let checkpointPos: GridCoord = { col: 10, row: 1 };
  const traps: GridCoord[] = [];
  const crystals: CrystalItem[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    const line = RAW_MAZE_LAYOUT[row];
    const rowTiles: TileKind[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const ch = line[col];
      switch (ch) {
        case '#':
          rowTiles.push('WALL');
          break;
        case 'S':
          start = { col, row };
          rowTiles.push('START');
          break;
        case 'E':
          exit = { col, row };
          rowTiles.push('EXIT');
          break;
        case 'W':
          switchPos = { col, row };
          rowTiles.push('SWITCH');
          break;
        case 'G':
          gatePos = { col, row };
          rowTiles.push('GATE');
          break;
        case 'D':
          doorPos = { col, row };
          rowTiles.push('DOOR');
          break;
        case 'T':
          traps.push({ col, row });
          rowTiles.push('TRAP');
          break;
        case 'P':
          checkpointPos = { col, row };
          rowTiles.push('CHECKPOINT');
          break;
        case 'K':
          keyPos = { col, row };
          rowTiles.push('FLOOR');
          break;
        case 'C':
          crystals.push({
            id: `crystal-${col}-${row}`,
            col,
            row,
            collected: false,
          });
          rowTiles.push('FLOOR');
          break;
        default:
          rowTiles.push('FLOOR');
          break;
      }
    }
    grid.push(rowTiles);
  }

  return {
    grid,
    start,
    exit,
    keyPos,
    doorPos,
    switchPos,
    gatePos,
    checkpointPos,
    traps,
    crystals,
  };
}

// Trap cycle in seconds:
// 0.00 - 1.25: Safe (recessed)
// 1.25 - 1.80: Warning (amber glow)
// 1.80 - 2.65: Active (extended spikes - hazardous!)
export const TRAP_CYCLE_DURATION = 2.65;

export type TrapPhase = 'SAFE' | 'WARNING' | 'ACTIVE';

export function getTrapPhase(elapsedSeconds: number, trapIndex: number): TrapPhase {
  // Slight offset between adjacent traps makes crossing rhythmic and readable
  const offset = trapIndex * 0.35;
  const t = (elapsedSeconds + offset) % TRAP_CYCLE_DURATION;
  if (t < 1.25) return 'SAFE';
  if (t < 1.8) return 'WARNING';
  return 'ACTIVE';
}
