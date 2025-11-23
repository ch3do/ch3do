import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface ScrapedData {
  pages: Array<{
    url: string
    title: string
    content: string
    images: string[]
  }>
  metadata: {
    logo?: string
    socialLinks: Record<string, string>
    emails: string[]
    phones: string[]
  }
  allImages: string[]
}

interface ExtractedProduct {
  name: string
  description: string
  category?: string
  features?: string[]
  benefits?: string[]
  price?: string
  imageUrls: string[]
  targetAudience?: string
  differentiators?: string[]
}

interface ExtractedTargetGroup {
  name: string
  description: string
  ageRange?: string
  gender?: string
  location?: string
  income?: string
  education?: string
  occupation?: string
  interests?: string[]
  painPoints?: string[]
  goals?: string[]
  behaviors?: string[]
  buyingMotivation?: string
  objections?: string[]
}

interface DeepAnalysisResult {
  businessDna: {
    description?: string
    history?: string
    mission?: string
    vision?: string
    values?: string[]
    toneOfVoice?: string
    brandPersonality?: string
    usp?: string
    competitors?: string[]
    industryKeywords?: string[]
  }
  products: ExtractedProduct[]
  targetGroups: ExtractedTargetGroup[]
  tokenUsage: {
    input: number
    output: number
  }
}

export async function analyzeWithGemini(scrapedData: ScrapedData, companyName: string): Promise<DeepAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  })

  // Prepare context with page content and image URLs
  const pagesContext = scrapedData.pages.map((page, idx) => {
    return `
## PAGE ${idx + 1}: ${page.title}
URL: ${page.url}

CONTENT:
${page.content.slice(0, 5000)}

IMAGES ON THIS PAGE (${page.images.length} total):
${page.images.slice(0, 10).map((img, i) => `${i + 1}. ${img}`).join('\n')}
${page.images.length > 10 ? `\n... and ${page.images.length - 10} more images` : ''}
`
  }).join('\n\n---\n\n')

  const prompt = `Sei un esperto analista di business e marketing. Analizza approfonditamente il contenuto di questo sito web e estrai il "Business DNA" completo dell'azienda.

# NOME AZIENDA
${companyName}

# CONTESTO SITO WEB
${pagesContext}

# METADATA
- Logo: ${scrapedData.metadata.logo || 'non trovato'}
- Email: ${scrapedData.metadata.emails.join(', ') || 'non trovata'}
- Telefono: ${scrapedData.metadata.phones.join(', ') || 'non trovato'}
- Social: ${JSON.stringify(scrapedData.metadata.socialLinks)}

# TUTTE LE IMMAGINI TROVATE (${scrapedData.allImages.length} totali)
${scrapedData.allImages.slice(0, 30).map((img, i) => `${i + 1}. ${img}`).join('\n')}
${scrapedData.allImages.length > 30 ? `\n... e altre ${scrapedData.allImages.length - 30} immagini` : ''}

# COMPITO

Estrai le seguenti informazioni in formato JSON:

1. **Business DNA**:
   - description: descrizione generale dell'azienda
   - history: storia e background (se trovata)
   - mission: dichiarazione di mission
   - vision: dichiarazione di vision
   - values: array di valori aziendali
   - toneOfVoice: tone of voice utilizzato (es: "professionale", "friendly", "tecnico")
   - brandPersonality: personalità del brand (es: "innovativo", "affidabile")
   - usp: unique selling proposition - cosa li distingue
   - competitors: array di competitor menzionati o dedotti dal settore
   - industryKeywords: parole chiave del settore

2. **Products/Services**: Array di prodotti o servizi. Per OGNI prodotto/servizio identifica:
   - name: nome del prodotto/servizio
   - description: descrizione dettagliata
   - category: categoria (es: "software", "servizio", "prodotto fisico")
   - features: array di caratteristiche principali
   - benefits: array di benefici per il cliente
   - price: prezzo se menzionato
   - imageUrls: array di URL delle immagini DALLA LISTA SOPRA che sono associate a questo prodotto. Usa l'analisi del contesto delle pagine per capire quali immagini sono di quale prodotto
   - targetAudience: pubblico target per questo prodotto
   - differentiators: cosa lo distingue dalla concorrenza

3. **Target Groups**: Array di gruppi target identificati. Per ogni target:
   - name: nome del segmento (es: "PMI", "Enterprise", "Freelancer")
   - description: descrizione del target
   - ageRange, gender, location, income, education, occupation: dati demografici se deducibili
   - interests: array di interessi
   - painPoints: array di problemi/pain points
   - goals: array di obiettivi
   - behaviors: array di comportamenti
   - buyingMotivation: motivazione all'acquisto
   - objections: possibili obiezioni

**IMPORTANTE PER LE IMMAGINI**:
- Analizza attentamente quale pagina contiene quale prodotto
- Abbina le immagini trovate su quella pagina al prodotto corrispondente
- Se una pagina parla del "Prodotto X" e contiene 3 immagini, quelle 3 immagini probabilmente sono del Prodotto X
- Includi SOLO URL dalla lista "TUTTE LE IMMAGINI TROVATE" sopra

Rispondi SOLO con un JSON valido nel seguente formato (senza markdown):

{
  "businessDna": { ... },
  "products": [ ... ],
  "targetGroups": [ ... ]
}

Sii il più dettagliato e accurato possibile. Se non trovi informazioni per un campo, omettilo o metti null.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  // Get token usage
  const usageMetadata = result.response.usageMetadata
  const inputTokens = usageMetadata?.promptTokenCount || 0
  const outputTokens = usageMetadata?.candidatesTokenCount || 0

  // Parse response
  let parsed: DeepAnalysisResult
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    const data = JSON.parse(cleaned)
    parsed = {
      businessDna: data.businessDna || {},
      products: data.products || [],
      targetGroups: data.targetGroups || [],
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
      }
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', response)
    throw new Error('Failed to parse AI analysis response')
  }

  return parsed
}
