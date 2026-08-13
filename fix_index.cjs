const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');

if (!index.includes('window.deferredPWAInstallPrompt')) {
  index = index.replace(
    '<head>',
    `<head>
    <script>
      window.deferredPWAInstallPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPWAInstallPrompt = e;
      });
    </script>`
  );
  fs.writeFileSync('index.html', index);
}
