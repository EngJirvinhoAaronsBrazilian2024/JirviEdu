#!/bin/bash
file="src/lib/db.ts"

cat << 'INNER_EOF' > camelToSnake.tmp
function camelToSnake(obj: any) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
    if (typeof value === 'number' && (key.endsWith('At') || key === 'deadline')) {
      newObj[snakeKey] = new Date(value).toISOString();
    } else {
      newObj[snakeKey] = camelToSnake(value);
    }
  }
  return newObj;
}
INNER_EOF

cat << 'INNER_EOF' > snakeToCamel.tmp
function snakeToCamel(obj: any) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/) && (camelKey.endsWith('At') || camelKey === 'deadline')) {
      newObj[camelKey] = new Date(value).getTime();
    } else {
      newObj[camelKey] = snakeToCamel(value);
    }
  }
  return newObj;
}
INNER_EOF

sed -i -e '/function camelToSnake(obj: any) {/,/^}/!b' -e '/^}/!d' -e '/^}/r camelToSnake.tmp' -e '/^}/d' "$file"
sed -i -e '/function snakeToCamel(obj: any) {/,/^}/!b' -e '/^}/!d' -e '/^}/r snakeToCamel.tmp' -e '/^}/d' "$file"

