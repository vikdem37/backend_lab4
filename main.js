import fs from 'node:fs';
import http from 'node:http';
import { Command, InvalidArgumentError } from 'commander';

function parsePort(value) {
  const port = Number(value);
  if (!/^\d+$/.test(value) || port < 1 || port > 65535) {
    throw new InvalidArgumentError('порт має бути цілим числом від 1 до 65535');
  }
  return port;
}

const program = new Command();

program
  .name('titanic-server')
  .description('HTTP-сервер, що повертає дані пасажирів «Титаніка» у форматі JSON')
  .helpOption('--help', 'показати довідку')
  .requiredOption('-i, --input <path>', 'шлях до файлу даних')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера', parsePort)
  .option('-o, --output <path>', 'файл, у який записується остання надіслана відповідь')
  .parse();

const { input, host, port, output } = program.opts();

function reply(req, res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
    console.log(`${req.method} ${req.url} → ${status}`);
  }
  
  function sendJson(req, res, status, payload) {
    reply(req, res, status, JSON.stringify(payload, null, 2));
  }
  
  function sendError(req, res, status, message) {
    sendJson(req, res, status, { error: message });
  }
  
  function parseNdjson(text) {
    const records = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        return { error: `рядок ${i + 1} не є коректним JSON` };
      }
      if (record === null || typeof record !== 'object' || Array.isArray(record)) {
        return { error: `рядок ${i + 1} не є JSON-об'єктом` };
      }
      records.push(record);
    }
    return { records };
  }
  
  function toPassenger(record) {
    return { name: record.Name ?? null, ticket: record.Ticket ?? null };
  }
  
  function handleRequest(req, res) {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      sendError(req, res, 400, 'Некоректний URL запиту');
      return;
    }
  
    if (url.pathname !== '/') {
      sendError(req, res, 404, `Маршрут ${url.pathname} не існує`);
      return;
    }
  
    fs.readFile(input, 'utf8', (err, text) => {
      if (err) {
        const message = err.code === 'ENOENT' ? 'Файл даних не знайдено' : 'Не вдалося прочитати файл даних';
        sendError(req, res, 500, message);
        return;
      }
      const parsed = parseNdjson(text);
      if (parsed.error) {
        sendError(req, res, 500, `Файл даних пошкоджений: ${parsed.error}`);
        return;
      }
      const passengers = parsed.records.map((record) => toPassenger(record));
      sendJson(req, res, 200, passengers);
    });
  }
  
  function startServer() {
    const server = http.createServer(handleRequest);
    server.on('error', (err) => {
      console.error(`Не вдалося запустити сервер на ${host}:${port}: ${err.message}`);
      process.exit(1);
    });
    server.listen(port, host, () => {
      console.log(`Сервер працює: http://${host}:${port}/`);
    });
  }

fs.stat(input, (err, stats) => {
  if (err || !stats.isFile()) {
    console.error('Cannot find input file');
    process.exit(1);
  }
  startServer();
});