import { playgroundRoot } from "@/pages/playground/registry";

const PORTFOLIO = {
  about:
    "I'm Thar Htet Zan, a web developer who enjoys building dynamic, user-friendly websites and applications, coding, and learning new technologies.",
  skills:
    "This portfolio is built with React, JavaScript, Tailwind CSS, Vite, and GSAP, with WebGL-powered visual effects.",
  projects:
    "SakutaOS is this portfolio. Also public: Shika Typo, THZ Components, Reflexo, Artify, and the earlier site at tharhtetzan.netlify.app.",
  contact:
    "Email tharhtetzan@gmail.com or thzarts@gmail.com. GitHub is github.com/SakutaTHZ. LinkedIn is linkedin.com/in/thar-htet-zan-a15b39198. Based in Yangon.",
};

export const COMMANDS = [
  { name: "/help", summary: "show every command" },
  { name: "ls", summary: "list a directory (-l details, -a all)", completes: "any" },
  { name: "cd", summary: "change directory", completes: "dir" },
  { name: "pwd", summary: "print the working directory" },
  { name: "find", summary: "search under a path (-name pattern)", completes: "any" },
  { name: "tree", summary: "print a directory tree", completes: "dir" },
  { name: "cat", summary: "print a file", completes: "any" },
  { name: "head", summary: "print the first lines of a file", completes: "any" },
  { name: "tail", summary: "print the last lines of a file", completes: "any" },
  { name: "file", summary: "describe a path", completes: "any" },
  { name: "stat", summary: "show kind, size, and source path", completes: "any" },
  { name: "open", summary: "open an app, folder, or file", completes: "open" },
  { name: "echo", summary: "print text" },
  { name: "date", summary: "print the date and time" },
  { name: "whoami", summary: "print the current user" },
  { name: "uname", summary: "print system information" },
  { name: "history", summary: "show commands from this session" },
  { name: "clear", summary: "clear the screen" },
  { name: "about", summary: "meet Thar Htet Zan" },
  { name: "skills", summary: "explore the toolkit" },
  { name: "projects", summary: "portfolio projects" },
  { name: "contact", summary: "contact information" },
  { name: "jumpscare", summary: "let Gato pop out" },
  { name: "exit", summary: "close the terminal" },
];

const HELP = [
  "Playground shell. / is the playground folder, and you cannot leave it.",
  "",
  ...COMMANDS.map((command) => `  ${command.name.padEnd(12)} ${command.summary}`),
  "",
  "An app name on its own opens that app. open memoBook and memoBook do the same thing.",
  "Aliases: help, man, cls, close.",
  "Examples: ls -l, cd apps, find . -name \"*memo*\", open memoBook, cat apps/MemoBook.jsx",
].join("\n");

function indexTree() {
  const byPath = new Map();

  function add(item, parentPath) {
    const segment = item.id === "." ? "" : item.fileName || item.id.split("/").pop();
    const path = item.id === "." ? "/" : parentPath === "/" ? `/${segment}` : `${parentPath}/${segment}`;
    byPath.set(path, {
      path,
      name: segment || "/",
      title: item.name,
      kind: item.type === "folder" ? "dir" : item.type,
      item,
      size: item.type === "folder" ? item.children.length : item.source?.length || 0,
    });
    if (item.type === "folder") item.children.forEach((child) => add(child, path));
  }

  add(playgroundRoot, "/");
  return byPath;
}

function filesystem() {
  return indexTree();
}

function getNode(path) {
  const map = filesystem();
  if (map.has(path)) return map.get(path);
  const lower = path.toLowerCase();
  for (const [key, node] of map) {
    if (key.toLowerCase() === lower) return node;
  }
  return null;
}

function childrenOf(path) {
  const prefix = path === "/" ? "/" : `${path}/`;
  return [...filesystem().values()].filter((node) => {
    if (node.path === "/") return false;
    const parent = node.path.slice(0, node.path.lastIndexOf("/")) || "/";
    return parent === path && node.path.startsWith(prefix);
  });
}

