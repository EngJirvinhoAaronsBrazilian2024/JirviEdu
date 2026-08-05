#!/bin/bash
file="src/components/Timetable.tsx"

# Backgrounds
sed -i -E 's/bg-neutral-800/bg-white dark:bg-\[var\(--bg-card\)\]/g' "$file"
sed -i -E 's/bg-neutral-900\/50/bg-neutral-50 dark:bg-black\/20/g' "$file"
sed -i -E 's/bg-neutral-900/bg-white dark:bg-\[var\(--bg-card\)\]/g' "$file"

# Borders
sed -i -E 's/border-neutral-700\/60/border-neutral-200 dark:border-\[var\(--border-subtle\)\]/g' "$file"
sed -i -E 's/border-neutral-700/border-neutral-200 dark:border-\[var\(--border-subtle\)\]/g' "$file"
sed -i -E 's/border-neutral-800/border-neutral-200 dark:border-\[var\(--border-subtle\)\]/g' "$file"

# Text colors
sed -i -E 's/text-neutral-50/text-neutral-900 dark:text-\[var\(--text-main\)\]/g' "$file"
sed -i -E 's/text-neutral-200/text-neutral-800 dark:text-\[var\(--text-main\)\]/g' "$file"
sed -i -E 's/text-neutral-400/text-neutral-500 dark:text-muted/g' "$file"
sed -i -E 's/text-neutral-500/text-neutral-500 dark:text-muted/g' "$file"
sed -i -E 's/text-neutral-600/text-neutral-400 dark:text-neutral-500/g' "$file"

# Hover states
sed -i -E 's/hover:bg-neutral-800/hover:bg-neutral-100 dark:hover:bg-neutral-800/g' "$file"
sed -i -E 's/hover:text-neutral-50/hover:text-neutral-900 dark:hover:text-\[var\(--text-main\)\]/g' "$file"
sed -i -E 's/hover:bg-neutral-700/hover:bg-neutral-100 dark:hover:bg-neutral-700/g' "$file"

