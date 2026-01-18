# File: api/api.py
from ninja import NinjaAPI
from ninja.errors import HttpError
from celery.result import AsyncResult
from api.models import Portfolio, Scenario, RiskOutput, AsyncTaskResponse, OptimizationResponse
from api.models import Portfolio, Scenario, RiskOutput, AsyncTaskResponse, OptimizationResponse
from api.risk_engine import RiskCalculator, MarketData, fetch_benchmark_data
from api.tasks import calculate_risk_async
from api.scenarios import get_all_scenarios, get_scenario_impact
import celery

api = NinjaAPI(
    title="RiskLens API",
    version="1.0.0",
    description="Portfolio risk analysis with real-time market data and scenario testing"
)


@api.post("/analyze", response=RiskOutput, tags=["Risk Analysis"])
def analyze_portfolio(
    request,
    portfolio: Portfolio,
    scenario: Scenario | None = None,
    period: str = '1Y'
):
    """
    Synchronously analyze portfolio risk metrics.
    
    Args:
        request: Django request object
        portfolio: Portfolio with positions
        scenario: Optional stress-test scenario
        period: Time period for analysis (1M, 3M, 6M, 1Y, 3Y, 5Y, YTD)
        
    Returns:
        RiskOutput with comprehensive risk metrics
        
    Raises:
        HttpError: 400 if market data fails or invalid tickers
        
    Example:
        POST /api/analyze?period=3M
        {
            "portfolio": {
                "positions": [
                    {"ticker": "AAPL", "quantity": 100, "asset_class": "Equity"},
                    {"ticker": "MSFT", "quantity": 50, "asset_class": "Equity"}
                ]
            }
        }
    """
    try:
        # Pre-fetch data for enhanced analytics
        md = MarketData()
        tickers = [p.ticker for p in portfolio.positions]
        
        # 1. Fetch Sector Data (Metadata)
        sector_data = md.get_asset_metadata(tickers)
        
        # 2. Fetch Benchmark Data (S&P 500)
        benchmark_data = fetch_benchmark_data('^GSPC', period=period)
        
        # 3. Calculate Risk with enhanced data
        calculator = RiskCalculator()
        result = calculator.calculate_risk(
            portfolio, 
            scenario, 
            period=period,
            benchmark_data=benchmark_data,
            sector_data=sector_data
        )
        return result
    except ValueError as e:
        raise HttpError(400, f"Risk calculation failed: {str(e)}")
    except Exception as e:
        raise HttpError(500, f"Internal server error: {str(e)}")


@api.post("/analyze-async", response=AsyncTaskResponse, tags=["Risk Analysis"])
def analyze_portfolio_async(request, portfolio: Portfolio, scenario: Scenario | None = None):
    """
    Asynchronously analyze portfolio risk metrics (for long-running scenarios).
    
    Args:
        request: Django request object
        portfolio: Portfolio with positions
        scenario: Optional stress-test scenario
        
    Returns:
        AsyncTaskResponse with Celery task ID
        
    Example:
        POST /api/analyze-async
        {
            "portfolio": {
                "positions": [
                    {"ticker": "AAPL", "quantity": 100, "asset_class": "Equity"}
                ]
            }
        }
        
        Response:
        {
            "task_id": "abc-123-def-456"
        }
    """
    try:
        # Serialize to JSON
        portfolio_json = portfolio.model_dump_json()
        scenario_json = scenario.model_dump_json() if scenario else None
        
        # Submit to Celery
        task = calculate_risk_async.delay(portfolio_json, scenario_json)
        
        return AsyncTaskResponse(task_id=task.id)
    except Exception as e:
        raise HttpError(500, f"Failed to queue task: {str(e)}")


