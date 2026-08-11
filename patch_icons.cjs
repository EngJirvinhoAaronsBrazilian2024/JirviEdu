const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('import appIcon from')) return;
  
  // Find the last import statement
  const imports = code.match(/^import .*? from .*?;?$/gm);
  if (imports) {
    const lastImport = imports[imports.length - 1];
    code = code.replace(lastImport, lastImport + "\nimport appIcon from '../../public/icon.png';");
  } else {
    code = "import appIcon from '../../public/icon.png';\n" + code;
  }
  
  code = code.replace(/"\/icon\.png\?v=2"/g, "{appIcon}");
  fs.writeFileSync(file, code);
}

const files = [
  'src/components/Login.tsx',
  'src/components/TeacherPortal.tsx',
  'src/components/InstallPrompt.tsx',
  'src/components/StudentPortal.tsx',
  'src/components/AdminPortal.tsx'
];

files.forEach(patchFile);
