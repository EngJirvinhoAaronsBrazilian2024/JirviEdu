#!/bin/bash
file="src/components/Timetable.tsx"

sed -i -E 's/dark:text-muted dark:text-muted/dark:text-muted/g' "$file"
sed -i -E 's/text-neutral-900 dark:text-\[var\(--text-main\)\]0/text-neutral-500 dark:text-muted/g' "$file"
sed -i -E 's/hover:bg-white dark:bg-\[var\(--bg-card\)\]/hover:bg-neutral-100 dark:hover:bg-neutral-800/g' "$file"
