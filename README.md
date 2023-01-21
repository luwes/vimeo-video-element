# `<vimeo-video>`

A custom element (web component) for Vimeo.

The element API matches the HTML5 `<video>` tag, so it can be easily swapped with other media, and be compatible with other UI components that work with the video tag.

One of the goals was to have `<vimeo-video>` seamlessly integrate with [Media Chrome](https://github.com/muxinc/media-chrome).

## Example ([CodeSandbox](https://codesandbox.io/s/vimeo-video-element-x5ku6s))

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/vimeo-video-element@0.2/+esm"></script>
<vimeo-video controls src="https://vimeo.com/648359100"></vimeo-video>
```

## Installing

`<vimeo-video>` is packaged as a javascript module (es6) only, which is supported by all evergreen browsers and Node v12+.

### Loading into your HTML using `<script>`

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/vimeo-video-element@0.2/+esm"></script>
```

### Adding to your app via `npm`

```bash
npm install vimeo-video-element
```

Include in your app javascript (e.g. src/App.js)

```js
import 'vimeo-video-element';
```

This will register the custom elements with the browser so they can be used as HTML.

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
- [`<youtube-video>`](https://github.com/muxinc/youtube-video-element) A web component for the YouTube player.
- [`<videojs-video>`](https://github.com/luwes/videojs-video-element) A web component for Video.js.
- [`<wistia-video>`](https://github.com/luwes/wistia-video-element) A web component for the Wistia player.
- [`<jwplayer-video>`](https://github.com/luwes/jwplayer-video-element) A web component for the JW player.
- [`<hls-video>`](https://github.com/muxinc/hls-video-element) A web component for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player web component.
