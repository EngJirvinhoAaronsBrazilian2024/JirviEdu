const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationBell.tsx', 'utf8');

code = code.replace(
  /console\.error\("Failed to fetch notifications", err\);/,
  'console.warn("Failed to fetch notifications", err);'
);

fs.writeFileSync('src/components/NotificationBell.tsx', code);
