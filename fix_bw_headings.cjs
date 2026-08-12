const fs = require('fs');

let code = fs.readFileSync('src/components/student/StudentResultSlip.tsx', 'utf8');

// 1. Force the main titles to be solid black when downloading for max contrast,
// and remove the grayscale filter from them (which can make them wash out).

code = code.replace(
  /<div className=\{\`relative z-10 \$\{isDownloading \? 'grayscale print:grayscale' : 'print:grayscale'\}\`\}>\s*<h1 className=\{\`font-extrabold text-blue-900 tracking-tight uppercase \$\{isDownloading \? 'text-3xl' : 'text-3xl sm:text-4xl'\}\`\}>Jirvinho Software World<\/h1>\s*<p className=\{\`font-bold tracking-widest uppercase mt-1 text-gray-500 \$\{isDownloading \? 'text-base' : 'text-sm sm:text-base'\}\`\}>Excellence in Education Technology<\/p>\s*<\/div>/,
  `<div className="relative z-10">
              <h1 className={\`font-extrabold tracking-tight uppercase \${isDownloading ? 'text-black text-3xl' : 'text-blue-900 text-3xl sm:text-4xl'}\`}>Jirvinho Software World</h1>
              <p className={\`font-bold tracking-widest uppercase mt-1 \${isDownloading ? 'text-black text-base' : 'text-gray-500 text-sm sm:text-base'}\`}>Excellence in Education Technology</p>
            </div>`
);

code = code.replace(
  /<div className=\{\`relative z-10 \$\{isDownloading \? 'grayscale print:grayscale' : 'print:grayscale'\}\`\}>\s*<h2 className=\{\`font-extrabold text-gray-800 mb-4 \$\{isDownloading \? 'text-2xl' : 'text-2xl sm:text-3xl'\}\`\}>OFFICIAL STUDENT RESULT SLIP<\/h2>/,
  `<div className="relative z-10">
              <h2 className={\`font-extrabold mb-4 \${isDownloading ? 'text-black text-2xl' : 'text-gray-800 text-2xl sm:text-3xl'}\`}>OFFICIAL STUDENT RESULT SLIP</h2>`
);

fs.writeFileSync('src/components/student/StudentResultSlip.tsx', code);
