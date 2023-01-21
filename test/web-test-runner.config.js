export default {
  nodeResolve: true,
  groups: [
    {
      name: 'lazy-upgrade',
      files: 'test/**/*test.js',
      testRunnerHtml: testFramework =>
        `<html>
          <head>
            <script type="importmap">
              {
                "imports": {
                  "@vimeo/player/": "https://cdn.jsdelivr.net/npm/@vimeo/player/"
                }
              }
            </script>
            <script type="module" src="./vimeo-video-element.js"></script>
            <script type="module" src="${testFramework}"></script>
          </head>
          <body></body>
        </html>`,
    },
  ],
};
