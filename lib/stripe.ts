import Stripe from 'stripe'

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2025-03-31.basil' })
}

export async function findOrCreateCustomer(params: {
  email: string
  name: string
}): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) { console.warn('[stripe] STRIPE_SECRET_KEY not set'); return null }

  const existing = await stripe.customers.list({ email: params.email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { source: 'hive-testing-station' },
  })
  return customer.id
}

export async function grantCreditToCustomer(params: {
  customerId: string
  amountUsd: number
  engineName: string
}): Promise<boolean> {
  const stripe = getStripe()
  if (!stripe) return false

  // Stripe balance: negative = credit on customer's account
  await stripe.customers.createBalanceTransaction(params.customerId, {
    amount: -(params.amountUsd * 100),
    currency: 'usd',
    description: `Founding Tester credit — ${params.engineName}`,
  })
  return true
}
