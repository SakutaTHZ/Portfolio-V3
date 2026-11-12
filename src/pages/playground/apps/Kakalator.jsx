import { useMemo, useState } from "react";
import {
  appendConstant,
  appendDigit,
  appendFactorial,
  appendFunction,
  appendOperator,
  appendParen,
  applyPercent,
  applyReciprocal,
  applySquare,
  backspace,
  canEvaluate,
  evaluate,
  formatNumber,
  liveValue,
  pretty,
  toggleSign,
} from "./kakalator-math";
import "./css/kakalator.css";

export const playgroundMeta = {
  title: "kakalator",
  width: 420,
  height: 760,
};

const CELL_BY_KEY = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const PAD = [
  { id: "ac", label: "AC", action: "clear", tone: "ghost" },
  { id: "sign", label: "±", action: "sign", tone: "ghost" },
  { id: "back", label: "⌫", action: "back", tone: "ghost", name: "Backspace" },
  { id: "div", label: "÷", action: "op", op: "/", tone: "op" },
  { id: "7", label: "7", action: "digit", digit: "7", cell: 0 },
  { id: "8", label: "8", action: "digit", digit: "8", cell: 1 },
  { id: "9", label: "9", action: "digit", digit: "9", cell: 2 },
  { id: "mul", label: "×", action: "op", op: "*", tone: "op" },
  { id: "4", label: "4", action: "digit", digit: "4", cell: 3 },
  { id: "5", label: "5", action: "digit", digit: "5", cell: 4 },
  { id: "6", label: "6", action: "digit", digit: "6", cell: 5 },
  { id: "sub", label: "−", action: "op", op: "-", tone: "op" },
  { id: "1", label: "1", action: "digit", digit: "1", cell: 6 },
  { id: "2", label: "2", action: "digit", digit: "2", cell: 7 },
  { id: "3", label: "3", action: "digit", digit: "3", cell: 8 },
  { id: "add", label: "+", action: "op", op: "+", tone: "op" },
  { id: "pct", label: "%", action: "percent", tone: "op" },
  { id: "0", label: "0", action: "digit", digit: "0" },
  { id: "dot", label: ".", action: "digit", digit: "." },
  { id: "eq", label: "=", action: "equals", tone: "eq" },
];

function winnerOf(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a], line };
    }
  }
  return null;
}

function emptyBoard() {
  return Array(9).fill(null);
}

