/**
 * Nanobanana Image Generation Service
 * https://nanobanana.com - Text-to-Image API
 */

interface ImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  guidanceScale?: number
  steps?: number
}

interface ImageGenerationResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

export async function generateImage(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const apiKey = process.env.NANOBANANA_API_KEY

  if (!apiKey) {
    throw new Error('NANOBANANA_API_KEY not configured')
  }

  try {
    // Default parameters optimized for marketing content
    const requestBody = {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy',
      width: params.width || 1024,
      height: params.height || 1024,
      guidance_scale: params.guidanceScale || 7.5,
      steps: params.steps || 30,
    }

    const response = await fetch('https://api.nanobanana.com/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      imageUrl: data.image_url || data.url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Nanobanana generation error:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Generate an optimized prompt for marketing images
 */
export function buildImagePrompt(context: {
  productName?: string
  productDescription?: string
  platform: string
  topic: string
  brandPersonality?: string
  style?: string
}): string {
  const parts: string[] = []

  // Base subject
  if (context.productName) {
    parts.push(`${context.productName}`)
  }

  // Context and description
  if (context.productDescription) {
    parts.push(context.productDescription.slice(0, 200))
  }

  // Style based on platform
  const platformStyles: Record<string, string> = {
    Instagram: 'vibrant, eye-catching, modern aesthetic, Instagram-worthy',
    Facebook: 'relatable, warm, engaging, social media optimized',
    LinkedIn: 'professional, clean, corporate, business-appropriate',
    Twitter: 'bold, attention-grabbing, dynamic',
    Blog: 'professional, editorial style, high quality',
    Email: 'clean, modern, attention-grabbing hero image',
  }

  const platformStyle = platformStyles[context.platform] || 'professional, high quality'
  parts.push(platformStyle)

  // Brand personality
  if (context.brandPersonality) {
    parts.push(context.brandPersonality)
  }

  // Quality keywords
  parts.push('high resolution, professional photography, sharp focus, perfect lighting, marketing photo')

  return parts.join(', ')
}

/**
 * Validate if image generation is appropriate for the content type
 */
export function shouldGenerateImage(contentType: string, platform: string): boolean {
  const imageAppropriateTypes = [
    'SOCIAL_POST',
    'BLOG_ARTICLE',
    'EMAIL',
    'AD_COPY',
    'LANDING_PAGE',
  ]

  const imageAppropiatePlatforms = [
    'Instagram',
    'Facebook',
    'LinkedIn',
    'Pinterest',
    'Blog',
    'Email',
    'Website',
  ]

  return (
    imageAppropriateTypes.includes(contentType) ||
    imageAppropiatePlatforms.includes(platform)
  )
}
