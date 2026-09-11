export const EMAIL = '26210680098@m.fdu.edu.cn';

export function particleCount(width) {
  return width < 760 ? 20 : 44;
}

export function advanceParticle(particle, width, height, elapsed = 1) {
  const step = Math.max(0, Math.min(2, elapsed));
  return { ...particle, x: ((particle.x + particle.vx * step) % width + width) % width,
    y: ((particle.y + particle.vy * step) % height + height) % height };
}

export function motionEnabled({ reducedMotion, paused, visible }) {
  return !reducedMotion && !paused && visible;
}

export async function copyEmail(clipboard) {
  if (!clipboard?.writeText) return { ok: false, message: `请手动复制邮箱：${EMAIL}` };
  try {
    await clipboard.writeText(EMAIL);
    return { ok: true, message: `邮箱已复制：${EMAIL}` };
  } catch {
    return { ok: false, message: `复制未成功，请手动复制：${EMAIL}` };
  }
}

export function bindCopyButton(button, feedback, clipboard) {
  if (!button || !feedback) return () => {};
  button.hidden = false;
  let busy = false;
  const listener = async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    try { feedback.textContent = (await copyEmail(clipboard)).message; }
    finally { button.disabled = false; busy = false; }
  };
  button.addEventListener('click', listener);
  return () => button.removeEventListener('click', listener);
}
