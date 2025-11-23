import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scrapeWebsite } from "@/services/scraper"
import { analyzeWithGemini } from "@/services/deepAnalyzer"
import { logUsage } from "@/lib/usage"

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { websiteUrl } = await req.json()
    if (!websiteUrl) {
      return NextResponse.json({ error: "Website URL required" }, { status: 400 })
    }

    let url: URL
    try {
      url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name: url.hostname.replace('www.', ''),
        website: url.href,
        scrapingStatus: "IN_PROGRESS",
      },
    })

    try {
      // Step 1: Scrape website with image extraction
      const scrapedData = await scrapeWebsite(url.href, 15) // Increased to 15 pages for more coverage

      // Step 2: Deep analysis with Gemini
      const companyName = url.hostname.replace('www.', '').split('.')[0]
      const analysis = await analyzeWithGemini(scrapedData, companyName)

      // Log AI usage for scraping
      try {
        await logUsage({
          userId: user.id,
          operation: "scraping",
          model: "gemini-3-pro-preview",
          inputTokens: analysis.tokenUsage.input,
          outputTokens: analysis.tokenUsage.output,
          companyId: company.id,
          metadata: {
            pagesScraped: scrapedData.pages.length,
            imagesFound: scrapedData.allImages.length,
            productsExtracted: analysis.products.length,
            targetGroupsExtracted: analysis.targetGroups.length,
          },
        })
      } catch (error) {
        // Non-blocking - scraping continues even if logging fails
        console.log('Warning: Usage logging failed', error)
      }

      // Step 3: Save Business DNA
      await prisma.businessDna.create({
        data: {
          companyId: company.id,
          description: analysis.businessDna.description,
          history: analysis.businessDna.history,
          mission: analysis.businessDna.mission,
          vision: analysis.businessDna.vision,
          values: JSON.stringify(analysis.businessDna.values || []),
          toneOfVoice: analysis.businessDna.toneOfVoice,
          brandPersonality: analysis.businessDna.brandPersonality,
          usp: analysis.businessDna.usp,
          competitors: JSON.stringify(analysis.businessDna.competitors || []),
          industryKeywords: JSON.stringify(analysis.businessDna.industryKeywords || []),
          email: scrapedData.metadata.emails[0],
          phone: scrapedData.metadata.phones[0],
          socialLinks: JSON.stringify(scrapedData.metadata.socialLinks),
          rawScrapedData: JSON.stringify({
            pages: scrapedData.pages.length,
            images: scrapedData.allImages.length,
          }),
        },
      })

      // Step 4: Save Target Groups
      if (analysis.targetGroups?.length) {
        for (const tg of analysis.targetGroups) {
          await prisma.targetGroup.create({
            data: {
              companyId: company.id,
              name: tg.name,
              description: tg.description,
              ageRange: tg.ageRange,
              gender: tg.gender,
              location: tg.location,
              income: tg.income,
              education: tg.education,
              occupation: tg.occupation,
              interests: JSON.stringify(tg.interests || []),
              painPoints: JSON.stringify(tg.painPoints || []),
              goals: JSON.stringify(tg.goals || []),
              behaviors: JSON.stringify(tg.behaviors || []),
              buyingMotivation: tg.buyingMotivation,
              objections: JSON.stringify(tg.objections || []),
            },
          })
        }
      }

      // Step 5: Save Products with Images
      if (analysis.products?.length) {
        for (const p of analysis.products) {
          await prisma.product.create({
            data: {
              companyId: company.id,
              name: p.name,
              description: p.description,
              category: p.category,
              features: JSON.stringify(p.features || []),
              benefits: JSON.stringify(p.benefits || []),
              price: p.price,
              imageUrl: p.imageUrls?.[0], // Primary image
              images: JSON.stringify(p.imageUrls || []), // All images
              targetAudience: p.targetAudience,
              differentiators: JSON.stringify(p.differentiators || []),
            },
          })
        }
      }

      await prisma.guideline.createMany({
        data: [
          {
            companyId: company.id,
            name: "Articoli Blog",
            type: "BLOG_ARTICLE",
            promptTemplate: `Scrivi un articolo per il blog aziendale.
- Usa il tone of voice del brand
- Lunghezza: 800-1200 parole
- Includi una introduzione coinvolgente
- Usa sottotitoli per organizzare il contenuto
- Concludi con una call-to-action`,
            isDefault: true,
          },
          {
            companyId: company.id,
            name: "Post Social",
            type: "SOCIAL_POST",
            promptTemplate: `Crea un post per i social media.
- Tono coinvolgente e diretto
- Massimo 280 caratteri per Twitter, 2200 per Instagram
- Includi emoji pertinenti
- Aggiungi hashtag rilevanti`,
            isDefault: true,
          },
          {
            companyId: company.id,
            name: "Email Marketing",
            type: "EMAIL",
            promptTemplate: `Scrivi un'email di marketing.
- Oggetto accattivante
- Apertura personalizzata
- Contenuto chiaro e conciso
- Call-to-action evidente`,
            isDefault: true,
          },
        ],
      })

      // Step 6: Update company with final data
      await prisma.company.update({
        where: { id: company.id },
        data: {
          name: companyName,
          logo: scrapedData.metadata.logo,
          scrapingStatus: "COMPLETED",
          scrapedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, companyId: company.id })
    } catch (error) {
      await prisma.company.update({
        where: { id: company.id },
        data: { scrapingStatus: "FAILED" },
      })
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("Scraping error:", errorMessage)
      return NextResponse.json({ error: `Analisi fallita: ${errorMessage}`, companyId: company.id }, { status: 500 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
