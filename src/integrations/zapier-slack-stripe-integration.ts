/**
 * Zapier + Slack + Stripe Integration
 * Automates expense notifications and payments
 */

export interface SlackMessage {
  channel: string
  text: string
  blocks?: Record<string, unknown>[]
  threadTs?: string
}

export interface StripePayload {
  amount: number
  currency: string
  description: string
  metadata: Record<string, string>
}

export interface ZapierTrigger {
  event: string
  data: Record<string, unknown>
}

export class ZapierSlackStripeIntegration {
  private slackWebhook: string
  private stripeApiKey: string
  private zapierWebhook: string

  constructor(slackWebhook: string, stripeApiKey: string, zapierWebhook: string) {
    this.slackWebhook = slackWebhook
    this.stripeApiKey = stripeApiKey
    this.zapierWebhook = zapierWebhook
  }

  /**
   * Send Slack notification for inventory template creation
   */
  async notifyInventoryCreation(templateName: string, productName: string): Promise<void> {
    const message: SlackMessage = {
      channel: '#inventory-alerts',
      text: `📦 New Inventory Template Created!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎉 *Inventory Template Created*\n\n*Template:* ${templateName}\n*Product:* ${productName}\n*Created:* ${new Date().toISOString()}`
          }
        } as Record<string, unknown>,
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Template' },
              value: templateName,
              action_id: 'view_inventory_template'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Create Expense' },
              value: productName,
              action_id: 'create_expense'
            }
          ]
        } as Record<string, unknown>
      ]
    }

    await this.sendToSlack(message)
  }

  /**
   * Send Slack notification for expense approval
   */
  async notifyExpenseApproval(expenseId: string, amount: number, category: string): Promise<void> {
    const message: SlackMessage = {
      channel: '#expense-approvals',
      text: `✅ Expense Approved: $${amount}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Expense Approved*\n\n*Amount:* $${amount}\n*Category:* ${category}\n*Expense ID:* ${expenseId}`
          }
        } as Record<string, unknown>
      ]
    }

    await this.sendToSlack(message)
  }

  /**
   * Create Stripe charge for approved expense
   */
  async createStripeCharge(amount: number, expenseId: string, description: string): Promise<string> {
    const payload: StripePayload = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description,
      metadata: {
        expenseId,
        timestamp: new Date().toISOString()
      }
    }

    // This would call actual Stripe API
    const chargeId = `ch_${Date.now()}_${expenseId}`

    const message: SlackMessage = {
      channel: '#payment-notifications',
      text: `💳 Stripe Charge Created`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `💳 *Stripe Charge Created*\n\n*Amount:* $${amount}\n*Description:* ${description}\n*Charge ID:* ${chargeId}`
          }
        } as Record<string, unknown>
      ]
    }

    await this.sendToSlack(message)
    return chargeId
  }

  /**
   * Trigger Zapier workflow
   */
  async triggerZapierWorkflow(trigger: ZapierTrigger): Promise<void> {
    try {
      await fetch(this.zapierWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trigger)
      })
    } catch (error) {
      console.error('Failed to trigger Zapier workflow:', error)
    }
  }

  /**
   * Send message to Slack
   */
  private async sendToSlack(message: SlackMessage): Promise<void> {
    try {
      await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
    } catch (error) {
      console.error('Failed to send Slack message:', error)
    }
  }

  /**
   * Process inventory template creation event
   */
  async onInventoryTemplateCreated(templateData: {
    templateId: string
    templateName: string
    productName: string
  }): Promise<void> {
    // 1. Notify Slack
    await this.notifyInventoryCreation(templateData.templateName, templateData.productName)

    // 2. Trigger Zapier workflow
    await this.triggerZapierWorkflow({
      event: 'inventory_template_created',
      data: templateData
    })
  }

  /**
   * Process expense approval event
   */
  async onExpenseApproved(expenseData: {
    expenseId: string
    amount: number
    category: string
    description: string
  }): Promise<void> {
    // 1. Notify Slack
    await this.notifyExpenseApproval(expenseData.expenseId, expenseData.amount, expenseData.category)

    // 2. Create Stripe charge
    const chargeId = await this.createStripeCharge(
      expenseData.amount,
      expenseData.expenseId,
      expenseData.description
    )

    // 3. Trigger Zapier workflow
    await this.triggerZapierWorkflow({
      event: 'expense_approved',
      data: {
        ...expenseData,
        chargeId
      }
    })
  }
}
