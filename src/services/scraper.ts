import * as cheerio from 'cheerio'

interface ScrapedPage {
  url: string
  title: string
  content: string
  links: string[]
  images: string[]  // All images found on the page
}

interface ScrapedData {
  pages: ScrapedPage[]
  metadata: {
    logo?: string
    socialLinks: Record<string, string>
    emails: string[]
    phones: string[]
  }
  allImages: string[]  // Deduplicated list of all images
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessDNABot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return null
    return await response.text()
  } catch {
    console.error(`Failed to fetch ${url}`)
    return null
  }
}

function extractContent($: cheerio.CheerioAPI): string {
  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove()

  // Get main content
  const mainContent = $('main, article, .content, #content, .main').first()
  const text = mainContent.length ? mainContent.text() : $('body').text()

  // Clean up whitespace
  return text.replace(/\s+/g, ' ').trim().slice(0, 10000)
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = []
  const base = new URL(baseUrl)

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    try {
      const url = new URL(href, baseUrl)
      // Only same domain links
      if (url.hostname === base.hostname && !url.pathname.match(/\.(pdf|jpg|png|gif|zip)$/i)) {
        links.push(url.href)
      }
    } catch {}
  })

  return [...new Set(links)]
}

function extractImages($: cheerio.CheerioAPI, baseUrl: string, excludeLogo: boolean = false): string[] {
  const images: string[] = []
  const logoSelectors = ['[class*="logo"]', 'header img.logo', '.logo', '#logo']

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src')
    if (!src) return

    // Skip very small images (likely icons)
    const width = parseInt($(el).attr('width') || '0')
    const height = parseInt($(el).attr('height') || '0')
    if (width > 0 && height > 0 && (width < 100 || height < 100)) return

    // Skip logo if requested
    if (excludeLogo) {
      const parent = $(el).parent()
      const isLogo = logoSelectors.some(sel => $(el).is(sel) || parent.is(sel) || parent.closest(sel).length > 0)
      if (isLogo) return
    }

    try {
      const fullUrl = new URL(src, baseUrl).href
      // Only include common image formats
      if (fullUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)) {
        images.push(fullUrl)
      }
    } catch {}
  })

  return [...new Set(images)]
}

function extractMetadata($: cheerio.CheerioAPI, baseUrl: string) {
  const socialLinks: Record<string, string> = {}

  // Social links
  const socialPatterns: Record<string, RegExp> = {
    facebook: /facebook\.com/i,
    instagram: /instagram\.com/i,
    linkedin: /linkedin\.com/i,
    twitter: /twitter\.com|x\.com/i,
    youtube: /youtube\.com/i,
  }

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(href) && !socialLinks[platform]) {
        socialLinks[platform] = href
      }
    }
  })

  // Logo
  let logo: string | undefined
  const logoSelectors = ['[class*="logo"] img', 'header img', '.logo img', '#logo img']
  for (const selector of logoSelectors) {
    const src = $(selector).first().attr('src')
    if (src) {
      logo = new URL(src, baseUrl).href
      break
    }
  }

  // Emails
  const pageText = $('body').text() + ' ' + $('a[href^="mailto:"]').map((_, el) => $(el).attr('href')).get().join(' ')
  const emails = [...new Set(pageText.match(/[\w.-]+@[\w.-]+\.\w+/g) || [])]

  // Phones
  const phones = [...new Set(pageText.match(/\+?[\d\s()-]{10,}/g)?.map(p => p.trim()) || [])]

  return { logo, socialLinks, emails, phones }
}

export async function scrapeWebsite(websiteUrl: string, maxPages = 10): Promise<ScrapedData> {
  const baseUrl = new URL(websiteUrl).origin
  const visited = new Set<string>()
  const toVisit: string[] = [websiteUrl]
  const pages: ScrapedPage[] = []
  const allMetadata: ScrapedData['metadata'] = {
    socialLinks: {},
    emails: [],
    phones: [],
  }
  const allImagesSet = new Set<string>()

  // Priority pages to try (especially product/service pages)
  const priorityPaths = [
    '/about', '/chi-siamo', '/about-us', '/azienda',
    '/servizi', '/services', '/prodotti', '/products', '/product', '/prodotto',
    '/shop', '/negozio', '/store', '/portfolio',
    '/contatti', '/contact', '/contacts',
  ]

  for (const path of priorityPaths) {
    toVisit.push(baseUrl + path)
  }

  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift()!
    const normalizedUrl = url.split('#')[0].split('?')[0]

    if (visited.has(normalizedUrl)) continue
    visited.add(normalizedUrl)

    const html = await fetchPage(url)
    if (!html) continue

    const $ = cheerio.load(html)

    const title = $('title').text() || $('h1').first().text() || url
    const content = extractContent($)
    const links = extractLinks($, url)
    const metadata = extractMetadata($, url)
    const images = extractImages($, url, true) // Exclude logo from general images

    pages.push({ url, title, content, links, images })

    // Collect all images
    images.forEach(img => allImagesSet.add(img))

    // Merge metadata
    Object.assign(allMetadata.socialLinks, metadata.socialLinks)
    allMetadata.emails.push(...metadata.emails)
    allMetadata.phones.push(...metadata.phones)
    if (metadata.logo) allMetadata.logo = metadata.logo

    // Add new links to visit
    for (const link of links) {
      if (!visited.has(link.split('#')[0].split('?')[0])) {
        toVisit.push(link)
      }
    }
  }

  // Deduplicate
  allMetadata.emails = [...new Set(allMetadata.emails)]
  allMetadata.phones = [...new Set(allMetadata.phones)]

  return {
    pages,
    metadata: allMetadata,
    allImages: Array.from(allImagesSet)
  }
}
