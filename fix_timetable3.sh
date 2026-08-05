#!/bin/bash
file="src/components/Timetable.tsx"

# We can replace the explicit styling of cards with premium-card
sed -i -E 's/bg-white dark:bg-\[var\(--bg-card\)\] rounded-2xl border border-neutral-200 dark:border-\[var\(--border-subtle\)\] shadow-sm/premium-card/g' "$file"

# Replace manual colors on other elements
sed -i -E 's/bg-neutral-50 dark:bg-black\/20/bg-[var(--bg-app)]/g' "$file"
sed -i -E 's/bg-white dark:bg-\[var\(--bg-card\)\]/bg-[var(--bg-card)]/g' "$file"
sed -i -E 's/border-neutral-200 dark:border-\[var\(--border-subtle\)\]/border-[var(--border-subtle)]/g' "$file"
sed -i -E 's/text-neutral-900 dark:text-\[var\(--text-main\)\]/text-[var(--text-main)]/g' "$file"
sed -i -E 's/text-neutral-800 dark:text-\[var\(--text-main\)\]/text-[var(--text-main)]/g' "$file"
sed -i -E 's/text-neutral-500 dark:text-muted/text-muted/g' "$file"
sed -i -E 's/hover:bg-neutral-100 dark:hover:bg-neutral-800/hover:bg-[var(--bg-app)]/g' "$file"
sed -i -E 's/hover:text-neutral-900 dark:hover:text-\[var\(--text-main\)\]/hover:text-[var(--text-main)]/g' "$file"
sed -i -E 's/text-neutral-400 dark:text-neutral-500/text-muted opacity-50/g' "$file"
