# HBARWatch

A comprehensive Hedera network explorer and portfolio tracker that provides wallet analytics, social features, and real-time insights for the Hedera ecosystem.

This is a modern Vite + React + TypeScript application styled with Tailwind CSS and shadcn/ui. Data fetching is powered by TanStack Query with React Query patterns, charts are built with Recharts, and wallet integration uses Buidler Labs HashGraph React Wallets. The repository includes serverless API routes and GraphQL integration.


🔍 Problem Statement

African retail users and crypto operators increasingly rely on blockchain-based finance — yet visibility into on-chain assets remains limited.

Barriers include:

Difficulty viewing full portfolio value across tokens and NFTs

Lack of transparent token supply and concentration insights

No easy way to evaluate counterparty risk when transacting

Tools like HashScan show raw data but lack actionable analytics

This reduces confidence in on-chain finance and makes informed participation in Web3 difficult for individuals, traders, and African fintech builders.

🧠 Hedera-Based Solution

HbarWatch is a smart, public explorer and portfolio tracker that turns raw Hedera network data into financial intelligence.

It enables African users to:
✅ Understand true portfolio value through real-time pricing
✅ Identify risky or centralized tokens via supply concentration analytics
✅ Improve decision-making with net worth history & diversification metrics
✅ Detect whale inflows/outflows affecting market risk
✅ Build trust through NFT + token verification and metadata
✅ Receive real-time notifications of activity on watched accounts

By making on-chain assets transparent, contextualized, and trustworthy, HbarWatch supports responsible growth of decentralized finance across Africa.

🏗️ Hedera Services Used
Hedera Service	Implementation in HbarWatch
HTS – Hedera Token Service	Token balance tracking, token metadata, supply + holder analytics
Mirror Node APIs (Data Layer)	Portfolio valuation, transaction history, NFT inventory, counterparty mapping, follow/alert system
WalletConnect (HashPack)	Secure wallet login and ownership verification (Ed25519 challenge-response)
Serverless API on Hedera Data	Historical snapshots for net worth tracking and trending insights

🔐 All reads are trustless — no centralized indexing required.

🧩 Hackathon Track

✅ On-chain Finance & Real-World Assets and DLT for Operations

HbarWatch aligns by enabling transparent financial operations, improved asset risk evaluation, and informed participation in Hedera-based economies.





## Features

### 🔍 **Portfolio & Analytics**
- **Net Worth Tracking**: Real-time portfolio valuation with historical charts
- **Portfolio Diversification**: Visual breakdown of token holdings and allocations
- **Token Price Tracking**: Live prices and 24h changes from SaucerSwap API
- **Transaction History**: Comprehensive transaction analysis and filtering
- **Account Balance Overview**: Multi-token balance display with USD values

### 🏆 **Top Holders & Discovery**
- **Top Token Holders**: Explore largest holders for any Hedera token
- **Token Information**: Comprehensive token metadata from SaucerSwap
- **Account Search**: Quick navigation and account lookup
- **NFT Gallery**: View and explore NFT collections with detailed modals

### 🔔 **Social & Notifications**
- **Follow System**: Follow other Hedera accounts and track their activity
- **Real-time Notifications**: Get notified of followed accounts' transactions
- **Notification Center**: Comprehensive notification management with filtering
- **Social Authentication**: Secure wallet-based login with JWT tokens

### 🔐 **Wallet Integration**
- **HashPack Support**: HashPack WalletConnect integration via Buidler Labs
- **Secure Authentication**: Ed25519 signature verification with challenge-response
- **Session Management**: JWT-based authentication with automatic token refresh
- **Wallet Connection Modal**: Unified wallet connection experience

### 📊 **Advanced Features**
<!-- - **Counterparty Mapping**: Transaction counterparty identification and labeling -->
- **Watchlist Management**: Track favorite accounts and tokens
- **Dark Mode Support**: Full theme switching with system preference detection
- **Responsive Design**: Mobile-first responsive UI across all devices

## Tech Stack

### **Frontend**
- **Framework**: Vite, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state
- **Charts**: Recharts for data visualization
- **Routing**: React Router DOM
- **Wallet Integration**: Buidler Labs HashGraph React Wallets
- **Forms**: React Hook Form with Zod validation

