import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center gap-2 rounded-[12px] border border-[#E0DBD5] bg-white px-3 py-2 text-[12px] font-black uppercase tracking-widest text-[#3D2B1F] shadow-sm transition-colors hover:bg-[#F8F7F5]"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
      {!compact && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
