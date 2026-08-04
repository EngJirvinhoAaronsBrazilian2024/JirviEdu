#!/bin/bash

# Find all tsx files in src/components
find src/components -type f -name "*.tsx" | while read file; do
  sed -i -E 's/dark:bg-\[var\(--bg-app\)\]/dark:bg-\[var\(--bg-card\)\]/g' "$file"
done

