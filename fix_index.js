const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

index = index.replace(
  /<link rel="icon" type="image\/jpeg" href="\/icon.jpg\?v=3" \/>\s*<link rel="apple-touch-icon" href="\/icon-192.jpg\?v=3" \/>/g,
  `<link rel="icon" type="image/png" href="/icon-192.png" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="JIRVI EDU" />`
);

if (!index.includes("serviceWorker' in navigator")) {
  index = index.replace(
    /<\/body>/,
    `  <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('SW registration failed: ', err);
          });
        });
      }
    </script>
  </body>`
  );
}

fs.writeFileSync('index.html', index);
