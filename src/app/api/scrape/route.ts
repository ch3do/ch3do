import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scrapeWebsite } from "@/services/scraper"
import { extractBusinessDna } from "@/services/gemini"

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
      const scrapedData = await scrapeWebsite(url.href)
      const dnaData = await extractBusinessDna(scrapedData)

      await prisma.businessDna.create({
        data: {
          companyId: company.id,
          description: dnaData.companyInfo?.description,
          history: dnaData.companyInfo?.history,
          mission: dnaData.companyInfo?.mission,
          vision: dnaData.companyInfo?.vision,
          values: JSON.stringify(dnaData.companyInfo?.values || []),
          toneOfVoice: dnaData.brand?.toneOfVoice,
          brandPersonality: dnaData.brand?.brandPersonality,
          usp: dnaData.brand?.usp,
          competitors: JSON.stringify(dnaData.market?.competitors || []),
          industryKeywords: JSON.stringify(dnaData.market?.industryKeywords || []),
          email: dnaData.companyInfo?.email || scrapedData.metadata.emails[0],
          phone: dnaData.companyInfo?.phone || scrapedData.metadata.phones[0],
          address: dnaData.companyInfo?.address,
          socialLinks: JSON.stringify(dnaData.companyInfo?.socialLinks || scrapedData.metadata.socialLinks),
          rawScrapedData: JSON.stringify(scrapedData),
        },
      })

      if (dnaData.targetGroups?.length) {
        for (const tg of dnaData.targetGroups) {
          await prisma.targetGroup.create({
            data: {
              companyId: company.id,
              name: (tg.name as string) || "Target Group",
              description: tg.description as string,
              ageRange: tg.ageRange as string,
              interests: JSON.stringify(tg.interests || []),
              painPoints: JSON.stringify(tg.painPoints || []),
              goals: JSON.stringify(tg.goals || []),
              behaviors: JSON.stringify([]),
              objections: JSON.stringify([]),
            },
          })
        }
      }

      if (dnaData.products?.length) {
        for (const p of dnaData.products) {
          await prisma.product.create({
            data: {
              companyId: company.id,
              name: (p.name as string) || "Product",
              description: p.description as string,
              category: p.category as string,
              features: JSON.stringify(p.features || []),
              benefits: JSON.stringify(p.benefits || []),
              differentiators: JSON.stringify([]),
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

      await prisma.company.update({
        where: { id: company.id },
        data: {
          name: dnaData.companyInfo?.name || company.name,
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
