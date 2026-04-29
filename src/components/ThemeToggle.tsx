'use client';

interface Props {
  theme: 'dark' | 'light';
  onChange: (theme: 'dark' | 'light') => void;
}

export default function ThemeToggle({ theme, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(theme === 'dark' ? 'light' : 'dark')}
      className="theme-btn"
      title="Cambiar tema"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
