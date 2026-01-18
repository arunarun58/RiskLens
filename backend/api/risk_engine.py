# File: api/risk_engine.py
import numpy as np
import pandas as pd
import yfinance as yf
from typing import Optional
from scipy import stats
from api.models import Portfolio, Scenario, RiskOutput, ExplanationOutput, RiskDriver


class MarketData:
    """
    Handles fetching and processing market data via yfinance.
    
    Example:
        >>> md = MarketData()
        >>> data = md.fetch_history(['AAPL', 'MSFT'])
        >>> print(data.keys())  # dict_keys(['returns', 'cov_matrix', 'mean_returns', 'current_prices'])
    """
    
    # Period mapping for user-friendly periods
    PERIOD_MAP = {
        '1M': '1mo',
        '3M': '3mo',
        '6M': '6mo',
        '1Y': '1y',
        '3Y': '3y',
        '5Y': '5y',
        'YTD': 'ytd',
        'MAX': 'max'
    }
    
    def fetch_history(self, tickers: list[str], period: str = '1Y') -> dict:
        """
        Fetch historical price data and compute returns/covariance.
        
        Args:
            tickers: List of ticker symbols
            period: Historical period (1M, 3M, 6M, 1Y, 3Y, 5Y, YTD, MAX)
            
        Returns:
            Dictionary containing returns, covariance matrix, mean returns, and current prices
            
        Raises:
            ValueError: If all tickers fail to download or no valid data is retrieved
            
        Example:
            >>> md = MarketData()
            >>> data = md.fetch_history(['AAPL', 'MSFT'], period='3M')
            >>> print(data['current_prices'])
        """
        if not tickers:
            raise ValueError("Ticker list cannot be empty")
        
        # Convert user-friendly period to yfinance format
        yf_period = self.PERIOD_MAP.get(period, period)
        
        # Download adjusted close prices
        try:
            df = yf.download(
                tickers,
                period=yf_period,
                progress=False,
                auto_adjust=True,
                threads=True
            )['Close']
        except Exception as e:
            raise ValueError(f"Failed to download data from yfinance: {str(e)}")
        
        # Handle single ticker case (yfinance returns Series instead of DataFrame)
        if isinstance(df, pd.Series):
            df = df.to_frame(name=tickers[0])
        
        # Drop tickers with all NaN values
        df = df.dropna(axis=1, how='all')
        
        if df.empty or len(df.columns) == 0:
            raise ValueError(f"No valid data retrieved for tickers: {tickers}")
        
        # Forward fill missing values
        df = df.fillna(method='ffill').dropna()
        
        if df.empty:
            raise ValueError("Insufficient data after cleaning")
        
        # Get current prices (last available price)
        current_prices = df.iloc[-1].to_dict()
        
        # Calculate daily returns
        returns = df.pct_change().dropna()
        
        # Compute covariance matrix (annualized: 252 trading days)
        cov_matrix = returns.cov() * 252
        
        # Compute mean returns (annualized)
        mean_returns = returns.mean() * 252
        
        return {
            'returns': returns,
            'cov_matrix': cov_matrix,
            'mean_returns': mean_returns,
            'current_prices': current_prices,
            'valid_tickers': list(df.columns)
        }

    def get_asset_metadata(self, tickers: list[str]) -> dict:
        """
        Fetch static metadata (Sector, Country) for tickers.
        """
        metadata = {}
        for ticker in tickers:
            try:
                # yfinance info property makes a network call
                # Note: This is slow. In production, use bulk fetch or cache.
                info = yf.Ticker(ticker).info
                metadata[ticker] = {
                    'sector': info.get('sector', 'Other'),
                    'country': info.get('country', 'Other'),
                    'industry': info.get('industry', 'Other')
                }
            except Exception:
                metadata[ticker] = {'sector': 'Unknown', 'country': 'Unknown'}
        return metadata


