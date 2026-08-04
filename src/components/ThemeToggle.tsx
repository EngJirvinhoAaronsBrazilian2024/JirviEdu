import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('jirvi_theme') === 'dark' || !localStorage.getItem('jirvi_theme');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('jirvi_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('jirvi_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all shadow-sm"
      title="Toggle Theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
