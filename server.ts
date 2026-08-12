import { createServer } from 'node:http';
import rsvpModule from './lib/rsvp.cjs';

const { processRsvp } = rsvpModule;

const server = createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/api/rsvp') {
    response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: false, error: 'Sahifa topilmadi' }));
    return;
  }

  let body = '';
  request.on('data', chunk => {
    body += chunk;
    if (body.length > 16_384) request.destroy();
  });
  request.on('end', async () => {
    try {
      const entry = await processRsvp(JSON.parse(body));
      response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: true, messageId: entry.telegramMessageId }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xabar yuborilmadi';
      console.error(`RSVP yuborilmadi: ${message}`);
      response.writeHead(message === 'Ism kiritilmagan' ? 400 : 502, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: false, error: message }));
    }
  });
});

server.listen(process.env.PORT ?? 3000);
