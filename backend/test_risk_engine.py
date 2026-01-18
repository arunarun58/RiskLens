#!/usr/bin/env python
# File: test_risk_engine.py
"""
Comprehensive test script for RiskLens Risk Calculation Engine
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'risklens.settings')
django.setup()

from api.models import Portfolio, PortfolioPosition, Scenario
from api.risk_engine import RiskCalculator

def print_header(text):
    print("\n" + "=" * 70)
    print(text.center(70))
    print("=" * 70 + "\n")

def print_section(text):
    print("\n" + "-" * 70)
    print(text)
    print("-" * 70)

def test_basic_portfolio():
    """Test basic portfolio risk calculation"""
    print_header("TEST 1: BASIC PORTFOLIO RISK CALCULATION")
    
    print("📊 Creating sample portfolio...")
    portfolio = Portfolio(positions=[
        PortfolioPosition(ticker="AAPL", quantity=100, asset_class="Equity"),
        PortfolioPosition(ticker="MSFT", quantity=50, asset_class="Equity"),
        PortfolioPosition(ticker="GOOGL", quantity=30, asset_class="Equity"),
    ])
    
    for pos in portfolio.positions:
        print(f"   • {pos.ticker}: {pos.quantity} shares ({pos.asset_class})")
    
    print("\n🔬 Fetching market data and calculating risk metrics...")
    print("   (This may take a moment to download historical data from yfinance)")
    
    try:
        calculator = RiskCalculator()
        result = calculator.calculate_risk(portfolio)
        
        print("\n✅ Risk calculation successful!")
        
        print_section("PORTFOLIO SUMMARY")
        print(f"💰 Total Portfolio Value: ${result.total_value:,.2f}")
        print(f"📈 Annualized Volatility: {result.volatility_annualized*100:.2f}%")
        print(f"⚠️  Value at Risk (95%, 1-day): ${result.var_95:,.2f}")
        print(f"📊 VaR as % of Portfolio: {(result.var_95/result.total_value)*100:.2f}%")
        
        print_section("POSITION BREAKDOWN")
        for pos in result.positions:
            print(f"\n{pos['ticker']}:")
            print(f"  Current Price: ${pos['current_price']:.2f}")
            print(f"  Position Value: ${pos['value']:,.2f}")
            print(f"  Portfolio Weight: {pos['weight']*100:.1f}%")
            print(f"  Annual Volatility: {pos['volatility']*100:.1f}%")
            print(f"  Risk Contribution: {pos['risk_contribution_pct']:.1f}%")
        
        print_section("RISK EXPLANATION")
        print(result.explanation.summary)
        print("\nTop Risk Drivers:")
        for i, driver in enumerate(result.explanation.top_drivers, 1):
            print(f"  {i}. {driver.name}: {driver.contribution_pct:.1f}%")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_scenario_analysis():
    """Test scenario analysis with market shock"""
    print_header("TEST 2: SCENARIO ANALYSIS (MARKET CRASH)")
    
    portfolio = Portfolio(positions=[
        PortfolioPosition(ticker="AAPL", quantity=100, asset_class="Equity"),
        PortfolioPosition(ticker="MSFT", quantity=50, asset_class="Equity"),
    ])
    
    scenario = Scenario(
        name="Market Crash (-15%)",
        factor_shocks={"AAPL": -0.15, "MSFT": -0.15}
    )
    
    print(f"📊 Portfolio: {len(portfolio.positions)} positions")
    print(f"⚡ Scenario: {scenario.name}")
    print(f"   Shocks: {scenario.factor_shocks}")
    
    print("\n🔬 Calculating stressed risk metrics...")
    
    try:
        calculator = RiskCalculator()
        result = calculator.calculate_risk(portfolio, scenario)
        
        print("\n✅ Scenario analysis successful!")
        
        print_section("STRESSED PORTFOLIO METRICS")
        print(f"💰 Total Value: ${result.total_value:,.2f}")
        print(f"📈 Volatility: {result.volatility_annualized*100:.2f}%")
        print(f"⚠️  VaR (95%): ${result.var_95:,.2f}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_error_handling():
    """Test error handling for invalid tickers"""
    print_header("TEST 3: ERROR HANDLING (INVALID TICKER)")
    
    portfolio = Portfolio(positions=[
        PortfolioPosition(ticker="INVALIDTICKER123", quantity=100, asset_class="Equity"),
    ])
    
    print("📊 Testing with invalid ticker: INVALIDTICKER123")
    print("🔬 Expected: Graceful error handling...")
    
    try:
        calculator = RiskCalculator()
        result = calculator.calculate_risk(portfolio)
        print("\n❌ Should have raised an error for invalid ticker!")
        return False
        
    except ValueError as e:
        print(f"\n✅ Correctly handled invalid ticker!")
        print(f"   Error message: {str(e)}")
        return True
        
    except Exception as e:
        print(f"\n⚠️  Unexpected error type: {type(e).__name__}")
        print(f"   Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print_header("RISKLENS BACKEND SYSTEM TEST SUITE")
    print("Testing Django + Django Ninja + yfinance + Risk Engine")
    
    results = []
    
    # Test 1: Basic portfolio
    results.append(("Basic Portfolio Calculation", test_basic_portfolio()))
    
    # Test 2: Scenario analysis
    results.append(("Scenario Analysis", test_scenario_analysis()))
    
    # Test 3: Error handling
    results.append(("Error Handling", test_error_handling()))
    
    # Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print_header("🎉 ALL TESTS PASSED! SYSTEM IS WORKING PROPERLY! ��")
        return 0
    else:
        print_header("❌ SOME TESTS FAILED")
        return 1

if __name__ == '__main__':
    sys.exit(main())