### **Backend & APIs**
- **Serverless Functions**: Vercel serverless functions in `/api` directory
- **GraphQL**: Hasura GraphQL endpoint for social features
- **External APIs**: SaucerSwap API, Hedera Mirror Node API, CoinGecko API
- **Authentication**: JWT tokens with Ed25519 signature verification
- **Caching**: Redis for session management and API response caching

### **Development & Deployment**
- **Build Tool**: Vite with SWC for fast compilation
- **Linting**: ESLint with TypeScript support
- **Analytics**: Vercel Analytics and Speed Insights
- **Deployment**: Vercel with automatic serverless function deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Required for GraphQL social features
VITE_HASURA_GRAPHQL_ENDPOINT=https://hbarwatch.hasura.app/v1/graphql

# Required for SaucerSwap API (server-side only)
SAUCERSWAP_KEY=875e1017-87b8-4b12-8301-6aa1f1aa073b

# Optional: Redis connection for caching (production)
REDIS_URL=your_redis_connection_string
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

## Scripts

- `npm run dev` — Start the Vite dev server
- `npm run build` — Build for production (optimized)
- `npm run build:dev` — Build for development mode
- `npm run preview` — Preview the production build locally
- `npm run lint` — Lint the codebase with ESLint

## Project Structure

```
.
├─ api/                           # Serverless API routes
│  ├─ admin/                      # Admin utilities (refresh snapshots)
│  ├─ auth/                       # Authentication endpoints (challenge, login)
│  ├─ cron/                       # Scheduled jobs (balance snapshots, transaction polling)
│  ├─ tokens/                     # Token-related APIs (info, prices, autocomplete, top-holders)
│  ├─ counterparty-map.ts         # Transaction counterparty mapping
│  └─ networth.ts                 # Net worth calculation endpoint
├─ public/                        # Static assets
├─ src/
│  ├─ components/                 # React components
│  │  ├─ ui/                      # shadcn/ui base components
│  │  ├─ AccountBalance.tsx       # Account balance display
│  │  ├─ AccountSearch.tsx        # Account search functionality
│  │  ├─ CounterpartyMap.tsx      # Transaction counterparty visualization
│  │  ├─ FollowButton.tsx         # Social follow functionality
│  │  ├─ HederaExplorer.tsx       # Main account explorer page
│  │  ├─ Navigation.tsx           # App navigation header
│  │  ├─ NetWorthChart.tsx        # Portfolio value charts
│  │  ├─ NotificationsCenter.tsx  # Notification management
│  │  ├─ TokenList.tsx            # Token holdings display
│  │  ├─ TransactionHistory.tsx   # Transaction list and filtering
│  │  ├─ WalletConnect.tsx        # Wallet connection interface
│  │  └─ Watchlist.tsx            # Account watchlist management
│  ├─ hooks/                      # Custom React hooks
│  │  ├─ useAuth.ts               # Authentication state management
│  │  ├─ useWalletAuth.ts         # Wallet connection and auth flow
│  │  ├─ useFollowedAccounts.ts   # Social following functionality
│  │  ├─ use-mobile.tsx           # Mobile device detection
│  │  └─ use-toast.ts             # Toast notification system
│  ├─ lib/                        # Utility functions
│  │  ├─ format.ts                # Number and date formatting
│  │  ├─ hedera-utils.ts          # Hedera-specific utilities
│  │  └─ top-holders.ts           # Top holders data processing
│  ├─ mutations/                  # GraphQL mutations (React Query)
│  │  └─ index.ts                 # Follow, unfollow, user management
│  ├─ pages/                      # Route components
│  │  ├─ Landing.tsx              # Homepage
│  │  ├─ NotificationsPage.tsx    # Full notifications interface
│  │  ├─ TopHoldersPage.tsx       # Top holders explorer
│  │  └─ PremiumPage.tsx          # Premium features page
│  ├─ providers/                  # React context providers
│  │  └─ ReactWalletsProvider.tsx # Buidler Labs wallet provider
│  ├─ queries/                    # Data fetching (React Query)
│  │  └─ index.ts                 # Mirror Node, GraphQL, and SaucerSwap queries
│  ├─ App.tsx                     # Main app component with routing
│  ├─ main.tsx                    # App entry point
│  └─ index.css                   # Global styles
├─ .env                           # Environment variables
├─ vercel.json                    # Vercel deployment config with cron jobs
├─ tailwind.config.ts             # Tailwind CSS configuration
├─ vite.config.ts                 # Vite build configuration
└─ package.json                   # Dependencies and scripts
```

