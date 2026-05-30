# 📊 Multi-Product Expenses Tracker & FAQ Setup Guide

## Overview

This guide helps you set up the **Expenses Tracker**, **FAQ Template System**, and **Zapier-Slack-Stripe Integration** for the Suprecakke project.

---

## 🎯 Quick Start

### 1. FAQ Template Setup

```typescript
import { FAQTemplateManager } from './templates/faq-template'

// Create a new FAQ template
const faqManager = new FAQTemplateManager('Product Support FAQs')

// Add categories
faqManager.addCategory({
  name: 'Ordering',
  description: 'Questions about placing orders',
  icon: '🛒',
  products: ['cakes', 'pastries']
})

// Add FAQ items
faqManager.addFAQ({
  question: 'How long does delivery take?',
  answer: 'Standard delivery takes 2-3 business days.',
  category: 'ordering',
  product: 'cakes',
  keywords: ['delivery', 'shipping', 'time'],
  isActive: true
})

// Publish template
faqManager.publishTemplate()

// Export as HTML table
const htmlTable = faqManager.generateHTMLTable('cakes')
```

### 2. Expenses Tracker Setup

```typescript
import { ExpensesTracker } from './trackers/expenses-tracker'

// Initialize tracker
const tracker = new ExpensesTracker()

// Add a product
tracker.addProduct({
  id: 'product-123',
  name: 'Premium Cake Line',
  category: 'baking',
  budget: 10000,
  currency: 'USD'
})

// Log an expense
tracker.addExpense('product-123', {
  productId: 'product-123',
  amount: 500,
  category: 'ingredients',
  description: 'Premium flour bulk order',
  date: new Date(),
  status: 'pending',
  vendor: 'Supplier Inc.'
})

// Get expense report
const report = tracker.getProductReport('product-123')
console.log(`Budget used: ${report.percentageUsed}%`)

// Generate HTML table
const expenseTable = tracker.generateExpenseTable('product-123')
```

### 3. Zapier-Slack-Stripe Integration

```typescript
import { ZapierSlackStripeIntegration } from './integrations/zapier-slack-stripe-integration'

// Initialize integration
const integration = new ZapierSlackStripeIntegration(
  process.env.SLACK_WEBHOOK_URL,
  process.env.STRIPE_API_KEY,
  process.env.ZAPIER_WEBHOOK_URL
)

// On inventory template created
await integration.onInventoryTemplateCreated({
  templateId: 'inv-123',
  templateName: 'Cake Supplies Inventory',
  productName: 'Premium Cakes'
})

// On expense approved
await integration.onExpenseApproved({
  expenseId: 'exp-456',
  amount: 500,
  category: 'ingredients',
  description: 'Bulk flour order'
})
```

---

## 🔧 Environment Variables

Create a `.env` file with the following:

```env
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_BOT_TOKEN=xoxb-your-token

# Stripe Integration
STRIPE_API_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Zapier Integration
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_KEY/

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost/expenses_db
```

---

## 📋 FAQ Template Features

### Create and Manage FAQs

- **Add FAQ Items**: Questions and answers for each product
- **Categorize**: Organize by topics (Ordering, Customization, Delivery, etc.)
- **Search**: Find FAQs by keywords or full-text search
- **Track Engagement**: Monitor views and helpful feedback
- **Export**: Generate Markdown or HTML tables

### Example FAQ Structure

```typescript
{
  question: "Can I customize my cake?",
  answer: "Yes! We offer custom designs for all orders placed 7+ days in advance.",
  category: "customization",
  product: "cakes",
  keywords: ["custom", "design", "personalization"],
  isActive: true
}
```

### HTML Table Export

FAQ data can be exported as:

```html
<table border="1" cellpadding="10">
  <thead>
    <tr>
      <th>Question</th>
      <th>Answer</th>
      <th>Category</th>
      <th>Product</th>
      <th>Views</th>
      <th>Helpful</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Can I customize my cake?</td>
      <td>Yes! We offer custom designs...</td>
      <td>customization</td>
      <td>cakes</td>
      <td>245</td>
      <td>198</td>
    </tr>
  </tbody>
</table>
```

---

## 💰 Expenses Tracker Features

### Track Multi-Product Expenses

- **Product Budget Management**: Set and monitor budgets
- **Expense Logging**: Track all expenses with categories
- **Status Management**: pending → approved → paid
- **Reporting**: Generate comprehensive expense reports
- **HTML Tables**: Export expense data as tables

### Expense Status Flow

```
pending → approved → paid
       ↓
     rejected
```

### Expense Report Example

```typescript
{
  productId: 'product-123',
  totalExpenses: 1500,
  approvedExpenses: 1000,
  pendingExpenses: 300,
  rejectedExpenses: 200,
  remainingBudget: 9000,
  percentageUsed: 10
}
```

---

## 🔔 Slack Integration Examples

