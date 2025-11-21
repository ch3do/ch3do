"use client"

import { useState } from "react"
import { useAuth } from "@/components/Providers"
import { Globe, Loader2, Sparkles, LogOut, Building2, Dna, Users, Zap, Lock, User } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Login form state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    const success = await login(username, password)
    if (!success) {
      setLoginError("Credenziali non valide")
    }
    setLoginLoading(false)
  }

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

  if (authLoading) {
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
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Dna className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            BusinessDNA
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition flex items-center gap-2 text-sm"
            >
              <Building2 className="w-4 h-4" />
              Le mie aziende
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-sm">{user.name || user.username}</span>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-white transition p-2 hover:bg-white/5 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-16 pb-32">
        {/* Hero */}
        <div className="text-center mb-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            Powered by Gemini AI
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              Estrai il{" "}
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              DNA
            </span>
            <br />
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              del tuo business
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Inserisci il sito web della tua azienda e lascia che l&apos;AI analizzi e comprenda
            il tuo brand per generare contenuti marketing perfetti.
          </p>
        </div>

        {/* Auth/Form */}
        {!user ? (
          <div className="w-full max-w-md">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mx-auto mb-6">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2 text-center">
                Accedi
              </h2>
              <p className="text-slate-500 text-center mb-6 text-sm">
                Usa admin / admin per testare
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="admin"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                    />
                  </div>
                </div>
                {loginError && (
                  <p className="text-red-400 text-sm text-center">{loginError}</p>
                )}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-purple-800 disabled:to-pink-800 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                >
                  {loginLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Accedi"
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Analizza un sito web</h2>
                  <p className="text-slate-500 text-sm">Inserisci l&apos;URL per estrarre il Business DNA</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="www.tuaazienda.com"
                    className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition text-lg"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="hidden sm:inline">Analisi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span className="hidden sm:inline">Analizza</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {loading && (
                <div className="mt-6 p-6 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    </div>
                    <p className="text-white font-medium">Analisi in corso...</p>
                  </div>
                  <div className="space-y-2">
                    {["Crawling delle pagine principali", "Estrazione contenuti e metadata", "Analisi AI del Business DNA"].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
          {[
            {
              icon: Dna,
              title: "Business DNA",
              desc: "Estrazione automatica di storia, valori, tone of voice, USP e tutto cio che definisce il tuo brand.",
              gradient: "from-purple-500 to-pink-500"
            },
            {
              icon: Users,
              title: "Target Groups",
              desc: "Identificazione dei tuoi clienti ideali con dati demografici, interessi e motivazioni d'acquisto.",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: Zap,
              title: "Content Engine",
              desc: "Genera articoli, post social, email e altri contenuti perfettamente allineati al tuo brand.",
              gradient: "from-orange-500 to-amber-500"
            },
          ].map((f, i) => (
            <div key={i} className="group relative bg-slate-900/30 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} bg-opacity-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
