import { test } from 'zora';

function createVideoElement() {
  return fixture(`<vimeo-video
    src="https://vimeo.com/648359100"
    muted
  ></vimeo-video>`);
}

test('has default video props', async function (t) {
  const player = await createVideoElement();

  t.equal(player.paused, true, 'is paused on initialization');

  await player.loadComplete;

  t.equal(player.paused, true, 'is paused on initialization');
  t.ok(!player.ended, 'is not ended');
  t.ok(player.muted, 'is muted');
});

test('volume', async function (t) {
  const player = await createVideoElement();
  await player.loadComplete;

  player.volume = 1;
  await delay(100); // postMessage is not instant
  t.equal(player.volume, 1, 'is all turned up. volume: ' + player.volume);
  player.volume = 0.5;
  await delay(100); // postMessage is not instant
  t.equal(player.volume, 0.5, 'is half volume');
});

test('loop', async function (t) {
  const player = await createVideoElement();
  await player.loadComplete;

  t.ok(!player.loop, 'loop is false by default');
  player.loop = true;
  t.ok(player.loop, 'loop is true');
});

test('duration', async function (t) {
  const player = await createVideoElement();
  await player.loadComplete;

  if (player.duration == null || Number.isNaN(player.duration)) {
    await promisify(player.addEventListener.bind(player))('durationchange');
  }

  t.equal(Math.round(player.duration), 115, `is 115s long`);
});

test('load promise', async function (t) {
  const player = await createVideoElement();
  await player.loadComplete;

  const loadComplete = player.loadComplete;

  player.src = 'https://vimeo.com/638371504';
  await player.loadComplete;

  t.ok(
    loadComplete != player.loadComplete,
    'creates a new promise after new src'
  );

  if (player.duration == null || Number.isNaN(player.duration)) {
    await promisify(player.addEventListener.bind(player))('durationchange');
  }

  t.equal(Math.round(player.duration), 90, `is 90s long`);
});

test('play promise', async function (t) {
  const player = await createVideoElement();
  await player.loadComplete;

  player.muted = true;

  try {
    await player.play();
  } catch (error) {
    console.warn(error);
  }
  t.ok(!player.paused, 'is playing after player.play()');
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixture(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = template.content.cloneNode(true);
  const result = fragment.children.length > 1
    ? [...fragment.children]
    : fragment.children[0];
  document.body.append(fragment);
  return result;
}

function promisify(fn) {
  return (...args) =>
    new Promise((resolve) => {
      fn(...args, (...res) => {
        if (res.length > 1) resolve(res);
        else resolve(res[0]);
      });
    });
}
