const gate = document.querySelector('#gate');
const openButton = document.querySelector('#openButton');
const audio = document.querySelector('#recitation');
const musicButton = document.querySelector('#musicButton');
const stars = document.querySelector('#stars');
const openingSparks = document.querySelector('#openingSparks');
const verse = document.querySelector('.sm-verse-ar');
const verseBar = document.querySelector('.sm-verse-bar span');
const invitation = document.querySelector('#invitation');
let isOpening = false;

for (let index = 0; index < 48; index += 1) {
  const star = document.createElement('span');
  star.className = 'sm-star';
  const size = index % 5 === 0 ? 2.6 : index % 3 === 0 ? 1 : 1.7;
  star.style.cssText = `top:${(index * 37 + 11) % 100}%;left:${(index * 61 + 7) % 100}%;width:${size}px;height:${size}px;animation-delay:${(index * .27) % 4}s;animation-duration:${2 + (index % 5) * .7}s`;
  stars.prepend(star);
}

function setMusicState(playing) {
  musicButton.classList.toggle('on', playing);
  musicButton.setAttribute('aria-pressed', String(playing));
  musicButton.setAttribute('aria-label', playing ? 'Tilovatni o‘chirish' : 'Tilovatni yoqish');
  musicButton.textContent = playing ? '♪' : '♫';
}

async function playAudio() {
  try {
    await audio.play();
    setMusicState(true);
  } catch {
    setMusicState(false);
  }
}

function openInvitation() {
  if (isOpening || gate.classList.contains('is-open')) return;
  isOpening = true;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  openButton.disabled = true;
  gate.classList.add('is-opening');
  playAudio();
  openingSparks.replaceChildren();
  for (let index = 0; index < 26; index += 1) {
    const spark = document.createElement('span');
    const angle = (Math.PI * 2 * index) / 26 + (index % 3) * .08;
    const distance = 95 + (index % 6) * 24;
    spark.className = 'sm-opening-spark';
    spark.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--delay', `${(index % 5) * .025}s`);
    openingSparks.append(spark);
  }
  setTimeout(() => {
    gate.classList.add('is-open');
    invitation.classList.add('invitation-opened');
    document.querySelector('.sm-hero').classList.add('visible');
    document.body.style.overflow = '';
  }, 620);
  setTimeout(() => {
    gate.setAttribute('aria-hidden', 'true');
    gate.classList.remove('is-opening');
    openingSparks.replaceChildren();
  }, 1700);
}

openButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openInvitation();
});
gate.addEventListener('click', openInvitation);

musicButton.addEventListener('click', () => {
  if (audio.paused) playAudio();
  else {
    audio.pause();
    setMusicState(false);
  }
});
audio.addEventListener('pause', () => setMusicState(false));
audio.addEventListener('play', () => setMusicState(true));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: .12, rootMargin: '0px 0px -25px' });
document.querySelectorAll('.sm-rev').forEach((element) => observer.observe(element));

function updateVerseProgress() {
  const rect = verse.getBoundingClientRect();
  const start = window.innerHeight * .9;
  const end = window.innerHeight * .25;
  const progress = Math.max(0, Math.min(100, ((start - rect.top) / (start - end)) * 100));
  verse.style.setProperty('--p', `${progress}%`);
  verseBar.style.width = `${progress}%`;
}
window.addEventListener('scroll', updateVerseProgress, { passive: true });
updateVerseProgress();

const optionButtons = [...document.querySelectorAll('.rsvp-opts button')];
let attendance = 'yes';
optionButtons.forEach((button) => button.addEventListener('click', () => {
  attendance = button.dataset.answer;
  optionButtons.forEach((item) => item.classList.toggle('on', item === button));
}));

document.querySelector('#rsvpForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = String(data.get('rname') || '').trim();
  const phone = String(data.get('rphone') || '').trim();
  const submitButton = event.currentTarget.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Yuborilmoqda…';
  const thanks = document.querySelector('#rsvpThanks');
  thanks.hidden = true;
  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, attendance }),
    });
    if (!response.ok) throw new Error('Telegramga yuborilmadi');
  } catch (error) {
    thanks.textContent = 'Xabar yuborilmadi. Internetni tekshirib, qayta urinib ko‘ring.';
    thanks.classList.add('is-error');
    thanks.hidden = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Tasdiqlash ✦';
    return;
  }
  thanks.classList.remove('is-error');
  thanks.textContent = attendance === 'yes'
    ? `Rahmat, ${name}! Sizni intiqlik bilan kutamiz. ✦`
    : `Rahmat, ${name}. Javobingiz qabul qilindi.`;
  thanks.hidden = false;
  event.currentTarget.hidden = true;
});

document.body.style.overflow = 'hidden';