def calculate_performance_metrics(
    returns: pd.DataFrame,
    weights: np.ndarray,
    portfolio_return: float,
    portfolio_volatility: float,
    risk_free_rate: float = 0.04
) -> dict:
    """
    Calculate risk-adjusted performance metrics.
    
    Args:
        returns: DataFrame of daily returns
        weights: Portfolio weights vector
        portfolio_return: Annualized portfolio return
        portfolio_volatility: Annualized portfolio volatility
        risk_free_rate: Annual risk-free rate (default: 4%)
        
    Returns:
        dict with sharpe_ratio, sortino_ratio, annualized_return
        
    Example:
        >>> metrics = calculate_performance_metrics(returns, weights, 0.12, 0.18)
        >>> print(f"Sharpe: {metrics['sharpe_ratio']:.2f}")
    """
    # Sharpe Ratio: (Return - Risk Free Rate) / Volatility
    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
    
    # Calculate portfolio returns for Sortino
    portfolio_returns = returns.dot(weights)
    
    # Sortino Ratio: Uses downside deviation instead of total volatility
    downside_returns = portfolio_returns[portfolio_returns < 0]
    if len(downside_returns) > 0:
        downside_deviation = downside_returns.std() * np.sqrt(252)
        sortino_ratio = (portfolio_return - risk_free_rate) / downside_deviation if downside_deviation > 0 else 0
    else:
        sortino_ratio = sharpe_ratio  # No downside, use Sharpe
    
    return {
        'sharpe_ratio': float(sharpe_ratio),
        'sortino_ratio': float(sortino_ratio),
        'annualized_return': float(portfolio_return),
        'risk_free_rate': float(risk_free_rate)
    }


def calculate_correlation_matrix(returns: pd.DataFrame) -> dict:
    """
    Calculate correlation matrix for portfolio assets.
    
    Args:
        returns: DataFrame of daily returns
        
    Returns:
        dict with tickers and correlation values
        
    Example:
        >>> corr_data = calculate_correlation_matrix(returns)
        >>> print(corr_data['tickers'])
    """
    corr_matrix = returns.corr()
    
    # Convert to list of dicts for frontend
    correlations = []
    tickers = list(corr_matrix.columns)
    
    for i, ticker1 in enumerate(tickers):
        for j, ticker2 in enumerate(tickers):
            correlations.append({
                'ticker1': ticker1,
                'ticker2': ticker2,
                'correlation': float(corr_matrix.iloc[i, j])
            })
    
    return {
        'tickers': tickers,
        'correlations': correlations
    }


def calculate_drawdown_metrics(
    returns: pd.DataFrame,
    weights: np.ndarray
) -> dict:
    """
    Calculate maximum drawdown and related metrics.
    
    Args:
        returns: DataFrame of historical returns
        weights: Portfolio weights
        
    Returns:
        Dictionary with drawdown metrics and time series
        
    Example:
        >>> metrics = calculate_drawdown_metrics(returns, weights)
        >>> print(f"Max DD: {metrics['max_drawdown']:.2%}")
    """
    # Calculate portfolio returns
    portfolio_returns = returns.dot(weights)
    
    # Calculate cumulative returns (wealth index)
    cumulative_returns = (1 + portfolio_returns).cumprod()
    
    # Calculate running maximum
    running_max = cumulative_returns.expanding().max()
    
    # Calculate drawdown series
    drawdown = (cumulative_returns - running_max) / running_max
    
    # Find maximum drawdown
    max_drawdown = drawdown.min()
    
    # Find when max drawdown occurred
    max_dd_date = drawdown.idxmin()
    
    # Calculate current drawdown
    current_drawdown = drawdown.iloc[-1]
    
    # Calculate recovery time (days from max DD to recovery)
    recovery_time = 0
    if max_drawdown < 0:
        # Find the peak before max drawdown
        peak_before_dd = running_max.loc[:max_dd_date].idxmax()
        # Find when portfolio recovered (if it did)
        recovery_dates = cumulative_returns[max_dd_date:][
            cumulative_returns[max_dd_date:] >= running_max.loc[peak_before_dd]
        ]
        if len(recovery_dates) > 0:
            recovery_date = recovery_dates.index[0]
            recovery_time = (recovery_date - max_dd_date).days
    
    # Prepare drawdown series for visualization (limit to last 252 days)
    recent_drawdown = drawdown.tail(min(252, len(drawdown)))
    drawdown_series = [
        {
            'date': date.strftime('%Y-%m-%d'),
            'drawdown': float(dd)
        }
        for date, dd in recent_drawdown.items()
    ]
    
    return {
        'max_drawdown': float(max_drawdown),
        'max_drawdown_date': max_dd_date.strftime('%Y-%m-%d') if max_drawdown < 0 else None,
        'current_drawdown': float(current_drawdown),
        'recovery_time_days': int(recovery_time),
        'drawdown_series': drawdown_series
    }


