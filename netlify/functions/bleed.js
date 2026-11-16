import { bleedErrorPage, fetchBleedDocument } from "./_shared/bleed-proxy.js";

export default async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const target = new URL(req.url).searchParams.get("url");
  try {
    const result = await fetchBleedDocument(target);
    return new Response(req.method === "HEAD" ? null : result.body, {
      status: result.status,
      headers: {
        "content-type": result.contentType,
        "cache-control": "no-store",
        "content-security-policy": "frame-ancestors 'self'",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
      },
    });
  } catch (error) {
    return new Response(bleedErrorPage(error.message || "Bleed could not open that page."), {
      status: 400,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy": "frame-ancestors 'self'",
      },
    });
  }
};

export const config = {
  method: ["GET", "HEAD"],
};
