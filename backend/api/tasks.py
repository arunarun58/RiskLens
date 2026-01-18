# File: api/tasks.py
from celery import shared_task
from api.models import Portfolio, Scenario, RiskOutput
from api.risk_engine import RiskCalculator
import json


@shared_task(bind=True, max_retries=3)
def calculate_risk_async(self, portfolio_json: str, scenario_json: str | None = None) -> dict:
    """
    Asynchronous task for calculating portfolio risk metrics.
    
    Args:
        self: Celery task instance (bound)
        portfolio_json: JSON string of Portfolio object
        scenario_json: Optional JSON string of Scenario object
        
    Returns:
        Dictionary representation of RiskOutput
        
    Example:
        >>> from api.tasks import calculate_risk_async
        >>> portfolio_data = '{"positions": [{"ticker": "AAPL", "quantity": 100, "asset_class": "Equity"}]}'
        >>> result = calculate_risk_async.delay(portfolio_data, None)
        >>> print(result.task_id)
    """
    try:
        # Deserialize portfolio
        portfolio_dict = json.loads(portfolio_json)
        portfolio = Portfolio(**portfolio_dict)
        
        # Deserialize scenario if provided
        scenario = None
        if scenario_json:
            scenario_dict = json.loads(scenario_json)
            scenario = Scenario(**scenario_dict)
        
        # Calculate risk
        calculator = RiskCalculator()
        risk_output = calculator.calculate_risk(portfolio, scenario)
        
        # Convert to dict for JSON serialization
        return risk_output.model_dump()
        
    except Exception as exc:
        # Retry on failure
        raise self.retry(exc=exc, countdown=60)
