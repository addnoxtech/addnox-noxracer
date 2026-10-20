(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const W = 420, H = 640, lanes = [106, 210, 314], playerY = 516;
  const storageKey = 'addnox-neon-racer-best-v1';
  let best = 0;
  try { best = Math.max(0, Number(localStorage.getItem(storageKey)) || 0); } catch {}
  const state = { mode: 'ready', lane: 1, x: 210, elapsed: 0, distance: 0, coins: 0, score: 0, road: 0, timer: 0, objects: [], particles: [], velocity: 240 };
  let lastTime = 0, sound = false, audio, swipeX = null, swipeY = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('year').textContent = new Date().getFullYear();

  function tone(frequency, duration = .07, type = 'sine', volume = .04) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch {}
  }
  function syncHud() {
    $('score').textContent = String(state.score).padStart(5, '0');
    $('best').textContent = String(best).padStart(5, '0');
    $('record').textContent = best.toLocaleString();
    $('coins').textContent = '◈ ' + state.coins;
    $('speed').textContent = state.mode === 'ready' ? 0 : Math.round(state.velocity / 2);
    $('distance').textContent = Math.floor(state.distance);
  }
  function showOverlay(label, title, copy, button, badge) {
    $('overlay-label').textContent = label;
    $('overlay-title').textContent = title;
    $('overlay-copy').textContent = copy;
    $('play').replaceChildren(document.createTextNode(button + ' '));
    const arrow = document.createElement('span'); arrow.textContent = '↗'; $('play').appendChild(arrow);
    $('badge').textContent = badge;
    $('overlay').hidden = false;
    $('overlay-hint').textContent = state.mode === 'paused' ? 'P / ESC TO RESUME' : 'ARROW KEYS / A & D / TOUCH CONTROLS';
  }
  function start() {
    Object.assign(state, { mode: 'playing', lane: 1, x: 210, elapsed: 0, distance: 0, coins: 0, score: 0, road: 0, timer: .7, objects: [], particles: [], velocity: 240 });
    $('overlay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pause game');
    lastTime = performance.now(); tone(440); syncHud();
    $('announcement').textContent = 'Run started. Use left and right to steer.';
  }
  function move(direction) {
    if (state.mode !== 'playing') return;
    state.lane = Math.max(0, Math.min(2, state.lane + direction)); tone(180, .025, 'triangle', .018);
  }
  function pause() {
    if (state.mode !== 'playing' && state.mode !== 'paused') return;
    if (state.mode === 'playing') {
      state.mode = 'paused'; $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', 'Resume game');
      showOverlay('TAKE A BREATHER', 'Parked for a moment.', 'Your run is waiting right here.', 'BACK TO THE ROAD', 'Ⅱ');
    } else {
      state.mode = 'playing'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pause game'); lastTime = performance.now();
    }
  }
  function burst(x, y, color, count) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) state.particles.push({ x, y, vx: (Math.random() - .5) * 180, vy: (Math.random() - .5) * 180, life: .6, color });
  }
  function end() {
    state.mode = 'over'; const newBest = state.score > best;
    best = Math.max(best, state.score);
    try { localStorage.setItem(storageKey, String(best)); } catch {}
    burst(state.x, playerY, '#63f5d2', 28); tone(65, .3, 'sawtooth', .07);
    $('pause').disabled = true; syncHud();
    showOverlay(newBest ? 'A NEW PERSONAL BEST' : 'THE NIGHT ISN’T OVER', newBest ? 'That’s a new record.' : 'One more run?', `Score ${state.score.toLocaleString()}  ·  ${Math.floor(state.distance)} m  ·  ${state.coins} coins`, 'RACE AGAIN', newBest ? '★' : '↻');
    $('announcement').textContent = `Run finished. Score ${state.score}. ${newBest ? 'New personal best!' : ''}`;
  }
  function spawn() {
    const order = [0, 1, 2];
    for (let i = 2; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const count = state.elapsed > 12 && Math.random() < .5 ? 2 : 1;
    const colors = ['#ed789f', '#ae95f7', '#ffb56f'];
    for (let i = 0; i < count; i++) state.objects.push({ kind: 'car', lane: order[i], x: lanes[order[i]], y: -90, color: colors[Math.floor(Math.random() * colors.length)] });
    if (Math.random() < .8) state.objects.push({ kind: 'coin', lane: order[2], x: lanes[order[2]], y: -90 });
  }
  function update(dt) {
    state.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    state.particles = state.particles.filter(p => p.life > 0);
    if (state.mode !== 'playing') return;
    state.elapsed += dt; state.velocity = Math.min(440, 240 + state.elapsed * 3.5);
    state.distance += state.velocity * dt * .1; state.road += state.velocity * dt;
    state.x += (lanes[state.lane] - state.x) * Math.min(1, dt * 19);
    state.timer -= dt;
    if (state.timer <= 0) { spawn(); state.timer = Math.max(.88, 1.38 - state.elapsed * .004); }
    for (const item of state.objects) {
      item.y += state.velocity * dt;
      if (item.collected) continue;
      const dx = Math.abs(item.x - state.x), dy = Math.abs(item.y - playerY);
      if (item.kind === 'coin' && dx < 34 && dy < 46) { item.collected = true; state.coins++; burst(item.x, item.y, '#ffd278', 9); tone(880, .09); }
      if (item.kind === 'car' && dx < 39 && dy < 64) { state.score = Math.floor(state.distance) + state.coins * 100; end(); return; }
    }
    state.objects = state.objects.filter(item => item.y < H + 110 && !item.collected);
    state.score = Math.floor(state.distance) + state.coins * 100;
    syncHud();
  }
  function rounded(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
  function car(x, y, color, player = false) {
    ctx.save(); ctx.translate(x, y);
    if (!reducedMotion) { ctx.shadowColor = color; ctx.shadowBlur = player ? 22 : 9; }
    rounded(-24, -39, 48, 78, [12, 12, 7, 7], color); ctx.shadowBlur = 0;
    rounded(-26, -24, 5, 17, 2, '#050a11'); rounded(21, -24, 5, 17, 2, '#050a11');
    rounded(-26, 15, 5, 17, 2, '#050a11'); rounded(21, 15, 5, 17, 2, '#050a11');
    rounded(-18, -14, 36, 36, 5, '#10202f'); rounded(-16, -13, 32, 12, 3, '#a0d7e063');
    rounded(-15, 26, 30, 7, 2, '#112536aa');
    rounded(-19, -34, 12, 4, 1, '#edfff8'); rounded(7, -34, 12, 4, 1, '#edfff8');
    rounded(-19, 34, 12, 3, 1, '#ff436a'); rounded(7, 34, 12, 3, 1, '#ff436a');
    ctx.fillStyle = '#ffffff44'; ctx.fillRect(-2, -35, 4, 15);
    if (player && state.mode === 'playing' && !reducedMotion) {
      const flame = 6 + Math.random() * 16; const glow = ctx.createLinearGradient(0, 40, 0, 40 + flame);
      glow.addColorStop(0, '#63f5d299'); glow.addColorStop(1, '#63f5d200'); ctx.fillStyle = glow; ctx.fillRect(-15, 40, 30, flame);
    }
    ctx.restore();
  }
  function draw() {
    ctx.fillStyle = '#0a1020'; ctx.fillRect(0, 0, W, H);
    // City blocks slide past outside the elevated three-lane expressway.
    const offset = state.road * .6;
    for (let i = 0; i < 12; i++) {
      const y = ((i * 85 + offset) % 900) - 130;
      for (const x of [4, 376]) {
        rounded(x, y, 40, 63, 2, '#151f32');
        for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
          ctx.fillStyle = (i + col + row) % 3 ? '#38536b55' : '#63f5d244'; ctx.fillRect(x + 7 + col * 10, y + 9 + row * 12, 4, 5);
        }
      }
    }
    ctx.fillStyle = '#141d2e'; ctx.fillRect(54, 0, 312, H);
    ctx.strokeStyle = '#243348'; ctx.lineWidth = 1;
    for (let y = (state.road % 80); y < H; y += 80) { ctx.beginPath(); ctx.moveTo(55, y); ctx.lineTo(365, y); ctx.stroke(); }
    ctx.fillStyle = '#63f5d2'; ctx.shadowColor = '#63f5d2'; ctx.shadowBlur = reducedMotion ? 0 : 10;
    ctx.fillRect(52, 0, 2, H); ctx.fillRect(366, 0, 2, H); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#a1b4d136'; ctx.lineWidth = 3; ctx.setLineDash([28, 31]); ctx.lineDashOffset = -state.road;
    for (const x of [158, 262]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } ctx.setLineDash([]);
    for (let i = 0; i < 12; i++) { const y = (i * 75 + state.road) % 900 - 100; ctx.fillStyle = '#ed6da54d'; ctx.fillRect(43, y, 4, 22); ctx.fillRect(373, y, 4, 22); }
    for (const item of state.objects) {
      if (item.kind === 'car') car(item.x, item.y, item.color);
      else if (!item.collected) {
        ctx.save(); ctx.shadowColor = '#ffd278'; ctx.shadowBlur = reducedMotion ? 0 : 14; ctx.fillStyle = '#ffd278';
        ctx.beginPath(); ctx.arc(item.x, item.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#9b6825'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(item.x, item.y, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#9b6825'; ctx.fillRect(item.x - 1, item.y - 4, 2, 8); ctx.restore();
      }
    }
    car(state.x, playerY, '#63f5d2', true);
    for (const p of state.particles) { ctx.globalAlpha = p.life / .6; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); } ctx.globalAlpha = 1;
    const shade = ctx.createLinearGradient(0, 0, 0, 125); shade.addColorStop(0, '#07101aeb'); shade.addColorStop(1, '#07101a00'); ctx.fillStyle = shade; ctx.fillRect(0, 0, W, 125);
  }
  function frame(timestamp) {
    const dt = Math.min(Math.max((timestamp - lastTime) / 1000, 0), .04); lastTime = timestamp;
    update(dt); draw(); requestAnimationFrame(frame);
  }
  $('play').addEventListener('click', () => state.mode === 'paused' ? pause() : start());
  $('left').addEventListener('pointerdown', event => { event.preventDefault(); move(-1); });
  $('right').addEventListener('pointerdown', event => { event.preventDefault(); move(1); });
  // Keyboard activation keeps the on-screen controls accessible without double-firing taps.
  $('left').addEventListener('click', event => { if (event.detail === 0) move(-1); });
  $('right').addEventListener('click', event => { if (event.detail === 0) move(1); });
  $('pause').addEventListener('click', pause);
  $('sound').addEventListener('click', () => { sound = !sound; $('sound').textContent = sound ? 'SOUND ON' : 'SOUND OFF'; $('sound').setAttribute('aria-label', sound ? 'Disable sound' : 'Enable sound'); $('sound').setAttribute('aria-pressed', String(sound)); tone(540); });
  document.addEventListener('keydown', event => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'a', 'd', 'p', 'escape', ' '].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'a') move(-1);
    if (key === 'arrowright' || key === 'd') move(1);
    if (key === 'p' || key === 'escape') pause();
    if (key === ' ') state.mode === 'playing' || state.mode === 'paused' ? pause() : start();
  });
  canvas.addEventListener('pointerdown', event => { swipeX = event.clientX; swipeY = event.clientY; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointerup', event => {
    if (swipeX === null) return;
    const deltaX = event.clientX - swipeX, deltaY = event.clientY - swipeY;
    if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? 1 : -1);
    else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) { const rect = canvas.getBoundingClientRect(); move(event.clientX < rect.left + rect.width / 2 ? -1 : 1); }
    swipeX = null; swipeY = null;
  });
  canvas.addEventListener('pointercancel', () => { swipeX = null; swipeY = null; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.mode === 'playing') pause(); });
  window.addEventListener('blur', () => { if (state.mode === 'playing') pause(); });
  syncHud(); draw(); requestAnimationFrame(frame);
})();
