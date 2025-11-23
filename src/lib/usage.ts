import { prisma } from "./prisma"

// Pricing per 1M tokens (USD) - Updated for Gemini models
const PRICING = {
  "gemini-3-pro-preview": {
    input: 2.0,  // Gemini 3 Pro pricing (<200k tokens)
    output: 12.0,
  },
  "gemini-2.0-flash-thinking-exp-01-21": {
    input: 0.075,
    output: 0.3,
  },
  "gemini-2.0-flash-exp": {
    input: 0.075,
    output: 0.3,
  },
  "gemini-2.0-flash": {
    input: 0.075,
    output: 0.3,
  },
  nanobanana: {
    // Assume $0.01 per image
    perImage: 0.01,
  },
}

interface LogUsageParams {
  userId: string
  operation: "scraping" | "content_generation" | "image_generation"
  model: string
  inputTokens: number
  outputTokens: number
  companyId?: string
  contentId?: string
  metadata?: Record<string, unknown>
}

export async function logUsage(params: LogUsageParams) {
  const { userId, operation, model, inputTokens, outputTokens, companyId, contentId, metadata } =
    params

  let costUsd = 0

  // Calculate cost based on model
  if (model.includes("gemini")) {
    // Select pricing based on specific model
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING["gemini-3-pro-preview"]
    costUsd = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
  } else if (model === "nanobanana") {
    const imageCount = metadata?.imageCount as number || 1
    costUsd = PRICING.nanobanana.perImage * imageCount
  }

  await prisma.usageLog.create({
    data: {
      userId,
      operation,
      model,
      inputTokens,
      outputTokens,
      costUsd,
      companyId: companyId || null,
      contentId: contentId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })

  return costUsd
}

export async function getUserUsageStats(
  userId: string,
  filters?: {
    startDate?: Date
    endDate?: Date
    operation?: string
  }
) {
  const where: {
    userId: string
    createdAt?: { gte?: Date; lte?: Date }
    operation?: string
  } = { userId }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  if (filters?.operation) {
    where.operation = filters.operation
  }

  const logs = await prisma.usageLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  const totalCost = logs.reduce((sum, log) => sum + log.costUsd, 0)
  const totalInputTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0)
  const totalOutputTokens = logs.reduce((sum, log) => sum + log.outputTokens, 0)

  const byOperation = logs.reduce(
    (acc, log) => {
      if (!acc[log.operation]) {
        acc[log.operation] = {
          count: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
        }
      }
      acc[log.operation].count++
      acc[log.operation].cost += log.costUsd
      acc[log.operation].inputTokens += log.inputTokens
      acc[log.operation].outputTokens += log.outputTokens
      return acc
    },
    {} as Record<
      string,
      { count: number; cost: number; inputTokens: number; outputTokens: number }
    >
  )

  const byDay = logs.reduce(
    (acc, log) => {
      const day = log.createdAt.toISOString().split("T")[0]
      if (!acc[day]) {
        acc[day] = { cost: 0, count: 0 }
      }
      acc[day].cost += log.costUsd
      acc[day].count++
      return acc
    },
    {} as Record<string, { cost: number; count: number }>
  )

  return {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    totalOperations: logs.length,
    byOperation,
    byDay,
    recentLogs: logs.slice(0, 20),
  }
}