export function resolvePath(cwd, input) {
  const raw = (input ?? "").trim();
  if (!raw || raw === "~") return { path: cwd, escaped: false };
  let text = raw;
  if (text === "~/") text = "/";
  else if (text.startsWith("~/")) text = `/${text.slice(2)}`;

  const parts = text.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
  let escaped = false;
  let climbed = false;
  for (const part of text.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      climbed = true;
      if (parts.length === 0) escaped = true;
      else parts.pop();
      continue;
    }
    climbed = false;
    parts.push(part);
  }

  return {
    path: parts.length ? `/${parts.join("/")}` : "/",
    escaped: escaped && climbed,
  };
}

function tokenize(line) {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match = pattern.exec(line);
  while (match) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
    match = pattern.exec(line);
  }
  return tokens;
}

function quote(value) {
  return /\s/.test(value) ? `"${value}"` : value;
}

function unique(values) {
  return [...new Set(values)];
}

function sortNodes(a, b) {
  if (a.kind !== b.kind) return a.kind === "dir" ? -1 : b.kind === "dir" ? 1 : 0;
  return a.name.localeCompare(b.name);
}

function mode(node) {
  return node.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
}

function formatEntry(node, long) {
  if (!long) return node.kind === "dir" ? `${node.name}/` : node.name;
  const size = String(node.size).padStart(7, " ");
  return `${mode(node)}  ${size}  ${node.name}`;
}

function listDirectory(node, { all = false, long = false } = {}) {
  const rows = [];
  if (all) {
    rows.push(formatEntry({ name: ".", kind: "dir", size: childrenOf(node.path).length }, long));
    const parent = node.path === "/" ? "/" : node.path.slice(0, node.path.lastIndexOf("/")) || "/";
    const parentNode = getNode(parent);
    rows.push(formatEntry({ name: "..", kind: "dir", size: parentNode?.size ?? 0 }, long));
  }
  childrenOf(node.path)
    .sort(sortNodes)
    .forEach((child) => rows.push(formatEntry(child, long)));
  return rows.join(long ? "\n" : "  ") || "";
}

function describe(node) {
  if (node.kind === "dir") return "directory";
  if (node.kind === "app") return `application: ${node.title}`;
  return "file";
}

function readLines(node, which, count = 10) {
  if (node.kind === "dir") return { error: `${which}: ${node.path}: Is a directory` };
  const lines = (node.item.source || "").split("\n");
  const slice = which === "head" ? lines.slice(0, count) : lines.slice(-count);
  return { output: slice.join("\n") };
}

