// File: lib/api.ts
import { Portfolio, Scenario, RiskOutput } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'APIError'
    }
}

export async function analyzePortfolio(
    portfolio: Portfolio,
    scenario?: Scenario
): Promise<RiskOutput> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                portfolio,
                scenario: scenario || null,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new APIError(
                response.status,
                errorData.detail || `API Error: ${response.statusText}`
            )
        }

        const data: RiskOutput = await response.json()
        return data
    } catch (error) {
        if (error instanceof APIError) {
            throw error
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new APIError(0, 'Unable to connect to API server. Please ensure the backend is running.')
        }
        throw new APIError(500, 'An unexpected error occurred')
    }
}

export async function healthCheck(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`)
        return response.ok
    } catch {
        return false
    }
}

// --- Cloud Sync API ---

export async function savePortfolio(
    portfolio: { name: string, positions: any[], description?: string },
    token: string
) {
    const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(portfolio)
    })

    if (!response.ok) {
        throw new Error('Failed to save portfolio')
    }
    return response.json()
}

export async function listPortfolios(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to list portfolios')
    }
    return response.json()
}

export async function getPortfolio(id: number, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to load portfolio')
    }
    return response.json()
}

export async function deletePortfolio(id: number, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to delete portfolio')
    }
    return response.json()
}

export async function updatePortfolio(
    id: number,
    portfolio: { name: string, positions: any[], description?: string },
    token: string
) {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(portfolio)
    })

    if (!response.ok) {
        throw new Error('Failed to update portfolio')
    }
    return response.json()
}

