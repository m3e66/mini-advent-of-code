// Dependency-free local preview. Production is served statically by GitHub Pages.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.PORT || 4173);
const publicFiles = new Set(['index.html', 'style.css', 'app.js', 'puzzles.js', 'progress.js', 'puzzle-runner.js', 'icon.png']);
for (const name of fs.readdirSync(path.join(__dirname, 'days'))) {
  if (name.endsWith('.html')) publicFiles.add(`days/${name}`);
}
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png'
};
http.createServer((request, response) => {
  let filename;
  try {
    filename = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html';
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  if (!publicFiles.has(filename)) {
    response.writeHead(404).end('Not found');
    return;
  }
  fs.readFile(path.join(__dirname, filename), (error, body) => {
    response.writeHead(error ? 404 : 200, {
      'Content-Type': mimeTypes[path.extname(filename)],
      'Cache-Control': 'no-store'
    });
    response.end(error ? 'Not found' : body);
  });
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