function globToRegExp(pattern) {
  const body = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${body}$`, "i");
}

function matchesName(node, pattern) {
  if (!pattern) return true;
  const hasWildcard = /[*?]/.test(pattern);
  if (!hasWildcard) {
    const needle = pattern.toLowerCase();
    return node.name.toLowerCase().includes(needle) || node.title.toLowerCase().includes(needle);
  }
  const regex = globToRegExp(pattern);
  return regex.test(node.name) || regex.test(node.title);
}

function walk(node, acc = []) {
  childrenOf(node.path)
    .sort(sortNodes)
    .forEach((child) => {
      acc.push(child);
      if (child.kind === "dir") walk(child, acc);
    });
  return acc;
}

function treeLines(node, prefix = "") {
  const kids = childrenOf(node.path).sort(sortNodes);
  return kids.flatMap((kid, index) => {
    const last = index === kids.length - 1;
    const label = kid.kind === "dir" ? `${kid.name}/` : kid.name;
    const line = `${prefix}${last ? "└── " : "├── "}${label}`;
    if (kid.kind !== "dir") return [line];
    return [line, ...treeLines(kid, `${prefix}${last ? "    " : "│   "}`)];
  });
}

function launchables(extras) {
  const fromTree = [...filesystem().values()]
    .filter((node) => node.path !== "/")
    .map((node) => ({
      label: node.kind === "app" ? node.title : node.name,
      item: node.item,
      kind: node.kind,
      names: [node.title, node.name, node.path, node.path.replace(/^\//, "")],
    }));
  const builtin = extras.map((item) => ({
    label: item.name,
    item,
    kind: "app",
    names: [item.name],
  }));
  return [...builtin, ...fromTree];
}

function ambiguous(query, matches) {
  return [`open: ${query}: matches more than one item`, ...matches.map((match) => `  ${match.label}`)].join("\n");
}

function resolveLaunch(query, cwd, extras) {
  const text = query.trim();
  if (!text) return { error: "open: missing app name" };

  if (text.includes("/") || text.startsWith(".")) {
    const { path } = resolvePath(cwd, text);
    const node = getNode(path);
    if (!node) return { error: `open: ${text}: No such file or directory` };
    return { item: node.item, label: node.kind === "app" ? node.title : node.name };
  }

  const candidates = launchables(extras);
  const exact = candidates.filter((candidate) =>
    candidate.names.some((name) => name.toLowerCase() === text.toLowerCase())
  );
  if (exact.length === 1) return { item: exact[0].item, label: exact[0].label };
  if (exact.length > 1) return { error: ambiguous(text, exact) };

  const prefix = candidates.filter((candidate) =>
    candidate.names.some((name) => name.toLowerCase().startsWith(text.toLowerCase()))
  );
  const apps = prefix.filter((candidate) => candidate.kind !== "file");
  const matches = apps.length ? apps : prefix;
  if (matches.length === 1) return { item: matches[0].item, label: matches[0].label };
  if (matches.length > 1) return { error: ambiguous(text, matches) };
  return { error: `open: ${text}: No such app or file` };
}

function requireNode(cwd, raw, command) {
  const { path } = resolvePath(cwd, raw);
  const node = getNode(path);
  if (!node) return { error: `${command}: ${raw}: No such file or directory` };
  return { node };
}

function answerQuestion(value) {
  const query = value.toLowerCase().trim().replace(/[?!.,]+$/g, "");
  if (PORTFOLIO[query]) return PORTFOLIO[query];
  if (/\b(who|about|name|yourself)\b/.test(query)) return PORTFOLIO.about;
  if (/\b(skills?|stack|technolog\w*|tools?|frameworks?|built with)\b/.test(query)) return PORTFOLIO.skills;
  if (/\b(contact|email|hire|reach|socials?)\b/.test(query)) return PORTFOLIO.contact;
  if (/\b(projects?|work|build|portfolio)\b/.test(query)) return PORTFOLIO.projects;
  if (/^(hi|hey|hello)\b/.test(query)) return "Hello. This is the playground shell. Type /help to see every command.";
  return null;
}

function completePath(cwd, partial, dirsOnly) {
  const slash = partial.lastIndexOf("/");
  const dirPart = slash === -1 ? "" : partial.slice(0, slash + 1);
  const base = slash === -1 ? partial : partial.slice(slash + 1);
  const { path } = resolvePath(cwd, dirPart || ".");
  const dir = getNode(path);
  if (!dir || dir.kind !== "dir") return [];
  return childrenOf(dir.path)
    .filter((child) => !dirsOnly || child.kind === "dir")
    .filter((child) => child.name.toLowerCase().startsWith(base.toLowerCase()))
    .sort(sortNodes)
    .map((child) => `${dirPart}${child.name}${child.kind === "dir" ? "/" : ""}`);
}

function suggestOpen(cwd, partial, extras) {
  const paths = completePath(cwd, partial, false).map((path) => `open ${quote(path)}`);
  if (partial.includes("/") || partial.startsWith(".")) return paths.slice(0, 8);
  const needle = partial.toLowerCase();
  const pool = launchables(extras).filter((candidate) =>
    candidate.names.some((name) => name.toLowerCase().startsWith(needle))
  );
  const preferred = pool.some((candidate) => candidate.kind !== "file")
    ? pool.filter((candidate) => candidate.kind !== "file")
    : pool;
  const named = preferred.map((candidate) => `open ${quote(candidate.label)}`);
  return unique([...named, ...paths]).slice(0, 8);
}

export function suggest(input, cwd, extras = []) {
  const endsWithSpace = /\s$/.test(input);
  const parts = tokenize(input.trim());

  if (!parts.length) {
    return ["ls", "cd", "find", "tree", "open", "cat", "pwd", "/help"];
  }

  if (parts.length === 1 && !endsWithSpace) {
    const needle = parts[0].toLowerCase();
    const commands = COMMANDS.filter((command) => command.name.toLowerCase().startsWith(needle)).map(
      (command) => command.name
    );
    if (needle && "help".startsWith(needle)) commands.unshift("/help");
    const apps = launchables(extras)
      .filter((candidate) => candidate.kind === "app")
      .filter((candidate) => candidate.label.toLowerCase().startsWith(needle))
      .map((candidate) => quote(candidate.label));
    const list = unique([...commands, ...apps]);
    if (needle === "open") {
      return unique(["open", ...suggestOpen(cwd, "", extras)]).slice(0, 8);
    }
    return list.slice(0, 8);
  }

  const command = parts[0].toLowerCase() === "help" ? "/help" : parts[0].toLowerCase();
  const spec = COMMANDS.find((entry) => entry.name === command);
  if (!spec?.completes) return [];

  const partial = endsWithSpace ? "" : parts[parts.length - 1];
  const head = endsWithSpace ? input.trimEnd() : input.trimEnd().slice(0, input.trimEnd().length - partial.length).trimEnd();

  if (spec.completes === "open") return suggestOpen(cwd, partial, extras);

  const dirsOnly = spec.completes === "dir";
  return completePath(cwd, partial, dirsOnly)
    .slice(0, 8)
    .map((path) => `${head} ${quote(path)}`.trim());
}

export function execute(raw, cwd, { extras = [], history = [] } = {}) {
  const line = raw.trim();
  if (!line) return { cwd, output: "" };

  const tokens = tokenize(line);
  const name = tokens[0].toLowerCase();
  const args = tokens.slice(1);
  const command = name === "help" ? "/help" : name;

  if (command === "/help" || command === "man") return { cwd, output: HELP };
  if (command === "clear" || command === "cls") return { cwd, clear: true };
  if (command === "exit" || command === "close") return { cwd, exit: true };
  if (command === "pwd") return { cwd, output: cwd };
  if (command === "whoami") return { cwd, output: "guest" };
  if (command === "date") return { cwd, output: new Date().toString() };
  if (command === "uname") return { cwd, output: "SakutaOS 1.0 playground" };
  if (command === "echo") return { cwd, output: args.join(" ") };
  if (command === "history") {
    const output = history.map((entry, index) => `${String(index + 1).padStart(4, " ")}  ${entry}`).join("\n");
    return { cwd, output };
  }
  if (command === "jumpscare" || command === "gato") return { cwd, action: "jumpscare" };
  if (PORTFOLIO[command]) return { cwd, output: PORTFOLIO[command] };

  if (["mkdir", "rm", "rmdir", "touch", "mv", "cp"].includes(command)) {
    return { cwd, output: `${command}: read-only file system` };
  }

  if (command === "cd") {
    const target = args[0] ?? "/";
    const { path, escaped } = resolvePath(cwd, target);
    if (escaped && path === "/") return { cwd: "/", output: "cd: already at playground root" };
    const node = getNode(path);
    if (!node) return { cwd, output: `cd: ${target}: No such file or directory` };
    if (node.kind !== "dir") return { cwd, output: `cd: ${target}: Not a directory` };
    return { cwd: node.path, output: "" };
  }

  if (command === "ls") {
    const flags = new Set();
    const paths = [];
    args.forEach((arg) => {
      if (/^-[a-zA-Z]+$/.test(arg)) [...arg.slice(1)].forEach((flag) => flags.add(flag));
      else paths.push(arg);
    });
    const targets = paths.length ? paths : ["."];
    const blocks = targets.map((target) => {
      const found = requireNode(cwd, target, "ls");
      if (found.error) return found.error;
      if (found.node.kind !== "dir") return formatEntry(found.node, flags.has("l"));
      return listDirectory(found.node, { all: flags.has("a"), long: flags.has("l") });
    });
    return { cwd, output: blocks.join("\n\n") };
  }

  if (command === "tree") {
    const target = args.find((arg) => !arg.startsWith("-")) || ".";
    const found = requireNode(cwd, target, "tree");
    if (found.error) return { cwd, output: found.error };
    if (found.node.kind !== "dir") return { cwd, output: found.node.name };
    const body = treeLines(found.node).join("\n");
    return { cwd, output: body ? `${found.node.path}\n${body}` : found.node.path };
  }

  if (command === "find") {
    let start = ".";
    let pattern = "";
    const positionals = [];
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (arg === "-name" || arg === "-iname") {
        pattern = args[index + 1] ?? "";
        index += 1;
      } else if (!arg.startsWith("-")) positionals.push(arg);
    }
    if (positionals.length) {
      const maybe = getNode(resolvePath(cwd, positionals[0]).path);
      if (maybe) start = positionals[0];
      else if (!pattern) pattern = positionals[0];
    }
    const found = requireNode(cwd, start, "find");
    if (found.error) return { cwd, output: found.error };
    const listed = [found.node, ...walk(found.node)]
      .filter((node) => !pattern || matchesName(node, pattern))
      .map((node) => node.path);
    return { cwd, output: listed.join("\n") };
  }

  if (command === "cat" || command === "head" || command === "tail") {
    const target = args.filter((arg) => !/^-n?\d*$/.test(arg) && arg !== "-n").at(-1);
    if (!target) return { cwd, output: `${command}: missing file` };
    const found = requireNode(cwd, target, command);
    if (found.error) return { cwd, output: found.error };
    if (command === "cat") {
      if (found.node.kind === "dir") return { cwd, output: `cat: ${target}: Is a directory` };
      return { cwd, output: found.node.item.source || "" };
    }
    const countFlag = args.find((arg) => /^-\d+$/.test(arg));
    const count = Number(countFlag?.slice(1) || args[args.indexOf("-n") + 1] || 10);
    const result = readLines(found.node, command, Number.isFinite(count) ? count : 10);
    return { cwd, output: result.error || result.output };
  }

  if (command === "file" || command === "stat") {
    const target = args[0] || ".";
    const found = requireNode(cwd, target, command);
    if (found.error) return { cwd, output: found.error };
    if (command === "file") return { cwd, output: `${found.node.path}: ${describe(found.node)}` };
    return {
      cwd,
      output: [
        `  File: ${found.node.path}`,
        `  Name: ${found.node.kind === "app" ? found.node.title : found.node.name}`,
        `  Kind: ${describe(found.node)}`,
        `  Size: ${found.node.size}`,
        found.node.item.sourcePath ? `  Source: ${found.node.item.sourcePath}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (command === "open") {
    const opened = resolveLaunch(args.join(" "), cwd, extras);
    if (opened.error) return { cwd, output: opened.error };
    return { cwd, output: `opened ${opened.label}`, item: opened.item };
  }

  const opened = resolveLaunch(line, cwd, extras);
  if (opened.item && !opened.error) return { cwd, output: `opened ${opened.label}`, item: opened.item };
  if (opened.error && !opened.error.endsWith("No such app or file")) return { cwd, output: opened.error };

  const answer = answerQuestion(line);
  if (answer) return { cwd, output: answer };
  return { cwd, output: `${tokens[0]}: command not found. Type /help for the command list.` };
}
