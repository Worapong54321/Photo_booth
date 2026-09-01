const screens = document.querySelectorAll('.screen');
const video = document.querySelector('#cameraFeed');
const placeholder = document.querySelector('#cameraPlaceholder');
const countdown = document.querySelector('#countdown');
const status = document.querySelector('#shotStatus');
const startButton = document.querySelector('#startCapture');
const cameraTitle = document.querySelector('#cameraTitle');
const captureCanvas = document.querySelector('#captureCanvas');
const stripCanvas = document.querySelector('#photoStrip');
const flash = document.querySelector('#flash');
const filterPreview = document.querySelector('#filterPreview');
let stream, selectedTemplate, captures = [], selectedFilter = 'normal';

const templates = {
  ticket: { name: 'Movie Love', title: 'Movie Love', stars: '★ ★ ★ ★', bg: '#fff7e9', ink: '#8e403a', accent: '#315c90', footer: 'LIVEBOOTH', shots: 4 },
  picnic: { name: 'Sweet Picnic', title: 'sweet day', stars: '❀  ❀  ❀', bg: '#fff2bd', ink: '#a04f70', accent: '#ef9eb6', footer: 'LIVEBOOTH', shots: 4 },
  night: { name: 'Midnight Kiss', title: 'midnight', stars: '✦  ✦  ✦', bg: '#e9edff', ink: '#3b4c8c', accent: '#6077b4', footer: 'LIVEBOOTH', shots: 4 }
};
const filterCSS = { normal: 'none', vintage: 'sepia(.65) saturate(.8) contrast(.94)', mono: 'grayscale(1) contrast(1.12)', dreamy: 'brightness(1.08) saturate(.72) contrast(.92)' };

function showScreen(id) { screens.forEach(s => s.classList.toggle('active', s.id === id)); if (id !== 'camera') stopCamera(); }
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.go)));
document.querySelectorAll('[data-template]').forEach(button => button.addEventListener('click', async () => { selectedTemplate = templates[button.dataset.template]; captures = []; selectedFilter = 'normal'; cameraTitle.textContent = selectedTemplate.name; status.textContent = `${selectedTemplate.shots} shots in this template`; showScreen('camera'); await openCamera(); }));
document.querySelector('#changeTemplate').addEventListener('click', () => showScreen('templates'));
document.querySelector('#retake').addEventListener('click', async () => { captures = []; showScreen('camera'); await openCamera(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { selectedFilter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('selected', item === button)); filterPreview.style.filter = filterCSS[selectedFilter]; }));
document.querySelector('#finishFilter').addEventListener('click', async () => { await makeStrip(); showScreen('result'); });

async function openCamera() {
  startButton.disabled = true; placeholder.style.display = 'flex';
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false }); video.srcObject = stream; await video.play(); placeholder.style.display = 'none'; status.textContent = `${selectedTemplate.shots} shots · camera ready`; startButton.disabled = false; }
  catch { placeholder.innerHTML = '<span>!</span><p>WE COULDN’T OPEN YOUR CAMERA.<br>ALLOW CAMERA ACCESS AND TRY AGAIN.</p>'; status.textContent = 'Please allow camera access in your browser.'; startButton.disabled = false; }
}
function stopCamera() { if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; } }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function countDown() { for (let number = 5; number >= 1; number--) { countdown.textContent = number; countdown.classList.add('show'); await wait(850); countdown.classList.remove('show'); await wait(150); } }
function snap() { const w = video.videoWidth, h = video.videoHeight; captureCanvas.width = w; captureCanvas.height = h; const ctx = captureCanvas.getContext('2d'); ctx.translate(w, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, w, h); return captureCanvas.toDataURL('image/jpeg', .94); }
startButton.addEventListener('click', async () => { if (!stream) return openCamera(); startButton.disabled = true; captures = []; for (let index = 0; index < selectedTemplate.shots; index++) { status.textContent = `SHOT ${index + 1} OF ${selectedTemplate.shots} · GET READY!`; await countDown(); captures.push(snap()); flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 320); status.textContent = `SHOT ${index + 1} CAPTURED!`; await wait(650); } stopCamera(); filterPreview.src = captures[0]; filterPreview.style.filter = filterCSS.normal; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('selected', item.dataset.filter === 'normal')); showScreen('filters'); startButton.disabled = false; });

