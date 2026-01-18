# File: api/models.py
from typing import Literal
from pydantic import BaseModel, Field


class PortfolioPosition(BaseModel):
    """
    Represents a single position in a portfolio.
    
    Example:
        >>> position = PortfolioPosition(ticker="AAPL", quantity=100.0, asset_class="Equity")
    """
    ticker: str = Field(..., description="Stock ticker symbol (e.g., AAPL, MSFT)")
    quantity: float = Field(..., gt=0, description="Number of shares/units held")
    asset_class: Literal['Equity', 'Bond', 'Cash'] = Field(..., description="Asset classification")


class Portfolio(BaseModel):
    """
    Represents a complete portfolio with multiple positions.
    
    Example:
        >>> portfolio = Portfolio(positions=[
        ...     PortfolioPosition(ticker="AAPL", quantity=100, asset_class="Equity"),
        ...     PortfolioPosition(ticker="MSFT", quantity=50, asset_class="Equity")
        ... ])
    """
    positions: list[PortfolioPosition] = Field(..., min_length=1, description="List of portfolio positions")


class Scenario(BaseModel):
    """
    Represents a stress-test scenario with factor shocks.
    
    Example:
        >>> scenario = Scenario(
        ...     name="Market Crash",
        ...     factor_shocks={'^GSPC': -0.15, 'AAPL': -0.20}
        ... )
    """
    name: str = Field(..., description="Scenario name")
    factor_shocks: dict[str, float] = Field(
        default_factory=dict,
        description="Ticker-to-shock mapping (e.g., {'^GSPC': -0.15})"
    )


class RiskDriver(BaseModel):
    """
    Represents a single risk contributor.
    
    Example:
        >>> driver = RiskDriver(name="AAPL", contribution_pct=40.5)
    """
    name: str = Field(..., description="Asset/ticker name")
    contribution_pct: float = Field(..., description="Percentage contribution to total risk")


class ExplanationOutput(BaseModel):
    """
    Natural language explanation of risk analysis.
    
    Example:
        >>> explanation = ExplanationOutput(
        ...     summary="Your portfolio is heavily concentrated in Tech.",
        ...     top_drivers=[RiskDriver(name="AAPL", contribution_pct=40.5)]
        ... )
    """
    summary: str = Field(..., description="Human-readable risk summary")
    top_drivers: list[RiskDriver] = Field(..., description="Top 3 risk contributors")


class PerformanceMetrics(BaseModel):
    """
    Risk-adjusted performance metrics.
    
    Example:
        >>> metrics = PerformanceMetrics(
        ...     sharpe_ratio=1.25,
        ...     sortino_ratio=1.45,
        ...     annualized_return=0.12,
        ...     risk_free_rate=0.04
        ... )
    """
    sharpe_ratio: float = Field(..., description="Sharpe ratio (return per unit of risk)")
    sortino_ratio: float = Field(..., description="Sortino ratio (return per unit of downside risk)")
    annualized_return: float = Field(..., description="Annualized portfolio return")
    risk_free_rate: float = Field(..., description="Risk-free rate used in calculations")


class CorrelationData(BaseModel):
    """
    Asset correlation matrix data.
    
    Example:
        >>> corr = CorrelationData(
        ...     tickers=['AAPL', 'MSFT'],
        ...     correlations=[...]
        ... )
    """
    tickers: list[str] = Field(..., description="List of ticker symbols")
    correlations: list[dict] = Field(..., description="Correlation values for each ticker pair")