### Inventory Template Created Notification

```
🎉 Inventory Template Created

Template: Cake Supplies Inventory
Product: Premium Cakes
Created: 2026-05-30T12:00:00Z

[View Template] [Create Expense]
```

### Expense Approved Notification

```
✅ Expense Approved

Amount: $500
Category: ingredients
Expense ID: exp-456

[View Details] [Generate Invoice]
```

### Payment Created Notification

```
💳 Stripe Charge Created

Amount: $500
Description: Bulk flour order
Charge ID: ch_1234567890

[View in Stripe] [Refund]
```

---

## ⚡ Zapier Workflow Automation

### Workflow 1: Inventory → Slack → Stripe

```
Inventory Template Created
  ↓ (Webhook)
Zapier Filter (validate data)
  ↓
Send Slack Message
  ↓
Create Stripe Invoice
  ↓
Add to Expenses Tracker
```

### Workflow 2: Expense Approval → Payment

```
Expense Approved (Manual or Webhook)
  ↓
Slack Notification
  ↓
Stripe Charge Created
  ↓
Expense Status Updated
  ↓
Slack Confirmation
```

---

## 🚀 API Endpoints (Example)

### FAQ Endpoints

```
POST   /api/faq/create              - Create new FAQ template
POST   /api/faq/:id/item            - Add FAQ item
GET    /api/faq/:id/items           - Get all FAQs
GET    /api/faq/:id/product/:name   - Get FAQs by product
GET    /api/faq/:id/search          - Search FAQs
GET    /api/faq/:id/export/html     - Export as HTML table
POST   /api/faq/:id/publish         - Publish template
```

### Expenses Endpoints

```
POST   /api/expenses/product        - Add product
POST   /api/expenses/:id/item       - Log expense
GET    /api/expenses/:id/product    - Get product expenses
GET    /api/expenses/:id/report     - Get expense report
GET    /api/expenses/export/html    - Export as HTML table
PUT    /api/expenses/:id/status     - Update expense status
GET    /api/expenses/summary        - Get all products summary
```

### Integration Endpoints

```
POST   /webhooks/inventory-created  - Inventory template event
POST   /webhooks/expense-approved   - Expense approval event
POST   /webhooks/stripe-webhook     - Stripe payment event
```

---

## 📊 Dashboard Tables

### FAQ Performance Table

| Question | Views | Helpful | Rating | Status |
|----------|-------|---------|--------|--------|
| How long does delivery take? | 245 | 198 | 80.8% | Published |
| Can I customize my cake? | 189 | 165 | 87.3% | Published |
| What's your refund policy? | 156 | 125 | 80.1% | Published |

### Expenses Summary Table

| Product | Budget | Used | Approved | Pending | Remaining | % Used |
|---------|--------|------|----------|---------|-----------|--------|
| Premium Cakes | $10,000 | $5,200 | $3,800 | $1,400 | $4,800 | 52% |
| Pastries | $5,000 | $2,100 | $2,100 | $0 | $2,900 | 42% |
| **Total** | **$15,000** | **$7,300** | **$5,900** | **$1,400** | **$7,700** | **49%** |

---

## 🔐 Security Best Practices

1. **Store API Keys**: Use environment variables, not hardcoded
2. **Validate Webhooks**: Verify Slack and Zapier signatures
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Audit Logging**: Log all expense approvals and payments
5. **Data Encryption**: Encrypt sensitive expense data
6. **Access Control**: Restrict who can approve expenses

---

## 📝 Testing Guide

### Test FAQ Template

```bash
npm test -- faq-template.spec.ts
```

### Test Expenses Tracker

```bash
npm test -- expenses-tracker.spec.ts
```

### Test Integration

```bash
npm test -- zapier-slack-stripe.spec.ts
```

---

## 🐛 Troubleshooting

### Issue: Slack messages not sending

- Verify `SLACK_WEBHOOK_URL` is correct
- Check Slack workspace permissions
- Ensure channel exists and bot has access

### Issue: Stripe charges failing

- Verify `STRIPE_API_KEY` is valid
- Check amount format (should be in cents)
- Ensure card is valid in test mode

### Issue: Zapier workflow not triggering

- Confirm webhook URL is active
- Check event payload format
- Verify network connectivity

---

## 📚 Additional Resources

- [Slack API Documentation](https://api.slack.com/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Zapier Developer Platform](https://zapier.com/developer/)
- [GitHub Integration Examples](./workflows/)

---

## 🎉 Next Steps

1. ✅ Set up environment variables
2. ✅ Initialize FAQ template for your products
3. ✅ Create expense tracker for budgets
4. ✅ Configure Slack integration
5. ✅ Set up Stripe webhook
6. ✅ Create Zapier automation workflows
7. ✅ Test end-to-end workflows
8. ✅ Monitor dashboard and reports

**Let's track expenses and help customers with comprehensive FAQ templates!** 🚀
