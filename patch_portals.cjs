const fs = require('fs');

const files = [
  'src/components/TeacherPortal.tsx',
  'src/components/StudentPortal.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace appIcon import and add GraduationCap
  code = code.replace(
    "import appIcon from '../assets/logo.jpg';",
    "import { GraduationCap } from 'lucide-react';"
  );
  
  // Replace image with GraduationCap graphic
  code = code.replace(
    /<img src=\{appIcon\} alt="Jirvi Logo" className="w-8 h-8 rounded-lg" \/>/g,
    `<div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shrink-0 border border-blue-400/20 shadow-sm"><GraduationCap className="w-5 h-5 text-white" /></div>`
  );
  
  // Alternative alt text just in case
  code = code.replace(
    /<img src=\{appIcon\} alt="Logo" className="w-8 h-8 rounded-lg" \/>/g,
    `<div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shrink-0 border border-blue-400/20 shadow-sm"><GraduationCap className="w-5 h-5 text-white" /></div>`
  );

  fs.writeFileSync(file, code);
});
