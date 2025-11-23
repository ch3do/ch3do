import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { logUsage } from "@/lib/usage"
import { generateImage, buildImagePrompt, shouldGenerateImage } from "@/services/nanobanana"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface GenerateContentRequest {
  companyId: string
  targetGroupId?: string
  productId?: string
  guidelineId: string
  platform: string
  topic: string
  additionalNotes?: string
  generateImage?: boolean  // New: whether to generate an image
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestBody: GenerateContentRequest = await req.json()
    const { companyId, targetGroupId, productId, guidelineId, platform, topic, additionalNotes, generateImage } = requestBody

    // Verify ownership and load all context
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
      include: {
        businessDna: true,
        targetGroups: true,
        products: true,
        guidelines: true,
      },
    })

    if (!company || !company.businessDna) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Get specific entities
    const targetGroup = targetGroupId
      ? company.targetGroups.find((tg) => tg.id === targetGroupId)
      : null

    const product = productId ? company.products.find((p) => p.id === productId) : null

    const guideline = company.guidelines.find((g) => g.id === guidelineId)
    if (!guideline) {
      return NextResponse.json({ error: "Guideline not found" }, { status: 404 })
    }

    // Parse JSON strings
    const businessDna = {
      ...company.businessDna,
      values: safeJsonParse(company.businessDna.values),
      competitors: safeJsonParse(company.businessDna.competitors),
      industryKeywords: safeJsonParse(company.businessDna.industryKeywords),
    }

    const targetGroupData = targetGroup
      ? {
          ...targetGroup,
          interests: safeJsonParse(targetGroup.interests),
          painPoints: safeJsonParse(targetGroup.painPoints),
          goals: safeJsonParse(targetGroup.goals),
        }
      : null

    const productData = product
      ? {
          ...product,
          features: safeJsonParse(product.features),
          benefits: safeJsonParse(product.benefits),
        }
      : null

    // Generate content with Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    })

    const prompt = buildPrompt({
      company: company.name,
      businessDna,
      targetGroup: targetGroupData,
      product: productData,
      guideline,
      platform,
      topic,
      additionalNotes,
    })

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Get token usage
    const usageMetadata = result.response.usageMetadata
    const inputTokens = usageMetadata?.promptTokenCount || 0
    const outputTokens = usageMetadata?.candidatesTokenCount || 0

    // Parse response
    let title = ""
    let body = ""

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      title = parsed.title || ""
      body = parsed.body || response
    } catch {
      // If not JSON, use raw response
      const lines = response.split("\n")
      title = lines[0].replace(/^#+\s*/, "").trim()
      body = lines.slice(1).join("\n").trim()
    }

    // Generate image if requested
    let imageUrl: string | undefined
    let imagePrompt: string | undefined

    if (generateImage && shouldGenerateImage(guideline.type, platform)) {
      try {
        // Build intelligent image prompt based on context
        imagePrompt = buildImagePrompt({
          productName: productData?.name,
          productDescription: productData?.description || body.slice(0, 300),
          platform,
          topic,
          brandPersonality: businessDna.brandPersonality,
        })

        const imageResult = await generateImage({
          prompt: imagePrompt,
          width: 1024,
          height: 1024,
        })

        if (imageResult.success && imageResult.imageUrl) {
          imageUrl = imageResult.imageUrl

          // Log image generation usage
          await logUsage({
            userId: user.id,
            operation: "image_generation",
            model: "nanobanana",
            inputTokens: 0,
            outputTokens: 0,
            companyId,
            metadata: {
              platform,
              topic,
              imageCount: 1,
              prompt: imagePrompt,
            },
          })
        }
      } catch (imgError) {
        console.error("Image generation failed:", imgError)
        // Continue without image - non-blocking
      }
    }

    // Save to database
    const content = await prisma.content.create({
      data: {
        companyId,
        targetGroupId: targetGroupId || null,
        productId: productId || null,
        guidelineId,
        title,
        topic,
        body,
        imageUrl,
        imagePrompt,
        type: guideline.type,
        status: "DRAFT",
        generationContext: JSON.stringify({
          platform,
          additionalNotes,
          timestamp: new Date().toISOString(),
          imageGenerated: !!imageUrl,
        }),
      },
    })

    // Log text generation usage
    await logUsage({
      userId: user.id,
      operation: "content_generation",
      model: "gemini-2.0-flash-exp",
      inputTokens,
      outputTokens,
      companyId,
      contentId: content.id,
      metadata: {
        platform,
        topic,
        hasTargetGroup: !!targetGroupId,
        hasProduct: !!productId,
        hasImage: !!imageUrl,
      },
    })

    return NextResponse.json({
      success: true,
      content: {
        id: content.id,
        title,
        body,
        imageUrl,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Content generation error:", errorMessage)
    return NextResponse.json({ error: `Generazione fallita: ${errorMessage}` }, { status: 500 })
  }
}

function safeJsonParse(str: string | null): unknown {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

function buildPrompt(context: {
  company: string
  businessDna: Record<string, unknown>
  targetGroup: Record<string, unknown> | null
  product: Record<string, unknown> | null
  guideline: Record<string, unknown>
  platform: string
  topic: string
  additionalNotes?: string
}): string {
  return `Sei un esperto copywriter specializzato in marketing digitale. Il tuo compito è creare contenuti eccellenti basati sul contesto aziendale fornito.

# CONTESTO AZIENDALE

## Azienda: ${context.company}

### Business DNA
${JSON.stringify(context.businessDna, null, 2)}

${
  context.targetGroup
    ? `### Target Group
${JSON.stringify(context.targetGroup, null, 2)}`
    : ""
}

${
  context.product
    ? `### Prodotto/Servizio
${JSON.stringify(context.product, null, 2)}`
    : ""
}

# RICHIESTA

**Piattaforma:** ${context.platform}
**Argomento:** ${context.topic}
${context.additionalNotes ? `**Note aggiuntive:** ${context.additionalNotes}` : ""}

# LINEE GUIDA

${JSON.stringify(context.guideline, null, 2)}

# ISTRUZIONI

1. Analizza attentamente il Business DNA per comprendere:
   - Il tone of voice dell'azienda
   - La brand personality
   - L'USP (Unique Selling Proposition)
   - I valori aziendali

2. Se specificato un target group, adatta il linguaggio e il messaggio per:
   - Rispondere ai loro pain points
   - Parlare ai loro interessi
   - Allinearti ai loro obiettivi

3. Se specificato un prodotto, evidenzia:
   - Le features più rilevanti
   - I benefits concreti per il target
   - I differenziatori rispetto alla concorrenza

4. Segui ESATTAMENTE le linee guida fornite

5. Adatta il formato e lo stile per la piattaforma: ${context.platform}

6. Mantieni coerenza con la brand voice in tutto il contenuto

# OUTPUT

Rispondi con un JSON nel seguente formato:

{
  "title": "Un titolo accattivante e pertinente",
  "body": "Il contenuto completo, formattato per ${context.platform}"
}

Genera SOLO il JSON, senza markdown o testo aggiuntivo.`
}
