# Hedgie Wealth View

Visualize wallet net worth, top token holders, and on-chain insights for the Hedera network.

This is a Vite + React + TypeScript app styled with Tailwind CSS and shadcn/ui. Data fetching is powered by TanStack Query, and charts are built with Recharts. The repository also includes serverless API routes under the `api/` directory.

## Features

- Net worth charting and portfolio breakdown
- Top token holders explorer
- Wallet/account search and quick navigation
- Responsive UI with dark mode support

## Tech Stack

- Vite, React 18, TypeScript
- Tailwind CSS, shadcn/ui, Radix UI primitives
- TanStack Query
- Recharts
- Vercel Analytics / Speed Insights (optional)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will start on the port Vite reports (typically http://localhost:5173).

### Production Build

```bash
npm run build
npm run preview
```

## Environment Variables

No environment variables are required for basic development. If you introduce third-party services later, add them to a local `.env` file using the `VITE_` prefix for client-side usage.

## Scripts

- `npm run dev` — Start the Vite dev server
- `npm run build` — Build for production
- `npm run preview` — Preview the production build locally
- `npm run lint` — Lint the codebase

## Project Structure

```
.
├─ api/                      # Serverless API routes (e.g., networth, tokens)
├─ public/                   # Static assets
├─ src/
│  ├─ components/            # UI components (e.g., NetWorthChart, Navigation)
│  ├─ hooks/                 # Reusable hooks (e.g., use-toast, use-on-screen)
│  ├─ lib/                   # Helpers and utilities
│  ├─ pages/                 # Top-level pages and views
│  └─ queries/               # Data fetching/query utilities
├─ index.html                # Vite HTML entry
├─ tailwind.config.ts        # Tailwind config
├─ vite.config.ts            # Vite config
└─ README.md
```

## Development Notes

- Component library is based on shadcn/ui; new components should follow existing patterns in `src/components/`
- For data fetching, prefer TanStack Query patterns (query keys, caching, invalidation)
- Charts use Recharts; keep datasets typed and memoized for performance

## Deployment

This project is compatible with static hosting or Vercel.

### Vercel

1. Push the repository to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Build command: `npm run build`
4. Output directory: `dist`

If you rely on any functions in `api/`, those will be deployed as serverless functions on Vercel automatically.

### Static Hosting (Netlify, Cloudflare Pages, etc.)

1. Build locally or via CI: `npm run build`
2. Publish the `dist/` directory

## Contributing

1. Create a feature branch
2. Commit changes with clear messages
3. Open a Pull Request

## License

This project is licensed under the MIT License. See `LICENSE` if present, or include one in the repository.
