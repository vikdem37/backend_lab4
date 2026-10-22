import fs from 'node:fs';
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

fs.stat(input, (err, stats) => {
  if (err || !stats.isFile()) {
    console.error('Cannot find input file');
    process.exit(1);
  }
  console.log(`Параметри прийнято: input=${input}, host=${host}, port=${port}, output=${output ?? '—'}`);
});