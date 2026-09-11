import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { EMAIL, copyEmail, bindCopyButton, motionEnabled, advanceParticle, particleCount } from '../assets/interactions.mjs';

test('copies the new contact address and announces success', async () => {
  const writes = [];
  const result = await copyEmail({ writeText: async (text) => writes.push(text) });
  assert.equal(EMAIL, '26210680098@m.fdu.edu.cn');
  assert.deepEqual(writes, [EMAIL]);
  assert.equal(result.ok, true);
  assert.match(result.message, /邮箱已复制/);
  assert.ok(result.message.includes(EMAIL));
});

test('unavailable or denied clipboard leaves a usable manual fallback', async () => {
  for (const clipboard of [undefined, {}, { writeText: async () => { throw new Error('denied'); } }]) {
    const result = await copyEmail(clipboard);
    assert.equal(result.ok, false);
    assert.ok(result.message.includes(EMAIL));
    assert.match(result.message, /手动复制/);
  }
});

test('copy button blocks duplicate requests, restores itself, and cleans up', async () => {
  const button = Object.assign(new EventTarget(), { hidden: true, disabled: false });
  const feedback = { textContent: '' };
  let calls = 0;
  let finish;
  const cleanup = bindCopyButton(button, feedback, { writeText: () => {
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  } });
  assert.equal(button.hidden, false);
  button.dispatchEvent(new Event('click'));
  button.dispatchEvent(new Event('click'));
  assert.equal(calls, 1);
  assert.equal(button.disabled, true);
  finish();
  await setImmediate();
  assert.equal(button.disabled, false);
  assert.ok(feedback.textContent.includes(EMAIL));
  cleanup();
  button.dispatchEvent(new Event('click'));
  assert.equal(calls, 1);
});

test('copy button recovers after a permission error', async () => {
  const button = new EventTarget();
  const feedback = { textContent: '' };
  const cleanup = bindCopyButton(button, feedback, { writeText: async () => { throw new Error('denied'); } });
  button.dispatchEvent(new Event('click'));
  await setImmediate();
  assert.equal(button.disabled, false);
  assert.match(feedback.textContent, /手动复制/);
  cleanup();
  assert.doesNotThrow(() => bindCopyButton(null, null)());
});

test('motion honors reduced-motion, pause, and background-tab preferences', () => {
  for (const reducedMotion of [false, true]) for (const paused of [false, true]) for (const visible of [false, true]) {
    assert.equal(motionEnabled({ reducedMotion, paused, visible }), visible && !paused && !reducedMotion);
  }
});

test('particles wrap at boundaries without mutating their input', () => {
  const particle = { x: 99, y: 1, vx: 3, vy: -3, size: 2 };
  assert.deepEqual(advanceParticle(particle, 100, 100), { x: 2, y: 98, vx: 3, vy: -3, size: 2 });
  assert.deepEqual(particle, { x: 99, y: 1, vx: 3, vy: -3, size: 2 });
  assert.equal(advanceParticle(particle, 100, 100, 1000).x, 5);
  assert.deepEqual(advanceParticle(particle, 100, 100, -1), particle);
});

test('mobile animation uses a smaller bounded particle budget', () => {
  assert.ok(particleCount(360) > 0);
  assert.ok(particleCount(360) < particleCount(1280));
  assert.ok(particleCount(1280) <= 50);
});