class BenchmarkComparison(BaseModel):
    """
    Benchmark comparison metrics (vs S&P 500).
    
    Example:
        >>> benchmark = BenchmarkComparison(
        ...     benchmark_ticker='^GSPC',
        ...     benchmark_return=0.182,
        ...     alpha=0.141,
        ...     beta=1.24
        ... )
    """
    benchmark_ticker: str = Field(..., description="Benchmark ticker symbol")
    benchmark_return: float = Field(..., description="Benchmark annualized return")
    benchmark_volatility: float = Field(..., description="Benchmark annualized volatility")
    benchmark_sharpe: float = Field(..., description="Benchmark Sharpe ratio")
    alpha: float = Field(..., description="Portfolio alpha (excess return)")
    beta: float = Field(..., description="Portfolio beta (market sensitivity)")
    correlation: float = Field(..., description="Correlation with benchmark")


class RiskOutput(BaseModel):
    """
    Complete risk analysis output.
    
    Example:
        >>> output = RiskOutput(
        ...     total_value=100000.0,
        ...     volatility_annualized=0.25,
        ...     var_95=15000.0,
        ...     positions=[{"ticker": "AAPL", "value": 50000, "risk_contribution": 0.45}],
        ...     explanation=ExplanationOutput(summary="...", top_drivers=[...]),
        ...     performance=PerformanceMetrics(sharpe_ratio=1.2, sortino_ratio=1.4, annualized_return=0.12, risk_free_rate=0.04),
        ...     correlation_matrix=CorrelationData(tickers=[...], correlations=[...])
        ... )
    """
    total_value: float = Field(..., description="Total portfolio value in USD")
    volatility_annualized: float = Field(..., description="Annualized portfolio volatility (std dev)")
    var_95: float = Field(..., description="Value at Risk at 95% confidence (1-day)")
    positions: list[dict] = Field(..., description="Position-level risk breakdown")
    explanation: ExplanationOutput = Field(..., description="Natural language explanation")
    performance: dict = Field(..., description="Performance metrics (Sharpe, Sortino, returns)")
    correlation_matrix: dict = Field(..., description="Asset correlation matrix")
    benchmark: dict | None = Field(None, description="Benchmark comparison (vs S&P 500)")
    monte_carlo: dict | None = Field(None, description="Monte Carlo VaR simulation results")
    drawdown: dict | None = Field(None, description="Maximum drawdown metrics and time series")
    backtest: dict | None = Field(None, description="Growth of $10k backtest data")
    sector_breakdown: dict | None = Field(None, description="Sector and country exposure")


class BacktestData(BaseModel):
    dates: list[str]
    portfolio: list[float]
    benchmark: list[float]

class SectorBreakdown(BaseModel):
    sectors: dict[str, float]
    countries: dict[str, float]


class OptimalPortfolio(BaseModel):
    weights: dict
    return_metric: float = Field(..., alias="return")
    volatility: float
    sharpe: float

class FrontierData(BaseModel):
    returns: list[float]
    volatility: list[float]

class TradeRecommendation(BaseModel):
    ticker: str
    action: str
    shares: float
    amount: float
    price: float
    current_weight: float
    target_weight: float

class OptimizationResponse(BaseModel):
    frontier: FrontierData
    max_sharpe_portfolio: OptimalPortfolio
    min_vol_portfolio: OptimalPortfolio
    rebalancing_trades: list[TradeRecommendation] | None = None


class AsyncTaskResponse(BaseModel):
    """
    Response for async task submission.
    
    Example:
        >>> response = AsyncTaskResponse(task_id="abc-123-def")
    """
    task_id: str = Field(..., description="Celery task ID for status tracking")


# --- Django ORM Models (Persistence) ---
from django.db import models as db_models
from django.contrib.auth.models import User

class SavedPortfolio(db_models.Model):
    user = db_models.ForeignKey(User, on_delete=db_models.CASCADE, related_name='portfolios')
    name = db_models.CharField(max_length=255)
    created_at = db_models.DateTimeField(auto_now_add=True)
    updated_at = db_models.DateTimeField(auto_now=True)
    description = db_models.TextField(blank=True, null=True)
    
    # Store positions as JSON
    positions = db_models.JSONField(default=list)

    def __str__(self):
        return f"{self.user.username} - {self.name}"