function drawCover(ctx, image, x, y, width, height) { const scale = Math.max(width / image.width, height / image.height); const drawW = image.width * scale, drawH = image.height * scale; ctx.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH); }
function applyCanvasFilter(ctx) { if (selectedFilter === 'vintage') ctx.filter = 'sepia(.65) saturate(.8) contrast(.94)'; if (selectedFilter === 'mono') ctx.filter = 'grayscale(1) contrast(1.12)'; if (selectedFilter === 'dreamy') ctx.filter = 'brightness(1.08) saturate(.72) contrast(.92)'; }
function loadImage(source) { return new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image); image.src = source; }); }
async function makeStrip() {
  const t = selectedTemplate, ctx = stripCanvas.getContext('2d'), W = 900, H = 2850, outer = 34, photoX = 76, photoW = 748, photoH = 435, startY = 450, gap = 34;
  ctx.filter = 'none'; ctx.fillStyle = t.accent; ctx.fillRect(0, 0, W, H); ctx.fillStyle = t.bg; ctx.fillRect(outer, 0, W - outer * 2, H); ctx.strokeStyle = t.ink; ctx.lineWidth = 7; ctx.strokeRect(outer + 10, 28, W - outer * 2 - 20, H - 56);
  ctx.textAlign = 'center'; ctx.fillStyle = t.ink; ctx.font = 'italic 700 82px Playfair Display, serif'; ctx.fillText(t.title, W / 2, 140); ctx.font = '500 31px DM Sans, sans-serif'; ctx.fillText(t.stars, W / 2, 194);
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(outer + 10, 223); ctx.lineTo(W - outer - 10, 223); ctx.moveTo(outer + 10, 362); ctx.lineTo(W - outer - 10, 362); ctx.stroke();
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()); const time = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  ctx.font = '600 22px DM Sans, sans-serif'; ctx.fillText(today, 245, 270); ctx.fillText('PASS', 536, 270); ctx.fillText('SET', 735, 270); ctx.font = '700 54px Playfair Display, serif'; ctx.fillText(time, 245, 337); ctx.fillText('01', 536, 337); ctx.fillText('04', 735, 337);
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(438, 223); ctx.lineTo(438, 362); ctx.moveTo(635, 223); ctx.lineTo(635, 362); ctx.stroke();
  const images = await Promise.all(captures.map(loadImage)); images.forEach((image, index) => { const y = startY + index * (photoH + gap); ctx.save(); ctx.beginPath(); ctx.rect(photoX, y, photoW, photoH); ctx.clip(); applyCanvasFilter(ctx); drawCover(ctx, image, photoX, y, photoW, photoH); ctx.restore(); ctx.strokeStyle = t.ink; ctx.lineWidth = 6; ctx.strokeRect(photoX, y, photoW, photoH); });
  ctx.fillStyle = t.ink; ctx.font = '500 19px DM Mono, monospace'; ctx.fillText('KEEP THIS LITTLE MEMORY CLOSE  ✦  LIVEBOOTH', W / 2, 2335); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(outer + 10, 2380); ctx.lineTo(W - outer - 10, 2380); ctx.stroke(); ctx.font = 'italic 700 108px Playfair Display, serif'; ctx.fillText('LiveBooth', W / 2, 2533); ctx.font = '500 28px DM Sans, sans-serif'; ctx.fillText('make it a memory', W / 2, 2583);
  document.querySelector('#downloadPhoto').href = stripCanvas.toDataURL('image/png');
}
