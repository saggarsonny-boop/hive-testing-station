'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function Redirector() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id')
  useEffect(() => {
    if (id) router.replace(`/confirm/${id}`)
    else router.replace('/')
  }, [id, router])
  return <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Loading…</div>
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Loading…</div>}>
      <Redirector />
    </Suspense>
  )
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