## API Endpoints

The application includes several serverless API endpoints:

### **Authentication**
- `POST /api/auth/challenge` - Generate authentication challenge
- `POST /api/auth/login` - Verify signature and issue JWT token

### **Token Data**
- `GET /api/tokens/info` - Token metadata from SaucerSwap
- `GET /api/tokens/prices` - Current token prices
- `GET /api/tokens/price-changes` - 24h price changes
- `GET /api/tokens/autocomplete` - Token search autocomplete
- `GET /api/tokens/top-holders` - Top token holders analysis

### **Portfolio & Analytics**
- `GET /api/networth` - Account net worth calculation
- `GET /api/counterparty-map` - Transaction counterparty mapping

### **Scheduled Jobs (Cron)**
- `POST /api/cron/snapshot-balances` - Daily balance snapshots (00:00 UTC)
- `POST /api/cron/poll-transactions` - Transaction polling (every 15 minutes)

### **Admin**
- `POST /api/admin/refresh-snapshots` - Manual snapshot refresh

## Development Guidelines

### **Architecture Patterns**
- **React Query**: Use `useQuery` for data fetching, `useMutation` for state changes
- **Component Structure**: Follow shadcn/ui patterns for consistent styling
- **Authentication**: Use `useAuth` and `useWalletAuth` hooks for wallet integration
- **Error Handling**: Implement proper error boundaries and toast notifications

### **Code Organization**
- **Queries**: Place all data fetching logic in `src/queries/index.ts`
- **Mutations**: Place all GraphQL mutations in `src/mutations/index.ts`
- **Components**: Keep components focused and reusable, extract complex logic to hooks
- **Types**: Define TypeScript interfaces for all API responses and component props

### **Performance Considerations**
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Query Caching**: Configure appropriate stale times for different data types
- **Bundle Optimization**: Lazy load pages and heavy components when possible

## Key Dependencies

### **Core Framework**
- `react` (18.3.1) - React framework
- `typescript` (5.8.3) - TypeScript support
- `vite` (5.4.19) - Build tool and dev server

### **UI & Styling**
- `tailwindcss` (3.4.17) - Utility-first CSS framework
- `@radix-ui/*` - Accessible UI primitives (40+ components)
- `lucide-react` (0.462.0) - Icon library
- `next-themes` (0.3.0) - Theme switching

### **State Management & Data**
- `@tanstack/react-query` (5.83.0) - Server state management
- `react-hook-form` (7.61.1) - Form handling
- `zod` (3.25.76) - Schema validation

### **Hedera & Blockchain**
- `@buidlerlabs/hashgraph-react-wallets` (2.5.0) - Wallet integration
- `@hashgraph/sdk` (2.73.1) - Hedera SDK
- `hashconnect` (3.0.13) - HashConnect protocol

### **Charts & Visualization**
- `recharts` (2.15.4) - Chart library
- `date-fns` (3.6.0) - Date utilities

### **Backend & APIs**
- `ioredis` (5.7.0) - Redis client
- `redis` (5.8.2) - Redis utilities

## Routes & Navigation

The application includes the following routes:

- `/` - Landing page with account search
- `/explorer` - Account explorer (redirects to landing)
- `/explorer/:accountId` - Account details and portfolio
- `/top-holders` - Top token holders explorer
- `/notifications` - Notification center (requires authentication)
- `/premium` - Premium features page
- `/waitlist` - Waitlist signup page

## Authentication Flow

1. **Wallet Connection**: User connects Hedera wallet (HashPack, Blade, WalletConnect)
2. **Challenge Generation**: Frontend requests challenge from `/api/auth/challenge`
3. **Message Signing**: User signs challenge message with wallet
4. **Signature Verification**: Backend verifies Ed25519 signature via `/api/auth/login`
5. **JWT Issuance**: Valid signature results in JWT token for GraphQL access
6. **Session Management**: JWT stored in localStorage with automatic refresh

## GraphQL Integration

The app uses Hasura GraphQL for social features:

### **Queries**
- User profiles and account information
- Follow relationships and social graphs
- Real-time notifications for followed accounts
- Notification read/unread status

### **Mutations**
- Follow/unfollow accounts
- Mark notifications as read
- Update user profiles
- Account creation and management

### **Authentication Guards**
All GraphQL operations require valid JWT token and wallet connection.

**Built with ❤️ for the Hedera ecosystem**
