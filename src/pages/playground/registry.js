/**
 * Playground desktop registry.
 *
 * Drop a React component in this folder (or a subfolder) and it appears on the
 * desktop. Subfolders become Finder folders. Optional named export:
 *
 *   export const playgroundMeta = { title: "My Lab", width: 720, height: 520 }
 *
 * Stylesheets beside a component show up as files you can cat from the shell.
 */
const modules = import.meta.glob("./**/*.{jsx,tsx}", { eager: true });
const rawFiles = import.meta.glob("./**/*.{jsx,tsx,css}", {
  query: "?raw",
  import: "default",
  eager: true,
});

function toTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortItems(a, b) {
  if (a.type !== b.type) {
    if (a.type === "folder") return -1;
    if (b.type === "folder") return 1;
  }
  return a.name.localeCompare(b.name);
}

function ensureFolder(parent, name, id, fileName) {
  let folder = parent.children.find((child) => child.type === "folder" && child.id === id);
  if (!folder) {
    folder = { type: "folder", id, name, fileName, children: [] };
    parent.children.push(folder);
  }
  return folder;
}

function buildTree() {
  const root = { type: "folder", id: ".", name: "Playground", fileName: "", children: [] };
  const paths = new Set([...Object.keys(modules), ...Object.keys(rawFiles)]);

  for (const path of paths) {
    const mod = modules[path];
    const source = typeof rawFiles[path] === "string" ? rawFiles[path] : "";
    const parts = path.replace(/^\.\//, "").split("/");
    const meta = mod?.playgroundMeta ?? {};
    let node = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!isFile) {
        const id = `./${parts.slice(0, index + 1).join("/")}`;
        node = ensureFolder(node, toTitle(part), id, part);
        return;
      }

      const isApp = Boolean(mod?.default);
      node.children.push({
        type: isApp ? "app" : "file",
        id: path,
        name: isApp ? meta.title || toTitle(part) : part,
        fileName: part,
        component: isApp ? mod.default : undefined,
        width: isApp ? meta.width : 720,
        height: isApp ? meta.height : 520,
        sourcePath: `src/pages/playground/${path.replace(/^\.\//, "")}`,
        source,
      });
    });
  }

  const sortTree = (folder) => {
    folder.children.sort(sortItems);
    folder.children.forEach((child) => {
      if (child.type === "folder") sortTree(child);
    });
  };

  sortTree(root);
  return root;
}

export const playgroundRoot = buildTree();

export function findPlaygroundItem(id, node = playgroundRoot) {
  if (node.id === id) return node;
  if (node.type !== "folder") return null;
  for (const child of node.children) {
    const match = findPlaygroundItem(id, child);
    if (match) return match;
  }
  return null;
}

export function flattenPlaygroundItems(node = playgroundRoot, acc = []) {
  if (node.type === "folder") {
    node.children.forEach((child) => flattenPlaygroundItems(child, acc));
  } else if (node.type === "app") {
    acc.push(node);
  }
  return acc;
}
