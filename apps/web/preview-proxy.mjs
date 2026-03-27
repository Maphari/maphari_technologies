// Minimal HTTP proxy: forwards all requests from port 55445 → 3000
// Used by Claude preview tools so they don't start a second Next.js instance.
import http from "http";

const TARGET_PORT = 3000;
const PROXY_PORT  = 55445;

const server = http.createServer((req, res) => {
  const options = {
    hostname: "localhost",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  };
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxy.on("error", () => {
    res.writeHead(503);
    res.end("Dev server not running on port 3000");
  });
  req.pipe(proxy, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`Preview proxy: http://localhost:${PROXY_PORT} → http://localhost:${TARGET_PORT}`);
});
