const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

code = code.replace(
  '<img src={appIcon} alt="JIRVI EDU Logo" className="w-16 h-16 object-contain drop-shadow-md mb-4" />',
  `<div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 mb-5 border border-blue-400/20">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>`
);
code = code.replace(
  '<span className="text-2xl font-bold tracking-tight text-[var(--text-main)] mb-6">JIRVI EDU</span>',
  '<span className="text-3xl font-extrabold tracking-tight text-[var(--text-main)] mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">JIRVI EDU</span>'
);

fs.writeFileSync('src/components/Login.tsx', code);
