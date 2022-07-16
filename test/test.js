import { fixture, assert, aTimeout } from '@open-wc/testing';
import '../src/vimeo-video-element.js';

describe('<vimeo-video>', () => {
  it('has a video like API', async function () {
    this.timeout(10000);

    const player = await fixture(`<vimeo-video
      src="https://vimeo.com/648359100"
      muted
    ></vimeo-video>`);

    assert.equal(player.paused, true, 'is paused on initialization');

    await player.loadComplete;

    assert.equal(player.paused, true, 'is paused on initialization');
    assert(!player.ended, 'is not ended');

    // player.muted = true;
    // await aTimeout(50); // postMessage is not instant
    assert(player.muted, 'is muted');

    assert.equal(player.volume, 1, 'is all turned up');
    player.volume = 0.5;
    await aTimeout(100); // postMessage is not instant
    assert.equal(player.volume, 0.5, 'is half volume');

    assert(!player.loop, 'loop is false by default');
    player.loop = true;
    assert(player.loop, 'loop is true');

    if (player.duration == null || Number.isNaN(player.duration)) {
      await promisify(player.addEventListener.bind(player))('durationchange');
    }

    assert.equal(Math.round(player.duration), 115, `is 115s long`);

    const loadComplete = player.loadComplete;

    player.src = 'https://vimeo.com/638371504';
    await player.loadComplete;

    assert(
      loadComplete != player.loadComplete,
      'creates a new promise after new src'
    );

    if (player.duration == null || Number.isNaN(player.duration)) {
      await promisify(player.addEventListener.bind(player))('durationchange');
    }

    assert.equal(Math.round(player.duration), 90, `is 90s long`);

    player.src = 'https://vimeo.com/648359100';
    await player.loadComplete;

    if (player.duration == null || Number.isNaN(player.duration)) {
      await promisify(player.addEventListener.bind(player))('durationchange');
    }

    assert.equal(Math.round(player.duration), 115, `is 115s long`);

    player.muted = true;

    try {
      await player.play();
    } catch (error) {
      console.warn(error);
    }
    assert(!player.paused, 'is playing after player.play()');

    await aTimeout(1000);

    assert.equal(String(Math.round(player.currentTime)), 1, 'is about 1s in');

    player.playbackRate = 2;
    await aTimeout(1000);

    assert.equal(String(Math.round(player.currentTime)), 3, 'is about 3s in');
  });
});

export function promisify(fn) {
  return (...args) =>
    new Promise((resolve) => {
      fn(...args, (...res) => {
        if (res.length > 1) resolve(res);
        else resolve(res[0]);
      });
    });
}
