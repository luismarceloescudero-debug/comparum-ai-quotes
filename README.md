# 🤖 AI Quote Extractor

AI-powered provider quote extraction and comparison tool. Upload quotes from multiple providers (PDF, images, XLSX, DOCX), extract structured data using AI, and compare side-by-side.

## Features

- 📄 **Multi-format upload**: PDF, PNG, JPG, WEBP, XLSX, DOCX (drag & drop)
- 🤖 **Multi-AI providers**: Google Gemini (free, vision), Groq (free, fast), Abacus AI (paid, premium)
- 📊 **Smart comparison**: Sort by price, coverage, quality, date
- 💱 **Currency conversion**: ARS/USD with configurable exchange rate
- 🧠 **Learning system**: Corrections become rules for future extractions
- 📋 **Extraction logs**: Track all extractions with export to JSON/CSV
- 💾 **Smart caching**: Skip re-extraction of identical files
- ⏱ **Rate limiting**: Configurable delay between bulk uploads

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Configuration

1. Click ⚙️ in the header
2. Enter your API key for your preferred provider:
   - **Gemini**: Get key at https://aistudio.google.com/apikey
   - **Groq**: Get key at https://console.groq.com/keys
   - **Abacus**: Get token from your Abacus AI deployment
3. Set exchange rate and processing delay

## Architecture

See `references/architecture.md` for detailed system design.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (dark theme)
- localStorage for client-side persistence
- No database required (future: Supabase/Firebase)

## License

MIT
