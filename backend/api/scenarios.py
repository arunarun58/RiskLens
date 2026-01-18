# File: api/scenarios.py
"""
Pre-built historical crisis scenarios for portfolio stress testing.

Each scenario includes:
- Name and description
- Historical date range
- Market-wide shock percentage
- Sector-specific shocks (if applicable)

Example:
    >>> from api.scenarios import HISTORICAL_SCENARIOS
    >>> crisis = HISTORICAL_SCENARIOS['2008_financial_crisis']
    >>> print(crisis['market_shock'])  # -0.38
"""

HISTORICAL_SCENARIOS = {
    '2008_financial_crisis': {
        'name': '2008 Financial Crisis',
        'description': 'Global financial meltdown triggered by subprime mortgage collapse',
        'date_range': ('2008-09-01', '2009-03-31'),
        'market_shock': -0.38,  # S&P 500 fell 38% from Sep 2008 to Mar 2009
        'duration_days': 212,
        'severity': 'extreme',
        'icon': '📉',
    },
    'covid_crash': {
        'name': 'COVID-19 Crash',
        'description': 'Pandemic-induced market crash in early 2020',
        'date_range': ('2020-02-19', '2020-03-23'),
        'market_shock': -0.34,  # S&P 500 fell 34% in 33 days
        'duration_days': 33,
        'severity': 'severe',
        'icon': '🦠',
    },
    'dotcom_bubble': {
        'name': 'Dot-com Bubble Burst',
        'description': 'Technology stock collapse from 2000-2002',
        'date_range': ('2000-03-01', '2002-10-01'),
        'market_shock': -0.49,  # NASDAQ fell 78%, S&P 500 fell 49%
        'duration_days': 945,
        'severity': 'extreme',
        'icon': '💻',
    },
    'black_monday': {
        'name': '1987 Black Monday',
        'description': 'Largest single-day percentage decline in stock market history',
        'date_range': ('1987-10-19', '1987-10-19'),
        'market_shock': -0.22,  # S&P 500 fell 22% in one day
        'duration_days': 1,
        'severity': 'severe',
        'icon': '⚫',
    },
}


def get_scenario_impact(scenario_id: str, portfolio_value: float) -> dict:
    """
    Calculate the impact of a historical scenario on a portfolio.
    
    Args:
        scenario_id: ID of the scenario (e.g., '2008_financial_crisis')
        portfolio_value: Current portfolio value in USD
        
    Returns:
        dict with scenario details and projected impact
        
    Example:
        >>> impact = get_scenario_impact('covid_crash', 100000)
        >>> print(impact['projected_loss'])  # -34000.0
    """
    if scenario_id not in HISTORICAL_SCENARIOS:
        raise ValueError(f"Unknown scenario: {scenario_id}")
    
    scenario = HISTORICAL_SCENARIOS[scenario_id]
    market_shock = scenario['market_shock']
    
    projected_value = portfolio_value * (1 + market_shock)
    projected_loss = portfolio_value * market_shock
    loss_pct = market_shock * 100
    
    return {
        'scenario_id': scenario_id,
        'scenario_name': scenario['name'],
        'description': scenario['description'],
        'date_range': scenario['date_range'],
        'duration_days': scenario['duration_days'],
        'severity': scenario['severity'],
        'icon': scenario['icon'],
        'market_shock_pct': market_shock * 100,
        'original_value': portfolio_value,
        'projected_value': projected_value,
        'projected_loss': projected_loss,
        'loss_pct': loss_pct,
    }


def get_all_scenarios() -> list[dict]:
    """
    Get all available historical scenarios.
    
    Returns:
        List of scenario metadata
        
    Example:
        >>> scenarios = get_all_scenarios()
        >>> print(len(scenarios))  # 4
    """
    return [
        {
            'id': scenario_id,
            'name': data['name'],
            'description': data['description'],
            'severity': data['severity'],
            'icon': data['icon'],
        }
        for scenario_id, data in HISTORICAL_SCENARIOS.items()
    ]
