/**
 * FAQ Template System
 * Provides structured FAQ management with product categorization and Slack integration
 */

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  product: string
  keywords: string[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  helpfulCount: number
  views: number
}

export interface FAQCategory {
  id: string
  name: string
  description: string
  icon: string
  products: string[]
}

export interface FAQTemplate {
  id: string
  name: string
  description: string
  version: string
  faqs: FAQItem[]
  categories: FAQCategory[]
  metadata: FAQMetadata
}

export interface FAQMetadata {
  lastUpdated: Date
  totalViews: number
  averageHelpfulness: number
  language: string
  status: 'draft' | 'published' | 'archived'
}

/**
 * FAQ Template Manager
 */
export class FAQTemplateManager {
  private template: FAQTemplate
  private faqIndex: Map<string, FAQItem>

  constructor(templateName: string) {
    this.template = {
      id: `faq-${Date.now()}`,
      name: templateName,
      description: '',
      version: '1.0.0',
      faqs: [],
      categories: [],
      metadata: {
        lastUpdated: new Date(),
        totalViews: 0,
        averageHelpfulness: 0,
        language: 'en',
        status: 'draft'
      }
    }
    this.faqIndex = new Map()
  }

  /**
   * Add a new FAQ item
   */
  addFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'views'>): FAQItem {
    const newFAQ: FAQItem = {
      ...faq,
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      helpfulCount: 0,
      views: 0
    }

    this.template.faqs.push(newFAQ)
    this.faqIndex.set(newFAQ.id, newFAQ)
    this.updateMetadata()

    return newFAQ
  }

  /**
   * Add multiple FAQs
   */
  addFAQs(faqs: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'views'>[]): FAQItem[] {
    return faqs.map(faq => this.addFAQ(faq))
  }

  /**
   * Add a category
   */
  addCategory(category: Omit<FAQCategory, 'id'>): FAQCategory {
    const newCategory: FAQCategory = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    this.template.categories.push(newCategory)
    return newCategory
  }

  /**
   * Get FAQs by category
   */
  getFAQsByCategory(categoryId: string): FAQItem[] {
    return this.template.faqs.filter(faq => {
      const category = this.template.categories.find(c => c.id === categoryId)
      return faq.category === categoryId || (category && category.products.includes(faq.product))
    })
  }

  /**
   * Get FAQs by product
   */
  getFAQsByProduct(product: string): FAQItem[] {
    return this.template.faqs.filter(faq => faq.product === product && faq.isActive)
  }

  /**
   * Search FAQs by keywords
   */
  searchFAQs(query: string): FAQItem[] {
    const lowerQuery = query.toLowerCase()
    return this.template.faqs.filter(faq => {
      return (
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery) ||
        faq.keywords.some(k => k.toLowerCase().includes(lowerQuery))
      )
    })
  }

  /**
   * Record FAQ view
   */
  recordView(faqId: string): void {
    const faq = this.faqIndex.get(faqId)
    if (faq) {
      faq.views++
      this.template.metadata.totalViews++
    }
  }

  /**
   * Record helpful feedback
   */
  recordHelpful(faqId: string, isHelpful: boolean): void {
    const faq = this.faqIndex.get(faqId)
    if (faq && isHelpful) {
      faq.helpfulCount++
      this.updateAverageHelpfulness()
    }
  }

  /**
   * Get top FAQs by views
   */
  getTopFAQsByViews(limit: number = 10): FAQItem[] {
    return [...this.template.faqs].sort((a, b) => b.views - a.views).slice(0, limit)
  }

  /**
   * Get top FAQs by helpfulness
   */
  getTopFAQsByHelpfulness(limit: number = 10): FAQItem[] {
    return [...this.template.faqs]
      .filter(faq => faq.views > 0)
      .sort((a, b) => (b.helpfulCount / b.views) - (a.helpfulCount / a.views))
      .slice(0, limit)
  }

  /**
   * Update FAQ
   */
  updateFAQ(faqId: string, updates: Partial<FAQItem>): FAQItem | null {
    const faq = this.faqIndex.get(faqId)
    if (!faq) return null

    Object.assign(faq, updates, { updatedAt: new Date() })
    this.updateMetadata()

    return faq
  }

  /**
   * Delete FAQ
   */
  deleteFAQ(faqId: string): boolean {
    const index = this.template.faqs.findIndex(faq => faq.id === faqId)
    if (index === -1) return false

    this.template.faqs.splice(index, 1)
    this.faqIndex.delete(faqId)
    this.updateMetadata()

    return true
  }

  /**
   * Export template to JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.template, null, 2)
  }

  /**
   * Export as Markdown
   */
  exportMarkdown(): string {
    let markdown = `# ${this.template.name}\n\n`
    markdown += `${this.template.description}\n\n`

    this.template.categories.forEach(category => {
      markdown += `## ${category.name}\n`
      markdown += `${category.description}\n\n`

      const categoryFAQs = this.getFAQsByCategory(category.id)
      categoryFAQs.forEach(faq => {
        markdown += `### Q: ${faq.question}\n`
        markdown += `**A:** ${faq.answer}\n\n`
        markdown += `*Product: ${faq.product} | Views: ${faq.views} | Helpful: ${faq.helpfulCount}*\n\n`
      })
    })

    return markdown
  }

  /**
   * Generate HTML table for FAQ
   */
  generateHTMLTable(productFilter?: string): string {
    let html = '<table border="1" cellpadding="10">\n'
    html += '<thead><tr><th>Question</th><th>Answer</th><th>Category</th><th>Product</th><th>Views</th><th>Helpful</th></tr></thead>\n'
    html += '<tbody>\n'

    const faqs = productFilter ? this.getFAQsByProduct(productFilter) : this.template.faqs

    faqs.forEach(faq => {
      html += `<tr>`
      html += `<td>${faq.question}</td>`
      html += `<td>${faq.answer}</td>`
      html += `<td>${faq.category}</td>`
      html += `<td>${faq.product}</td>`
      html += `<td>${faq.views}</td>`
      html += `<td>${faq.helpfulCount}</td>`
      html += `</tr>\n`
    })

    html += '</tbody>\n</table>'
    return html
  }

  /**
   * Get template data
   */
  getTemplate(): FAQTemplate {
    return this.template
  }

  /**
   * Set template description
   */
  setDescription(description: string): void {
    this.template.description = description
  }

  /**
   * Publish template
   */
  publishTemplate(): void {
    this.template.metadata.status = 'published'
    this.updateMetadata()
  }

  /**
   * Archive template
   */
  archiveTemplate(): void {
    this.template.metadata.status = 'archived'
    this.updateMetadata()
  }

  /**
   * Update internal metadata
   */
  private updateMetadata(): void {
    this.template.metadata.lastUpdated = new Date()
  }

  /**
   * Update average helpfulness
   */
  private updateAverageHelpfulness(): void {
    const activeItems = this.template.faqs.filter(faq => faq.views > 0)
    if (activeItems.length === 0) {
      this.template.metadata.averageHelpfulness = 0
      return
    }

    const totalHelpfulness = activeItems.reduce((sum, faq) => sum + (faq.helpfulCount / faq.views), 0)
    this.template.metadata.averageHelpfulness = totalHelpfulness / activeItems.length
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalFAQs: this.template.faqs.length,
      activeFAQs: this.template.faqs.filter(faq => faq.isActive).length,
      totalCategories: this.template.categories.length,
      totalViews: this.template.metadata.totalViews,
      averageHelpfulness: this.template.metadata.averageHelpfulness,
      status: this.template.metadata.status
    }
  }
}

// Pre-built FAQ templates for common products
export const PRODUCT_FAQ_TEMPLATES = {
  CAKES: {
    categories: [
      {
        name: 'Ordering',
        description: 'Questions about placing orders',
        icon: '🛒',
        products: ['cakes']
      },
      {
        name: 'Customization',
        description: 'Custom cake options and designs',
        icon: '🎨',
        products: ['cakes']
      },
      {
        name: 'Delivery',
        description: 'Shipping and delivery information',
        icon: '🚚',
        products: ['cakes']
      },
      {
        name: 'Pricing',
        description: 'Cost and payment options',
        icon: '💰',
        products: ['cakes']
      }
    ]
  },
  INVENTORY: {
    categories: [
      {
        name: 'Stock Management',
        description: 'Managing inventory levels',
        icon: '📦',
        products: ['inventory']
      },
      {
        name: 'Suppliers',
        description: 'Supplier information and ordering',
        icon: '🏢',
        products: ['inventory']
      },
      {
        name: 'Tracking',
        description: 'Inventory tracking and reports',
        icon: '📊',
        products: ['inventory']
      }
    ]
  }
}
