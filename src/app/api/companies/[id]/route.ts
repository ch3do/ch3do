import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const company = await prisma.company.findFirst({
      where: { id, userId: session.user.id },
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

    return NextResponse.json(company)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await req.json()

    // Verify ownership
    const company = await prisma.company.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Update businessDna if provided
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
