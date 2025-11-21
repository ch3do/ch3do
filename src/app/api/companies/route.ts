import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companies = await prisma.company.findMany({
      where: { userId: user.id },
      include: {
        businessDna: true,
        _count: {
          select: {
            targetGroups: true,
            products: true,
            contents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
