/**
 * Playground desktop registry.
 *
 * Drop a React component in this folder (or a subfolder) and it appears on the
 * desktop. Subfolders become Finder folders. Optional named export:
 *
 *   export const playgroundMeta = { title: "My Lab", width: 720, height: 520 }
 */
const modules = import.meta.glob("./**/*.{jsx,tsx}", { eager: true });

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
  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function ensureFolder(parent, name, id) {
  let folder = parent.children.find((child) => child.type === "folder" && child.id === id);
  if (!folder) {
    folder = { type: "folder", id, name, children: [] };
    parent.children.push(folder);
  }
  return folder;
}

function buildTree() {
  const root = { type: "folder", id: ".", name: "Playground", children: [] };

  for (const [path, mod] of Object.entries(modules)) {
    if (!mod?.default) continue;

    const parts = path.replace(/^\.\//, "").split("/");
    const meta = mod.playgroundMeta ?? {};
    let node = root;
    let acc = ".";

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      acc += `/${part}`;

      if (isFile) {
        node.children.push({
          type: "app",
          id: path,
          name: meta.title || toTitle(part),
          component: mod.default,
          width: meta.width,
          height: meta.height,
          sourcePath: `src/pages/playground/${path.replace(/^\.\//, "")}`,
        });
        return;
      }

      node = ensureFolder(node, toTitle(part), acc);
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
  } else {
    acc.push(node);
  }
  return acc;
}
