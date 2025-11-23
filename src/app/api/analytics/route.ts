import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserUsageStats } from "@/lib/usage"

export async function GET(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const operation = searchParams.get("operation")

    const filters: {
      startDate?: Date
      endDate?: Date
      operation?: string
    } = {}

    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (operation) filters.operation = operation

    const stats = await getUserUsageStats(user.id, filters)

    return NextResponse.json(stats)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Analytics error:", errorMessage)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
