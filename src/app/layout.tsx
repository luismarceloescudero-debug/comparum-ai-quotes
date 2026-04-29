import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'COMPARUM - Marcelo Escudero',
  description: 'Aplicación escalable de extracción de cotizaciones con multi-proveedor IA, comparación y conversión de divisas en tiempo real.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
