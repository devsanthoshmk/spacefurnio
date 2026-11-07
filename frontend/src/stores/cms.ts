import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import homePageText from '@/assets/contents/homePage.js'

export interface CmsSection {
  id: string
  sectionKey: string
  sortOrder?: number
  enabled?: boolean
  data?: Record<string, unknown>
  publishedData?: Record<string, unknown>
  updatedAt?: string
  [key: string]: unknown
}

export interface CmsPage {
  id: string
  slug: string
  title: string
  seoMetadata?: Record<string, unknown>
  status?: string
  publishedAt?: string | null
  updatedAt?: string
  sections?: CmsSection[]
  [key: string]: unknown
}

export interface CmsPolicy {
  id: string
  slug: string
  title: string
  content?: string
  publishedContent?: string
  versionNum?: number
  publishedAt?: string | null
  updatedAt?: string
  [key: string]: unknown
}

export interface CmsBundle {
  generatedAt?: string
  pages: CmsPage[]
  policies?: CmsPolicy[]
  [key: string]: unknown
}

interface WindowWithInitialBundle {
  __INITIAL_CMS_BUNDLE__?: CmsBundle
}

function resolveWorkerUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env
  const envUrl = (
    (typeof env?.VITE_WORKER_URL === 'string' ? env.VITE_WORKER_URL : '') ||
    (typeof env?.VITE_API_URL === 'string' ? env.VITE_API_URL : '') ||
    ''
  ).replace(/\/$/, '')

  if (envUrl) {
    if (env?.PROD && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return 'https://backend.spacefurnio.workers.dev'
    }
    return envUrl
  }
  return env?.PROD
    ? 'https://backend.spacefurnio.workers.dev'
    : 'http://localhost:8788'
}