export default function Kakalator() {
  const [expr, setExpr] = useState("");
  const [fresh, setFresh] = useState(false);
  const [error, setError] = useState(false);
  const [scientific, setScientific] = useState(false);
  const [degrees, setDegrees] = useState(true);
  const [ticTacToe, setTicTacToe] = useState(false);
  const [board, setBoard] = useState(emptyBoard);

  const outcome = useMemo(() => winnerOf(board), [board]);
  const boardFull = board.every(Boolean);
  const turn = board.filter(Boolean).length % 2 === 0 ? "X" : "O";
  const live = useMemo(() => liveValue(expr, degrees), [expr, degrees]);
  const readout = error ? "Error" : live === "Error" ? "Error" : live ?? "0";

  function editing() {
    return fresh || error ? "" : expr;
  }

  function continued() {
    return error ? "" : expr;
  }

  function write(next, options = {}) {
    setExpr(next);
    setFresh(options.fresh ?? false);
    setError(false);
  }

  function playCell(cell) {
    if (!ticTacToe || outcome || board[cell]) return;
    setBoard((prev) => {
      if (prev[cell] || winnerOf(prev)) return prev;
      const next = prev.slice();
      next[cell] = prev.filter(Boolean).length % 2 === 0 ? "X" : "O";
      return next;
    });
  }

  function onKey(key) {
    if (key.action === "digit" && ticTacToe && key.cell !== undefined) {
      playCell(key.cell);
      return;
    }
    if (key.action === "digit") write(appendDigit(editing(), key.digit));
    else if (key.action === "op") write(appendOperator(continued(), key.op));
    else if (key.action === "clear") write("");
    else if (key.action === "back") write(backspace(editing()));
    else if (key.action === "sign") write(toggleSign(continued() || "0"));
    else if (key.action === "percent") {
      const next = applyPercent(continued(), degrees);
      write(next, { fresh: next !== continued() });
    } else if (key.action === "equals") onEquals();
  }

  function onEquals() {
    if (!expr) return;
    if (!canEvaluate(expr)) {
      setError(true);
      setFresh(false);
      return;
    }
    try {
      write(formatNumber(evaluate(expr, degrees)), { fresh: true });
    } catch {
      setError(true);
      setFresh(false);
    }
  }

  function onType(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    if ((key === "Enter" || key === " ") && event.target instanceof HTMLButtonElement) return;

    if (ticTacToe && CELL_BY_KEY[key] !== undefined) {
      event.preventDefault();
      playCell(CELL_BY_KEY[key]);
      return;
    }

    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      write(appendDigit(editing(), key));
      return;
    }
    if (key === ".") {
      event.preventDefault();
      write(appendDigit(editing(), "."));
      return;
    }
    if (key === "+" || key === "-" || key === "*" || key === "/") {
      event.preventDefault();
      write(appendOperator(continued(), key));
      return;
    }
    if (key === "Enter" || key === "=") {
      event.preventDefault();
      onEquals();
      return;
    }
    if (key === "Backspace") {
      event.preventDefault();
      write(backspace(editing()));
      return;
    }
    if (key === "Escape") {
      event.preventDefault();
      write("");
      return;
    }
    if (key === "%") {
      event.preventDefault();
      const next = applyPercent(continued(), degrees);
      write(next, { fresh: next !== continued() });
      return;
    }
    if (key === "(" || key === ")") {
      event.preventDefault();
      write(appendParen(editing(), key));
    }
  }

  function insert(next, options) {
    write(next, options);
  }

  const matchText = outcome
    ? `${outcome.mark} wins`
    : boardFull
      ? "Draw"
      : `${turn} to play`;

  const sciKeys = [
    { label: "sin", run: () => insert(appendFunction(editing(), "sin")) },
    { label: "cos", run: () => insert(appendFunction(editing(), "cos")) },
    { label: "tan", run: () => insert(appendFunction(editing(), "tan")) },
    { label: "ln", run: () => insert(appendFunction(editing(), "ln")) },
    { label: "log", run: () => insert(appendFunction(editing(), "log")) },
    { label: "√", run: () => insert(appendFunction(editing(), "sqrt")) },
    { label: "x²", run: () => insert(applySquare(continued())) },
    { label: "xʸ", run: () => insert(appendOperator(continued(), "^")) },
    { label: "π", run: () => insert(appendConstant(editing(), "pi")) },
    { label: "e", run: () => insert(appendConstant(editing(), "e")) },
    { label: "(", run: () => insert(appendParen(editing(), "(")) },
    { label: ")", run: () => insert(appendParen(editing(), ")")) },
    { label: "n!", run: () => insert(appendFactorial(continued())) },
    { label: "mod", run: () => insert(appendOperator(continued(), "%")) },
    { label: "1/x", run: () => insert(applyReciprocal(continued())) },
    { label: degrees ? "Deg" : "Rad", run: () => setDegrees((value) => !value) },
  ];

  return (
    <div className="kaka" data-ttt={ticTacToe || undefined} onKeyDown={onType} tabIndex={0}>
      <header className="kaka-bar">
        <p className="kaka-name">kakalator</p>
        <div className="kaka-modes">
          <button
            type="button"
            className="kaka-mode"
            aria-pressed={scientific}
            onClick={() => setScientific((value) => !value)}
          >
            Scientific
          </button>
          <button
            type="button"
            className="kaka-mode"
            aria-pressed={ticTacToe}
            onClick={() => setTicTacToe((value) => !value)}
          >
            Tic-tac-toe
          </button>
        </div>
      </header>

      <div className="kaka-screen">
        <p className="kaka-expr">{pretty(expr) || " "}</p>
        <p className="kaka-readout" data-error={readout === "Error" || undefined} aria-live="polite">
          {readout}
        </p>
      </div>

      {ticTacToe && (
        <div className="kaka-match">
          <span className={`kaka-turn is-${(outcome?.mark || turn).toLowerCase()}`}>{matchText}</span>
          <button type="button" className="kaka-new" onClick={() => setBoard(emptyBoard())}>
            New game
          </button>
        </div>
      )}

      {scientific && (
        <div className="kaka-sci">
          {sciKeys.map((key) => (
            <button
              key={key.label}
              type="button"
              className="kaka-key is-sci"
              aria-pressed={key.label === "Deg" || key.label === "Rad" ? degrees : undefined}
              onClick={key.run}
            >
              {key.label}
            </button>
          ))}
        </div>
      )}

      <div className="kaka-pad" data-ttt={ticTacToe || undefined}>
        {PAD.map((key) => {
          const playing = ticTacToe && key.cell !== undefined;
          const mark = playing ? board[key.cell] : null;
          const winning = Boolean(outcome?.line.includes(key.cell));
          return (
            <button
              key={key.id}
              type="button"
              className={[
                "kaka-key",
                key.tone ? `is-${key.tone}` : "",
                playing ? "is-cell" : "",
                mark ? `is-${mark.toLowerCase()}` : "",
                winning ? "is-win" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={playing ? `${mark || "Empty"} square` : key.name || key.label}
              onClick={() => onKey(key)}
            >
              {playing ? <span className="kaka-mark">{mark || ""}</span> : key.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
