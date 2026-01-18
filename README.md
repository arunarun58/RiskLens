# 🚀 RiskLens - Professional Portfolio Risk Analysis

Professional-grade portfolio risk analysis platform with real-time market data, advanced analytics, and beautiful visualizations.

## ✨ Features

### Core Risk Metrics
- **Value at Risk (VaR)**: 95% confidence, 1-day horizon
- **Portfolio Volatility**: Annualized risk measurement
- **Euler Decomposition**: Position-level risk contribution analysis
- **Risk Explanations**: Plain-English summaries with top risk drivers

### Advanced Analytics
- **Sharpe & Sortino Ratios**: Risk-adjusted performance metrics
- **Benchmark Comparison**: Alpha, Beta, and correlation vs S&P 500
- **Correlation Heatmap**: Asset correlation visualization
- **Historical Scenarios**: Stress testing with 4 crisis scenarios
- **Monte Carlo VaR**: 10,000 simulations for accurate tail risk
- **Time Period Selection**: 1M, 3M, 6M, 1Y, 3Y, 5Y, YTD analysis

### User Experience
- **Real-time Data**: Powered by yfinance
- **Interactive Charts**: Built with Recharts
- **Responsive Design**: Works on all devices
- **Professional UI**: Modern, clean interface

## 🏗️ Architecture

### Backend (Django + Django Ninja)
- **Framework**: Django 6.0 with Django Ninja for REST API
- **Risk Engine**: Vectorized NumPy calculations
- **Data Source**: yfinance for real-time market data
- **Monte Carlo**: Multivariate normal distribution simulations

### Frontend (Next.js 16)
- **Framework**: Next.js 16 with Turbopack
- **UI**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **TypeScript**: Full type safety

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Quick Start

1. **Clone and navigate to project**:
```bash
cd /Users/arun/Desktop/Exposure
```

2. **Backend Setup**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

3. **Frontend Setup**:
```bash
cd frontend
npm install
```

4. **Start Everything**:
```bash
# From the Exposure directory
./start.sh
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

## 🎯 Usage

### Quick Analysis

1. Navigate to http://localhost:3000/portfolio
2. Select your time period (1M, 3M, 6M, 1Y, 3Y, 5Y, YTD)
3. Add positions:
   - Ticker symbol (e.g., AAPL, MSFT, GOOGL)
   - Quantity
   - Asset class (Equity, Bond, Cash)
4. Click "Analyze Portfolio"

### API Usage

```bash
# Analyze portfolio
curl -X POST http://localhost:8000/api/analyze?period=1Y \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": {
      "positions": [
        {"ticker": "AAPL", "quantity": 100, "asset_class": "Equity"},
        {"ticker": "MSFT", "quantity": 50, "asset_class": "Equity"}
      ]
    }
  }'

# Get historical scenarios
curl http://localhost:8000/api/scenarios

# Test scenario impact
curl -X POST http://localhost:8000/api/scenarios/covid_crash/test?portfolio_value=100000
```

## 📊 What You Get

### Risk Metrics Dashboard
- Total portfolio value
- Annualized volatility
- Value at Risk (95%)
- Position-level breakdown

### Performance Analysis
- Sharpe Ratio (risk-adjusted return)
- Sortino Ratio (downside risk)
- Annualized return

### Benchmark Comparison
- Alpha (excess return vs S&P 500)
- Beta (market sensitivity)
- Correlation with benchmark

### Monte Carlo Simulation
- 10,000 portfolio simulations
- VaR and CVaR (Expected Shortfall)
- Distribution visualization
- Comparison with parametric VaR

### Correlation Analysis
- Interactive heatmap
- Asset correlation matrix
- Color-coded visualization

### Stress Testing
- 2008 Financial Crisis
- COVID-19 Crash (March 2020)
- Dot-com Bubble Burst (2000)
- 1987 Black Monday

## 🛠️ Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Stop Servers
```bash
./stop.sh
```

## 📁 Project Structure

```
Exposure/
├── backend/               # Django backend
│   ├── api/
│   │   ├── risk_engine.py    # Core risk calculations
│   │   ├── monte_carlo.py    # Monte Carlo simulations
│   │   ├── scenarios.py      # Historical scenarios
│   │   ├── models.py         # Pydantic models
│   │   └── api.py            # Django Ninja endpoints
│   ├── risklens/
│   │   └── settings.py       # Django settings
│   └── manage.py
├── frontend/              # Next.js frontend
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   └── portfolio/
│   │       └── page.tsx      # Portfolio analysis
│   ├── components/
│   │   ├── RiskMetrics.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   ├── BenchmarkComparison.tsx
│   │   ├── MonteCarloVaR.tsx
│   │   ├── CorrelationHeatmap.tsx
│   │   └── ScenarioTester.tsx
│   └── lib/
│       ├── types.ts          # TypeScript types
│       └── utils.ts          # Utility functions
├── start.sh               # Start both servers
├── stop.sh                # Stop both servers
└── README.md
```

## 🔬 Technical Details

### Risk Calculations
- **Parametric VaR**: Normal distribution assumption, 95% confidence
- **Monte Carlo VaR**: 10,000 simulations using multivariate normal
- **Euler Decomposition**: Marginal risk contribution per position
- **Sharpe Ratio**: (Return - Risk-free) / Volatility
- **Sortino Ratio**: (Return - Risk-free) / Downside Volatility

### Data Processing
- Historical data from yfinance
- Vectorized NumPy operations for performance
- Pandas for time series analysis
- Real-time price updates

## 🚀 Performance

- **Backend**: <100ms for standard portfolio analysis
- **Monte Carlo**: ~2-3 seconds for 10,000 simulations
- **Frontend**: Optimized with Next.js Turbopack
- **Data Caching**: Efficient market data retrieval

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

This is a professional portfolio risk analysis tool. Contributions welcome!

## 📧 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ using Django, Next.js, and modern web technologies**
