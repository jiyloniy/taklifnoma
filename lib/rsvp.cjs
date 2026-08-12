function normalizeRsvp(payload = {}) {
  const entry = {
    name: String(payload.name || '').trim().slice(0, 120),
    phone: String(payload.phone || '').trim().slice(0, 40),
    attendance: payload.attendance === 'no' ? 'no' : 'yes',
    createdAt: new Date().toISOString(),
  };
  if (!entry.name) throw new Error('Ism kiritilmagan');
  return entry;
}

async function sendTelegramRsvp(entry) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram sozlamalari kiritilmagan');

  const status = entry.attendance === 'yes' ? '✅ Kelaman' : '❌ Kelolmayman';
  const sentAt = new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    dateStyle: 'long',
    timeStyle: 'medium',
  }).format(new Date(entry.createdAt));
  const message = [
    '💌 Yangi taklifnoma javobi',
    '',
    `👤 Ism: ${entry.name}`,
    `📞 Telefon: ${entry.phone || 'Kiritilmagan'}`,
    `💬 Javob: ${status}`,
    `🕒 Vaqt: ${sentAt}`,
    '',
    'Sunnatulla & Tursinoy · 31 Avgust, 2026',
  ].join('\n');

  const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
    signal: AbortSignal.timeout(12_000),
  });
  const telegramResult = await telegramResponse.json();
  if (!telegramResponse.ok || !telegramResult.ok) {
    throw new Error(telegramResult.description || 'Telegram xabarni qabul qilmadi');
  }
  return telegramResult.result.message_id;
}

async function processRsvp(payload) {
  const entry = normalizeRsvp(payload);
  entry.telegramMessageId = await sendTelegramRsvp(entry);
  return entry;
}

module.exports = { normalizeRsvp, sendTelegramRsvp, processRsvp };