@api.get("/task/{task_id}", tags=["Task Management"])
def get_task_status(request, task_id: str):
    """
    Check the status of an async risk calculation task.
    
    Args:
        request: Django request object
        task_id: Celery task ID from /analyze-async
        
    Returns:
        Task status and result (if complete)
        
    Example:
        GET /api/task/abc-123-def-456
        
        Response (pending):
        {
            "task_id": "abc-123-def-456",
            "status": "PENDING"
        }
        
        Response (complete):
        {
            "task_id": "abc-123-def-456",
            "status": "SUCCESS",
            "result": { ... RiskOutput ... }
        }
    """
    from celery.result import AsyncResult
    
    task = AsyncResult(task_id)
    
    response = {
        "task_id": task_id,
        "status": task.status,
    }
    
    if task.ready():
        if task.successful():
            response["result"] = task.result
        else:
            response["error"] = str(task.info)
    
    return response


@api.get("/scenarios", tags=["Scenarios"])
def list_scenarios(request):
    """
    Get all available historical crisis scenarios.
    
    Returns:
        List of scenario metadata
        
    Example:
        GET /api/scenarios
        
        Response:
        [
            {
                "id": "2008_financial_crisis",
                "name": "2008 Financial Crisis",
                "description": "Global financial meltdown...",
                "severity": "extreme",
                "icon": "📉"
            },
            ...
        ]
    """
    return get_all_scenarios()


@api.post("/scenarios/{scenario_id}/test", tags=["Scenarios"])
def test_scenario(request, scenario_id: str, portfolio_value: float):
    """
    Test the impact of a historical scenario on a portfolio.
    
    Args:
        request: Django request object
        scenario_id: ID of the scenario (e.g., '2008_financial_crisis')
        portfolio_value: Current portfolio value in USD
        
    Returns:
        Scenario impact analysis
        
    Raises:
        HttpError: 400 if scenario not found
        
    Example:
        POST /api/scenarios/covid_crash/test
        {
            "portfolio_value": 100000
        }
        
        Response:
        {
            "scenario_name": "COVID-19 Crash",
            "projected_loss": -34000.0,
            "loss_pct": -34.0,
            ...
        }
    """
    try:
        impact = get_scenario_impact(scenario_id, portfolio_value)
        return impact
    except ValueError as e:
        raise HttpError(400, str(e))


@api.get("/validate-ticker/{ticker}", tags=["Validation"])
def validate_ticker(request, ticker: str):
    """
    Validate a stock ticker and return company info.
    """
    try:
        import yfinance as yf
        data = yf.Ticker(ticker)
        # Fast check: 'info' usually fetches basic metadata
        info = data.info
        
        # Check if info is empty or quoteType is invalid
        if not info or info.get('quoteType') == 'NONE' or info.get('symbol') is None:
             return {"valid": False}
        
        # Must have a valid name
        name = info.get('shortName') or info.get('longName')
        if not name:
             return {"valid": False}
             
        # Check for price data (ensure it's a tradeable asset with history)
        # using 'regularMarketPrice', 'currentPrice', or 'previousClose'
        price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        if not price:
             return {"valid": False}
        
        return {
            "valid": True,
            "symbol": info.get('symbol', ticker),
            "name": name,
            "exchange": info.get('exchange', 'Unknown'),
            "currency": info.get('currency', 'USD')
        }
    except Exception:
         return {"valid": False}


