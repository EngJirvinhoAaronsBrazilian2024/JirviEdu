const fs = require('fs');

let code = fs.readFileSync('src/components/student/StudentResultSlip.tsx', 'utf8');

// 1. Fix the parent container overflow during download to prevent cut-offs
code = code.replace(
  /<div className="w-full max-w-4xl my-auto print:m-0 mt-16 sm:mt-auto mb-16 sm:mb-auto overflow-x-auto">/,
  '<div className={`w-full max-w-4xl my-auto print:m-0 mt-16 sm:mt-auto mb-16 sm:mb-auto ${isDownloading ? \'overflow-visible\' : \'overflow-x-auto\'}`}>'
);

// 2. Remove grayscale from the header parent, and apply it to the specific parts so logo remains colored
code = code.replace(
  /<div className=\{\`flex flex-col items-center border-b-4 border-blue-600 pb-8 mb-8 text-center space-y-4 relative \$\{isDownloading \? 'grayscale print:grayscale' : 'print:grayscale'\}\`\}>/,
  '<div className="flex flex-col items-center border-b-4 border-blue-600 pb-8 mb-8 text-center space-y-4 relative">'
);

// 2a. Background div
code = code.replace(
  /<div className="absolute top-0 left-0 w-full h-32 bg-blue-50\/50 -z-10 rounded-t-2xl"><\/div>/,
  '<div className={`absolute top-0 left-0 w-full h-32 bg-blue-50/50 -z-10 rounded-t-2xl ${isDownloading ? \'grayscale print:grayscale\' : \'print:grayscale\'}`}></div>'
);

// 2b. The logo itself (increased size to w-36 h-36, no grayscale)
code = code.replace(
  /<img src=\{logoImage\} alt="Logo" className="w-24 h-24 object-contain shadow-sm rounded-xl p-2 bg-white border border-slate-100 relative z-10" \/>/,
  '<img src={logoImage} alt="Logo" className="w-32 h-32 sm:w-40 sm:h-40 object-contain shadow-sm rounded-2xl p-3 bg-white border border-slate-100 relative z-10" />'
);

// 2c. The text under the logo
code = code.replace(
  /<div className="relative z-10">\s*<h1 className="text-4xl font-extrabold text-blue-900 tracking-tight uppercase">Jirvinho Software World<\/h1>\s*<p className="text-base text-gray-500 font-bold tracking-widest uppercase mt-1">Excellence in Education Technology<\/p>\s*<\/div>/,
  `<div className={\`relative z-10 \${isDownloading ? 'grayscale print:grayscale' : 'print:grayscale'}\`}>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight uppercase">Jirvinho Software World</h1>
              <p className="text-sm sm:text-base text-gray-500 font-bold tracking-widest uppercase mt-1">Excellence in Education Technology</p>
            </div>`
);

// 2d. The divider
code = code.replace(
  /<div className="w-24 h-1 bg-blue-500 rounded-full my-4 relative z-10"><\/div>/,
  '<div className={`w-24 h-1 bg-blue-500 rounded-full my-4 relative z-10 ${isDownloading ? \'grayscale print:grayscale\' : \'print:grayscale\'}`}></div>'
);

// 2e. The "OFFICIAL STUDENT RESULT SLIP" part
code = code.replace(
  /<div className="relative z-10">\s*<h2 className="text-3xl font-extrabold text-gray-800 mb-4">OFFICIAL STUDENT RESULT SLIP<\/h2>/,
  `<div className={\`relative z-10 \${isDownloading ? 'grayscale print:grayscale' : 'print:grayscale'}\`}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4">OFFICIAL STUDENT RESULT SLIP</h2>`
);

// 3. Prevent the table from getting cut off by ensuring minimum width.
code = code.replace(
  /<table className="w-full text-left border-collapse">/,
  '<table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">'
);

fs.writeFileSync('src/components/student/StudentResultSlip.tsx', code);
