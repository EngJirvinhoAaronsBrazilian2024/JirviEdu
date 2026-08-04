#!/bin/bash

# Find all tsx files in src/components
find src/components -type f -name "*.tsx" | while read file; do
  # Replace backgrounds and rounded corners
  sed -i -E 's/bg-orange-400 dark:bg-orange-500 p-6 rounded-none/bg-orange-400 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-purple-500 dark:bg-purple-600 p-6 rounded-none/bg-purple-500 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-pink-500 dark:bg-pink-600 p-6 rounded-none/bg-pink-500 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-teal-500 dark:bg-teal-600 p-6 rounded-none/bg-teal-500 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-slate-500 p-6 rounded-none/bg-slate-500 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-teal-600 p-6 rounded-none/bg-teal-600 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-amber-400 p-6 rounded-none/bg-amber-400 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-amber-400 dark:bg-amber-500 p-6 rounded-none/bg-amber-400 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-red-500 dark:bg-red-600 p-6 rounded-none/bg-red-500 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"
  sed -i -E 's/bg-cyan-500 dark:bg-cyan-600 p-6 rounded-none/bg-cyan-500 dark:bg-[var(--bg-app)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)]/g' "$file"

  # Replace other parts
  sed -i -E 's/z-10 text-white h-full/z-10 text-white dark:text-[var(--text-main)] h-full/g' "$file"
  sed -i -E 's/text-white" strokeWidth=\{1\.5\}/text-white dark:text-muted" strokeWidth=\{1.5\}/g' "$file"
  sed -i -E 's/border-l border-white\/20/border-l border-white\/20 dark:border-[var(--border-strong)]/g' "$file"
  sed -i -E 's/tracking-tight text-white\}/tracking-tight text-white dark:text-[var(--text-main)]\}/g' "$file"
  sed -i -E 's/text-sm font-semibold text-white\/90 mt-1 uppercase/text-sm font-semibold text-white\/90 dark:text-muted mt-1 uppercase/g' "$file"
done