def fetch_benchmark_data(benchmark_ticker: str = '^GSPC', period: str = '1Y') -> dict:
    """
    Fetch benchmark (S&P 500) performance data.
    
    Args:
        benchmark_ticker: Ticker symbol for benchmark (default: S&P 500)
        period: Historical period (1M, 3M, 6M, 1Y, 3Y, 5Y, YTD)
        
    Returns:
        dict with benchmark performance metrics
        
    Example:
        >>> benchmark = fetch_benchmark_data('^GSPC', '3M')
        >>> print(benchmark['annualized_return'])
    """
    # Period mapping
    PERIOD_MAP = {
        '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y',
        '3Y': '3y', '5Y': '5y', 'YTD': 'ytd', 'MAX': 'max'
    }
    yf_period = PERIOD_MAP.get(period, period)
    
    try:
        df = yf.download(benchmark_ticker, period=yf_period, progress=False, auto_adjust=True)['Close']
        returns = df.pct_change().dropna()
        
        annualized_return = returns.mean() * 252
        annualized_volatility = returns.std() * np.sqrt(252)
        sharpe_ratio = (annualized_return - 0.04) / annualized_volatility if annualized_volatility > 0 else 0
        
        return {
            'ticker': benchmark_ticker,
            'annualized_return': float(annualized_return),
            'annualized_volatility': float(annualized_volatility),
            'sharpe_ratio': float(sharpe_ratio),
            'returns': returns
        }
    except Exception as e:
        # Return None if benchmark fetch fails (don't break main analysis)
        return None


def calculate_alpha_beta(
    portfolio_returns: pd.Series,
    benchmark_returns: pd.Series,
    portfolio_return: float,
    benchmark_return: float,
    risk_free_rate: float = 0.04
) -> dict:
    """
    Calculate alpha and beta vs benchmark.
    
    Args:
        portfolio_returns: Portfolio daily returns
        benchmark_returns: Benchmark daily returns
        portfolio_return: Annualized portfolio return
        benchmark_return: Annualized benchmark return
        risk_free_rate: Annual risk-free rate
        
    Returns:
        dict with alpha, beta, and correlation
        
    Example:
        >>> metrics = calculate_alpha_beta(port_returns, bench_returns, 0.32, 0.18)
        >>> print(f"Alpha: {metrics['alpha']:.2%}")
    """
    # Align returns
    aligned = pd.concat([portfolio_returns, benchmark_returns], axis=1).dropna()
    
    if len(aligned) < 2:
        return {'alpha': 0, 'beta': 0, 'correlation': 0}
    
    # Calculate beta (covariance / variance)
    covariance = aligned.cov().iloc[0, 1]
    benchmark_variance = aligned.iloc[:, 1].var()
    beta = covariance / benchmark_variance if benchmark_variance > 0 else 0
    
    # Calculate alpha using CAPM: alpha = portfolio_return - (rf + beta * (benchmark_return - rf))
    alpha = portfolio_return - (risk_free_rate + beta * (benchmark_return - risk_free_rate))
    
    # Calculate correlation
    correlation = aligned.corr().iloc[0, 1]
    
    return {
        'alpha': float(alpha),
        'beta': float(beta),
        'correlation': float(correlation)
    }


