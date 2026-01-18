// File: lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function getRiskLevel(volatility: number): {
  label: string
  color: string
  bgColor: string
} {
  if (volatility > 0.30) {
    return { label: 'Very High', color: 'text-red-600', bgColor: 'bg-red-100' }
  } else if (volatility > 0.20) {
    return { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' }
  } else if (volatility > 0.10) {
    return { label: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  } else {
    return { label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' }
  }
}
