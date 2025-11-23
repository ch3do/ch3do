"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/Providers"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Zap,
  BarChart3,
  Calendar,
  Loader2,
  Dna,
  Image as ImageIcon,
  FileText,
} from "lucide-react"

interface Analytics {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  totalOperations: number
  byOperation: Record<string, {
    count: number
    cost: number
    inputTokens: number
    outputTokens: number
  }>
  byDay: Record<string, { cost: number; count: number }>
  recentLogs: Array<{
    id: string
    operation: string
    model: string
    costUsd: number
    inputTokens: number
    outputTokens: number
    createdAt: string
  }>
}

const TIME_RANGES = [
  { value: "7", label: "Ultimi 7 giorni" },
  { value: "30", label: "Ultimi 30 giorni" },
  { value: "90", label: "Ultimi 90 giorni" },
  { value: "all", label: "Tutto il periodo" },
]

const OPERATIONS = [
  { value: "all", label: "Tutte le operazioni" },
  { value: "scraping", label: "Scraping" },
  { value: "content_generation", label: "Generazione Contenuti" },
  { value: "image_generation", label: "Generazione Immagini" },
]

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const [operation, setOperation] = useState("all")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange, operation])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (timeRange !== "all") {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(timeRange))
        params.append("startDate", startDate.toISOString())
        params.append("endDate", endDate.toISOString())
      }

      if (operation !== "all") {
        params.append("operation", operation)
      }

      const res = await fetch(`/api/analytics?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  const getOperationIcon = (op: string) => {
    switch (op) {
      case "scraping":
        return Dna
      case "content_generation":
        return FileText
      case "image_generation":
        return ImageIcon
      default:
        return Zap
    }
  }

  const getOperationLabel = (op: string) => {
    switch (op) {
      case "scraping":
        return "Scraping"
      case "content_generation":
        return "Generazione Contenuti"
      case "image_generation":
        return "Generazione Immagini"
      default:
        return op
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition p-2 hover:bg-white/5 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Analytics</h1>
                <p className="text-xs text-slate-500">Utilizzo e costi AI</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Periodo</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Operazione</label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {OPERATIONS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {analytics && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  ${analytics.totalCost.toFixed(4)}
                </p>
                <p className="text-sm text-slate-500">Costo Totale</p>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {analytics.totalOperations.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">Operazioni</p>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {(analytics.totalInputTokens / 1000).toFixed(1)}K
                </p>
                <p className="text-sm text-slate-500">Token Input</p>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {(analytics.totalOutputTokens / 1000).toFixed(1)}K
                </p>
                <p className="text-sm text-slate-500">Token Output</p>
              </div>
            </div>

            {/* By Operation */}
            {Object.keys(analytics.byOperation).length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
                <h2 className="text-lg font-semibold text-white mb-6">Per Operazione</h2>
                <div className="space-y-4">
                  {Object.entries(analytics.byOperation).map(([op, stats]) => {
                    const Icon = getOperationIcon(op)
                    const percentage = (stats.cost / analytics.totalCost) * 100

                    return (
                      <div key={op} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{getOperationLabel(op)}</p>
                              <p className="text-xs text-slate-500">{stats.count} operazioni</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">${stats.cost.toFixed(4)}</p>
                            <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-6">Attivita Recente</h2>
              <div className="space-y-3">
                {analytics.recentLogs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nessuna attivita recente</p>
                ) : (
                  analytics.recentLogs.map((log) => {
                    const Icon = getOperationIcon(log.operation)
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{getOperationLabel(log.operation)}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(log.createdAt).toLocaleString("it-IT")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">${log.costUsd.toFixed(4)}</p>
                          <p className="text-xs text-slate-500">
                            {log.inputTokens + log.outputTokens} tokens
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