@api.post("/optimize", response=OptimizationResponse, tags=["Optimization"])
def optimize_portfolio(request, portfolio: Portfolio, period: str = '1Y'):
    """
    Calculate Efficient Frontier and optimal portfolios.
    
    Args:
        request: Django request object
        portfolio: Portfolio with positions
        period: Time period for historical data
        
    Returns:
        Efficient Frontier points and optimal portfolios
        
    Example:
        POST /api/optimize
        {
            "portfolio": { ... }
        }
    """
    try:
        from api.risk_engine import MarketData
        from api.optimization import calculate_efficient_frontier, calculate_rebalancing_trades
        import numpy as np
        
        # Extract tickers
        tickers = [p.ticker for p in portfolio.positions]
        if not tickers:
            raise ValueError("Portfolio must have at least one position")
            
        # Fetch historical data
        md = MarketData()
        market_data = md.fetch_history(tickers, period=period)
        if market_data['returns'].empty:
            raise ValueError("No market data found for tickers")
            
        # Calculate Efficient Frontier
        result = calculate_efficient_frontier(market_data['returns'])
        
        # Calculate Rebalancing Trades (for Max Sharpe Portfolio)
        total_value = sum(p.quantity * market_data['current_prices'][p.ticker] for p in portfolio.positions)
        target_weights = result['max_sharpe_portfolio']['weights']
        
        trades = calculate_rebalancing_trades(
            current_positions=portfolio.positions,
            target_weights=target_weights,
            total_value=total_value,
            current_prices=market_data['current_prices']
        )
        
        result['rebalancing_trades'] = trades
        
        return result
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, f"Optimization failed: {str(e)}")


@api.get("/health", tags=["System"])
def health_check(request):
    """
    Health check endpoint.
    
    Returns:
        Status message
        
    Example:
        GET /api/health
        
        Response:
        {
            "status": "healthy",
            "service": "RiskLens API"
        }
    """
    return {
        "status": "healthy",
        "service": "RiskLens API",
        "version": "1.0.0"
    }


# --- Portfolio Management APIs ---
from api.auth import GoogleAuthBearer
from api.models import SavedPortfolio
from typing import List
from ninja import Schema
from datetime import datetime

class PortfolioSummary(Schema):
    id: int
    name: str
    updated_at: datetime
    description: str | None = None

class PortfolioInput(Schema):
    name: str
    positions: List[dict]
    description: str | None = None

@api.post("/portfolios", auth=GoogleAuthBearer(), response=PortfolioSummary, tags=["Cloud Sync"])
def save_portfolio(request, payload: PortfolioInput):
    """Save a portfolio to the cloud for the authenticated user."""
    user = request.auth
    
    # Create new portfolio
    p = SavedPortfolio.objects.create(
        user=user,
        name=payload.name,
        positions=payload.positions,
        description=payload.description
    )
    return p

@api.get("/portfolios", auth=GoogleAuthBearer(), response=List[PortfolioSummary], tags=["Cloud Sync"])
def list_portfolios(request):
    """List all saved portfolios for the authenticated user."""
    return SavedPortfolio.objects.filter(user=request.auth).order_by('-updated_at')

@api.get("/portfolios/{id}", auth=GoogleAuthBearer(), tags=["Cloud Sync"])
def get_portfolio(request, id: int):
    """Load a specific portfolio."""
    try:
        p = SavedPortfolio.objects.get(id=id, user=request.auth)
        return {
            "id": p.id,
            "name": p.name,
            "positions": p.positions,
            "description": p.description,
            "updated_at": p.updated_at
        }
    except SavedPortfolio.DoesNotExist:
        raise HttpError(404, "Portfolio not found")

@api.put("/portfolios/{id}", auth=GoogleAuthBearer(), response=PortfolioSummary, tags=["Cloud Sync"])
def update_portfolio(request, id: int, payload: PortfolioInput):
    """Update an existing portfolio."""
    try:
        p = SavedPortfolio.objects.get(id=id, user=request.auth)
        p.name = payload.name
        p.positions = payload.positions
        if payload.description is not None:
             p.description = payload.description
        p.save()
        return p
    except SavedPortfolio.DoesNotExist:
        raise HttpError(404, "Portfolio not found")

@api.delete("/portfolios/{id}", auth=GoogleAuthBearer(), tags=["Cloud Sync"])
def delete_portfolio(request, id: int):
    """Delete a saved portfolio."""
    try:
        p = SavedPortfolio.objects.get(id=id, user=request.auth)
        p.delete()
        return {"success": True}
    except SavedPortfolio.DoesNotExist:
        raise HttpError(404, "Portfolio not found")

