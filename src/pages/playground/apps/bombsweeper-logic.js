const NEIGHBORS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export const DIFFICULTIES = {
  scout: { id: "scout", label: "Scout", cols: 9, rows: 9, mines: 10 },
  ranger: { id: "ranger", label: "Ranger", cols: 12, rows: 12, mines: 28 },
  breach: { id: "breach", label: "Breach", cols: 16, rows: 16, mines: 40 },
};

export function cellIndex(row, col, cols) {
  return row * cols + col;
}

export function inBounds(row, col, rows, cols) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

export function createEmpty(rows, cols) {
  return {
    rows,
    cols,
    mines: 0,
    mineSet: new Set(),
    adjacency: Array(rows * cols).fill(0),
    revealed: Array(rows * cols).fill(false),
    flagged: Array(rows * cols).fill(false),
    exploded: null,
    seeded: false,
    status: "idle",
    startedAt: null,
    endedAt: null,
  };
}

function placeMines(board, avoidIndex) {
  const { rows, cols, mines: count } = board;
  const candidates = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const idx = cellIndex(r, c, cols);
      if (idx !== avoidIndex) candidates.push(idx);
    }
  }
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mineSet = new Set(candidates.slice(0, count));
  const adjacency = Array(rows * cols).fill(0);
  mineSet.forEach((idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    for (const [dr, dc] of NEIGHBORS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc, rows, cols)) continue;
      const nIdx = cellIndex(nr, nc, cols);
      if (!mineSet.has(nIdx)) adjacency[nIdx] += 1;
    }
  });
  return { mineSet, adjacency };
}

export function startBoard(difficultyId) {
  const spec = DIFFICULTIES[difficultyId] || DIFFICULTIES.scout;
  const board = createEmpty(spec.rows, spec.cols);
  board.mines = spec.mines;
  board.difficulty = spec.id;
  return board;
}

function beginIfNeeded(board) {
  if (board.status !== "playing") {
    board.status = "playing";
    board.startedAt = Date.now();
  }
}

export function revealCell(board, index) {
  if (board.status === "won" || board.status === "lost") return board;
  if (board.flagged[index] || board.revealed[index]) return board;

  const next = { ...board, revealed: [...board.revealed], flagged: [...board.flagged] };

  if (!next.seeded) {
    const placed = placeMines(next, index);
    next.mineSet = placed.mineSet;
    next.adjacency = placed.adjacency;
    next.seeded = true;
  }

  beginIfNeeded(next);

  if (next.mineSet.has(index)) {
    next.revealed[index] = true;
    next.exploded = index;
    next.status = "lost";
    next.endedAt = Date.now();
    for (let i = 0; i < next.revealed.length; i += 1) {
      if (next.mineSet.has(i)) next.revealed[i] = true;
    }
    return next;
  }

  const queue = [index];
  next.revealed[index] = true;

  while (queue.length) {
    const current = queue.pop();
    if (next.adjacency[current] !== 0) continue;
    const row = Math.floor(current / next.cols);
    const col = current % next.cols;
    for (const [dr, dc] of NEIGHBORS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc, next.rows, next.cols)) continue;
      const nIdx = cellIndex(nr, nc, next.cols);
      if (next.revealed[nIdx] || next.flagged[nIdx] || next.mineSet.has(nIdx)) continue;
      next.revealed[nIdx] = true;
      queue.push(nIdx);
    }
  }

  if (isWin(next)) {
    next.status = "won";
    next.endedAt = Date.now();
  }

  return next;
}

export function toggleFlag(board, index) {
  if (board.status === "won" || board.status === "lost") return board;
  if (board.revealed[index]) return board;

  const next = { ...board, flagged: [...board.flagged] };
  if (!next.seeded) beginIfNeeded(next);
  else beginIfNeeded(next);

  next.flagged[index] = !next.flagged[index];
  return next;
}

export function chordReveal(board, index) {
  if (board.status !== "playing") return board;
  if (!board.revealed[index] || board.adjacency[index] === 0) return board;

  const row = Math.floor(index / board.cols);
  const col = index % board.cols;
  let flags = 0;
  const neighbors = [];
  for (const [dr, dc] of NEIGHBORS) {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(nr, nc, board.rows, board.cols)) continue;
    const nIdx = cellIndex(nr, nc, board.cols);
    neighbors.push(nIdx);
    if (board.flagged[nIdx]) flags += 1;
  }
  if (flags !== board.adjacency[index]) return board;

  let next = board;
  for (const nIdx of neighbors) {
    if (board.flagged[nIdx]) continue;
    next = revealCell(next, nIdx);
    if (next.status === "lost") break;
  }
  return next;
}

function isWin(board) {
  const total = board.rows * board.cols;
  let revealedSafe = 0;
  for (let i = 0; i < total; i += 1) {
    if (board.revealed[i] && !board.mineSet.has(i)) revealedSafe += 1;
  }
  return revealedSafe === total - board.mineSet.size;
}

export function elapsedMs(board, now = Date.now()) {
  if (!board.startedAt) return 0;
  const end = board.endedAt ?? now;
  return Math.max(0, end - board.startedAt);
}

export function formatMs(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  return `${s}.${String(cs).padStart(2, "0")}s`;
}

export function remainingFlags(board) {
  const flagged = board.flagged.filter(Boolean).length;
  return Math.max(0, board.mines - flagged);
}