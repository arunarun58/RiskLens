# File: api/monte_carlo.py
"""
Monte Carlo simulation for Value at Risk (VaR) calculation.

Uses multivariate normal distribution to simulate portfolio returns
and calculate VaR and CVaR (Conditional VaR / Expected Shortfall).

Example:
    >>> from api.monte_carlo import monte_carlo_var
    >>> import pandas as pd
    >>> import numpy as np
    >>> 
    >>> returns = pd.DataFrame(...)  # Historical returns
    >>> weights = np.array([0.5, 0.5])
    >>> result = monte_carlo_var(returns, weights, 100000, num_simulations=10000)
    >>> print(f"MC VaR: ${result['mc_var_95']:,.2f}")
"""

import numpy as np
import pandas as pd
from typing import Dict, List


def monte_carlo_var(
    returns: pd.DataFrame,
    weights: np.ndarray,
    portfolio_value: float,
    num_simulations: int = 10000,
    time_horizon: int = 1,
    confidence_level: float = 0.95
) -> Dict:
    """
    Calculate Value at Risk using Monte Carlo simulation.
    
    Args:
        returns: DataFrame of historical returns for each asset
        weights: Array of portfolio weights
        portfolio_value: Current portfolio value in USD
        num_simulations: Number of Monte Carlo simulations (default: 10,000)
        time_horizon: Time horizon in days (default: 1)
        confidence_level: Confidence level for VaR (default: 0.95)
        
    Returns:
        Dictionary containing:
        - mc_var_95: Monte Carlo VaR at 95% confidence
        - mc_cvar_95: Conditional VaR (Expected Shortfall)
        - distribution: Statistics about the simulated distribution
        - simulations: Sample of simulated portfolio values (for visualization)
        
    Example:
        >>> result = monte_carlo_var(returns, weights, 100000)
        >>> print(f"VaR: ${result['mc_var_95']:,.2f}")
        >>> print(f"CVaR: ${result['mc_cvar_95']:,.2f}")
    """
    # Calculate mean returns and covariance matrix
    mean_returns = returns.mean().values
    cov_matrix = returns.cov().values
    
    # Adjust for time horizon
    mean_returns_adjusted = mean_returns * time_horizon
    cov_matrix_adjusted = cov_matrix * time_horizon
    
    # Generate random samples from multivariate normal distribution
    simulated_returns = np.random.multivariate_normal(
        mean_returns_adjusted,
        cov_matrix_adjusted,
        num_simulations
    )
    
    # Calculate portfolio returns for each simulation
    portfolio_returns = np.dot(simulated_returns, weights)
    
    # Calculate portfolio values
    portfolio_values = portfolio_value * (1 + portfolio_returns)
    
    # Calculate VaR (Value at Risk)
    # VaR is the loss at the (1 - confidence_level) percentile
    var_threshold = np.percentile(portfolio_values, (1 - confidence_level) * 100)
    mc_var = portfolio_value - var_threshold
    
    # Calculate CVaR (Conditional VaR / Expected Shortfall)
    # CVaR is the average loss beyond VaR
    losses_beyond_var = portfolio_values[portfolio_values < var_threshold]
    if len(losses_beyond_var) > 0:
        mc_cvar = portfolio_value - losses_beyond_var.mean()
    else:
        mc_cvar = mc_var
    
    # Calculate distribution statistics
    percentiles = {
        '1': float(np.percentile(portfolio_values, 1)),
        '5': float(np.percentile(portfolio_values, 5)),
        '25': float(np.percentile(portfolio_values, 25)),
        '50': float(np.percentile(portfolio_values, 50)),
        '75': float(np.percentile(portfolio_values, 75)),
        '95': float(np.percentile(portfolio_values, 95)),
        '99': float(np.percentile(portfolio_values, 99)),
    }
    
    # Sample simulations for visualization (limit to 1000 for performance)
    sample_size = min(1000, num_simulations)
    sample_indices = np.random.choice(num_simulations, sample_size, replace=False)
    simulations_sample = portfolio_values[sample_indices].tolist()
    
    return {
        'mc_var_95': float(mc_var),
        'mc_cvar_95': float(mc_cvar),
        'num_simulations': num_simulations,
        'confidence_level': confidence_level,
        'distribution': {
            'mean': float(portfolio_values.mean()),
            'std': float(portfolio_values.std()),
            'min': float(portfolio_values.min()),
            'max': float(portfolio_values.max()),
            'percentiles': percentiles
        },
        'simulations': simulations_sample
    }


def compare_var_methods(
    parametric_var: float,
    mc_var: float,
    mc_cvar: float
) -> Dict:
    """
    Compare parametric VaR with Monte Carlo VaR.
    
    Args:
        parametric_var: VaR calculated using parametric method
        mc_var: VaR calculated using Monte Carlo simulation
        mc_cvar: Conditional VaR from Monte Carlo
        
    Returns:
        Dictionary with comparison metrics
        
    Example:
        >>> comparison = compare_var_methods(1500, 1650, 2100)
        >>> print(comparison['difference_pct'])
    """
    difference = mc_var - parametric_var
    difference_pct = (difference / parametric_var) * 100 if parametric_var > 0 else 0
    
    return {
        'parametric_var': float(parametric_var),
        'mc_var': float(mc_var),
        'mc_cvar': float(mc_cvar),
        'difference': float(difference),
        'difference_pct': float(difference_pct),
        'recommendation': 'Monte Carlo VaR is more accurate for non-normal distributions'
    }
