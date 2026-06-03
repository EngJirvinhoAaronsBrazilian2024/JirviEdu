#!/bin/bash
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-white/g 'bg-neutral-800' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /border-slate-200/g 'border-neutral-700' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /border-slate-100/g 'border-neutral-700' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /border-neutral-200/g 'border-neutral-700' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /border-neutral-300/g 'border-neutral-600' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /border-b\\s+border-slate-200\\/60/g 'border-b border-neutral-700' {} +

find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-slate-900/g 'text-white' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-neutral-900/g 'text-white' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-slate-700/g 'text-neutral-200' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-neutral-700/g 'text-neutral-200' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-slate-500/g 'text-neutral-400' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-neutral-500/g 'text-neutral-400' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-slate-600/g 'text-neutral-300' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /text-neutral-600/g 'text-neutral-300' {} +

find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-slate-50/g 'bg-neutral-900' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-slate-100/g 'bg-neutral-800' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-neutral-50/g 'bg-neutral-900' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-neutral-100/g 'bg-neutral-800' {} +

find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /hover:bg-slate-50/g 'hover:bg-neutral-700' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /hover:bg-neutral-50/g 'hover:bg-neutral-700' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /hover:bg-slate-100/g 'hover:bg-neutral-700' {} +

find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-\\\\[radial-gradient.*\\\\]\\s+from-blue-100\\s+via-blue-50\\s+to-blue-100/g 'bg-neutral-900' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-gradient-to-br\\s+from-blue-100\\s+to-white/g 'bg-neutral-800' {} +
find src/components -type f -name "*.tsx" -exec npx -qy replace-in-file /bg-white\\/50/g 'bg-neutral-900/50' {} +
