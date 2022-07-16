// https://github.com/vimeo/player.js
import VimeoPlayerAPI from '@vimeo/player';
import {
  PublicPromise,
  serialize,
  boolToBinary,
  createEmbedIframe,
  createTimeRanges,
} from './utils.js';

const EMBED_BASE = 'https://player.vimeo.com/video';
const MATCH_SRC = /vimeo\.com\/(?:video\/)?(\d+)/;

const templateShadowDOM = document.createElement('template');
templateShadowDOM.innerHTML = `
<style>
  :host {
    display: inline-block;
    line-height: 0;
    position: relative;
  }
  iframe {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
`;

class VimeoVideoElement extends HTMLElement {
  static observedAttributes = [
    'autoplay',
    'controls',
    'crossorigin',
    'loop',
    'muted',
    'playsinline',
    'poster',
    'preload',
    'src',
  ];

  #options;
  #currentTime = 0;
  #duration = NaN;
  #muted = false;
  #paused = !this.autoplay;
  #playbackRate = 1;
  #progress = 0;
  #readyState = 0;
  #seeking = false;
  #volume = 1;
  #videoWidth = NaN;
  #videoHeight = NaN;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(templateShadowDOM.content.cloneNode(true));

    this.loadComplete = new PublicPromise();
  }

  async load() {
    if (this.hasLoaded) {
      this.loadComplete = new PublicPromise();
      this.noInit = true;
    }
    this.hasLoaded = true;

    this.#currentTime = 0;
    this.#duration = NaN;
    this.#muted = false;
    this.#paused = !this.autoplay;
    this.#playbackRate = 1;
    this.#progress = 0;
    this.#readyState = 0;
    this.#seeking = false;
    this.#volume = 1;
    this.#readyState = 0;
    this.#videoWidth = NaN;
    this.#videoHeight = NaN;
    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    if (!this.src) {
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    this.#options = {
      autoplay: this.autoplay,
      controls: this.controls,
      loop: this.loop,
      muted: this.defaultMuted,
      playsinline: this.playsInline,
      preload: this.preload ?? 'metadata',
      transparent: false,
    };

    if (this.noInit) {
      this.api = oldApi;
      this.api.loadVideo({
        ...this.#options,
        url: this.src,
      });
      await this.loadComplete;
      return;
    }

    const matches = this.src.match(MATCH_SRC);
    const metaId = matches && matches[1];
    const src = `${EMBED_BASE}/${metaId}?${serialize(
      boolToBinary(this.#options)
    )}`;
    let iframe = this.shadowRoot.querySelector('iframe');
    if (!iframe) {
      iframe = createEmbedIframe({ src });
      this.shadowRoot.append(iframe);
    }

    this.api = new VimeoPlayerAPI(iframe);

    this.api.on('loaded', async () => {
      this.#readyState = 1; // HTMLMediaElement.HAVE_METADATA
      this.dispatchEvent(new Event('loadedmetadata'));

      if (this.api) {
        this.#muted = await this.api.getMuted();
        this.#volume = await this.api.getVolume();
        this.dispatchEvent(new Event('volumechange'));

        this.#duration = await this.api.getDuration();
        this.dispatchEvent(new Event('durationchange'));
      }

      this.dispatchEvent(new Event('loadcomplete'));
      this.loadComplete.resolve();
    });

    // Make sure a `play` event is fired before the bufferstart event.
    // For example Vimeo's `play` event is delayed decreasing video startup time.
    this.api.on('bufferstart', () => {
      if (this.#paused) {
        this.#paused = false;
        this.dispatchEvent(new Event('play'));
      }
      this.dispatchEvent(new Event('waiting'));
    });

    this.api.on('play', () => {
      if (!this.#paused) return;
      this.#paused = false;
      this.dispatchEvent(new Event('play'));
    });

    this.api.on('playing', () => {
      this.#readyState = 3; // HTMLMediaElement.HAVE_FUTURE_DATA
      this.#paused = false;
      this.dispatchEvent(new Event('playing'));
    });

    this.api.on('seeking', () => {
      this.#seeking = true;
      this.dispatchEvent(new Event('seeking'));
    });

    this.api.on('seeked', () => {
      this.#seeking = false;
      this.dispatchEvent(new Event('seeked'));
    });

    this.api.on('pause', () => {
      this.#paused = true;
      this.dispatchEvent(new Event('pause'));
    });

    this.api.on('ended', () => {
      this.#paused = true;
      this.dispatchEvent(new Event('ended'));
    });

    this.api.on('ratechange', ({ playbackRate }) => {
      this.#playbackRate = playbackRate;
      this.dispatchEvent(new Event('ratechange'));
    });

    this.api.on('volumechange', async ({ volume }) => {
      this.#volume = volume;
      if (this.api) {
        this.#muted = await this.api.getMuted();
      }
      this.dispatchEvent(new Event('volumechange'));
    });

    this.api.on('durationchange', ({ duration }) => {
      this.#duration = duration;
      this.dispatchEvent(new Event('durationchange'));
    });

    this.api.on('timeupdate', ({ seconds }) => {
      this.#currentTime = seconds;
      this.dispatchEvent(new Event('timeupdate'));
    });

    this.api.on('progress', ({ seconds }) => {
      this.#progress = seconds;
      this.dispatchEvent(new Event('progress'));
    });

    this.api.on('resize', ({ videoWidth, videoHeight }) => {
      this.#videoWidth = videoWidth;
      this.#videoHeight = videoHeight;
      this.dispatchEvent(new Event('resize'));
    });

    await this.loadComplete;
  }

  async attributeChangedCallback(attrName) {
    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'src': {
        this.load();
        return;
      }
    }

    await this.loadComplete;

    switch (attrName) {
      case 'autoplay':
      case 'controls': {
        if (this.#options[attrName] !== this.hasAttribute(attrName)) {
          this.load();
        }
        break;
      }
      case 'loop': {
        this.api.setLoop(this.loop);
        break;
      }
    }
  }

  async play() {
    this.#paused = false;
    this.dispatchEvent(new Event('play'));

    await this.loadComplete;

    try {
      await this.api?.play();
    } catch (error) {
      this.#paused = true;
      this.dispatchEvent(new Event('pause'));
      throw error;
    }
  }

  async pause() {
    await this.loadComplete;
    return this.api?.pause();
  }

  get ended() {
    return this.#currentTime >= this.#duration;
  }

  get seeking() {
    return this.#seeking;
  }

  get readyState() {
    return this.#readyState;
  }

  get videoWidth() {
    return this.#videoWidth;
  }

  get videoHeight() {
    return this.#videoHeight;
  }

  // If the getter from SuperVideoElement is overridden, it's required to define
  // the setter again too unless it's a read only property! It's a JS thing.

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (this.src == val) return;
    this.setAttribute('src', val);
  }

  get paused() {
    return this.#paused;
  }

  get duration() {
    return this.#duration;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(val) {
    if (this.autoplay == val) return;
    if (val) this.setAttribute('autoplay', '');
    else this.removeAttribute('autoplay');
  }

  get buffered() {
    if (this.#progress > 0) {
      return createTimeRanges(0, this.#progress);
    }
    return createTimeRanges();
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  set controls(val) {
    if (this.controls == val) return;
    if (val) this.setAttribute('controls', '');
    else this.removeAttribute('controls');
  }

  get currentTime() {
    return this.#currentTime;
  }

  set currentTime(val) {
    if (this.currentTime == val) return;
    this.#currentTime = val;
    this.loadComplete.then(() => {
      this.api?.setCurrentTime(val);
    });
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }

  set defaultMuted(val) {
    if (this.defaultMuted == val) return;
    if (val) this.setAttribute('muted', '');
    else this.removeAttribute('muted');
  }

  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(val) {
    if (this.loop == val) return;
    if (val) this.setAttribute('loop', '');
    else this.removeAttribute('loop');
  }

  get muted() {
    return this.#muted;
  }

  set muted(val) {
    if (this.muted == val) return;
    this.#muted = val;
    this.loadComplete.then(() => {
      this.api?.setMuted(val);
    });
  }

  get playbackRate() {
    return this.#playbackRate;
  }

  set playbackRate(val) {
    if (this.playbackRate == val) return;
    this.#playbackRate = val;
    this.loadComplete.then(() => {
      this.api?.setPlaybackRate(val);
    });
  }

  get playsInline() {
    return this.hasAttribute('playsinline');
  }

  set playsInline(val) {
    if (this.playsInline == val) return;
    if (val) this.setAttribute('playsinline', '');
    else this.removeAttribute('playsinline');
  }

  get poster() {
    return this.getAttribute('poster');
  }

  set poster(val) {
    if (this.poster == val) return;
    this.setAttribute('poster', `${val}`);
  }

  get volume() {
    return this.#volume;
  }

  set volume(val) {
    if (this.volume == val) return;
    this.#volume = val;
    this.loadComplete.then(() => {
      this.api?.setVolume(val);
    });
  }
}

if (
  globalThis.customElements.get('vimeo-video') ||
  globalThis.VimeoVideoElement
) {
  console.debug('VimeoVideoElement: <vimeo-video> defined more than once.');
} else {
  globalThis.VimeoVideoElement = VimeoVideoElement;
  globalThis.customElements.define('vimeo-video', VimeoVideoElement);
}

export default VimeoVideoElement;
