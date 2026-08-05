#!/bin/bash
file="src/components/Timetable.tsx"

sed -i -E 's/hover:bg-neutral-100 dark:hover:bg-neutral-700/hover:bg-\[var\(--bg-app\)\]/g' "$file"
sed -i -E 's/text-muted opacity-50 opacity-50/text-muted opacity-50/g' "$file"
