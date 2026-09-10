# Gift Garden AI

A Next.js app that creates personalized gift shortlists from a recipient, occasion, vibe, and optional details. Gift generation runs through a server-side OpenAI-compatible backend; Firestore and `localdb.json` provide fallbacks when inference is unavailable.

## Run locally

Requirements: Node.js 18.18+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/v2` unless `NEXT_PUBLIC_PAGE_REDIRECT` is set.

## LLM backend

Add the server-only inference settings to `.env`:

```dotenv
BACKEND_API_URL=https://your-inference-api.example/v2/chat/completions
CLIENT_API_KEY=your-client-api-key
CLIENT_ID=giftgenerator

# Optional: omit to let the backend select a provider.
PROVIDER=
```

`BACKEND_API_URL` must be an HTTPS URL ending in `/v2/chat/completions`. Localhost HTTP URLs are accepted for development. The browser never receives these values; `/api/generate-gifts` calls the backend from the Next.js server.

## App configuration

The active experience reads these optional public variables:

```dotenv
NEXT_PUBLIC_PAGE_REDIRECT=/v2
NEXT_PUBLIC_GIFT_RECIPIENTS=mom:🧑‍🦳,dad:🧔,friend:🧑
NEXT_PUBLIC_GIFT_OCCASIONS=birthday:🎂,anniversary:💑
NEXT_PUBLIC_GIFT_VIBES=funny:😂,sentimental:💌,practical:🛠️
NEXT_PUBLIC_NUM_GIFTS_TO_GENERATE=6
NEXT_PUBLIC_TOP_GIFTS=5
```

Firebase Admin credentials are required for Firestore fallback results and feedback storage. See [DB.md](./DB.md) for the database setup.

## Commands

```bash
npm run dev
npm run build
```

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase Admin, and a server-side OpenAI-compatible inference API.
