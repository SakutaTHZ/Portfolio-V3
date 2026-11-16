import { lookup } from "node:dns/promises";

const MAX_BYTES = 2_500_000;
const MAX_REDIRECTS = 4;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const HOOK = `(function(){
  var real = document.querySelector('meta[name="bleed-url"]');
  function report(){
    try {
      parent.postMessage({ type: "bleed-nav", url: real && real.content, via: location.href, title: document.title || "" }, "*");
    } catch (err) {}
  }
  function absolute(href){
    try { return new URL(href, document.baseURI).href; } catch (err) { return ""; }
  }
  document.addEventListener("click", function(event){
    var node = event.target && event.target.closest && event.target.closest("a[href]");
    if (!node) return;
    var href = absolute(node.getAttribute("href"));
    if (!href || !/^https?:/i.test(href)) return;
    if (node.getAttribute("target") === "_blank") return;
    event.preventDefault();
    event.stopPropagation();
    location.assign("/api/bleed?url=" + encodeURIComponent(href));
  }, true);
  document.addEventListener("submit", function(event){
    var form = event.target;
    if (!form || String(form.tagName).toUpperCase() !== "FORM") return;
    var method = (form.getAttribute("method") || "get").toLowerCase();
    if (method !== "get") return;
    var action = absolute(form.getAttribute("action") || document.baseURI);
    if (!action || !/^https?:/i.test(action)) return;
    event.preventDefault();
    var url = new URL(action);
    new FormData(form).forEach(function(value, key){
      url.searchParams.append(key, String(value));
    });
    location.assign("/api/bleed?url=" + encodeURIComponent(url.href));
  }, true);
  report();
  document.addEventListener("DOMContentLoaded", report);
})();`;

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function bleedErrorPage(message) {
  const safe = String(message).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Bleed</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#f3f3f3;font:15px/1.5 Segoe UI,sans-serif"><p style="max-width:28rem;padding:24px">${safe}</p></body></html>`;
}

function isBlockedAddress(address) {
  const ip = String(address).toLowerCase().replace(/^::ffff:/, "");
  if (ip.includes(":")) {
    return ip === "::1" || ip === "::" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
  }
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

async function assertPublicHttpUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("That address is not a page Bleed can open.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Bleed only opens http and https pages.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("That address is not a public page.");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0"
  ) {
    throw new Error("That address stays on this machine.");
  }
  if (parsed.pathname === "/api/bleed") {
    throw new Error("That address loops back into Bleed.");
  }
  let records = [];
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error("Bleed could not find that site.");
  }
  if (!records.length || records.some((record) => isBlockedAddress(record.address))) {
    throw new Error("That address stays on this machine.");
  }
  return parsed;
}

async function readBody(response) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("That page is too large to pull into the window.");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return body;
}

function decodeHtml(buffer, contentType) {
  const match = /charset=([^;]+)/i.exec(contentType || "");
  const charset = match?.[1]?.trim().replace(/["']/g, "") || "utf-8";
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder().decode(buffer);
  }
}

function inject(html, pageUrl) {
  const safeUrl = escapeAttr(pageUrl);
  const head = `<base href="${safeUrl}"><meta name="bleed-url" content="${safeUrl}"><script>${HOOK}</script>`;
  const stripped = html
    .replace(/<meta[^>]+http-equiv=["']?(?:content-security-policy|refresh)["']?[^>]*>/gi, "")
    .replace(/<base\b[^>]*>/gi, "");
  if (/<head[^>]*>/i.test(stripped)) return stripped.replace(/<head[^>]*>/i, (tag) => `${tag}${head}`);
  return `<!doctype html><html><head>${head}</head><body>${stripped}</body></html>`;
}

export async function fetchBleedDocument(raw) {
  let current = String(raw || "").trim();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const target = await assertPublicHttpUrl(current);
    let response;
    try {
      response = await fetch(target, {
        redirect: "manual",
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en",
          "user-agent": USER_AGENT,
        },
      });
    } catch {
      try {
        response = await fetch(target, {
          redirect: "manual",
          headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "accept-language": "en",
            "user-agent": USER_AGENT,
          },
        });
      } catch (again) {
        const reason = again.cause?.code || again.cause?.message || again.message;
        throw new Error(reason && reason !== "fetch failed" ? `Bleed could not reach that site (${reason}).` : "Bleed could not reach that site.");
      }
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || hop === MAX_REDIRECTS) throw new Error("That page redirected too many times.");
      current = new URL(location, target).href;
      continue;
    }
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await readBody(response);
    const html = /text\/html|application\/xhtml\+xml/i.test(contentType);
    return {
      status: response.status,
      contentType: html ? "text/html; charset=utf-8" : contentType.split(";")[0],
      body: html ? inject(decodeHtml(buffer, contentType), target.href) : buffer,
    };
  }
  throw new Error("That page redirected too many times.");
}
