import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function extractBusinessDna(scrapedContent: {
  pages: Array<{ url: string; title: string; content: string }>
  metadata: Record<string, unknown>
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = `Analizza il seguente contenuto scraped da un sito web aziendale ed estrai il "Business DNA" completo.

CONTENUTO SCRAPED:
${JSON.stringify(scrapedContent, null, 2)}

Estrai e restituisci un JSON con questa struttura esatta:
{
  "companyInfo": {
    "name": "nome azienda",
    "description": "descrizione completa dell'azienda",
    "history": "storia dell'azienda se disponibile",
    "mission": "mission aziendale",
    "vision": "vision aziendale",
    "values": ["valore1", "valore2"],
    "email": "email contatto",
    "phone": "telefono",
    "address": "indirizzo",
    "socialLinks": {
      "facebook": "url",
      "instagram": "url",
      "linkedin": "url",
      "twitter": "url"
    }
  },
  "brand": {
    "toneOfVoice": "descrizione dettagliata del tono di voce usato (formale/informale, tecnico/accessibile, ecc.)",
    "brandPersonality": "personalità del brand (innovativo, affidabile, giovane, tradizionale, ecc.)",
    "usp": "Unique Selling Proposition - cosa rende unica questa azienda"
  },
  "market": {
    "industry": "settore di appartenenza",
    "industryKeywords": ["keyword1", "keyword2"],
    "competitors": ["competitor1", "competitor2"]
  },
  "targetGroups": [
    {
      "name": "nome target group",
      "description": "descrizione",
      "ageRange": "fascia età",
      "interests": ["interesse1"],
      "painPoints": ["problema1"],
      "goals": ["obiettivo1"]
    }
  ],
  "products": [
    {
      "name": "nome prodotto/servizio",
      "description": "descrizione",
      "category": "categoria",
      "features": ["feature1"],
      "benefits": ["benefit1"]
    }
  ]
}

IMPORTANTE:
- Estrai TUTTI i dati possibili dal contenuto
- Se un dato non è disponibile, usa null
- Inferisci il tone of voice analizzando lo stile di scrittura
- Identifica i target group basandoti sui contenuti e messaggi
- Identifica tutti i prodotti/servizi menzionati

Rispondi SOLO con il JSON, senza markdown o testo aggiuntivo.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  // Parse JSON response
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    console.error("Failed to parse Gemini response:", response)
    throw new Error("Failed to parse AI response")
  }
}

export async function generateContent(context: {
  businessDna: Record<string, unknown>
  targetGroup?: Record<string, unknown>
  product?: Record<string, unknown>
  guideline: Record<string, unknown>
  topic: string
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = `Genera contenuto marketing basato sul seguente contesto:

BUSINESS DNA:
${JSON.stringify(context.businessDna, null, 2)}

${context.targetGroup ? `TARGET GROUP:
${JSON.stringify(context.targetGroup, null, 2)}` : ''}

${context.product ? `PRODOTTO:
${JSON.stringify(context.product, null, 2)}` : ''}

LINEE GUIDA:
${JSON.stringify(context.guideline, null, 2)}

ARGOMENTO: ${context.topic}

Genera il contenuto seguendo esattamente le linee guida fornite, mantenendo il tone of voice del brand e rivolgendoti al target group specificato.

Rispondi con un JSON:
{
  "title": "titolo del contenuto",
  "body": "corpo del contenuto completo"
}

Rispondi SOLO con il JSON.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to parse AI response")
  }
}
