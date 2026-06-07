const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will export our mock from src/lib/db.ts
      // For components in src/components/student and src/components/admin
      let newDbPath = '../../lib/db';
      if (dir === 'src/components') newDbPath = '../lib/db';
      if (dir === 'src') newDbPath = './lib/db';

      content = content.replace(/from\s+['"]firebase\/firestore['"]/g, `from '${newDbPath}'`);
      content = content.replace(/from\s+['"]\.\.\/lib\/firebase['"]/g, `from '${newDbPath}'`);
      content = content.replace(/from\s+['"]\.\.\/\.\.\/lib\/firebase['"]/g, `from '${newDbPath}'`);
      content = content.replace(/from\s+['"]firebase\/storage['"]/g, `from '${newDbPath}'`);
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('src');
console.log('Done replacement.');
