# Aadhar — आधार

A culturally-aware parenting support platform where parents can ask questions about their children and receive empathetic, thoughtful guidance. Available in English and Nepali with voice input, text-to-speech, crisis resources, and a location-aware support map.

## Project Overview

Aadhar helps parents navigate everyday parenting challenges — from schoolwork struggles to phone habits — without judgment. The app:

- **Conversational AI** — Parents ask questions via voice (microphone) or text. The AI responds with warm, practical advice grounded in real parenting experiences, not clinical jargon.
- **Bilingual** — Full English and Nepali (Devanagari) support, including AI responses translated to Nepali.
- **Text-to-Speech** — English uses browser TTS; Nepali uses OpenAI's speech API for natural pronunciation.
- **Crisis Support** — Location-aware crisis hotline (auto-detects country via timezone, covers 11 countries). Interactive map with nearby health facilities via OpenStreetMap + Overpass API.
- **Privacy-first** — No accounts, no data stored server-side. Conversations stay in the browser session.

## Setup and Run Instructions

### Prerequisites

- Node.js 18+ and npm
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Installation

```bash
git clone https://github.com/Adarsha-gg/nepal-hackathon.git
cd nepal-hackathon
npm install
```

### Environment Variables

Copy the example file and add your key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
OPENAI_API_KEY=your_key_here
```

Optionally set `OPENAI_CHAT_MODEL` (defaults to `gpt-4o-mini`).

### Running

```bash
npm run dev        # Development server at http://localhost:3000
npm run build      # Production build
npm run start      # Serve production build
npm run lint       # ESLint
```

## Dependencies and Tools

### Core Stack

| Tool | Purpose |
|------|---------|
| **Next.js 16** (App Router, Turbopack) | React framework, server-side rendering, API routes |
| **React 19** | UI components |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Utility-first styling (alongside custom CSS) |

### APIs and Services

| Service | Purpose |
|---------|---------|
| **OpenAI GPT-4o-mini** | Conversational AI responses |
| **OpenAI Whisper** | Voice-to-text transcription |
| **OpenAI TTS (tts-1)** | Nepali text-to-speech (onyx voice) |
| **Overpass API** (OpenStreetMap) | Nearby health facility search |
| **Leaflet + OSM tiles** | Interactive crisis support map |

### Key Libraries

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI API client (chat, transcription, speech) |
| `leaflet` | Interactive map rendering with custom markers |
| `next` | Framework (SSR, routing, API routes) |

### Browser APIs Used

- **Web Speech API** — English text-to-speech
- **MediaRecorder API** — Voice recording
- **Geolocation API** — User location for crisis map
- **Intl API** — Timezone detection for local hotline

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main single-page app (home, ask, crisis views)
│   ├── layout.tsx            # Root layout with fonts
│   ├── aadhar.css            # Custom component styles
│   ├── globals.css           # Global styles
│   └── api/
│       ├── respond/route.ts  # Chat AI endpoint (GPT + translation)
│       ├── transcribe/route.ts # Voice-to-text (Whisper)
│       ├── tts/route.ts      # Nepali text-to-speech (OpenAI)
│       └── nearby-places/route.ts # Health facility lookup (Overpass)
├── components/
│   └── CrisisSupportMap.tsx  # Leaflet map with user + facility pins
├── lib/
│   ├── openai-client.ts      # OpenAI SDK wrapper
│   ├── browser-tts.ts        # Browser speech synthesis helpers
│   ├── crisis-hotlines.ts    # Country-specific hotline lookup
│   └── reddit-experiences.ts # Experience pool for AI context
├── data/
│   ├── nepali-family-experiences.ts  # Curated parenting stories
│   └── prefilled-real-experiences.json
app.py                        # Python prototype (early development)
```

## Team Members and Roles

| Name | Role |
|------|------|
| **Adarsha Mishra** | Lead developer — Next.js app, AI integration (OpenAI GPT/Whisper/TTS), crisis map (Leaflet + Overpass), dynamic hotlines, UI/UX implementation |
| **Abhijit Yadav** | Frontend prototyping — initial HTML/CSS designs and layout |
| **Anuj Vikram Shah** | Backend prototyping — Python scripts and early API exploration |
