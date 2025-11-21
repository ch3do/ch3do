import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const company = await prisma.company.findFirst({
      where: { id, userId: user.id },
      include: {
        businessDna: true,
        targetGroups: true,
        products: true,
        guidelines: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Parse JSON strings for frontend
    const parsed = {
      ...company,
      businessDna: company.businessDna ? {
        ...company.businessDna,
        values: safeJsonParse(company.businessDna.values),
        competitors: safeJsonParse(company.businessDna.competitors),
        industryKeywords: safeJsonParse(company.businessDna.industryKeywords),
        socialLinks: safeJsonParse(company.businessDna.socialLinks),
      } : null,
      targetGroups: company.targetGroups.map(tg => ({
        ...tg,
        interests: safeJsonParse(tg.interests),
        painPoints: safeJsonParse(tg.painPoints),
        goals: safeJsonParse(tg.goals),
        behaviors: safeJsonParse(tg.behaviors),
        objections: safeJsonParse(tg.objections),
      })),
      products: company.products.map(p => ({
        ...p,
        features: safeJsonParse(p.features),
        benefits: safeJsonParse(p.benefits),
        differentiators: safeJsonParse(p.differentiators),
      })),
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await req.json()

    const company = await prisma.company.findFirst({
      where: { id, userId: user.id },
    })

    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (data.businessDna) {
      await prisma.businessDna.update({
        where: { companyId: id },
        data: data.businessDna,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
