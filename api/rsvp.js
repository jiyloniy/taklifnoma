const { processRsvp } = require('../lib/rsvp.cjs');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Faqat POST so‘rovi qabul qilinadi' });
  }

  try {
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const entry = await processRsvp(payload);
    return response.status(201).json({ ok: true, messageId: entry.telegramMessageId });
  } catch (error) {
    console.error(`RSVP yuborilmadi: ${error.message}`);
    const status = error.message === 'Ism kiritilmagan' ? 400 : 502;
    return response.status(status).json({ ok: false, error: error.message });
  }
};