class RiskCalculator:
    """
    Performs vectorized portfolio risk calculations.
    
    Example:
        >>> calc = RiskCalculator()
        >>> portfolio = Portfolio(positions=[...])
        >>> result = calc.calculate_risk(portfolio)
    """
    
    def __init__(self):
        self.market_data = MarketData()
    
    def calculate_risk(
        self,
        portfolio: Portfolio,
        scenario: Optional[Scenario] = None,
        period: str = '1Y',
        benchmark_data: dict | None = None,
        sector_data: dict | None = None
    ) -> RiskOutput:
        """
        Calculate comprehensive risk metrics for a portfolio.
        
        Args:
            portfolio: Portfolio object with positions
            scenario: Optional scenario for stress testing
            period: Time period for analysis (1M, 3M, 6M, 1Y, 3Y, 5Y, YTD)
            
        Returns:
            RiskOutput with all risk metrics and explanations
            
        Example:
            >>> from api.models import Portfolio, PortfolioPosition
            >>> portfolio = Portfolio(positions=[
            ...     PortfolioPosition(ticker="AAPL", quantity=100, asset_class="Equity")
            ... ])
            >>> calc = RiskCalculator()
            >>> result = calc.calculate_risk(portfolio, period='3M')
            >>> print(f"Portfolio VaR: ${result.var_95:,.2f}")
        """
        # Extract tickers
        tickers = [pos.ticker for pos in portfolio.positions]
        
        # Fetch market data with specified period
        try:
            market_data = self.market_data.fetch_history(tickers, period=period)
        except ValueError as e:
            raise ValueError(f"Market data error: {str(e)}")
        
        valid_tickers = market_data['valid_tickers']
        current_prices = market_data['current_prices']
        cov_matrix = market_data['cov_matrix']
        mean_returns = market_data['mean_returns']
        
        # Filter positions to only valid tickers
        valid_positions = [
            pos for pos in portfolio.positions
            if pos.ticker in valid_tickers
        ]
        
        if not valid_positions:
            raise ValueError("No valid positions after market data filtering")
        
        # Calculate position values
        position_values = np.array([
            pos.quantity * current_prices[pos.ticker]
            for pos in valid_positions
        ])
        
        total_value = position_values.sum()
        
        # Calculate weights
        weights = position_values / total_value
        
        # Apply scenario shocks if provided
        if scenario and scenario.factor_shocks:
            adjusted_returns = mean_returns.copy()
            for ticker, shock in scenario.factor_shocks.items():
                if ticker in adjusted_returns.index:
                    adjusted_returns[ticker] += shock
            mean_returns = adjusted_returns
        
        # Align weights with covariance matrix
        weights_vector = np.array([weights[i] for i, pos in enumerate(valid_positions)])
        
        # Portfolio volatility: σ_p = sqrt(W^T * Σ * W)
        portfolio_variance = np.dot(weights_vector, np.dot(cov_matrix.values, weights_vector))
        portfolio_volatility = np.sqrt(portfolio_variance)
        
        # Marginal contribution to risk: MCR = (Σ * W) / σ_p
        marginal_risk = np.dot(cov_matrix.values, weights_vector) / portfolio_volatility
        
        # Component risk (Euler decomposition): CR = W * MCR
        component_risk = weights_vector * marginal_risk
        
        # Normalize to percentages
        risk_contributions = (component_risk / component_risk.sum()) * 100
        
        # Value at Risk (95% confidence, 1-day, parametric)
        # VaR = μ - z * σ, where z = 1.645 for 95% confidence
        z_score = stats.norm.ppf(0.05)  # -1.645
        portfolio_return = np.dot(weights_vector, mean_returns.values)
        daily_volatility = portfolio_volatility / np.sqrt(252)
        var_95 = abs(total_value * (z_score * daily_volatility - portfolio_return / 252))
        
        # Build position-level breakdown
        positions_breakdown = []
        for i, pos in enumerate(valid_positions):
            positions_breakdown.append({
                'ticker': pos.ticker,
                'quantity': pos.quantity,
                'current_price': current_prices[pos.ticker],
                'value': position_values[i],
                'weight': float(weights[i]),
                'volatility': float(np.sqrt(cov_matrix.loc[pos.ticker, pos.ticker])),
                'risk_contribution_pct': float(risk_contributions[i]),
                'marginal_risk': float(marginal_risk[i])
            })
        
        # Generate explanation
        explanation = self._generate_explanation(
            portfolio_volatility,
            positions_breakdown,
            total_value,
            var_95
        )
        
        # Calculate performance metrics
        performance_metrics = calculate_performance_metrics(
            returns=market_data['returns'],
            weights=weights_vector,
            portfolio_return=portfolio_return,
            portfolio_volatility=portfolio_volatility
        )
        
        # Calculate correlation matrix
        correlation_data = calculate_correlation_matrix(market_data['returns'])
        
        # Calculate drawdown metrics
        drawdown_metrics = calculate_drawdown_metrics(
            returns=market_data['returns'],
            weights=weights_vector
        )
        
        # Calculate benchmark comparison
        benchmark_data = fetch_benchmark_data('^GSPC', period=period)
        benchmark_comparison = None
        
        if benchmark_data:
            # Calculate portfolio returns for alpha/beta
            portfolio_returns = market_data['returns'].dot(weights_vector)
            
            alpha_beta = calculate_alpha_beta(
                portfolio_returns=portfolio_returns,
                benchmark_returns=benchmark_data['returns'],
                portfolio_return=portfolio_return,
                benchmark_return=benchmark_data['annualized_return']
            )
            
            benchmark_comparison = {
                'benchmark_ticker': benchmark_data['ticker'],
                'benchmark_return': benchmark_data['annualized_return'],
                'benchmark_volatility': benchmark_data['annualized_volatility'],
                'benchmark_sharpe': benchmark_data['sharpe_ratio'],
                'alpha': alpha_beta['alpha'],
                'beta': alpha_beta['beta'],
                'correlation': alpha_beta['correlation']
            }
        
        # Calculate Monte Carlo VaR
        from api.monte_carlo import monte_carlo_var
        mc_var_result = monte_carlo_var(
            returns=market_data['returns'],
            weights=weights_vector,
            portfolio_value=total_value,
            num_simulations=10000,
            time_horizon=1,
            confidence_level=0.95
        )
        
        return RiskOutput(
            total_value=float(total_value),
            volatility_annualized=float(portfolio_volatility),
            var_95=float(var_95),
            positions=positions_breakdown,
            explanation=explanation,
            performance=performance_metrics,
            correlation_matrix=correlation_data,
            benchmark=benchmark_comparison,
            monte_carlo=mc_var_result,
            drawdown=drawdown_metrics
        )
    
    def _generate_explanation(
        self,
        volatility: float,
        positions: list[dict],
        total_value: float,
        var_95: float
    ) -> ExplanationOutput:
        """
        Generate human-readable risk explanation.
        
        Args:
            volatility: Portfolio volatility
            positions: Position breakdown
            total_value: Total portfolio value
            var_95: Value at Risk
            
        Returns:
            ExplanationOutput with summary and top drivers
            
        Example:
            >>> explanation = calc._generate_explanation(0.25, positions, 100000, 15000)
            >>> print(explanation.summary)
        """
        # Classify risk level
        if volatility > 0.30:
            risk_level = "Very High"
        elif volatility > 0.20:
            risk_level = "High"
        elif volatility > 0.10:
            risk_level = "Moderate"
        else:
            risk_level = "Low"
        
        # Get top 3 risk contributors
        sorted_positions = sorted(
            positions,
            key=lambda x: x['risk_contribution_pct'],
            reverse=True
        )[:3]
        
        top_drivers = [
            RiskDriver(
                name=pos['ticker'],
                contribution_pct=pos['risk_contribution_pct']
            )
            for pos in sorted_positions
        ]
        
        # Build summary
        top_contributor = sorted_positions[0]
        summary_parts = [
            f"Your portfolio has {risk_level.lower()} risk with an annualized volatility of {volatility*100:.1f}%.",
            f"The 1-day Value at Risk (95% confidence) is ${var_95:,.2f}, representing {(var_95/total_value)*100:.1f}% of your portfolio.",
            f"{top_contributor['ticker']} is your largest risk contributor at {top_contributor['risk_contribution_pct']:.1f}% of total portfolio risk."
        ]
        
        if len(sorted_positions) > 1:
            summary_parts.append(
                f"Together, {', '.join([p['ticker'] for p in sorted_positions[:3]])} account for "
                f"{sum(p['risk_contribution_pct'] for p in sorted_positions[:3]):.1f}% of your downside exposure."
            )
        
        summary = " ".join(summary_parts)
        
        return ExplanationOutput(
            summary=summary,
            top_drivers=top_drivers
        )
    def calculate_growth_of_10k(self, returns: pd.Series, benchmark_returns: pd.Series) -> dict:
        """
        Calculate cumulative growth of a hypothetical $10,000 investment.
        """
        if returns.empty or benchmark_returns.empty:
            return None
            
        # Align dates
        aligned = pd.concat([returns, benchmark_returns], axis=1, join='inner').dropna()
        aligned.columns = ['portfolio', 'benchmark']
        
        if aligned.empty:
            return None
        
        # Calculate cumulative returns starting at 10,000
        portfolio_cum = (1 + aligned['portfolio']).cumprod() * 10000
        benchmark_cum = (1 + aligned['benchmark']).cumprod() * 10000
        
        # Prepend starting value
        dates = aligned.index.strftime('%Y-%m-%d').tolist()
        portfolio_values = portfolio_cum.tolist()
        benchmark_values = benchmark_cum.tolist()
        
        return {
            'dates': dates,
            'portfolio': portfolio_values,
            'benchmark': benchmark_values
        }
        """
        Calculate cumulative growth of a hypothetical $10,000 investment.
        """
        if returns.empty or benchmark_returns.empty:
            return None
            
        # Align dates
        aligned = pd.concat([returns, benchmark_returns], axis=1, join='inner').dropna()
        aligned.columns = ['portfolio', 'benchmark']
        
        if aligned.empty:
            return None
        
        # Calculate cumulative returns starting at 10,000
        portfolio_cum = (1 + aligned['portfolio']).cumprod() * 10000
        benchmark_cum = (1 + aligned['benchmark']).cumprod() * 10000
        
        # Prepend starting value
        dates = aligned.index.strftime('%Y-%m-%d').tolist()
        portfolio_values = portfolio_cum.tolist()
        benchmark_values = benchmark_cum.tolist()
        
        return {
            'dates': dates,
            'portfolio': portfolio_values,
            'benchmark': benchmark_values
        }

    def fetch_sector_data(self, tickers: list[str]) -> dict:
        """
        Fetch sector and country exposure from yfinance.
        Note: This can be slow, in prod use caching or async.
        """
        sectors = {}
        countries = {}
        
        # Simple caching could be added here
        for ticker in tickers:
            try:
                # Use fast_info if available or fallback to info (slower)
                # Note: yfinance info is slow. Ideally fetch in bulk or cache.
                # For MVP, we catch errors and continue.
                t = yf.Ticker(ticker)
                # Try to access dictionary directly if possible
                info = t.info 
                
                sector = info.get('sector', 'Unknown')
                country = info.get('country', 'Unknown')
                
                # We count frequency for now, but ideally we weight by portfolio value
                # Since this function only takes tickers, we assume equal weight or 
                # we need to pass weights. 
                # Better approach: This method returns metadata, caller aggregates.
                # But for simplicity, let's return raw mapping for the calculator to aggregate.
                pass 
            except Exception:
                pass
                
        # Wait, the RiskCalculator logic usually iterates positions.
        # Let's move the aggregation logic to calculate_risk in `api.py` or here?
        # Let's keep this helper simple or integrated into the main flow.
        return {} # Placeholder, logic better placed in main loop
