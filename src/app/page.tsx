"use client"

import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Globe, Loader2, Sparkles, LogOut, Building2 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: url }),
      })

      const data = await res.json()

      if (data.success) {
        window.location.href = `/company/${data.companyId}`
      } else {
        setError(data.error || "Errore durante l'analisi")
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <span className="text-xl font-bold text-white">BusinessDNA</span>
        </div>
        {session ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Le mie aziende
            </Link>
            <button
              onClick={() => signOut()}
              className="text-slate-400 hover:text-white transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        ) : null}
      </header>

      {/* Main */}
      <main className="flex flex-col items-center justify-center px-4 pt-20 pb-32">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Estrai il <span className="text-purple-400">DNA</span> del tuo business
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Inserisci il sito web della tua azienda e lascia che l&apos;AI analizzi e comprenda
            il tuo brand, i tuoi prodotti e il tuo target per generare contenuti perfetti.
          </p>
        </div>

        {!session ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center">
              Inizia ora
            </h2>
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-3 px-6 rounded-xl font-medium hover:bg-slate-100 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Accedi con Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="www.tuaazienda.com"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analisi...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analizza
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-4 text-red-400 text-sm">{error}</p>
              )}
              {loading && (
                <div className="mt-6 space-y-3">
                  <p className="text-slate-300 text-sm">Sto analizzando il sito web...</p>
                  <div className="space-y-2 text-slate-400 text-sm">
                    <p>• Crawling delle pagine principali</p>
                    <p>• Estrazione contenuti e metadata</p>
                    <p>• Analisi AI del Business DNA</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
          {[
            {
              title: "Business DNA",
              desc: "Estrazione automatica di storia, valori, tone of voice, USP e tutto ciò che definisce il tuo brand.",
            },
            {
              title: "Target Groups",
              desc: "Identificazione dei tuoi clienti ideali con dati demografici, interessi, pain points e motivazioni d'acquisto.",
            },
            {
              title: "Content Engine",
              desc: "Genera articoli, post social, email e altri contenuti perfettamente allineati al tuo brand.",
            },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
