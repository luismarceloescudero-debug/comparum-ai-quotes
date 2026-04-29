# Comparum v2 — Extracción y comparación inteligente de cotizaciones

Aplicación full-stack en **Next.js (App Router + TypeScript)** para:
- Extraer cotizaciones desde **imágenes y PDFs (incluyendo escaneados)**
- Comparar múltiples proveedores con normalización de datos
- Convertir monedas en tiempo real con APIs confiables y fallback
- Aprender de correcciones del usuario para mejorar futuras extracciones

## Arquitectura

```txt
src/
  app/
    api/
      ai/extract-quote/route.ts      -> endpoint de extracción
      currency/rates/route.ts        -> tasas con fallback+cache
      learnings/route.ts             -> reglas aprendidas (JSON FS)
      quotes/route.ts                -> histórico y comparación
  server/
    providers/                       -> Abacus, Groq, Gemini
    services/                        -> orquestación, prompt, moneda, storage, normalización
    controllers/                     -> capa HTTP/controller
  components/                        -> UI reutilizable (upload/cards/comparativa/modales)
  services/                          -> servicios client-side
  types/
```

## Funcionalidades principales

- ✅ **Proveedor principal IA**: Abacus AI
- ✅ **Fallback automático**: Groq → Gemini (con ajuste para PDF escaneado)
- ✅ **Extracción robusta PDF/imagen**:
  - PDF con texto: se usa texto + contexto
  - PDF escaneado: se envía PDF base64 a provider de visión (Gemini cuando aplica fallback)
- ✅ **Conversión de divisas en tiempo real**:
  - API principal: `open.er-api.com` (ExchangeRate API)
  - Fallback: `frankfurter.app`
  - Cache local JSON con refresco automático
- ✅ **Comparador multicotización**: tabla por coberturas + mejor precio
- ✅ **Sistema de aprendizaje**: correcciones del usuario guardadas como reglas
- ✅ **Persistencia local tipo JSON FS** (compatible con Vercel runtime de forma efímera)
- ✅ **Tema oscuro/claro**

## Instalación paso a paso

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir en navegador:
- `http://localhost:3000`

## Variables de entorno

Ver `.env.example`.

- `ABACUS_API_KEY` (**recomendada/primaria**)
- `ABACUS_DEPLOYMENT_ID` (opcional pero recomendado para `getChatResponse` con deployment)
- `GROQ_API_KEY` (opcional)
- `GEMINI_API_KEY` (opcional)
- `DATA_DIR` (opcional, para persistencia local)

> También puedes cargar API keys desde el modal de configuración de la UI.

## Uso rápido

1. Entra a **⚙️ IA** y configura modelos/API keys
2. Sube imágenes o PDFs
3. Revisa cotizaciones extraídas
4. Ajusta moneda de visualización y compara
5. Edita coberturas para entrenar reglas aprendidas

## Deployment en Vercel

1. Importa repo en Vercel
2. Configura variables de entorno (`ABACUS_API_KEY`, etc.)
3. Deploy

Se incluye `vercel.json` con:
- funciones optimizadas para extracción
- timeout/memoria adecuados para archivos y llamadas a IA

## Capturas de pantalla (flujo recomendado)

- Pantalla principal con drag&drop de PDFs
- Cards de proveedores extraídos
- Tabla comparativa con mejor precio resaltado
- Modal de configuración IA (Abacus/Groq/Gemini)
- Panel de logs y sistema de aprendizaje

> Puedes tomar estas capturas desde el entorno en ejecución para documentación comercial.

## Notas técnicas

- En Vercel, el sistema JSON en filesystem es **efímero** (no reemplaza una DB).
- Para producción multiusuario persistente se recomienda migrar a Postgres/Supabase.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Licencia

MIT
