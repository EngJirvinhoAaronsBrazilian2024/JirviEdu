const fs = require('fs');

const files = [
  'src/components/Login.tsx',
  'src/components/TeacherPortal.tsx',
  'src/components/InstallPrompt.tsx',
  'src/components/StudentPortal.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/import appIcon from '\.\.\/\.\.\/public\/icon\.png';/g, "import appIcon from '../assets/logo.png';");
  fs.writeFileSync(file, code);
});
