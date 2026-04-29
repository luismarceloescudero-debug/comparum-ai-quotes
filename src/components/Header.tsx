'use client';

import { Moon, Sun, Settings, ScrollText, Scale } from 'lucide-react';

interface HeaderProps {
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAIConfig: () => void;
  onOpenAILog: () => void;
}

export default function Header({
  exchangeRate,
  onExchangeRateChange,
  theme,
  onToggleTheme,
  onOpenAIConfig,
  onOpenAILog,
}: HeaderProps) {
  return (
    <header className="comp-header no-print">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon"><Scale size={22} /></div>
          <span className="logo-text">COMPARUM</span>
        </div>
        <span className="client-badge">Marcelo Escudero</span>
      </div>

      <div className="header-right">
        <div className="exchange-box">
          <label>USD/ARS</label>
          <input
            type="number"
            value={exchangeRate}
            step={10}
            min={1}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v) && v > 0) onExchangeRateChange(v);
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
        </div>
        <button className="theme-btn" onClick={onToggleTheme} title="Cambiar tema">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="theme-btn" onClick={onOpenAIConfig} title="Configuración IA">
          <Settings size={16} />
        </button>
        <button className="theme-btn" onClick={onOpenAILog} title="Logs IA">
          <ScrollText size={16} />
        </button>
      </div>
    </header>
  );
}
