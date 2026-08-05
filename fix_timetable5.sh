#!/bin/bash
file="src/components/Timetable.tsx"

sed -i -E 's/bg-\[var\(--bg-card\)\] p-4 md:p-6 rounded-2xl border border-\[var\(--border-subtle\)\] shadow-sm/premium-card p-4 md:p-6/g' "$file"
sed -i -E 's/bg-\[var\(--bg-card\)\] rounded-2xl border border-\[var\(--border-subtle\)\] min-h-\[400px\]/premium-card min-h-[400px]/g' "$file"
