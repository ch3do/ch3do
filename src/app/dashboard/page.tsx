"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Plus, Loader2, ExternalLink, Users, Package, FileText } from "lucide-react"

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchCompanies()
    }
  }, [session])

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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Le mie aziende</h1>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Nuova azienda
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {companies.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Nessuna azienda</h2>
            <p className="text-slate-400 mb-6">Inizia inserendo il sito web della tua prima azienda</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Aggiungi azienda
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {company.logo ? (
                      <img src={company.logo} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition">
                        {company.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          company.scrapingStatus === "COMPLETED"
                            ? "bg-green-500/20 text-green-400"
                            : company.scrapingStatus === "IN_PROGRESS"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {company.scrapingStatus === "COMPLETED"
                          ? "Completato"
                          : company.scrapingStatus === "IN_PROGRESS"
                          ? "In corso"
                          : "Fallito"}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition" />
                </div>

                <div className="flex gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {company._count.targetGroups}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {company._count.products}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {company._count.contents}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Creato il {new Date(company.createdAt).toLocaleDateString("it-IT")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
