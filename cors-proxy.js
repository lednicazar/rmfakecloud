const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = 8899;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const targetUrl = req.headers["x-target-url"];
  if (!targetUrl) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing x-target-url header" }));
    return;
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid target URL" }));
    return;
  }

  const isHttps = parsed.protocol === "https:";
  const transport = isHttps ? https : http;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "x-target-url" || lower === "origin" || lower === "referer") continue;
    headers[key] = value;
  }

  const bodyChunks = [];
  req.on("data", (chunk) => bodyChunks.push(chunk));
  req.on("end", () => {
    const body = bodyChunks.length ? Buffer.concat(bodyChunks) : null;

    const proxyReq = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: req.method,
        headers,
        rejectUnauthorized: false,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("CORS proxy running on http://0.0.0.0:" + PORT);
});
