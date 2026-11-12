const FUNCTIONS = ["asin", "acos", "atan", "sqrt", "sin", "cos", "tan", "log", "ln"];

function parenDepth(expr) {
  let depth = 0;
  for (const char of expr) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return depth;
  }
  return depth;
}

function endsWithValue(expr) {
  return /[\d)!]$/.test(expr) || expr.endsWith("pi") || /(?:^|[^a-z])e$/.test(expr);
}

function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    if (char === " ") {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let end = index;
      while (end < source.length && /[0-9.]/.test(source[end])) end += 1;
      if ((source[end] === "e" || source[end] === "E") && /[0-9+-]/.test(source[end + 1] || "")) {
        end += 1;
        if (source[end] === "+" || source[end] === "-") end += 1;
        while (/[0-9]/.test(source[end] || "")) end += 1;
      }
      const raw = source.slice(index, end);
      if (!/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) throw new Error("number");
      tokens.push({ type: "num", value: Number(raw) });
      index = end;
      continue;
    }

    const rest = source.slice(index);
    const name = FUNCTIONS.find((fn) => rest.startsWith(fn));
    if (name) {
      tokens.push({ type: "fn", name });
      index += name.length;
      continue;
    }

    if (rest.startsWith("pi")) {
      tokens.push({ type: "const", value: Math.PI });
      index += 2;
      continue;
    }

    if (char === "e") {
      tokens.push({ type: "const", value: Math.E });
      index += 1;
      continue;
    }

    if ("+-*/^%!()".includes(char)) {
      tokens.push({ type: "op", op: char });
      index += 1;
      continue;
    }

    throw new Error("token");
  }

  return tokens;
}

