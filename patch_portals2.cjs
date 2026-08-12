const fs = require('fs');

const files = [
  'src/components/TeacherPortal.tsx',
  'src/components/StudentPortal.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace image with GraduationCap graphic (w-10 h-10 variant)
  code = code.replace(
    /<img src=\{appIcon\}.*?\/>/g,
    `<div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 border border-blue-400/20 shadow-sm"><GraduationCap className="w-6 h-6 text-white" /></div>`
  );

  fs.writeFileSync(file, code);
});
