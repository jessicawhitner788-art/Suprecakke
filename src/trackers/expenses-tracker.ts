/**
 * Multi-Product Expenses Tracker
 * Tracks expenses across multiple products with Stripe & Slack integration
 */

export interface Expense {
  id: string
  productId: string
  amount: number
  category: string
  description: string
  date: Date
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  vendor?: string
  invoiceId?: string
  slackThreadId?: string
  stripeChargeId?: string
}

export interface Product {
  id: string
  name: string
  category: string
  budget: number
  currency: string
  expenses: Expense[]
}

export interface ExpenseReport {
  productId: string
  totalExpenses: number
  approvedExpenses: number
  pendingExpenses: number
  rejectedExpenses: number
  remainingBudget: number
  percentageUsed: number
}

export class ExpensesTracker {
  private products: Map<string, Product> = new Map()
  private expenses: Map<string, Expense> = new Map()

  /**
   * Create or update a product
   */
  addProduct(product: Omit<Product, 'expenses'>): Product {
    const newProduct: Product = {
      ...product,
      expenses: []
    }
    this.products.set(product.id, newProduct)
    return newProduct
  }

  /**
   * Log an expense
   */
  addExpense(productId: string, expense: Omit<Expense, 'id'>): Expense {
    const product = this.products.get(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    product.expenses.push(newExpense)
    this.expenses.set(newExpense.id, newExpense)

    return newExpense
  }

  /**
   * Get expenses for a specific product
   */
  getProductExpenses(productId: string): Expense[] {
    const product = this.products.get(productId)
    return product ? product.expenses : []
  }

  /**
   * Get all expenses across products
   */
  getAllExpenses(): Expense[] {
    return Array.from(this.expenses.values())
  }

  /**
   * Get report for a product
   */
  getProductReport(productId: string): ExpenseReport {
    const product = this.products.get(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    const totalExpenses = product.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const approvedExpenses = product.expenses
      .filter(exp => exp.status === 'approved' || exp.status === 'paid')
      .reduce((sum, exp) => sum + exp.amount, 0)
    const pendingExpenses = product.expenses
      .filter(exp => exp.status === 'pending')
      .reduce((sum, exp) => sum + exp.amount, 0)
    const rejectedExpenses = product.expenses
      .filter(exp => exp.status === 'rejected')
      .reduce((sum, exp) => sum + exp.amount, 0)

    return {
      productId,
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      rejectedExpenses,
      remainingBudget: product.budget - approvedExpenses,
      percentageUsed: (approvedExpenses / product.budget) * 100
    }
  }

  /**
   * Generate expense table
   */
  generateExpenseTable(productId: string): string {
    const product = this.products.get(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    let html = '<table border="1" cellpadding="10">\n'
    html += '<thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Vendor</th><th>Status</th></tr></thead>\n'
    html += '<tbody>\n'

    product.expenses.forEach(exp => {
      html += `<tr><td>${exp.date.toLocaleDateString()}</td><td>${exp.category}</td><td>${exp.description}</td><td>${exp.amount}</td><td>${exp.vendor || 'N/A'}</td><td>${exp.status}</td></tr>\n`
    })

    html += '</tbody>\n</table>'
    return html
  }

  /**
   * Update expense status
   */
  updateExpenseStatus(expenseId: string, status: Expense['status']): Expense | null {
    const expense = this.expenses.get(expenseId)
    if (!expense) return null

    expense.status = status
    return expense
  }

  /**
   * Get summary across all products
   */
  getSummary() {
    const allExpenses = this.getAllExpenses()
    return {
      totalProducts: this.products.size,
      totalExpenses: allExpenses.length,
      totalAmount: allExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      approvedAmount: allExpenses
        .filter(exp => exp.status === 'approved' || exp.status === 'paid')
        .reduce((sum, exp) => sum + exp.amount, 0),
      pendingAmount: allExpenses
        .filter(exp => exp.status === 'pending')
        .reduce((sum, exp) => sum + exp.amount, 0),
      byStatus: {
        pending: allExpenses.filter(exp => exp.status === 'pending').length,
        approved: allExpenses.filter(exp => exp.status === 'approved').length,
        paid: allExpenses.filter(exp => exp.status === 'paid').length,
        rejected: allExpenses.filter(exp => exp.status === 'rejected').length
      }
    }
  }

  /**
   * Get expenses by category across all products
   */
  getExpensesByCategory(category: string): Expense[] {
    return this.getAllExpenses().filter(exp => exp.category === category)
  }

  /**
   * Get expenses by status across all products
   */
  getExpensesByStatus(status: Expense['status']): Expense[] {
    return this.getAllExpenses().filter(exp => exp.status === status)
  }

  /**
   * Get all products
   */
  getAllProducts(): Product[] {
    return Array.from(this.products.values())
  }
}
