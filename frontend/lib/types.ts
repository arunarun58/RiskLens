// File: lib/types.ts
export interface PortfolioPosition {
    ticker: string
    quantity: number
    asset_class: 'Equity' | 'Bond' | 'Cash'
    avg_price?: number
    purchase_date?: string
}

export interface Portfolio {
    positions: PortfolioPosition[]
}

export interface Scenario {
    name: string
    factor_shocks: Record<string, number>
}

export interface RiskDriver {
    name: string
    contribution_pct: number
}

export interface ExplanationOutput {
    summary: string
    top_drivers: RiskDriver[]
}

export interface PerformanceMetrics {
    sharpe_ratio: number
    sortino_ratio: number
    annualized_return: number
    risk_free_rate: number
}

export interface CorrelationData {
    tickers: string[]
    correlations: Array<{
        ticker1: string
        ticker2: string
        correlation: number
    }>
}

export interface BenchmarkComparison {
    benchmark_ticker: string
    benchmark_return: number
    benchmark_volatility: number
    benchmark_sharpe: number
    alpha: number
    beta: number
    correlation: number
}

export interface MonteCarloVaR {
    mc_var_95: number
    mc_cvar_95: number
    num_simulations: number
    confidence_level: number
    distribution: {
        mean: number
        std: number
        min: number
        max: number
        percentiles: {
            '1': number
            '5': number
            '25': number
            '50': number
            '75': number
            '95': number
            '99': number
        }
    }
    simulations: number[]
}

export interface DrawdownMetrics {
    max_drawdown: number
    max_drawdown_date: string | null
    current_drawdown: number
    recovery_time_days: number
    drawdown_series: Array<{
        date: string
        drawdown: number
    }>
}

export interface SavedPortfolio {
    id: string
    name: string
    date: string
    positions: PortfolioPosition[]
}

export interface PositionDetail {
    ticker: string
    quantity: number
    current_price: number
    value: number
    weight: number
    volatility: number
    risk_contribution_pct: number
    marginal_risk: number
    avg_price?: number
    cost_basis?: number
    unrealized_pl?: number
    unrealized_pl_pct?: number
    purchase_date?: string
}

export interface RiskOutput {
    total_value: number
    volatility_annualized: number
    var_95: number
    positions: PositionDetail[]
    explanation: ExplanationOutput
    performance: PerformanceMetrics
    correlation_matrix: CorrelationData
    benchmark: BenchmarkComparison | null
    monte_carlo: MonteCarloVaR | null
    drawdown: DrawdownMetrics | null
    backtest?: {
        dates: string[]
        portfolio: number[]
        benchmark: number[]
    }
    sector_breakdown?: {
        sectors: Record<string, number>
        countries: Record<string, number>
    }
}
export interface OptimalPortfolio {
    weights: Record<string, number>
    return: number
    volatility: number
    sharpe: number
}

export interface FrontierData {
    returns: number[]
    volatility: number[]
}

export interface TradeRecommendation {
    ticker: string
    action: 'BUY' | 'SELL'
    shares: number
    amount: number
    price: number
    current_weight: number
    target_weight: number
}

export interface OptimizationResponse {
    frontier: FrontierData
    max_sharpe_portfolio: OptimalPortfolio
    min_vol_portfolio: OptimalPortfolio
    rebalancing_trades?: TradeRecommendation[]
}

export interface PortfolioSummary {
    id: number
    name: string
    updated_at: string
    description?: string | null
}
