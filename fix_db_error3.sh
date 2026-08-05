#!/bin/bash
file="src/lib/db.ts"

sed -i -E 's/\\\$\{/\$\{/g' "$file"
sed -i -E 's/\\\`/\`/g' "$file"
