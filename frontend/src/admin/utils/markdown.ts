/**
 * Zero-dependency, XSS-safe Markdown-to-HTML parser for Spacefurnio CMS Admin.
 */

const SAFE_PROTOCOLS = /^(https?:\/\/|mailto:|tel:|\/|#)/i
const DANGEROUS_PROTOCOLS = /^(?:javascript|data|vbscript):/i

/**
 * Escapes HTML entities to prevent XSS injection.
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSafeUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim()
  if (DANGEROUS_PROTOCOLS.test(trimmed)) {
    return false
  }
  return SAFE_PROTOCOLS.test(trimmed)
}

function formatInline(text: string): string {
  let res = text

  // Strikethrough: ~~text~~
  res = res.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Bold: **text** or __text__
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  res = res.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  res = res.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  res = res.replace(/_([^_\n]+?)_/g, '<em>$1</em>')

  // Links: [text](url) - supports nested parentheses in URLs
  res = res.replace(/\[([^\]]+)\]\(((?:[^\s()]+|\([^\s()]*\))+)\)/g, (_, linkText, url) => {
    const trimmedUrl = url.trim()
    if (isSafeUrl(trimmedUrl)) {
      return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
    }
    return linkText
  })

  return res
}

/**
 * Converts a markdown string to sanitized HTML.
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const sanitized = sanitizeText(normalized)

  // Extract fenced code blocks
  const codeBlocks: string[] = []
  const withCodeBlocks = sanitized.replace(
    /(?:^|\n)```([a-zA-Z0-9_-]+)?\n([\s\S]*?)\n?```(?=\n|$)/g,
    (_, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : ''
      const index = codeBlocks.length
      codeBlocks.push(`<pre><code${langClass}>${code}</code></pre>`)
      return `\n\n@@CMSCODEBLOCK${index}@@\n\n`
    }
  )

  // Extract inline code
  const inlineCodes: string[] = []
  const withInlineCode = withCodeBlocks.replace(/`([^`\n]+)`/g, (_, code) => {
    const index = inlineCodes.length
    inlineCodes.push(`<code>${code}</code>`)
    return `@@CMSINLINE${index}@@`
  })

  const lines = withInlineCode.split('\n')
  const output: string[] = []

  let currentParagraph: string[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
  let currentBlockquote: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.map(formatInline).join('<br>\n')
      output.push(`<p>${content}</p>`)
      currentParagraph = []
    }
  }

  const flushList = () => {
    if (currentList) {
      const tag = currentList.type
      const itemsHtml = currentList.items.map((item) => `  <li>${formatInline(item)}</li>`).join('\n')
      output.push(`<${tag}>\n${itemsHtml}\n</${tag}>`)
      currentList = null
    }
  }

  const flushBlockquote = () => {
    if (currentBlockquote.length > 0) {
      const content = currentBlockquote.map(formatInline).join('<br>\n')
      output.push(`<blockquote><p>${content}</p></blockquote>`)
      currentBlockquote = []
    }
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
    flushBlockquote()
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Code block placeholder
    const cbMatch = trimmed.match(/^@@CMSCODEBLOCK(\d+)@@$/)
    if (cbMatch) {
      flushAll()
      output.push(trimmed)
      continue
    }

    // Blank line
    if (!trimmed) {
      flushAll()
      continue
    }

    // Heading (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushAll()
      const level = headingMatch[1].length
      const title = formatInline(headingMatch[2].trim())
      output.push(`<h${level}>${title}</h${level}>`)
      continue
    }

    // Blockquote
    const bqMatch = line.match(/^(?:&gt;|>)\s?(.*)$/)
    if (bqMatch) {
      flushParagraph()
      flushList()
      currentBlockquote.push(bqMatch[1])
      continue
    }

    // Unordered list item
    const ulMatch = line.match(/^\s*[-*]\s+(.*)$/)
    if (ulMatch) {
      flushParagraph()
      flushBlockquote()
      if (currentList && currentList.type !== 'ul') {
        flushList()
      }
      if (!currentList) {
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(ulMatch[1])
      continue
    }

    // Ordered list item
    const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (olMatch) {
      flushParagraph()
      flushBlockquote()
      if (currentList && currentList.type !== 'ol') {
        flushList()
      }
      if (!currentList) {
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(olMatch[2])
      continue
    }

    // Normal paragraph text
    flushList()
    flushBlockquote()
    currentParagraph.push(line)
  }

  flushAll()

  let html = output.join('\n\n')

  // Restore code blocks
  html = html.replace(/@@CMSCODEBLOCK(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)] || '')

  // Restore inline codes
  html = html.replace(/@@CMSINLINE(\d+)@@/g, (_, idx) => inlineCodes[Number(idx)] || '')

  return html
}
