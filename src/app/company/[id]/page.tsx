"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Users,
  Package,
  FileText,
  Loader2,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
} from "lucide-react"

interface Company {
  id: string
  name: string
  website: string
  logo?: string
  scrapingStatus: string
  businessDna?: {
    description?: string
    history?: string
    mission?: string
    vision?: string
    values: string[]
    toneOfVoice?: string
    brandPersonality?: string
    usp?: string
    competitors: string[]
    industryKeywords: string[]
    email?: string
    phone?: string
    address?: string
    socialLinks?: Record<string, string>
  }
  targetGroups: Array<{
    id: string
    name: string
    description?: string
    ageRange?: string
    interests: string[]
    painPoints: string[]
    goals: string[]
  }>
  products: Array<{
    id: string
    name: string
    description?: string
    category?: string
    features: string[]
    benefits: string[]
  }>
  guidelines: Array<{
    id: string
    name: string
    type: string
    promptTemplate: string
  }>
}

export default function CompanyPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"dna" | "targets" | "products" | "guidelines">("dna")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brand: true,
    contact: true,
    market: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (session && params.id) {
      fetchCompany()
    }
  }, [session, params.id])

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCompany(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Azienda non trovata</p>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            Torna alla dashboard
          </Link>
        </div>
      </div>
    )
  }

  const dna = company.businessDna

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            {company.logo && (
              <img src={company.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{company.name}</h1>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:underline"
              >
                {company.website}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                company.scrapingStatus === "COMPLETED"
                  ? "bg-green-500/20 text-green-400"
                  : company.scrapingStatus === "IN_PROGRESS"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {company.scrapingStatus === "COMPLETED"
                ? "Analisi completata"
                : company.scrapingStatus === "IN_PROGRESS"
                ? "Analisi in corso..."
                : "Analisi fallita"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-6">
            {[
              { id: "dna", label: "Business DNA", icon: Building2 },
              { id: "targets", label: "Target Groups", icon: Users },
              { id: "products", label: "Prodotti", icon: Package },
              { id: "guidelines", label: "Linee Guida", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dna" && dna && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Panoramica</h2>
              <p className="text-slate-300 leading-relaxed">{dna.description || "Nessuna descrizione disponibile"}</p>

              {dna.history && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Storia</h3>
                  <p className="text-slate-300">{dna.history}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {dna.mission && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-400 mb-2">Mission</h3>
                    <p className="text-slate-300 text-sm">{dna.mission}</p>
                  </div>
                )}
                {dna.vision && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-400 mb-2">Vision</h3>
                    <p className="text-slate-300 text-sm">{dna.vision}</p>
                  </div>
                )}
              </div>

              {dna.values?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Valori</h3>
                  <div className="flex flex-wrap gap-2">
                    {dna.values.map((v, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Brand Section */}
            <div className="bg-slate-800 rounded-xl border border-slate-700">
              <button
                onClick={() => toggleSection("brand")}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-white">Brand & Comunicazione</h2>
                {expandedSections.brand ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedSections.brand && (
                <div className="px-6 pb-6 space-y-4">
                  {dna.toneOfVoice && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Tone of Voice</h3>
                      <p className="text-slate-300">{dna.toneOfVoice}</p>
                    </div>
                  )}
                  {dna.brandPersonality && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Personalita del Brand</h3>
                      <p className="text-slate-300">{dna.brandPersonality}</p>
                    </div>
                  )}
                  {dna.usp && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-purple-400 mb-2">Unique Selling Proposition</h3>
                      <p className="text-white">{dna.usp}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Market Section */}
            <div className="bg-slate-800 rounded-xl border border-slate-700">
              <button
                onClick={() => toggleSection("market")}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-white">Mercato & Posizionamento</h2>
                {expandedSections.market ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedSections.market && (
                <div className="px-6 pb-6 space-y-4">
                  {dna.industryKeywords?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Keywords di Settore</h3>
                      <div className="flex flex-wrap gap-2">
                        {dna.industryKeywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {dna.competitors?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Competitor</h3>
                      <div className="flex flex-wrap gap-2">
                        {dna.competitors.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div className="bg-slate-800 rounded-xl border border-slate-700">
              <button
                onClick={() => toggleSection("contact")}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-white">Contatti & Social</h2>
                {expandedSections.contact ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedSections.contact && (
                <div className="px-6 pb-6 grid md:grid-cols-2 gap-4">
                  {dna.email && (
                    <div>
                      <span className="text-sm text-slate-400">Email:</span>
                      <p className="text-white">{dna.email}</p>
                    </div>
                  )}
                  {dna.phone && (
                    <div>
                      <span className="text-sm text-slate-400">Telefono:</span>
                      <p className="text-white">{dna.phone}</p>
                    </div>
                  )}
                  {dna.address && (
                    <div className="md:col-span-2">
                      <span className="text-sm text-slate-400">Indirizzo:</span>
                      <p className="text-white">{dna.address}</p>
                    </div>
                  )}
                  {dna.socialLinks && Object.keys(dna.socialLinks).length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-sm text-slate-400 block mb-2">Social:</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(dna.socialLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm hover:bg-slate-600 transition capitalize"
                          >
                            {platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "targets" && (
          <div className="space-y-4">
            {company.targetGroups.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nessun target group identificato</p>
              </div>
            ) : (
              company.targetGroups.map((tg) => (
                <div key={tg.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-2">{tg.name}</h3>
                  {tg.description && <p className="text-slate-300 mb-4">{tg.description}</p>}
                  {tg.ageRange && (
                    <p className="text-sm text-slate-400 mb-4">Eta: {tg.ageRange}</p>
                  )}
                  <div className="grid md:grid-cols-3 gap-4">
                    {tg.interests?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2">Interessi</h4>
                        <ul className="space-y-1">
                          {tg.interests.map((i, idx) => (
                            <li key={idx} className="text-sm text-slate-300">• {i}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tg.painPoints?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">Pain Points</h4>
                        <ul className="space-y-1">
                          {tg.painPoints.map((p, idx) => (
                            <li key={idx} className="text-sm text-slate-300">• {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tg.goals?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-400 mb-2">Obiettivi</h4>
                        <ul className="space-y-1">
                          {tg.goals.map((g, idx) => (
                            <li key={idx} className="text-sm text-slate-300">• {g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid md:grid-cols-2 gap-4">
            {company.products.length === 0 ? (
              <div className="md:col-span-2 bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nessun prodotto identificato</p>
              </div>
            ) : (
              company.products.map((p) => (
                <div key={p.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-1">{p.name}</h3>
                  {p.category && (
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  )}
                  {p.description && <p className="text-slate-300 mt-3 text-sm">{p.description}</p>}
                  <div className="mt-4 space-y-3">
                    {p.features?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-1">Features</h4>
                        <div className="flex flex-wrap gap-1">
                          {p.features.map((f, i) => (
                            <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.benefits?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-1">Benefits</h4>
                        <div className="flex flex-wrap gap-1">
                          {p.benefits.map((b, i) => (
                            <span key={i} className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "guidelines" && (
          <div className="space-y-4">
            {company.guidelines.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nessuna linea guida configurata</p>
              </div>
            ) : (
              company.guidelines.map((g) => (
                <div key={g.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{g.name}</h3>
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {g.type.replace("_", " ")}
                    </span>
                  </div>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-900 rounded-lg p-4 font-mono">
                    {g.promptTemplate}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
