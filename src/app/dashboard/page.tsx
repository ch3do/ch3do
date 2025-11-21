"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/Providers"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Plus, Loader2, ExternalLink, Users, Package, FileText, Dna, ArrowLeft } from "lucide-react"

interface Company {
  id: string
  name: string
  website: string
  logo?: string
  scrapingStatus: string
  createdAt: string
  _count: {
    targetGroups: number
    products: number
    contents: number
  }
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchCompanies()
    }
  }, [user])

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
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
            <Link href="/" className="text-slate-400 hover:text-white transition p-2 hover:bg-white/5 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Le mie aziende</h1>
                <p className="text-xs text-slate-500">{companies.length} aziende registrate</p>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4" />
            Nuova azienda
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {companies.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-16 text-center border border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">Nessuna azienda</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Inizia inserendo il sito web della tua prima azienda per estrarre il Business DNA
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              Aggiungi la tua prima azienda
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    {company.logo ? (
                      <img src={company.logo} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center ring-2 ring-white/5">
                        <Building2 className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {company.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mt-1 ${
                          company.scrapingStatus === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : company.scrapingStatus === "IN_PROGRESS"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          company.scrapingStatus === "COMPLETED"
                            ? "bg-emerald-400"
                            : company.scrapingStatus === "IN_PROGRESS"
                            ? "bg-amber-400 animate-pulse"
                            : "bg-red-400"
                        }`}></span>
                        {company.scrapingStatus === "COMPLETED"
                          ? "Completato"
                          : company.scrapingStatus === "IN_PROGRESS"
                          ? "In corso"
                          : "Fallito"}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                </div>

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{company._count.targetGroups} target</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Package className="w-4 h-4" />
                    <span>{company._count.products} prodotti</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    {new Date(company.createdAt).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                  <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Visualizza DNA →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
