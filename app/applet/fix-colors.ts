import fs from 'fs';
import path from 'path';

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = findFiles('src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Convert all text-white to text-neutral-50
  content = content.replace(/text-white/g, 'text-neutral-50');
  
  content = content.replace(/className=(['"])(.*?)\1/g, (match, q, classes) => {
    if (/(bg-(blue|green|red|indigo|purple|pink|orange|black)-(400|500|600|700|800|900))/.test(classes)) {
      classes = classes.replace(/text-neutral-50/g, 'text-white');
    }
    return `className=${q}${classes}${q}`;
  });

  content = content.replace(/className=\{`([^`]*?)`\}/g, (match, classes) => {
    if (/(bg-(blue|green|red|indigo|purple|pink|orange|black)-(400|500|600|700|800|900))/.test(classes)) {
      classes = classes.replace(/text-neutral-50/g, 'text-white');
    }
    return `className={\`${classes}\`}`;
  });

  // some conditional classes like: current ? 'bg-blue-600 text-white' : 'text-neutral-50'
  content = content.replace(/('|"|`)([^'"`]*?)(\1)/g, (match, q, classes) => {
    if (/(bg-(blue|green|red|indigo|purple|pink|orange|black)-(400|500|600|700|800|900))/.test(classes)) {
      classes = classes.replace(/text-neutral-50/g, 'text-white');
    }
    return `${q}${classes}${q}`;
  });
  
  fs.writeFileSync(file, content);
});

console.log('done');
