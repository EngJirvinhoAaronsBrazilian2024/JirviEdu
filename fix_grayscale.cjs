const fs = require('fs');
let code = fs.readFileSync('src/components/student/StudentResultSlip.tsx', 'utf8');

// Replace all instances of `${isDownloading ? 'grayscale print:grayscale' : 'print:grayscale'}` with just `print:grayscale`
code = code.replaceAll(
  "${isDownloading ? 'grayscale print:grayscale' : 'print:grayscale'}",
  "print:grayscale"
);

fs.writeFileSync('src/components/student/StudentResultSlip.tsx', code);
