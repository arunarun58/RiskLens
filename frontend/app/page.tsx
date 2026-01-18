import Link from 'next/link'
import HeroSection from '@/components/HeroSection'
import BentoGrid from '@/components/BentoGrid'
import { ArrowRight, Shield, Zap, BarChart3, TrendingUp } from 'lucide-react'
import { signIn } from "@/auth"

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <HeroSection />
      <BentoGrid />
    </div>
  )
}