export const useCmsStore = defineStore('cms', () => {
  // 1. Initial Hydration from SSR / SSG snapshot
  const initialBundle =
    typeof window !== 'undefined'
      ? (window as unknown as WindowWithInitialBundle).__INITIAL_CMS_BUNDLE__ ?? null
      : null

  // 2. State
  const bundle = ref<CmsBundle | null>(initialBundle)
  const isLoaded = ref<boolean>(Boolean(initialBundle))
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 3. Methods & Actions
  function getPage(slug: string): CmsPage | undefined {
    return bundle.value?.pages?.find((p: CmsPage) => p.slug === slug)
  }

  function getSection(pageSlug: string, sectionKey: string): Record<string, unknown> | null {
    const page = getPage(pageSlug)
    if (!page || !page.sections) return null
    const section = page.sections.find((s: CmsSection) => s.sectionKey === sectionKey)
    if (!section) return null
    return section.publishedData || section.data || null
  }

  function getSectionField(
    pageSlug: string,
    sectionKey: string,
    fieldKey: string,
    fallback = '',
  ): string {
    const section = getSection(pageSlug, sectionKey)
    if (!section) return fallback
    const val = section[fieldKey]
    if (val !== undefined && val !== null && val !== '') {
      return String(val)
    }
    return fallback
  }

  function getPolicy(slug: string): CmsPolicy | undefined {
    return bundle.value?.policies?.find((p: CmsPolicy) => p.slug === slug)
  }

  function getPolicyContent(slug: string, fallback = ''): string {
    const policy = getPolicy(slug)
    return policy?.publishedContent || policy?.content || fallback
  }

  let activeFetchPromise: Promise<void> | null = null

  async function fetchBundle(force = false): Promise<void> {
    if (typeof window !== 'undefined' && !bundle.value) {
      const win = window as unknown as WindowWithInitialBundle
      if (win.__INITIAL_CMS_BUNDLE__) {
        bundle.value = win.__INITIAL_CMS_BUNDLE__
        isLoaded.value = true
      }
    }

    if (isLoaded.value && !force) {
      return
    }

    if (activeFetchPromise) {
      return activeFetchPromise
    }

    isLoading.value = true
    error.value = null

    activeFetchPromise = (async () => {
      try {
        const workerUrl = resolveWorkerUrl()
        const res = await fetch(`${workerUrl}/api/cms/bundle`)
        if (!res.ok) {
          throw new Error(`Failed to fetch CMS bundle: ${res.status} ${res.statusText}`)
        }
        const data = (await res.json()) as CmsBundle
        bundle.value = data
        isLoaded.value = true
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : String(err)
        // Handles gracefully without throwing, keeps existing/fallback data
      } finally {
        isLoading.value = false
        activeFetchPromise = null
      }
    })()

    return activeFetchPromise
  }

  // 4. Auto-initialize on client mount / app startup safely (SSR/prerender compatible)
  if (typeof window !== 'undefined') {
    if (!isLoaded.value && !isLoading.value) {
      void fetchBundle()
    }
  }

  // 5. Home Getters
  const heroTagline = computed(() =>
    getSectionField('home', 'hero', 'tagline', homePageText.hero_tagline.text),
  )
  const heroBrandName = computed(() =>
    getSectionField('home', 'hero', 'brand_name', homePageText.hero_brand_name.text),
  )
  const newArrivalsHeading = computed(() =>
    getSectionField('home', 'hero', 'new_arrivals_heading', homePageText.new_arrivals_heading.text),
  )
  const comingSoonBadge = computed(() =>
    getSectionField('home', 'hero', 'coming_soon_badge', homePageText.coming_soon.text),
  )
  const ctaLine1 = computed(() =>
    getSectionField('home', 'hero', 'cta_line_1', homePageText.cta_line_1.text),
  )
  const ctaLine2 = computed(() =>
    getSectionField('home', 'hero', 'cta_line_2', homePageText.cta_line_2.text),
  )
  const grabNowButton = computed(() =>
    getSectionField('home', 'hero', 'grab_now_button', homePageText.grab_now_button.text),
  )
  const productSectionHeading = computed(() =>
    getSectionField('home', 'products', 'section_heading', homePageText.product_section_heading.text),
  )
  const productSectionButton = computed(() =>
    getSectionField('home', 'products', 'section_button', homePageText.product_section_button.text),
  )
  const scrollText1 = computed(() =>
    getSectionField('home', 'scroll', 'scroll_text_1', homePageText.scroll_text_1.text),
  )
  const scrollText2 = computed(() =>
    getSectionField('home', 'scroll', 'scroll_text_2', homePageText.scroll_text_2.text),
  )

  // 6. Footer Getters
  const footerBrandStatement = computed(() =>
    getSectionField(
      'footer',
      'footer_info',
      'brand_statement',
      'Transforming spaces with bespoke craftsmanship and timeless architectural elegance.',
    ),
  )
  const footerCopyright = computed(() =>
    getSectionField(
      'footer',
      'footer_info',
      'copyright',
      '© 2026 Spacefurnio – All rights reserved.',
    ),
  )
  const footerAddress = computed(() =>
    getSectionField(
      'footer',
      'footer_info',
      'address',
      '90/1, North Beach Road Tuticorin, Chennai – 628001.',
    ),
  )
  const footerPhone = computed(() =>
    getSectionField('footer', 'footer_info', 'phone', '+91 9751112025'),
  )
  const footerEmail = computed(() =>
    getSectionField('footer', 'footer_info', 'email', 'info.spacefurnio@gmail.com'),
  )
  const footerDetails = computed(() => {
    const sec = getSection('footer', 'footer_info')
    const socialLinks = (sec?.social_links as Array<{ name: string; url: string; label: string }>) || [
      {
        name: 'facebook',
        url: 'https://facebook.com/spacefurnio',
        label: 'Follow us on Facebook',
      },
      {
        name: 'twitter',
        url: 'https://twitter.com/spacefurnio',
        label: 'Follow us on Twitter',
      },
      {
        name: 'instagram',
        url: 'https://instagram.com/spacefurnio',
        label: 'Follow us on Instagram',
      },
      {
        name: 'linkedin',
        url: 'https://linkedin.com/company/spacefurnio',
        label: 'Follow us on LinkedIn',
      },
    ]
    return {
      brand_statement: footerBrandStatement.value,
      copyright: footerCopyright.value,
      address: footerAddress.value,
      phone: footerPhone.value,
      email: footerEmail.value,
      social_links: socialLinks,
    }
  })

  // 7. About Getters & Helpers
  const aboutHeadline = computed(() =>
    getSectionField(
      'about',
      'intro',
      'headline',
      'Shaping Spaces with Purpose, Personality, and Precision',
    ),
  )
  const aboutParagraph = computed(() =>
    getSectionField(
      'about',
      'intro',
      'paragraph',
      'At Spacefurnio, we are passionate about shaping spaces that reflect purpose, personality, and precision. We offer an integrated approach to architecture, construction, interior design, and custom furniture, ensuring every detail aligns seamlessly with your vision.',
    ),
  )
  const aboutStoryQuote = computed(() =>
    getSectionField(
      'about',
      'story',
      'quote',
      "Where lines meet light, and function meets soul, you'll find us – blending vision with reality & creativity with living. Every corner crafted. Every piece with purpose. Because your space deserves more than structure, it deserves a story.",
    ),
  )
  const aboutIntro = computed(() => ({
    headline: aboutHeadline.value,
    paragraph: aboutParagraph.value,
  }))
  const aboutStory = computed(() => {
    const sec = getSection('about', 'story')
    const pillars = (sec?.pillars as Array<{ title: string; desc: string }>) || [
      {
        title: 'Bespoke Craftsmanship',
        desc: 'Hand-selected hardwoods, precision joinery, and artisanal finishes designed to endure.',
      },
      {
        title: 'Architectural Harmony',
        desc: 'Furniture designed as natural extensions of modern architectural lines and spatial flow.',
      },
      {
        title: 'Sustainable Materials',
        desc: 'Responsibly sourced timber, low-VOC finishes, and eco-conscious fabrication.',
      },
    ]
    return {
      quote: aboutStoryQuote.value,
      pillars,
    }
  })

  // 8. Collabs Getters & Helpers
  const collabsHeadline = computed(() =>
    getSectionField('collabs', 'main', 'headline', 'Spacefurnio × Collabs'),
  )
  const collabsQuote = computed(() =>
    getSectionField(
      'collabs',
      'main',
      'quote',
      "We believe that true elegance is found in the dialogue between distinct voices. Our collaborations series invites the world's most visionary brands and designers to reimagine interior forms.",
    ),
  )
  const collabsCuratedNote = computed(() =>
    getSectionField(
      'collabs',
      'main',
      'curated_note',
      'Exclusive limited-edition pieces developed in tandem with master artisans and visionary architects.',
    ),
  )
  const collabsMain = computed(() => ({
    headline: collabsHeadline.value,
    quote: collabsQuote.value,
    curated_note: collabsCuratedNote.value,
  }))

  // 9. Portfolio Getters & Helpers
  const portfolioHeadline = computed(() =>
    getSectionField('portfolio', 'main', 'headline', 'Discover Our Latest Collection'),
  )
  const portfolioDescription = computed(() =>
    getSectionField(
      'portfolio',
      'main',
      'description',
      'Explore a curated selection of minimalist designs that bring harmony and functionality to your living spaces.',
    ),
  )
  const portfolioCtaText = computed(() =>
    getSectionField('portfolio', 'main', 'cta_text', 'Inquire About Custom Projects'),
  )
  const portfolioCtaLink = computed(() =>
    getSectionField('portfolio', 'main', 'cta_link', '/contact'),
  )
  const portfolioMain = computed(() => ({
    headline: portfolioHeadline.value,
    description: portfolioDescription.value,
    cta_text: portfolioCtaText.value,
    cta_link: portfolioCtaLink.value,
  }))

  // 10. Contact Getters & Helpers
  const contactAddress = computed(() =>
    getSectionField(
      'contact',
      'details',
      'office_address',
      '90/1, North Beach Road Tuticorin, Chennai – 628001.',
    ),
  )
  const contactPhone = computed(() =>
    getSectionField('contact', 'details', 'phone', '+91 9751112025'),
  )
  const contactEmail = computed(() =>
    getSectionField('contact', 'details', 'email', 'info.spacefurnio@gmail.com'),
  )
  const contactOperatingHours = computed(() =>
    getSectionField(
      'contact',
      'details',
      'operating_hours',
      'Monday to Saturday, 9:00 AM – 6:00 PM IST',
    ),
  )
  const contactResponseTime = computed(() =>
    getSectionField(
      'contact',
      'details',
      'response_time',
      'Our design consultants typically respond within 24 hours.',
    ),
  )
  const contactDetails = computed(() => ({
    office_address: contactAddress.value,
    phone: contactPhone.value,
    email: contactEmail.value,
    operating_hours: contactOperatingHours.value,
    response_time: contactResponseTime.value,
  }))

  return {
    // State
    bundle,
    isLoaded,
    isLoading,
    error,

    // Methods
    fetchBundle,
    init: fetchBundle,
    getPage,
    getSection,
    getSectionField,
    getPolicy,
    getPolicyContent,

    // Home Getters
    heroTagline,
    heroBrandName,
    newArrivalsHeading,
    comingSoonBadge,
    ctaLine1,
    ctaLine2,
    grabNowButton,
    productSectionHeading,
    productSectionButton,
    scrollText1,
    scrollText2,

    // Footer Getters
    footerBrandStatement,
    footerCopyright,
    footerAddress,
    footerPhone,
    footerEmail,
    footerDetails,

    // About Getters & Helpers
    aboutHeadline,
    aboutParagraph,
    aboutStoryQuote,
    aboutIntro,
    aboutStory,

    // Collabs Getters & Helpers
    collabsHeadline,
    collabsQuote,
    collabsCuratedNote,
    collabsMain,

    // Portfolio Getters & Helpers
    portfolioHeadline,
    portfolioDescription,
    portfolioCtaText,
    portfolioCtaLink,
    portfolioMain,

    // Contact Getters & Helpers
    contactAddress,
    contactPhone,
    contactEmail,
    contactOperatingHours,
    contactResponseTime,
    contactDetails,
  }
})
