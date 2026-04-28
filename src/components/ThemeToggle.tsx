'use client';

interface Props {
  theme: 'dark' | 'light';
  onChange: (theme: 'dark' | 'light') => void;
}

export default function ThemeToggle({ theme, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(theme === 'dark' ? 'light' : 'dark')}
      className="btn-secondary"
      title="Cambiar tema"
    >
      {theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
    </button>
  );
}
