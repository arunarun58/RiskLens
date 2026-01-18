# RiskLens Frontend

Modern, responsive frontend dashboard for portfolio risk analysis built with Next.js 15, TypeScript, and TailwindCSS.

## Features

- 📊 **Interactive Portfolio Builder** - Add/remove positions with real-time validation
- 📈 **Risk Metrics Dashboard** - Total value, volatility, VaR, risk levels
- 🎨 **Beautiful Visualizations** - Bar charts, pie charts, position tables
- ⚡ **Real-Time Analysis** - Connects to Django backend API
- 🎯 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Loading States** - Smooth UX with loading indicators
- ❌ **Error Handling** - User-friendly error messages

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Ensure Backend is Running

Make sure the Django backend is running on `http://localhost:8000`:

```bash
cd ..
venv/bin/python manage.py runserver
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Landing page
│   └── portfolio/
│       └── page.tsx        # Portfolio analysis page
├── components/
│   ├── PortfolioForm.tsx   # Add/edit positions
│   ├── RiskMetrics.tsx     # Risk metric cards
│   └── RiskCharts.tsx      # Charts and visualizations
├── lib/
│   ├── api.ts              # API client
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Helper functions
└── package.json
```

## Usage

1. **Navigate to Portfolio Page**: Click "Analyze Portfolio" or go to `/portfolio`
2. **Add Positions**: Enter ticker symbol, quantity, and asset class
3. **Analyze**: Click "Analyze Portfolio" to fetch data and calculate risk
4. **View Results**: See metrics, charts, and explanations

## API Configuration

The frontend connects to the backend API at `http://localhost:8000` by default.

To change this, set the environment variable:

```bash
NEXT_PUBLIC_API_URL=http://your-api-url
```

## Build for Production

```bash
npm run build
npm start
```

## Screenshots

### Landing Page
- Hero section with feature highlights
- Quick start guide
- Call-to-action buttons

### Portfolio Analysis
- Left sidebar: Portfolio form
- Right panel: Risk metrics, charts, explanations
- Responsive grid layout

## Components

### PortfolioForm
- Add position inputs (ticker, quantity, asset class)
- Position list with delete functionality
- Analyze button with loading state

### RiskMetrics
- 4 metric cards: Total Value, Volatility, VaR, VaR %
- Color-coded risk levels
- Icon indicators

### RiskCharts
- Position values bar chart
- Risk contribution pie chart
- Individual volatility comparison
- Detailed position table

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

## Next Steps

- [ ] Add PDF export functionality
- [ ] Implement dark mode toggle
- [ ] Add scenario builder UI
- [ ] Create correlation heatmap
- [ ] Add historical performance charts
- [ ] Implement user authentication
- [ ] Add portfolio save/load functionality

## License

MIT
