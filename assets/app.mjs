import { advanceParticle, bindCopyButton, motionEnabled, particleCount } from './interactions.mjs';

document.querySelector('#year').textContent = String(new Date().getFullYear());
bindCopyButton(document.querySelector('#copy-email'), document.querySelector('#copy-feedback'), navigator.clipboard);

const menu = document.querySelector('.mobile-menu');
menu?.addEventListener('click', (event) => { if (event.target.closest('a')) menu.open = false; });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
});

const canvas = document.querySelector('#constellation');
const context = canvas?.getContext('2d');
const toggle = document.querySelector('#motion-toggle');
const label = document.querySelector('#motion-label');
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
let visible = !document.hidden;
let frame = 0;
let previousTime = 0;
let width = 0;
let height = 0;
let particles = [];

function resize() {
  if (!context) return;
  const box = canvas.getBoundingClientRect();
  width = Math.max(1, box.width); height = Math.max(1, box.height);
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  particles = Array.from({ length: particleCount(width) }, () => ({
    x: Math.random() * width, y: Math.random() * height,
    vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15,
    size: Math.random() * 1.2 + .5,
  }));
  draw(0, false);
}

function draw(time, animate = true) {
  if (!context) return;
  const elapsed = previousTime ? (time - previousTime) / 16.67 : 1;
  previousTime = time;
  context.clearRect(0, 0, width, height);
  if (animate) particles = particles.map((particle) => advanceParticle(particle, width, height, elapsed));
  particles.forEach((particle, index) => {
    context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = '#b4a4e569'; context.fill();
    for (const other of particles.slice(index + 1)) {
      const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
      if (distance < 90) {
        context.beginPath(); context.moveTo(particle.x, particle.y); context.lineTo(other.x, other.y);
        context.strokeStyle = `rgba(153, 143, 196, ${.13 * (1 - distance / 90)})`;
        context.lineWidth = .6; context.stroke();
      }
    }
  });
  if (animate) frame = requestAnimationFrame(draw);
}

function syncMotion() {
  cancelAnimationFrame(frame); previousTime = 0;
  const enabled = motionEnabled({ reducedMotion: preference.matches, paused, visible });
  document.body.classList.toggle('motion-paused', !enabled);
  document.body.classList.toggle('motion-enabled', enabled);
  if (toggle) {
    toggle.hidden = !context || preference.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? '开启背景动画' : '暂停背景动画';
  }
  if (context) { if (enabled) frame = requestAnimationFrame(draw); else draw(0, false); }
}

if (context) {
  resize(); syncMotion();
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
  preference.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; syncMotion(); });
}
