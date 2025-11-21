import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scrapeWebsite } from "@/services/scraper"
import { extractBusinessDna } from "@/services/gemini"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { websiteUrl } = await req.json()
    if (!websiteUrl) {
      return NextResponse.json({ error: "Website URL required" }, { status: 400 })
    }

    // Validate URL
    let url: URL
    try {
      url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Create company record
    const company = await prisma.company.create({
      data: {
        userId: session.user.id,
        name: url.hostname.replace('www.', ''),
        website: url.href,
        scrapingStatus: "IN_PROGRESS",
      },
    })

    // Start scraping (in production, this would be a background job)
    try {
      const scrapedData = await scrapeWebsite(url.href)
      const dnaData = await extractBusinessDna(scrapedData)

      // Create BusinessDna record
      await prisma.businessDna.create({
        data: {
          companyId: company.id,
          description: dnaData.companyInfo?.description,
          history: dnaData.companyInfo?.history,
          mission: dnaData.companyInfo?.mission,
          vision: dnaData.companyInfo?.vision,
          values: dnaData.companyInfo?.values || [],
          toneOfVoice: dnaData.brand?.toneOfVoice,
          brandPersonality: dnaData.brand?.brandPersonality,
          usp: dnaData.brand?.usp,
          competitors: dnaData.market?.competitors || [],
          industryKeywords: dnaData.market?.industryKeywords || [],
          email: dnaData.companyInfo?.email || scrapedData.metadata.emails[0],
          phone: dnaData.companyInfo?.phone || scrapedData.metadata.phones[0],
          address: dnaData.companyInfo?.address,
          socialLinks: dnaData.companyInfo?.socialLinks || scrapedData.metadata.socialLinks,
          rawScrapedData: JSON.parse(JSON.stringify(scrapedData)),
        },
      })

      // Create target groups
      if (dnaData.targetGroups?.length) {
        await prisma.targetGroup.createMany({
          data: dnaData.targetGroups.map((tg: Record<string, unknown>) => ({
            companyId: company.id,
            name: tg.name as string || "Target Group",
            description: tg.description as string,
            ageRange: tg.ageRange as string,
            interests: (tg.interests as string[]) || [],
            painPoints: (tg.painPoints as string[]) || [],
            goals: (tg.goals as string[]) || [],
            behaviors: [],
            objections: [],
          })),
        })
      }

      // Create products
      if (dnaData.products?.length) {
        await prisma.product.createMany({
          data: dnaData.products.map((p: Record<string, unknown>) => ({
            companyId: company.id,
            name: p.name as string || "Product",
            description: p.description as string,
            category: p.category as string,
            features: (p.features as string[]) || [],
            benefits: (p.benefits as string[]) || [],
            differentiators: [],
          })),
        })
      }

      // Create default guidelines
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

      // Update company status
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
      console.error("Scraping error:", error)
      return NextResponse.json({ error: "Scraping failed", companyId: company.id }, { status: 500 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
