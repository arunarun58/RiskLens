# File: api/optimization.py
"""
Portfolio optimization module using Modern Portfolio Theory (MPT).
Calculates Efficient Frontier and optimal portfolios.
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple


def calculate_efficient_frontier(
    returns: pd.DataFrame,
    num_points: int = 20,
    risk_free_rate: float = 0.045
) -> Dict:
    """
    Calculate the Efficient Frontier for a set of assets.
    
    Args:
        returns: DataFrame of historical returns for each asset
        num_points: Number of points on the frontier to calculate
        risk_free_rate: Risk-free rate for Sharpe ratio calculation
        
    Returns:
        Dictionary containing frontier points and optimal portfolios
    """
    mean_returns = returns.mean() * 252
    cov_matrix = returns.cov() * 252
    tickers = returns.columns.tolist()
    num_assets = len(tickers)
    
    # Helper functions for optimization
    def portfolio_volatility(weights, cov_matrix):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        
    def portfolio_return(weights, mean_returns):
        return np.sum(mean_returns * weights)
        
    def neg_sharpe_ratio(weights, mean_returns, cov_matrix, risk_free_rate):
        p_ret = portfolio_return(weights, mean_returns)
        p_vol = portfolio_volatility(weights, cov_matrix)
        return -(p_ret - risk_free_rate) / p_vol
        
    # Constraints and bounds
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for _ in range(num_assets))
    initial_weights = num_assets * [1. / num_assets,]
    
    # 1. Find Max Sharpe Ratio Portfolio
    max_sharpe_opts = minimize(
        neg_sharpe_ratio,
        initial_weights,
        args=(mean_returns, cov_matrix, risk_free_rate),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )
    max_sharpe_weights = max_sharpe_opts.x
    max_sharpe_ret = portfolio_return(max_sharpe_weights, mean_returns)
    max_sharpe_vol = portfolio_volatility(max_sharpe_weights, cov_matrix)
    
    # 2. Find Min Volatility Portfolio
    min_vol_opts = minimize(
        portfolio_volatility,
        initial_weights,
        args=(cov_matrix,),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )
    min_vol_weights = min_vol_opts.x
    min_vol_ret = portfolio_return(min_vol_weights, mean_returns)
    min_vol_vol = portfolio_volatility(min_vol_weights, cov_matrix)
    
    # 3. Calculate Efficient Frontier points
    frontier_volatility = []
    frontier_returns = []
    
    # Generate target returns from min vol to max return (approx)
    # Finding max return portfolio is trivial (100% in highest return asset)
    max_ret_theoretical = mean_returns.max()
    target_returns = np.linspace(min_vol_ret, max_ret_theoretical, num_points)
    
    for target in target_returns:
        constraints_frontier = (
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'eq', 'fun': lambda x: portfolio_return(x, mean_returns) - target}
        )
        
        result = minimize(
            portfolio_volatility,
            initial_weights,
            args=(cov_matrix,),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints_frontier
        )
        
        if result.success:
            frontier_volatility.append(float(result.fun))
            frontier_returns.append(float(target))
            
    return {
        'frontier': {
            'returns': frontier_returns,
            'volatility': frontier_volatility
        },
        'max_sharpe_portfolio': {
            'weights': dict(zip(tickers, max_sharpe_weights.round(4))),
            'return': float(max_sharpe_ret),
            'volatility': float(max_sharpe_vol),
            'sharpe': float((max_sharpe_ret - risk_free_rate) / max_sharpe_vol)
        },
        'min_vol_portfolio': {
            'weights': dict(zip(tickers, min_vol_weights.round(4))),
            'return': float(min_vol_ret),
            'volatility': float(min_vol_vol),
            'sharpe': float((min_vol_ret - risk_free_rate) / min_vol_vol)
        }
    }

def calculate_rebalancing_trades(
    current_positions: list, # List of dicts or objects with ticker, value/quantity
    target_weights: Dict[str, float],
    total_value: float,
    current_prices: Dict[str, float]
) -> List[Dict]:
    """
    Calculate buy/sell trades to reach target portfolio.
    
    Args:
        current_positions: List of position objects/dicts
        target_weights: Target weights from optimization {ticker: 0.15}
        total_value: Total portfolio value
        current_prices: Current market prices
        
    Returns:
        List of trades [{'ticker': 'AAPL', 'action': 'BUY', 'shares': 10, 'amount': 1500}]
    """
    trades = []
    
    # Map current holdings
    current_holdings = {}
    for pos in current_positions:
        # Handle both Pydantic models and dictionaries
        if hasattr(pos, 'ticker'):
            ticker = pos.ticker
            quantity = pos.quantity
        else:
            ticker = pos.get('ticker')
            quantity = pos.get('quantity')
            
        current_holdings[ticker] = quantity
        
    all_tickers = set(list(current_holdings.keys()) + list(target_weights.keys()))
    
    for ticker in all_tickers:
        price = current_prices.get(ticker, 0)
        if price == 0:
            continue
            
        current_qty = current_holdings.get(ticker, 0)
        current_val = current_qty * price
        
        target_weight = target_weights.get(ticker, 0)
        target_val = total_value * target_weight
        
        diff_val = target_val - current_val
        diff_shares = diff_val / price
        
        # Only suggest trades greater than $10 or 1 share to avoid noise
        if abs(diff_val) > 10 and abs(diff_shares) >= 0.1:
            trades.append({
                'ticker': ticker,
                'action': 'BUY' if diff_val > 0 else 'SELL',
                'shares': float(round(abs(diff_shares), 2)),
                'amount': float(round(abs(diff_val), 2)),
                'price': float(price),
                'current_weight': float(current_val / total_value),
                'target_weight': float(target_weight)
            })
            
    return sorted(trades, key=lambda x: x['amount'], reverse=True)
