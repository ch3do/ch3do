"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/Providers"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Users,
  Package,
  FileText,
  Save,
  Copy,
  CheckCircle2,
  Dna,
} from "lucide-react"

interface Company {
  id: string
  name: string
  targetGroups: Array<{ id: string; name: string }>
  products: Array<{ id: string; name: string }>
  guidelines: Array<{ id: string; name: string; type: string }>
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter/X" },
  { value: "tiktok", label: "TikTok" },
  { value: "blog", label: "Blog" },
  { value: "email", label: "Email" },
  { value: "website", label: "Sito Web" },
]

export default function CreateContentPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Form state
  const [targetGroupId, setTargetGroupId] = useState("")
  const [productId, setProductId] = useState("")
  const [guidelineId, setGuidelineId] = useState("")
  const [platform, setPlatform] = useState("instagram")
  const [topic, setTopic] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  // Generated content
  const [generatedTitle, setGeneratedTitle] = useState("")
  const [generatedBody, setGeneratedBody] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && params.id) {
      fetchCompany()
    }
  }, [user, params.id])

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCompany(data)
        // Set default guideline
        if (data.guidelines.length > 0) {
          setGuidelineId(data.guidelines[0].id)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guidelineId || !topic.trim()) return

    setGenerating(true)
    setError("")
    setGeneratedTitle("")
    setGeneratedBody("")

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: params.id,
          targetGroupId: targetGroupId || undefined,
          productId: productId || undefined,
          guidelineId,
          platform,
          topic,
          additionalNotes: additionalNotes || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setGeneratedTitle(data.content.title)
        setGeneratedBody(data.content.body)
      } else {
        setError(data.error || "Errore durante la generazione")
      }
    } catch {
      setError("Errore di connessione")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    const text = `${generatedTitle}\n\n${generatedBody}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Azienda non trovata</p>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            Torna alla dashboard
          </Link>
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
            <Link
              href={`/company/${params.id}`}
              className="text-slate-400 hover:text-white transition p-2 hover:bg-white/5 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Crea Copy</h1>
                <p className="text-xs text-slate-500">{company.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Configura il contenuto
              </h2>

              <form onSubmit={handleGenerate} className="space-y-6">
                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Argomento <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Es: Lancio nuovo prodotto, promozione estiva, caso studio..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                    required
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Piattaforma <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guideline */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Linea Guida <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={guidelineId}
                    onChange={(e) => setGuidelineId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                    required
                  >
                    {company.guidelines.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Group */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Target Group (opzionale)
                  </label>
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                  >
                    <option value="">Nessun target specifico</option>
                    {company.targetGroups.map((tg) => (
                      <option key={tg.id} value={tg.id}>
                        {tg.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Prodotto/Servizio (opzionale)
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                  >
                    <option value="">Nessun prodotto specifico</option>
                    {company.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Note aggiuntive (opzionale)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Aggiungi dettagli, richieste specifiche, CTA desiderata..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={generating || !topic.trim()}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:shadow-none"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generazione in corso...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Genera Copy
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 min-h-[600px] flex flex-col">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Dna className="w-5 h-5 text-purple-400" />
                Contenuto Generato
              </h2>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {generating && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
                      <div className="w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin absolute inset-0"></div>
                    </div>
                    <p className="text-slate-400 text-sm">L&apos;AI sta creando il tuo contenuto...</p>
                  </div>
                </div>
              )}

              {!generating && generatedBody && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    {/* Title */}
                    {generatedTitle && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{generatedTitle}</h3>
                        <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                      </div>
                    )}

                    {/* Body */}
                    <div className="prose prose-invert max-w-none">
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {generatedBody}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copia
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedTitle("")
                        setGeneratedBody("")
                        setTopic("")
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/25"
                    >
                      <Sparkles className="w-5 h-5" />
                      Nuovo
                    </button>
                  </div>
                </div>
              )}

              {!generating && !generatedBody && !error && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-500">Il contenuto generato apparirà qui</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