function factorial(value) {
  if (value < 0 || Math.abs(value - Math.round(value)) > 1e-9 || value > 170) throw new Error("factorial");
  let result = 1;
  const n = Math.round(value);
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

function applyFn(name, value, degrees) {
  const toRad = (n) => (degrees ? (n * Math.PI) / 180 : n);
  const fromRad = (n) => (degrees ? (n * 180) / Math.PI : n);

  switch (name) {
    case "sin":
      return Math.sin(toRad(value));
    case "cos":
      return Math.cos(toRad(value));
    case "tan":
      return Math.tan(toRad(value));
    case "asin":
      if (value < -1 || value > 1) throw new Error("domain");
      return fromRad(Math.asin(value));
    case "acos":
      if (value < -1 || value > 1) throw new Error("domain");
      return fromRad(Math.acos(value));
    case "atan":
      return fromRad(Math.atan(value));
    case "log":
      if (value <= 0) throw new Error("domain");
      return Math.log10(value);
    case "ln":
      if (value <= 0) throw new Error("domain");
      return Math.log(value);
    case "sqrt":
      if (value < 0) throw new Error("domain");
      return Math.sqrt(value);
    default:
      throw new Error("function");
  }
}

export function evaluate(source, degrees = true) {
  const tokens = tokenize(source);
  let index = 0;
  const peek = () => tokens[index];

  function parseExpr() {
    let left = parseTerm();
    while (peek()?.op === "+" || peek()?.op === "-") {
      const op = tokens[index].op;
      index += 1;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parseUnary();
    while (peek()?.op === "*" || peek()?.op === "/" || peek()?.op === "%") {
      const op = tokens[index].op;
      index += 1;
      const right = parseUnary();
      if (op === "*") left *= right;
      else if (op === "/") left /= right;
      else left %= right;
    }
    return left;
  }

  function parseUnary() {
    if (peek()?.op === "-") {
      index += 1;
      return -parseUnary();
    }
    if (peek()?.op === "+") {
      index += 1;
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePostfix();
    if (peek()?.op === "^") {
      index += 1;
      return base ** parseUnary();
    }
    return base;
  }

  function parsePostfix() {
    let left = parsePrimary();
    while (peek()?.op === "!") {
      index += 1;
      left = factorial(left);
    }
    return left;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error("end");

    if (token.type === "num" || token.type === "const") {
      index += 1;
      return token.value;
    }

    if (token.type === "fn") {
      index += 1;
      if (tokens[index]?.op !== "(") throw new Error("paren");
      index += 1;
      const arg = parseExpr();
      if (tokens[index]?.op !== ")") throw new Error("paren");
      index += 1;
      return applyFn(token.name, arg, degrees);
    }

    if (token.op === "(") {
      index += 1;
      const value = parseExpr();
      if (tokens[index]?.op !== ")") throw new Error("paren");
      index += 1;
      return value;
    }

    throw new Error("primary");
  }

  if (!tokens.length) throw new Error("empty");
  const value = parseExpr();
  if (index !== tokens.length) throw new Error("trailing");
  return value;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) throw new Error("range");
  if (Object.is(value, -0) || Math.abs(value) < 1e-10) return "0";

  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-6) {
    const [mantissa, exponent] = value.toExponential(6).split("e");
    const cleaned = mantissa.replace(/\.?0+$/, "");
    return `${cleaned}*10^${Number(exponent)}`;
  }

  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

export function pretty(expr) {
  return expr
    .replaceAll("sqrt", "√")
    .replaceAll("pi", "π")
    .replaceAll("*10^", "×10^")
    .replaceAll("%", " mod ")
    .replaceAll("*", " × ")
    .replaceAll("/", " ÷ ")
    .replaceAll("+", " + ")
    .replaceAll("-", " − ");
}

function isComplete(expr) {
  if (!expr) return false;
  if (/[+\-*/^(]$/.test(expr)) return false;
  if (parenDepth(expr) !== 0) return false;
  return true;
}

function relax(expr) {
  let next = expr;
  while (next.length > 1 && /[+\-*/^]$/.test(next)) next = next.slice(0, -1);
  const depth = parenDepth(next);
  if (depth > 0) next += ")".repeat(depth);
  return next;
}

export function liveValue(expr, degrees) {
  if (!expr) return "0";
  if (isComplete(expr)) {
    try {
      return formatNumber(evaluate(expr, degrees));
    } catch {
      return "Error";
    }
  }
  try {
    return formatNumber(evaluate(relax(expr), degrees));
  } catch {
    return null;
  }
}

export function canEvaluate(expr) {
  if (!isComplete(expr)) return false;
  try {
    formatNumber(evaluate(expr, true));
    return true;
  } catch {
    return false;
  }
}

export function appendDigit(expr, digit) {
  if (digit === ".") {
    const num = expr.match(/(\d*\.?\d*)$/)?.[1] ?? "";
    if (num.includes(".")) return expr;
    if (num) return `${expr}.`;
    if (endsWithValue(expr)) return `${expr}*0.`;
    return `${expr}0.`;
  }
  const num = expr.match(/(\d*\.?\d*)$/)?.[1] ?? "";
  if (!num && endsWithValue(expr)) return `${expr}*${digit}`;
  return expr + digit;
}

export function appendOperator(expr, op) {
  if (!expr) return op === "-" ? "-" : `0${op}`;
  if (op === "-" && /[*\/^(]$/.test(expr)) return `${expr}-`;

  const unary = expr.match(/^(.*[*\/^(])-$/);
  if (unary) {
    if (op === "-") return expr;
    const before = unary[1];
    if (before.endsWith("(")) return before;
    return before.slice(0, -1) + op;
  }

  if (/[+\-*/^%]$/.test(expr)) return expr.slice(0, -1) + op;
  return expr + op;
}

export function appendFunction(expr, name) {
  if (!expr) return `${name}(`;
  if (endsWithValue(expr)) return `${expr}*${name}(`;
  return `${expr}${name}(`;
}

export function appendConstant(expr, name) {
  if (endsWithValue(expr)) return `${expr}*${name}`;
  return expr + name;
}

export function appendParen(expr, paren) {
  if (paren === "(") {
    if (endsWithValue(expr)) return `${expr}*(`;
    return `${expr}(`;
  }
  if (parenDepth(expr) <= 0) return expr;
  if (/[+\-*/^(]$/.test(expr)) return expr;
  return `${expr})`;
}

export function appendFactorial(expr) {
  if (!endsWithValue(expr) || expr.endsWith("!")) return expr;
  return `${expr}!`;
}

export function backspace(expr) {
  if (!expr) return "";
  for (const name of FUNCTIONS) {
    if (expr.endsWith(`${name}(`)) return expr.slice(0, -(name.length + 1));
    if (expr.endsWith(name)) return expr.slice(0, -name.length);
  }
  if (expr.endsWith("pi")) return expr.slice(0, -2);
  return expr.slice(0, -1);
}

export function toggleSign(expr) {
  if (!expr) return "-";
  if (/^[+-]?(\d+\.?\d*|\.\d+)(\*10\^[+-]?\d+)?$/.test(expr)) {
    if (expr.startsWith("-")) return expr.slice(1) || "0";
    if (expr.startsWith("+")) return `-${expr.slice(1)}`;
    return `-${expr}`;
  }
  if (expr.startsWith("-(") && expr.endsWith(")") && parenDepth(expr.slice(2, -1)) === 0) {
    return expr.slice(2, -1);
  }
  const match = expr.match(/^(.*?)(\d+\.?\d*|\.\d+)$/);
  if (!match) return `-(${expr})`;
  const head = match[1];
  const num = match[2];
  if (head.endsWith("-")) {
    const prior = head.slice(0, -1);
    if (!prior || /[*\/^(+\-]$/.test(prior)) return prior + num;
    return `${prior}+${num}`;
  }
  if (head.endsWith("+")) return `${head.slice(0, -1)}-${num}`;
  return `${head}-${num}`;
}

export function applyPercent(expr, degrees) {
  if (!expr) return expr;
  const match = expr.match(/^(.*)([+\-])(\d+\.?\d*|\.\d+)$/);
  if (match?.[1]) {
    try {
      const left = evaluate(match[1], degrees);
      const delta = left * (Number(match[3]) / 100);
      return formatNumber(match[2] === "+" ? left + delta : left - delta);
    } catch {
      /* fall through to a plain percent of the whole value */
    }
  }
  try {
    return formatNumber(evaluate(expr, degrees) / 100);
  } catch {
    return expr;
  }
}

export function applySquare(expr) {
  if (!expr || /[+\-*/^(]$/.test(expr)) return expr;
  return `${expr}^2`;
}

export function applyReciprocal(expr) {
  if (!expr || /[+\-*/^(]$/.test(expr)) return expr;
  return `1/(${expr})`;
}
