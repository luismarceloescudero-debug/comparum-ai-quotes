'use client';

import { useEffect, useRef, useState } from 'react';
import { Scale, Moon, Sun, ChevronDown, LogOut, ScrollText, Sparkles } from 'lucide-react';

interface HeaderProps {
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAIConfig: () => void;
  onOpenAILog: () => void;
  clientName?: string;
}

export default function Header({
  exchangeRate,
  onExchangeRateChange,
  theme,
  onToggleTheme,
  onOpenAIConfig,
  onOpenAILog,
  clientName = 'Marcelo Escudero',
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', onClickOutside);
    }

    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const initials =
    clientName
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <header className="comp-header no-print">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">
            <Scale size={22} />
          </div>
          <span className="logo-text">COMPARUM</span>
        </div>
        <span className="client-badge">{clientName}</span>
      </div>

      <div className="header-right">
        <div className="exchange-box">
          <label>USD/ARS</label>
          <input
            type="number"
            value={exchangeRate}
            step={10}
            min={1}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isNaN(value) && value > 0) onExchangeRateChange(value);
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
        </div>

        <button className="theme-btn" onClick={onToggleTheme} title="Cambiar tema" type="button">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <button className="theme-btn" onClick={onOpenAIConfig} title="Configuración de IA" type="button">
          <Sparkles size={16} />
        </button>

        <button className="theme-btn" onClick={onOpenAILog} title="Logs de extracción" type="button">
          <ScrollText size={16} />
        </button>

        <div className="user-menu-wrap" ref={menuRef}>
          <button className="user-avatar user-avatar-btn" onClick={() => setMenuOpen((open) => !open)} type="button">
            {initials}
            <ChevronDown size={11} style={{ marginLeft: 2 }} />
          </button>

          {menuOpen && (
            <div className="user-menu" role="menu">
              <div className="user-menu-header">
                <div className="user-menu-avatar">{initials}</div>
                <div className="user-menu-name">{clientName}</div>
                <div className="user-menu-sub">COMPARUM · Entorno local</div>
              </div>

              <button className="user-menu-item" onClick={() => { setMenuOpen(false); onOpenAIConfig(); }} type="button">
                <Sparkles size={14} /> Configuración de IA
              </button>
              <button className="user-menu-item" onClick={() => { setMenuOpen(false); onOpenAILog(); }} type="button">
                <ScrollText size={14} /> Logs de extracción
              </button>

              <div className="user-menu-divider" />

              <button
                className="user-menu-item user-menu-item-danger"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm('¿Borrar datos locales de COMPARUM en este navegador?')) {
                    Object.keys(localStorage)
                      .filter((key) => key.startsWith('comparum_'))
                      .forEach((key) => localStorage.removeItem(key));
                    window.location.reload();
                  }
                }}
              >
                <LogOut size={14} /> Cerrar sesión y borrar datos
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
